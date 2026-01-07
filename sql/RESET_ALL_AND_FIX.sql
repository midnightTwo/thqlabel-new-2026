-- =====================================================
-- ПОЛНЫЙ СБРОС БАЛАНСОВ И НАСТРОЙКА СИСТЕМЫ ОТЧЁТОВ
-- Выполни ВЕСЬ этот SQL в Supabase SQL Editor
-- =====================================================

-- ============ ЧАСТЬ 1: ОЧИСТКА ВСЕХ БАЛАНСОВ ============

-- Сбрасываем балансы в user_balances
UPDATE user_balances SET 
  balance = 0,
  frozen_balance = 0,
  total_deposited = 0,
  total_withdrawn = 0,
  total_spent = 0,
  updated_at = NOW();

-- Сбрасываем балансы в profiles
UPDATE profiles SET balance = 0;

-- Удаляем все транзакции (опционально - закомментируй если не нужно)
-- TRUNCATE transactions;

-- Удаляем все выплаты роялти
TRUNCATE royalty_payouts;

-- Удаляем статистику треков
TRUNCATE track_statistics CASCADE;

-- Удаляем отчёты
TRUNCATE royalty_reports CASCADE;

-- ============ ЧАСТЬ 2: ИСПРАВЛЯЕМ CONSTRAINT ТРАНЗАКЦИЙ ============

ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_type_check;

ALTER TABLE transactions 
ADD CONSTRAINT transactions_type_check 
CHECK (type IN ('deposit', 'withdrawal', 'purchase', 'payout', 'refund', 'adjustment', 'bonus', 'fee', 'correction'));

-- Добавляем колонки если нет
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'RUB';
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);

-- ============ ЧАСТЬ 3: RLS ДЛЯ ТРАНЗАКЦИЙ ============

-- Разрешаем service role создавать транзакции
DROP POLICY IF EXISTS "Service role can insert transactions" ON transactions;
CREATE POLICY "Service role can insert transactions"
ON transactions FOR INSERT
TO service_role
WITH CHECK (true);

-- Пользователи видят свои транзакции
DROP POLICY IF EXISTS "Users view own transactions" ON transactions;
CREATE POLICY "Users view own transactions"
ON transactions FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Админы видят все
DROP POLICY IF EXISTS "Admins view all transactions" ON transactions;
CREATE POLICY "Admins view all transactions"
ON transactions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'owner')
  )
);

-- ============ ЧАСТЬ 4: ПРОВЕРКА ============

SELECT 'Балансы сброшены' as status, COUNT(*) as users FROM user_balances WHERE balance = 0;

SELECT 'Транзакции' as table_name, COUNT(*) as count FROM transactions
UNION ALL
SELECT 'Отчёты' as table_name, COUNT(*) as count FROM royalty_reports
UNION ALL  
SELECT 'Выплаты' as table_name, COUNT(*) as count FROM royalty_payouts;
