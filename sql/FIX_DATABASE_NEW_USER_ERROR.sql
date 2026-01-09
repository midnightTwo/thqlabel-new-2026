-- ⚡ ИСПРАВЛЕНИЕ: Database error saving new user
-- Выполните этот SQL в Supabase Dashboard → SQL Editor
-- ⚠️ ВЫПОЛНИТЕ ЭТОТ СКРИПТ ЦЕЛИКОМ!

-- =============================================
-- ШАГ 0: ДИАГНОСТИКА - посмотрим ВСЕ триггеры
-- =============================================
SELECT 
  t.tgname as trigger_name,
  n.nspname || '.' || c.relname as table_name,
  p.proname as function_name
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
LEFT JOIN pg_proc p ON t.tgfoid = p.oid
WHERE n.nspname = 'auth' AND c.relname = 'users'
AND NOT t.tgisinternal;

-- =============================================
-- ШАГ 1: УДАЛЯЕМ ВСЕ ТРИГГЕРЫ НА auth.users
-- =============================================
DO $$
DECLARE
  trigger_rec RECORD;
BEGIN
  -- Находим и удаляем ВСЕ пользовательские триггеры на auth.users
  FOR trigger_rec IN 
    SELECT t.tgname
    FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'auth' AND c.relname = 'users'
    AND NOT t.tgisinternal
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON auth.users', trigger_rec.tgname);
    RAISE NOTICE 'Удалён триггер: %', trigger_rec.tgname;
  END LOOP;
END $$;

-- Явно удаляем известные триггеры
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS create_profile_trigger ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user_trigger ON auth.users;
DROP TRIGGER IF EXISTS tr_on_auth_user_created ON auth.users;

-- Удаляем функции триггеров
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.create_profile_for_user() CASCADE;

-- =============================================
-- ШАГ 2: Проверяем таблицу profiles
-- =============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  nickname TEXT,
  avatar_url TEXT,
  member_id TEXT,
  role TEXT DEFAULT 'basic',
  balance DECIMAL(12, 2) DEFAULT 0,
  telegram TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- ШАГ 3: Настраиваем RLS для profiles
-- =============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Удаляем старые политики
DROP POLICY IF EXISTS "Enable read for all authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for own profile" ON profiles;
DROP POLICY IF EXISTS "Enable update for own profile" ON profiles;
DROP POLICY IF EXISTS "Enable update for admins" ON profiles;
DROP POLICY IF EXISTS "Enable read for anon users" ON profiles;
DROP POLICY IF EXISTS "Service role full access" ON profiles;

-- Политика для service_role (API routes)
CREATE POLICY "Service role full access" ON profiles
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Чтение для всех
CREATE POLICY "Enable read for all authenticated users" ON profiles 
  FOR SELECT TO authenticated USING (true);

-- Вставка для своего профиля
CREATE POLICY "Enable insert for own profile" ON profiles 
  FOR INSERT TO authenticated 
  WITH CHECK (auth.uid() = id);

-- Обновление своего профиля  
CREATE POLICY "Enable update for own profile" ON profiles 
  FOR UPDATE TO authenticated 
  USING (auth.uid() = id);

-- Чтение для анонимных
CREATE POLICY "Enable read for anon users" ON profiles 
  FOR SELECT TO anon USING (true);

-- =============================================
-- ШАГ 4: Права доступа
-- =============================================
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;

-- =============================================
-- ФИНАЛЬНАЯ ПРОВЕРКА: Триггеров НЕ должно быть
-- =============================================
SELECT 
  'Проверка триггеров после удаления' as info,
  COALESCE(
    (SELECT string_agg(t.tgname, ', ')
     FROM pg_trigger t
     JOIN pg_class c ON t.tgrelid = c.oid
     JOIN pg_namespace n ON c.relnamespace = n.oid
     WHERE n.nspname = 'auth' AND c.relname = 'users'
     AND NOT t.tgisinternal),
    '✅ Нет пользовательских триггеров'
  ) as result;

-- ✅ Теперь профиль будет создаваться из кода приложения
