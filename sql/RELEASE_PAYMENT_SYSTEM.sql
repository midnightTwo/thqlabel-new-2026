-- ============================================
-- СИСТЕМА ОПЛАТЫ РЕЛИЗОВ
-- ============================================
-- Добавляет поля для отслеживания оплаты релизов
-- и создаёт таблицу истории оплат для доказательства
-- Включает систему возвратов

-- ШАГ 0: Обновляем CHECK constraint для transactions
-- ============================================
-- Добавляем тип 'refund' для возвратов

DO $$
BEGIN
  -- Удаляем старый constraint если есть
  ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_type_check;
  
  -- Добавляем новый с поддержкой refund
  ALTER TABLE transactions ADD CONSTRAINT transactions_type_check 
    CHECK (type IN ('deposit', 'withdrawal', 'purchase', 'payout', 'refund', 'adjustment', 'bonus', 'fee'));
EXCEPTION WHEN OTHERS THEN
  -- Если не удалось, пробуем другой способ
  NULL;
END $$;

-- ШАГ 1: Добавляем поля оплаты в таблицы релизов
-- ============================================

-- Для releases_basic
ALTER TABLE releases_basic 
ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS payment_transaction_id UUID,
ADD COLUMN IF NOT EXISTS payment_amount DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

-- Для releases (если используется)
ALTER TABLE releases 
ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS payment_transaction_id UUID,
ADD COLUMN IF NOT EXISTS payment_amount DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_releases_basic_is_paid ON releases_basic(is_paid);
CREATE INDEX IF NOT EXISTS idx_releases_basic_payment_tx ON releases_basic(payment_transaction_id);
CREATE INDEX IF NOT EXISTS idx_releases_is_paid ON releases(is_paid);

-- ШАГ 2: Создаём таблицу истории оплат релизов
-- ============================================
-- Эта таблица хранит ВСЕ попытки оплаты и служит доказательством

CREATE TABLE IF NOT EXISTS release_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Связи
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  release_id UUID, -- ID релиза (может быть null если релиз удалён)
  release_type VARCHAR(20) NOT NULL, -- 'basic' или 'exclusive'
  transaction_id UUID, -- Связь с таблицей transactions
  
  -- Информация о релизе на момент оплаты (для истории)
  release_title TEXT NOT NULL,
  release_artist TEXT,
  tracks_count INTEGER DEFAULT 1,
  
  -- Финансовая информация
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'RUB',
  payment_method VARCHAR(50), -- 'balance', 'card', 'sbp', etc
  
  -- Статус
  status VARCHAR(20) DEFAULT 'completed', -- 'completed', 'refunded', 'failed'
  
  -- Метаданные
  metadata JSONB DEFAULT '{}',
  
  -- Временные метки
  created_at TIMESTAMPTZ DEFAULT NOW(),
  refunded_at TIMESTAMPTZ
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_release_payments_user ON release_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_release_payments_release ON release_payments(release_id);
CREATE INDEX IF NOT EXISTS idx_release_payments_tx ON release_payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_release_payments_created ON release_payments(created_at DESC);

-- RLS политики
ALTER TABLE release_payments ENABLE ROW LEVEL SECURITY;

-- Пользователь видит только свои оплаты
DROP POLICY IF EXISTS "Users view own release payments" ON release_payments;
CREATE POLICY "Users view own release payments" ON release_payments
  FOR SELECT USING (auth.uid() = user_id);

-- Админы видят всё
DROP POLICY IF EXISTS "Admins view all release payments" ON release_payments;
CREATE POLICY "Admins view all release payments" ON release_payments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator', 'owner'))
  );

-- ШАГ 3: Функция для безопасной оплаты релиза
-- ============================================

CREATE OR REPLACE FUNCTION pay_for_release(
  p_user_id UUID,
  p_release_id UUID,
  p_release_type VARCHAR(20),
  p_release_title TEXT,
  p_release_artist TEXT,
  p_tracks_count INTEGER,
  p_amount DECIMAL(10, 2)
)
RETURNS JSONB AS $$
DECLARE
  v_current_balance DECIMAL(10, 2);
  v_is_already_paid BOOLEAN;
  v_transaction_id UUID;
  v_payment_id UUID;
  v_new_balance DECIMAL(10, 2);
BEGIN
  -- Проверяем что релиз не оплачен
  IF p_release_type = 'basic' THEN
    SELECT is_paid INTO v_is_already_paid
    FROM releases_basic
    WHERE id = p_release_id AND user_id = p_user_id;
  ELSE
    SELECT is_paid INTO v_is_already_paid
    FROM releases
    WHERE id = p_release_id AND user_id = p_user_id;
  END IF;
  
  IF v_is_already_paid = TRUE THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Релиз уже оплачен',
      'code', 'ALREADY_PAID'
    );
  END IF;
  
  -- Получаем текущий баланс с блокировкой
  SELECT balance INTO v_current_balance
  FROM user_balances
  WHERE user_id = p_user_id
  FOR UPDATE;
  
  IF v_current_balance IS NULL OR v_current_balance < p_amount THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Недостаточно средств на балансе',
      'code', 'INSUFFICIENT_BALANCE',
      'current_balance', COALESCE(v_current_balance, 0),
      'required_amount', p_amount
    );
  END IF;
  
  v_new_balance := v_current_balance - p_amount;
  
  -- Списываем с баланса
  UPDATE user_balances
  SET 
    balance = v_new_balance,
    total_spent = COALESCE(total_spent, 0) + p_amount,
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Создаём транзакцию
  INSERT INTO transactions (
    user_id, type, amount, balance_before, balance_after, 
    currency, status, description, metadata
  )
  VALUES (
    p_user_id, 'purchase', p_amount, v_current_balance, v_new_balance,
    'RUB', 'completed', 
    'Оплата релиза: ' || p_release_title,
    jsonb_build_object(
      'release_id', p_release_id,
      'release_type', p_release_type,
      'release_title', p_release_title,
      'tracks_count', p_tracks_count
    )
  )
  RETURNING id INTO v_transaction_id;
  
  -- Записываем в историю оплат релизов
  INSERT INTO release_payments (
    user_id, release_id, release_type, transaction_id,
    release_title, release_artist, tracks_count,
    amount, payment_method, status
  )
  VALUES (
    p_user_id, p_release_id, p_release_type, v_transaction_id,
    p_release_title, p_release_artist, p_tracks_count,
    p_amount, 'balance', 'completed'
  )
  RETURNING id INTO v_payment_id;
  
  -- Обновляем релиз как оплаченный
  IF p_release_type = 'basic' THEN
    UPDATE releases_basic
    SET 
      is_paid = TRUE,
      payment_transaction_id = v_transaction_id,
      payment_amount = p_amount,
      paid_at = NOW()
    WHERE id = p_release_id AND user_id = p_user_id;
  ELSE
    UPDATE releases
    SET 
      is_paid = TRUE,
      payment_transaction_id = v_transaction_id,
      payment_amount = p_amount,
      paid_at = NOW()
    WHERE id = p_release_id AND user_id = p_user_id;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'payment_id', v_payment_id,
    'balance_before', v_current_balance,
    'balance_after', v_new_balance,
    'amount', p_amount
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Готово!
SELECT '✅ Система оплаты релизов создана!' as status;
