-- =====================================================
-- СИНХРОНИЗАЦИЯ БАЛАНСОВ: profiles <-> user_balances
-- Исправляет визуальные баги и рассинхронизацию
-- Выполни этот SQL в Supabase SQL Editor
-- =====================================================

-- ШАГ 1: Создаём записи в user_balances для всех пользователей у кого их нет
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

-- ШАГ 2: Синхронизируем балансы - берём МАКСИМАЛЬНОЕ значение из обеих таблиц
-- (на случай если где-то баланс актуальнее)
UPDATE user_balances ub
SET 
  balance = GREATEST(
    COALESCE(ub.balance, 0),
    COALESCE((SELECT balance FROM profiles WHERE id = ub.user_id), 0)
  ),
  updated_at = NOW()
WHERE EXISTS (SELECT 1 FROM profiles p WHERE p.id = ub.user_id);

-- ШАГ 3: Синхронизируем profiles обратно
UPDATE profiles p
SET balance = COALESCE((SELECT balance FROM user_balances WHERE user_id = p.id), p.balance, 0)
WHERE EXISTS (SELECT 1 FROM user_balances ub WHERE ub.user_id = p.id);

-- ШАГ 4: Проверяем результат
SELECT 
  p.id,
  p.email,
  p.display_name,
  p.balance as profiles_balance,
  ub.balance as user_balances_balance,
  CASE 
    WHEN p.balance = ub.balance THEN '✅ SYNC'
    ELSE '❌ MISMATCH'
  END as status
FROM profiles p
LEFT JOIN user_balances ub ON p.id = ub.user_id
WHERE p.balance > 0 OR ub.balance > 0
ORDER BY p.balance DESC;

-- ШАГ 5: Проверяем транзакции роялти
SELECT 
  t.id,
  t.user_id,
  p.display_name,
  t.type,
  t.amount,
  t.balance_before,
  t.balance_after,
  t.description,
  t.created_at
FROM transactions t
JOIN profiles p ON p.id = t.user_id
WHERE t.type = 'payout' 
   OR t.description ILIKE '%роялти%'
   OR (t.metadata->>'source')::text = 'royalty_report'
ORDER BY t.created_at DESC
LIMIT 20;
