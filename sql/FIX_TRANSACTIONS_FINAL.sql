-- ========================================
-- ФИНАЛЬНОЕ ИСПРАВЛЕНИЕ ТРАНЗАКЦИЙ
-- ========================================
-- Запустите в Supabase SQL Editor (Dashboard > SQL Editor)
-- ========================================

-- ШАГ 1: Гарантированно разрешаем INSERT для service role
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;

-- Удаляем все старые политики
DROP POLICY IF EXISTS "Service role can insert transactions" ON transactions;
DROP POLICY IF EXISTS "Users view own transactions" ON transactions;
DROP POLICY IF EXISTS "Admins view all transactions" ON transactions;
DROP POLICY IF EXISTS "Allow insert for authenticated" ON transactions;
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON transactions;
DROP POLICY IF EXISTS "Service role full access" ON transactions;

-- Включаем RLS обратно
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Создаём минимальные политики
CREATE POLICY "Transactions select" ON transactions FOR SELECT USING (
  auth.uid() = user_id 
  OR auth.jwt() ->> 'role' = 'service_role'
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Transactions insert" ON transactions FOR INSERT WITH CHECK (
  auth.uid() = user_id 
  OR auth.jwt() ->> 'role' = 'service_role'
);

CREATE POLICY "Transactions update" ON transactions FOR UPDATE USING (
  auth.jwt() ->> 'role' = 'service_role'
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ШАГ 2: Проверяем типы транзакций 
DO $$
BEGIN
  -- Добавляем payout в enum если его нет
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'payout' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'transaction_type')
  ) THEN
    ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'payout';
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Enum modification failed, type might be TEXT';
END $$;

-- ШАГ 3: Проверяем данные
SELECT 
  'Транзакции' as table_name,
  type,
  COUNT(*) as count 
FROM transactions 
GROUP BY type
ORDER BY count DESC;

SELECT 
  'Последние 5 транзакций' as info,
  id, 
  user_id,
  type,
  amount,
  status,
  created_at 
FROM transactions 
ORDER BY created_at DESC 
LIMIT 5;

-- ШАГ 4: Проверяем пользователей с балансом
SELECT 
  p.id,
  p.artist_name,
  p.balance as profiles_balance,
  ub.balance as user_balances_balance
FROM profiles p
LEFT JOIN user_balances ub ON p.id = ub.user_id
WHERE p.balance > 0 OR ub.balance > 0
ORDER BY COALESCE(ub.balance, p.balance) DESC
LIMIT 10;

SELECT '✅ Готово! Теперь загрузите отчёт заново.' as status;
