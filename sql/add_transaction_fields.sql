-- Добавляем новые поля в таблицу transactions
-- Выполни этот SQL в Supabase SQL Editor

-- Добавить поле currency
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'RUB';

-- Добавить поле payment_method
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);

-- Добавить поле reference_id для связи с внешними платежами
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS reference_id VARCHAR(255);

-- Обновляем функцию deposit_balance
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

-- Готово!
