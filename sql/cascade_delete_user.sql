-- КАСКАДНОЕ УДАЛЕНИЕ ПОЛЬЗОВАТЕЛЕЙ (УПРОЩЁННАЯ ВЕРСИЯ)
-- При удалении из profiles автоматически удаляется из auth.users
-- Освобождается email, никнейм и все данные

-- ========================================
-- ВАЖНО! Этот скрипт делает 2 вещи:
-- 1. При удалении из auth.users  удаляется из profiles (стандартно)
-- 2. При удалении из profiles  удаляется из auth.users (новое!)
-- ========================================

-- Шаг 1: Убедимся что есть CASCADE от auth.users к profiles
ALTER TABLE profiles 
  DROP CONSTRAINT IF EXISTS profiles_id_fkey,
  ADD CONSTRAINT profiles_id_fkey 
    FOREIGN KEY (id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE;

-- Шаг 2: Создаем функцию для обратного удаления (profiles  auth.users)
CREATE OR REPLACE FUNCTION delete_auth_user_on_profile_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Удаляем пользователя из auth.users
  -- Используем SECURITY DEFINER чтобы обойти RLS
  DELETE FROM auth.users WHERE id = OLD.id;
  
  RAISE NOTICE 'Пользователь % удалён из auth.users и profiles', OLD.email;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Шаг 3: Создаем триггер на удаление из profiles
DROP TRIGGER IF EXISTS on_profile_delete_cascade_auth ON profiles;

CREATE TRIGGER on_profile_delete_cascade_auth
  BEFORE DELETE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION delete_auth_user_on_profile_delete();

-- ========================================
-- ИНСТРУКЦИЯ ПО ИСПОЛЬЗОВАНИЮ:
-- ========================================
-- 
-- Теперь ты можешь просто удалять из profiles:
-- 
-- DELETE FROM profiles WHERE id = 'user-uuid-here';
-- 
-- И автоматически:
--  Удалится из auth.users
--  Освободится email
--  Освободится никнейм
--  Удалятся все связанные данные
--
-- ========================================

-- Проверка что триггер создан
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_profile_delete_cascade_auth';

SELECT ' Каскадное удаление настроено! Можешь удалять из profiles - всё остальное удалится автоматически' as status;
