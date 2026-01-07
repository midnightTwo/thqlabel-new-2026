-- ============================================
-- СИСТЕМА БАЛАНСА THQ LABEL
-- ============================================

-- 1. Таблица балансов пользователей
CREATE TABLE IF NOT EXISTS user_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  frozen_balance DECIMAL(12, 2) NOT NULL DEFAULT 0.00, -- замороженные средства (в процессе вывода)
  total_deposited DECIMAL(12, 2) NOT NULL DEFAULT 0.00, -- всего пополнено
  total_withdrawn DECIMAL(12, 2) NOT NULL DEFAULT 0.00, -- всего выведено
  total_spent DECIMAL(12, 2) NOT NULL DEFAULT 0.00, -- всего потрачено на услуги
  currency VARCHAR(10) NOT NULL DEFAULT 'RUB',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 2. Таблица транзакций (история всех операций)
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL, -- 'deposit', 'withdrawal', 'purchase', 'refund', 'bonus'
  amount DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'RUB',
  balance_before DECIMAL(12, 2) NOT NULL,
  balance_after DECIMAL(12, 2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'completed', -- 'pending', 'completed', 'failed', 'cancelled'
  description TEXT,
  payment_method VARCHAR(50), -- 'sbp', 'card', 'crypto', 'liqpay', 'stripe', 'yookassa'
  reference_id VARCHAR(255), -- внешний ID (order_id, payment_id и т.д.)
  metadata JSONB DEFAULT '{}', -- дополнительные данные (order_id, service_id и т.д.)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Таблица платёжных ордеров (ожидающие платежи)
CREATE TABLE IF NOT EXISTS payment_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Сумма и валюта
  amount DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'RUB',
  
  -- Провайдер и его данные
  provider VARCHAR(50) NOT NULL, -- 'yookassa', 'cryptocloud', 'robokassa', 'tinkoff'
  provider_order_id VARCHAR(255), -- ID заказа у провайдера
  provider_payment_url TEXT, -- URL для оплаты
  provider_data JSONB DEFAULT '{}', -- сырые данные от провайдера
  
  -- Метод оплаты
  payment_method VARCHAR(50), -- 'sbp', 'card', 'wallet', 'crypto_btc', 'crypto_usdt', 'crypto_ton'
  
  -- Статусы
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'waiting', 'paid', 'expired', 'cancelled', 'failed'
  
  -- Временные метки
  expires_at TIMESTAMPTZ, -- когда истекает ордер
  paid_at TIMESTAMPTZ, -- когда оплачен
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_user_balances_user_id ON user_balances(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_payment_orders_user_id ON payment_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_status ON payment_orders(status);
CREATE INDEX IF NOT EXISTS idx_payment_orders_provider_order_id ON payment_orders(provider_order_id);

-- 5. Триггер для автоматического создания баланса при регистрации
CREATE OR REPLACE FUNCTION create_user_balance()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_balances (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_balance ON auth.users;
CREATE TRIGGER on_auth_user_created_balance
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_balance();

-- 6. Функция пополнения баланса (вызывается после успешной оплаты)
CREATE OR REPLACE FUNCTION deposit_balance(
  p_user_id UUID,
  p_amount DECIMAL(12, 2),
  p_description TEXT DEFAULT 'Пополнение баланса',
  p_metadata JSONB DEFAULT '{}',
  p_payment_method VARCHAR(50) DEFAULT NULL,
  p_reference_id VARCHAR(255) DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_balance_before DECIMAL(12, 2);
  v_balance_after DECIMAL(12, 2);
  v_transaction_id UUID;
BEGIN
  -- Получаем текущий баланс с блокировкой
  SELECT balance INTO v_balance_before
  FROM user_balances
  WHERE user_id = p_user_id
  FOR UPDATE;
  
  -- Если баланса нет - создаём
  IF v_balance_before IS NULL THEN
    INSERT INTO user_balances (user_id, balance)
    VALUES (p_user_id, 0)
    RETURNING balance INTO v_balance_before;
  END IF;
  
  v_balance_after := v_balance_before + p_amount;
  
  -- Обновляем баланс
  UPDATE user_balances
  SET 
    balance = v_balance_after,
    total_deposited = total_deposited + p_amount,
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Создаём транзакцию
  INSERT INTO transactions (user_id, type, amount, balance_before, balance_after, status, description, metadata, payment_method, reference_id)
  VALUES (p_user_id, 'deposit', p_amount, v_balance_before, v_balance_after, 'completed', p_description, p_metadata, p_payment_method, p_reference_id)
  RETURNING id INTO v_transaction_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'balance_before', v_balance_before,
    'balance_after', v_balance_after
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Функция списания с баланса (для покупки услуг)
CREATE OR REPLACE FUNCTION spend_balance(
  p_user_id UUID,
  p_amount DECIMAL(12, 2),
  p_description TEXT DEFAULT 'Покупка услуги',
  p_metadata JSONB DEFAULT '{}'
)
RETURNS JSONB AS $$
DECLARE
  v_balance_before DECIMAL(12, 2);
  v_balance_after DECIMAL(12, 2);
  v_transaction_id UUID;
BEGIN
  -- Получаем текущий баланс с блокировкой
  SELECT balance INTO v_balance_before
  FROM user_balances
  WHERE user_id = p_user_id
  FOR UPDATE;
  
  -- Проверяем достаточность средств
  IF v_balance_before IS NULL OR v_balance_before < p_amount THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Недостаточно средств на балансе'
    );
  END IF;
  
  v_balance_after := v_balance_before - p_amount;
  
  -- Обновляем баланс
  UPDATE user_balances
  SET 
    balance = v_balance_after,
    total_spent = total_spent + p_amount,
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Создаём транзакцию
  INSERT INTO transactions (user_id, type, amount, balance_before, balance_after, status, description, metadata)
  VALUES (p_user_id, 'purchase', p_amount, v_balance_before, v_balance_after, 'completed', p_description, p_metadata)
  RETURNING id INTO v_transaction_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'balance_before', v_balance_before,
    'balance_after', v_balance_after
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. RLS политики
ALTER TABLE user_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_orders ENABLE ROW LEVEL SECURITY;

-- Удаляем старые политики если есть
DROP POLICY IF EXISTS "Users can view own balance" ON user_balances;
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can view own payment orders" ON payment_orders;
DROP POLICY IF EXISTS "Admins can view all balances" ON user_balances;
DROP POLICY IF EXISTS "Admins can view all transactions" ON transactions;
DROP POLICY IF EXISTS "Admins can view all payment orders" ON payment_orders;

-- Пользователь видит только свой баланс
CREATE POLICY "Users can view own balance" ON user_balances
  FOR SELECT USING (auth.uid() = user_id);

-- Пользователь видит только свои транзакции
CREATE POLICY "Users can view own transactions" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Пользователь видит только свои ордера
CREATE POLICY "Users can view own payment orders" ON payment_orders
  FOR SELECT USING (auth.uid() = user_id);

-- Админы видят всё
CREATE POLICY "Admins can view all balances" ON user_balances
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
  );

CREATE POLICY "Admins can view all transactions" ON transactions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
  );

CREATE POLICY "Admins can view all payment orders" ON payment_orders
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
  );

-- 9. Создание балансов для существующих пользователей
INSERT INTO user_balances (user_id)
SELECT id FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- Готово!
