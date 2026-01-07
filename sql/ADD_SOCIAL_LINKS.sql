-- ==============================================================
-- ДОБАВЛЕНИЕ ПОЛЕЙ СОЦИАЛЬНЫХ СЕТЕЙ В PROFILES
-- ==============================================================
-- Выполнить в Supabase SQL Editor

-- 1. Добавляем поля для социальных сетей (если их нет)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS telegram TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS vk TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS instagram TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS youtube TEXT;

-- 2. Комментарии к полям
COMMENT ON COLUMN profiles.telegram IS 'Telegram username или ссылка (например @username или t.me/username)';
COMMENT ON COLUMN profiles.vk IS 'VK профиль (например vk.com/username)';
COMMENT ON COLUMN profiles.instagram IS 'Instagram username (например @username)';
COMMENT ON COLUMN profiles.youtube IS 'YouTube канал (например youtube.com/@channel)';

-- 3. Проверяем результат
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name IN ('telegram', 'vk', 'instagram', 'youtube');

SELECT '✅ Поля социальных сетей добавлены в profiles!' as status;
