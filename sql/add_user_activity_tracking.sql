-- ============================================
-- СИСТЕМА ОТСЛЕЖИВАНИЯ АКТИВНОСТИ ПОЛЬЗОВАТЕЛЕЙ
-- Дата: 2026-01-08
-- ============================================

-- 1. Добавляем поле last_active в таблицу profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS last_active TIMESTAMP WITH TIME ZONE;

-- 2. Создаём индекс для быстрой сортировки по активности
CREATE INDEX IF NOT EXISTS idx_profiles_last_active ON profiles(last_active DESC NULLS LAST);

-- 3. Функция для обновления времени активности
CREATE OR REPLACE FUNCTION update_user_activity(p_user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET last_active = NOW()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Разрешаем выполнение функции аутентифицированным пользователям
GRANT EXECUTE ON FUNCTION update_user_activity(UUID) TO authenticated;

-- 5. Инициализация last_active для существующих пользователей
-- Используем last_sign_in или created_at
UPDATE profiles
SET last_active = COALESCE(
  (SELECT last_sign_in_at FROM auth.users WHERE id = profiles.id),
  created_at,
  NOW()
)
WHERE last_active IS NULL;

-- ============================================
-- ГОТОВО! Для тестирования выполните:
-- SELECT id, nickname, last_active FROM profiles LIMIT 10;
-- ============================================
