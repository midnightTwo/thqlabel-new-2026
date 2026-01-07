-- ==============================================================
-- ИСПРАВЛЕНИЕ RLS ПОЛИТИК ДЛЯ ТРАНЗАКЦИЙ
-- ==============================================================
-- Выполнить в Supabase SQL Editor ПОШАГОВО

-- ШАГ 1: Проверяем текущие транзакции (найди свой user_id)
SELECT id, user_id, type, amount, status, description, created_at 
FROM transactions 
ORDER BY created_at DESC 
LIMIT 20;

-- ШАГ 2: Смотрим RLS политики на transactions
SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'transactions';

-- ========================================
-- ШАГ 3: ПОЛНОСТЬЮ ОТКЛЮЧАЕМ RLS (КРИТИЧНО!)
-- ========================================
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;

-- ШАГ 4: Удаляем ВСЕ старые политики
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can view their own transactions" ON transactions;
DROP POLICY IF EXISTS "Allow insert transactions for admins" ON transactions;
DROP POLICY IF EXISTS "Allow owners and admins to insert transactions" ON transactions;
DROP POLICY IF EXISTS "Allow owners and admins to update transactions" ON transactions;
DROP POLICY IF EXISTS "Admin view transactions_with_user" ON transactions;
DROP POLICY IF EXISTS "transactions_select_policy" ON transactions;
DROP POLICY IF EXISTS "transactions_insert_policy" ON transactions;
DROP POLICY IF EXISTS "transactions_update_policy" ON transactions;
DROP POLICY IF EXISTS "Allow users to view their transactions" ON transactions;
DROP POLICY IF EXISTS "Allow admins to view all transactions" ON transactions;
DROP POLICY IF EXISTS "Service role full access" ON transactions;
DROP POLICY IF EXISTS "transactions_select" ON transactions;
DROP POLICY IF EXISTS "transactions_insert" ON transactions;
DROP POLICY IF EXISTS "transactions_update" ON transactions;

-- ШАГ 5: Включаем RLS обратно
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- ШАГ 6: Создаём НОВЫЕ политики
-- SELECT - пользователь видит свои транзакции
CREATE POLICY "transactions_user_select" ON transactions
FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- SELECT - админы видят все
CREATE POLICY "transactions_admin_select" ON transactions
FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner'))
);

-- INSERT - сервис роль для API
CREATE POLICY "transactions_service_insert" ON transactions
FOR INSERT TO service_role
WITH CHECK (true);

-- INSERT - админы могут создавать
CREATE POLICY "transactions_admin_insert" ON transactions
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner'))
);

-- UPDATE - только админы
CREATE POLICY "transactions_admin_update" ON transactions
FOR UPDATE TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner'))
);

-- ШАГ 7: Проверяем политики
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'transactions';

-- ШАГ 8: Даём права
GRANT ALL ON transactions TO service_role;
GRANT SELECT, INSERT ON transactions TO authenticated;

SELECT '✅ RLS исправлен!' as status;

-- ==============================================================
-- ЕСЛИ БОНУСЫ ВСЕ РАВНО НЕ ВИДНЫ - ПРОВЕРЬ user_id:
-- ==============================================================

-- Найди свой email и user_id в profiles:
SELECT id, email, nickname, balance FROM profiles WHERE email LIKE '%твой_email%';

-- Посмотри с каким user_id созданы транзакции:
SELECT user_id, type, amount, description FROM transactions WHERE type IN ('bonus', 'adjustment') ORDER BY created_at DESC LIMIT 10;

-- Если user_id в транзакциях НЕ СОВПАДАЕТ с твоим id из profiles - это проблема!
-- Тогда нужно обновить транзакции:
