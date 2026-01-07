-- =====================================================
-- ПОЛНОЕ ИСПРАВЛЕНИЕ СИСТЕМЫ БАЛАНСОВ И ТРАНЗАКЦИЙ
-- Выполни ВЕСЬ этот SQL в Supabase SQL Editor
-- =====================================================

-- ============ ЧАСТЬ 1: ИСПРАВЛЯЕМ CONSTRAINT ТРАНЗАКЦИЙ ============
-- Удаляем старые ограничения
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_type_check;

-- Добавляем новый constraint с ПОЛНЫМ списком типов
ALTER TABLE transactions 
ADD CONSTRAINT transactions_type_check 
CHECK (type IN ('deposit', 'withdrawal', 'purchase', 'payout', 'refund', 'adjustment', 'bonus', 'fee', 'correction'));

-- Добавляем недостающие колонки если их нет
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'RUB';
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);

-- Убираем NOT NULL если есть проблемы
ALTER TABLE transactions ALTER COLUMN description DROP NOT NULL;

-- ============ ЧАСТЬ 2: СИНХРОНИЗАЦИЯ БАЛАНСОВ ============
-- Создаём записи в user_balances для всех пользователей у кого их нет
INSERT INTO user_balances (user_id, balance, created_at, updated_at)
SELECT 
  p.id as user_id,
  COALESCE(p.balance, 0) as balance,
  NOW() as created_at,
  NOW() as updated_at
FROM profiles p
LEFT JOIN user_balances ub ON p.id = ub.user_id
WHERE ub.id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- Синхронизируем балансы - берём МАКСИМАЛЬНОЕ значение
UPDATE user_balances ub
SET 
  balance = GREATEST(
    COALESCE(ub.balance, 0),
    COALESCE((SELECT balance FROM profiles WHERE id = ub.user_id), 0)
  ),
  updated_at = NOW()
WHERE EXISTS (SELECT 1 FROM profiles p WHERE p.id = ub.user_id);

-- Синхронизируем profiles обратно
UPDATE profiles p
SET balance = COALESCE((SELECT balance FROM user_balances WHERE user_id = p.id), p.balance, 0)
WHERE EXISTS (SELECT 1 FROM user_balances ub WHERE ub.user_id = p.id);

-- ============ ЧАСТЬ 3: ИСПРАВЛЯЕМ RLS ДЛЯ ТРАНЗАКЦИЙ ============
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
SELECT 'Balances synced' as status, COUNT(*) as count FROM user_balances;

SELECT 
  'Transaction types allowed' as info,
  pg_get_constraintdef(oid) as constraint_def
FROM pg_constraint 
WHERE conname = 'transactions_type_check';

-- Показываем последние транзакции
SELECT 
  t.id,
  p.display_name,
  t.type,
  t.amount,
  t.description,
  t.created_at
FROM transactions t
JOIN profiles p ON p.id = t.user_id
ORDER BY t.created_at DESC
LIMIT 10;
