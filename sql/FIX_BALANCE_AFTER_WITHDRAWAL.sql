-- =====================================================
-- СРОЧНОЕ ИСПРАВЛЕНИЕ БАЛАНСА ПОСЛЕ ВЫВОДА
-- Синхронизирует user_balances с profiles
-- Выполни ВЕСЬ этот SQL в Supabase SQL Editor
-- =====================================================

-- ШАГ 1: Смотрим текущую ситуацию
SELECT 
  p.id,
  p.email,
  p.display_name,
  p.balance as profiles_balance,
  ub.balance as user_balances_balance,
  ub.frozen_balance,
  ub.total_withdrawn,
  CASE 
    WHEN p.balance = ub.balance THEN '✅ OK'
    ELSE '❌ РАЗНИЦА: ' || (ub.balance - p.balance)::TEXT || ' ₽'
  END as status
FROM profiles p
LEFT JOIN user_balances ub ON p.id = ub.user_id
WHERE p.balance > 0 OR ub.balance > 0
ORDER BY ABS(COALESCE(ub.balance, 0) - COALESCE(p.balance, 0)) DESC;

-- ШАГ 2: Синхронизируем user_balances с profiles (profiles считаем актуальным после вывода)
-- ВАЖНО: profiles.balance = реальный баланс после вывода
UPDATE user_balances ub
SET 
  balance = p.balance,
  frozen_balance = 0, -- сбрасываем замороженные (вывод уже завершён)
  updated_at = NOW()
FROM profiles p
WHERE p.id = ub.user_id;

-- ШАГ 3: Создаём записи для тех у кого нет user_balances
INSERT INTO user_balances (user_id, balance, frozen_balance, created_at, updated_at)
SELECT 
  p.id,
  COALESCE(p.balance, 0),
  0,
  NOW(),
  NOW()
FROM profiles p
LEFT JOIN user_balances ub ON p.id = ub.user_id
WHERE ub.id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- ШАГ 4: Проверяем результат
SELECT 
  p.email,
  p.display_name,
  p.balance as profiles_balance,
  ub.balance as user_balances_balance,
  ub.frozen_balance,
  CASE 
    WHEN p.balance = ub.balance THEN '✅ СИНХРОНИЗИРОВАНО'
    ELSE '❌ ОШИБКА'
  END as status
FROM profiles p
LEFT JOIN user_balances ub ON p.id = ub.user_id
WHERE p.balance > 0 OR ub.balance > 0
ORDER BY p.balance DESC;

-- ШАГ 5: Показываем завершённые выводы
SELECT 
  wr.id,
  p.display_name,
  wr.amount,
  wr.status,
  wr.created_at,
  wr.processed_at
FROM withdrawal_requests wr
JOIN profiles p ON p.id = wr.user_id
WHERE wr.status = 'completed'
ORDER BY wr.processed_at DESC
LIMIT 10;
