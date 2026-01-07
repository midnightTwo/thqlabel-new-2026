-- ==============================================================
-- ДИАГНОСТИКА И ИСПРАВЛЕНИЕ ТРАНЗАКЦИЙ
-- Выполни в Supabase SQL Editor пошагово!
-- ==============================================================

-- ШАГ 1: ПОКАЗАТЬ ВСЕ ПОСЛЕДНИЕ ТРАНЗАКЦИИ
SELECT 
  t.id,
  t.user_id,
  t.type,
  t.amount,
  t.status,
  t.description,
  t.created_at,
  p.email as user_email,
  p.nickname as user_nickname
FROM transactions t
LEFT JOIN profiles p ON p.id = t.user_id
ORDER BY t.created_at DESC 
LIMIT 20;

-- ШАГ 2: ПОКАЗАТЬ ВСЕХ ПОЛЬЗОВАТЕЛЕЙ С БАЛАНСОМ
SELECT id, email, nickname, display_name, balance, role
FROM profiles
WHERE balance > 0 OR role IN ('admin', 'owner')
ORDER BY created_at DESC
LIMIT 20;

-- ШАГ 3: ПОКАЗАТЬ ВСЕ BONUS/ADJUSTMENT ТРАНЗАКЦИИ
SELECT 
  t.id,
  t.user_id,
  t.type,
  t.amount,
  t.status,
  t.description,
  t.admin_id,
  t.created_at,
  p.email as target_user_email
FROM transactions t
LEFT JOIN profiles p ON p.id = t.user_id
WHERE t.type IN ('bonus', 'adjustment', 'correction')
ORDER BY t.created_at DESC;

-- ШАГ 4: ПОКАЗАТЬ ТЕКУЩИЕ RLS ПОЛИТИКИ
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'transactions';

-- ====================================================================
-- ШАГ 5: ОТКЛЮЧИТЬ RLS ПОЛНОСТЬЮ (ЧТОБЫ УВИДЕТЬ ВСЕ ДАННЫЕ)
-- ====================================================================
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;

-- ШАГ 6: ТЕПЕРЬ ПРОВЕРЬ САЙТ - ТРАНЗАКЦИИ ДОЛЖНЫ ПОЯВИТЬСЯ!
-- Если появились - проблема была в RLS политиках

-- ====================================================================
-- ШАГ 7: ЕСЛИ НУЖНО ВКЛЮЧИТЬ RLS ОБРАТНО С ПРАВИЛЬНЫМИ ПОЛИТИКАМИ
-- ====================================================================

-- Удаляем все старые политики
DO $$ 
DECLARE 
  pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'transactions'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON transactions', pol.policyname);
  END LOOP;
END $$;

-- Включаем RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Создаём простые политики
CREATE POLICY "select_own" ON transactions FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "select_admin" ON transactions FOR SELECT TO authenticated  
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')));

CREATE POLICY "insert_admin" ON transactions FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')));

CREATE POLICY "service_all" ON transactions FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- Права
GRANT ALL ON transactions TO service_role;
GRANT SELECT ON transactions TO authenticated;

SELECT '✅ RLS настроен!' as result;

-- ====================================================================
-- АЛЬТЕРНАТИВА: ОСТАВИТЬ RLS ОТКЛЮЧЁННЫМ
-- ====================================================================
-- Если RLS мешает, можно просто оставить его отключённым:
-- ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
-- GRANT ALL ON transactions TO authenticated;
-- GRANT ALL ON transactions TO service_role;
