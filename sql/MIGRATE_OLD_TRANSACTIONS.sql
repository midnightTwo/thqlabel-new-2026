-- ==============================================================
-- МИГРАЦИЯ СТАРЫХ ТРАНЗАКЦИЙ - ЗАПОЛНЕНИЕ balance_before/after
-- ==============================================================
-- Выполнить в Supabase SQL Editor

-- 1. Сначала проверяем сколько транзакций без balance_before/after
SELECT 
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE balance_before IS NULL) as missing_balance_before,
  COUNT(*) FILTER (WHERE balance_after IS NULL) as missing_balance_after
FROM transactions;

-- 2. Функция для пересчёта балансов в истории транзакций
-- Проходит по всем транзакциям пользователя и восстанавливает balance_before/after
CREATE OR REPLACE FUNCTION recalculate_transaction_balances(p_user_id UUID DEFAULT NULL)
RETURNS TABLE (
  user_id UUID,
  transactions_updated INT,
  final_balance DECIMAL
) AS $$
DECLARE
  v_user RECORD;
  v_tx RECORD;
  v_running_balance DECIMAL(12,2);
  v_amount_change DECIMAL(12,2);
  v_count INT;
BEGIN
  -- Если user_id не указан, обрабатываем всех пользователей
  FOR v_user IN 
    SELECT DISTINCT t.user_id 
    FROM transactions t
    WHERE (p_user_id IS NULL OR t.user_id = p_user_id)
    ORDER BY t.user_id
  LOOP
    v_running_balance := 0;
    v_count := 0;
    
    -- Проходим по транзакциям пользователя в хронологическом порядке
    FOR v_tx IN 
      SELECT id, type, amount, balance_before, balance_after, created_at
      FROM transactions
      WHERE transactions.user_id = v_user.user_id
      ORDER BY created_at ASC, id ASC
    LOOP
      -- Вычисляем изменение баланса
      CASE v_tx.type
        WHEN 'deposit' THEN v_amount_change := v_tx.amount;
        WHEN 'payout' THEN v_amount_change := v_tx.amount;
        WHEN 'bonus' THEN v_amount_change := v_tx.amount;
        WHEN 'refund' THEN v_amount_change := v_tx.amount;
        WHEN 'unfreeze' THEN v_amount_change := v_tx.amount;
        WHEN 'correction' THEN v_amount_change := v_tx.amount;
        WHEN 'adjustment' THEN v_amount_change := v_tx.amount;
        WHEN 'withdrawal' THEN v_amount_change := -v_tx.amount;
        WHEN 'purchase' THEN v_amount_change := -v_tx.amount;
        WHEN 'fee' THEN v_amount_change := -v_tx.amount;
        WHEN 'freeze' THEN v_amount_change := -v_tx.amount;
        ELSE v_amount_change := 0;
      END CASE;
      
      -- Обновляем транзакцию
      UPDATE transactions
      SET 
        balance_before = v_running_balance,
        balance_after = v_running_balance + v_amount_change
      WHERE id = v_tx.id;
      
      -- Обновляем текущий баланс
      v_running_balance := v_running_balance + v_amount_change;
      v_count := v_count + 1;
    END LOOP;
    
    -- Возвращаем результат для этого пользователя
    user_id := v_user.user_id;
    transactions_updated := v_count;
    final_balance := v_running_balance;
    RETURN NEXT;
  END LOOP;
  
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- 3. ВЫПОЛНЯЕМ МИГРАЦИЮ для всех пользователей
-- ⚠️ Это обновит ВСЕ транзакции, пересчитав balance_before/after
SELECT * FROM recalculate_transaction_balances();

-- 4. Проверяем результат
SELECT 
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE balance_before IS NOT NULL) as has_balance_before,
  COUNT(*) FILTER (WHERE balance_after IS NOT NULL) as has_balance_after
FROM transactions;

-- 5. Сверяем итоговые балансы с profiles
SELECT 
  p.id,
  p.nickname,
  p.email,
  p.balance as profile_balance,
  (SELECT balance_after FROM transactions WHERE user_id = p.id ORDER BY created_at DESC, id DESC LIMIT 1) as last_tx_balance,
  CASE 
    WHEN p.balance = (SELECT balance_after FROM transactions WHERE user_id = p.id ORDER BY created_at DESC, id DESC LIMIT 1)
    THEN '✅ OK'
    ELSE '⚠️ MISMATCH'
  END as status
FROM profiles p
WHERE EXISTS (SELECT 1 FROM transactions WHERE user_id = p.id)
ORDER BY p.created_at DESC
LIMIT 50;

-- 6. Если нужно синхронизировать баланс profiles с последней транзакцией:
-- UPDATE profiles p
-- SET balance = (
--   SELECT COALESCE(balance_after, 0) 
--   FROM transactions 
--   WHERE user_id = p.id 
--   ORDER BY created_at DESC, id DESC 
--   LIMIT 1
-- )
-- WHERE EXISTS (SELECT 1 FROM transactions WHERE user_id = p.id);

SELECT '✅ Миграция завершена! Проверьте результаты выше.' as status;
