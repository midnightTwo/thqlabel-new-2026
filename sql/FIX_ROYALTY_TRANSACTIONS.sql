-- =====================================================
-- ИСПРАВЛЕНИЕ ТРАНЗАКЦИЙ ДЛЯ ОТЧЁТОВ РОЯЛТИ
-- Выполни ВЕСЬ этот SQL в Supabase SQL Editor
-- =====================================================

-- ШАГ 1: Исправляем тип reference_id если нужно
DO $$
BEGIN
  -- Пробуем изменить на VARCHAR для универсальности
  ALTER TABLE transactions ALTER COLUMN reference_id TYPE VARCHAR(255) USING reference_id::VARCHAR;
  RAISE NOTICE 'reference_id changed to VARCHAR(255)';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'reference_id already OK or does not exist: %', SQLERRM;
END $$;

-- ШАГ 2: Добавляем колонки если их нет
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'RUB';
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS reference_id VARCHAR(255);

-- ШАГ 3: Исправляем constraint
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_type_check;
ALTER TABLE transactions 
ADD CONSTRAINT transactions_type_check 
CHECK (type IN ('deposit', 'withdrawal', 'purchase', 'payout', 'refund', 'adjustment', 'bonus', 'fee', 'correction'));

-- ШАГ 4: RLS - разрешаем INSERT для всех (service_role обходит RLS)
-- Удаляем все старые INSERT политики
DROP POLICY IF EXISTS "Service role can insert transactions" ON transactions;
DROP POLICY IF EXISTS "Admins create transactions" ON transactions;
DROP POLICY IF EXISTS "Allow owners and admins to insert transactions" ON transactions;

-- Создаём политику разрешающую INSERT для authenticated (суперадмин/service_role обходят RLS)
CREATE POLICY "Allow insert for authenticated" ON transactions
FOR INSERT TO authenticated
WITH CHECK (true);

-- ШАГ 5: Проверяем что транзакция теперь может быть создана
-- Добавляем транзакцию за последний отчёт вручную (если её нет)
DO $$
DECLARE
  v_user_id UUID;
  v_current_balance DECIMAL;
  v_payout_amount DECIMAL;
  v_report_id UUID;
  v_quarter TEXT;
  v_year INTEGER;
BEGIN
  -- Находим последнюю выплату без транзакции
  SELECT rp.user_id, rp.amount, rp.report_id, rp.quarter, rp.year
  INTO v_user_id, v_payout_amount, v_report_id, v_quarter, v_year
  FROM royalty_payouts rp
  WHERE NOT EXISTS (
    SELECT 1 FROM transactions t 
    WHERE t.user_id = rp.user_id 
    AND t.type = 'payout'
    AND t.metadata->>'report_id' = rp.report_id::TEXT
  )
  ORDER BY rp.created_at DESC
  LIMIT 1;
  
  IF v_user_id IS NOT NULL THEN
    -- Получаем текущий баланс
    SELECT balance INTO v_current_balance FROM user_balances WHERE user_id = v_user_id;
    
    -- Создаём транзакцию
    INSERT INTO transactions (
      user_id, type, amount, currency, balance_before, balance_after, 
      status, description, payment_method, metadata
    ) VALUES (
      v_user_id,
      'payout',
      v_payout_amount,
      'RUB',
      v_current_balance - v_payout_amount,
      v_current_balance,
      'completed',
      'Роялти за ' || v_quarter || ' ' || v_year || ' (отчёт дистрибьютора)',
      'royalty',
      jsonb_build_object(
        'report_id', v_report_id,
        'quarter', v_quarter,
        'year', v_year,
        'source', 'royalty_report',
        'processed_at', NOW()
      )
    );
    
    RAISE NOTICE 'Транзакция создана для user_id: %, сумма: % RUB', v_user_id, v_payout_amount;
  ELSE
    RAISE NOTICE 'Нет выплат без транзакций или все транзакции уже созданы';
  END IF;
END $$;

-- ШАГ 6: Показываем все транзакции payout
SELECT 
  t.id,
  p.display_name,
  p.email,
  t.type,
  t.amount,
  t.description,
  t.metadata->>'quarter' as quarter,
  t.metadata->>'year' as year,
  t.created_at
FROM transactions t
JOIN profiles p ON p.id = t.user_id
WHERE t.type = 'payout'
ORDER BY t.created_at DESC
LIMIT 10;

-- ШАГ 7: Проверяем royalty_payouts без транзакций
SELECT 
  rp.id,
  p.display_name,
  rp.amount,
  rp.quarter,
  rp.year,
  rp.created_at,
  CASE 
    WHEN EXISTS (SELECT 1 FROM transactions t WHERE t.user_id = rp.user_id AND t.type = 'payout' AND (t.metadata->>'report_id')::TEXT = rp.report_id::TEXT)
    THEN '✅ Есть транзакция'
    ELSE '❌ Нет транзакции'
  END as tx_status
FROM royalty_payouts rp
JOIN profiles p ON p.id = rp.user_id
ORDER BY rp.created_at DESC
LIMIT 10;
