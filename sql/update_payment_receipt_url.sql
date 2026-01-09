-- ============================================
-- ОБНОВЛЕНИЕ ФУНКЦИИ ОПЛАТЫ РЕЛИЗА
-- Добавляет сохранение payment_receipt_url и payment_date
-- ============================================

-- Сначала добавим колонку payment_date если её нет
ALTER TABLE releases_basic ADD COLUMN IF NOT EXISTS payment_date TIMESTAMPTZ;
ALTER TABLE releases ADD COLUMN IF NOT EXISTS payment_date TIMESTAMPTZ;

-- Обновлённая функция оплаты
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
  v_receipt_url TEXT;
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
  
  -- Формируем URL чека
  v_receipt_url := '/api/receipt/' || v_transaction_id::TEXT;
  
  -- Записываем в историю оплат релизов (если таблица существует)
  BEGIN
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
  EXCEPTION WHEN undefined_table THEN
    v_payment_id := NULL;
  END;
  
  -- Обновляем релиз как оплаченный
  IF p_release_type = 'basic' THEN
    UPDATE releases_basic
    SET 
      is_paid = TRUE,
      payment_transaction_id = v_transaction_id,
      payment_amount = p_amount,
      payment_receipt_url = v_receipt_url,
      payment_date = NOW(),
      paid_at = NOW()
    WHERE id = p_release_id AND user_id = p_user_id;
  ELSE
    UPDATE releases
    SET 
      is_paid = TRUE,
      payment_transaction_id = v_transaction_id,
      payment_amount = p_amount,
      payment_receipt_url = v_receipt_url,
      payment_date = NOW(),
      paid_at = NOW()
    WHERE id = p_release_id AND user_id = p_user_id;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'payment_id', v_payment_id,
    'balance_before', v_current_balance,
    'balance_after', v_new_balance,
    'amount', p_amount,
    'receipt_url', v_receipt_url
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Обновим старые оплаченные релизы - добавим им URL чека
UPDATE releases_basic
SET payment_receipt_url = '/api/receipt/' || payment_transaction_id::TEXT,
    payment_date = COALESCE(payment_date, paid_at)
WHERE is_paid = TRUE 
  AND payment_transaction_id IS NOT NULL 
  AND payment_receipt_url IS NULL;

UPDATE releases
SET payment_receipt_url = '/api/receipt/' || payment_transaction_id::TEXT,
    payment_date = COALESCE(payment_date, paid_at)
WHERE is_paid = TRUE 
  AND payment_transaction_id IS NOT NULL 
  AND payment_receipt_url IS NULL;

SELECT '✅ Функция оплаты обновлена! Чеки теперь доступны по /api/receipt/{transaction_id}' as status;
