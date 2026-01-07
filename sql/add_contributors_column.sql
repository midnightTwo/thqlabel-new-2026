-- ==============================================
-- ДОБАВЛЕНИЕ КОЛОНКИ CONTRIBUTORS В ТАБЛИЦЫ РЕЛИЗОВ
-- ==============================================
-- Выполните этот SQL в Supabase Dashboard -> SQL Editor

-- 1. Добавляем колонку contributors в releases_basic
ALTER TABLE releases_basic 
ADD COLUMN IF NOT EXISTS contributors JSONB DEFAULT '[]'::jsonb;

-- 2. Добавляем колонку contributors в releases (exclusive)
ALTER TABLE releases 
ADD COLUMN IF NOT EXISTS contributors JSONB DEFAULT '[]'::jsonb;

-- 3. Добавляем колонку contributors в releases_exclusive (если есть)
ALTER TABLE releases_exclusive 
ADD COLUMN IF NOT EXISTS contributors JSONB DEFAULT '[]'::jsonb;

-- 4. Комментарии для документации
COMMENT ON COLUMN releases_basic.contributors IS 'Массив авторов релиза [{role: string, fullName: string}]';
COMMENT ON COLUMN releases.contributors IS 'Массив авторов релиза [{role: string, fullName: string}]';

-- 5. Проверка
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name IN ('releases_basic', 'releases', 'releases_exclusive') 
AND column_name = 'contributors';

-- ==============================================
-- ФОРМАТ ДАННЫХ:
-- ==============================================
-- [
--   { "role": "composer", "fullName": "Иван Иванов" },
--   { "role": "lyricist", "fullName": "Петр Петров" }
-- ]
-- 
-- Роли: composer, lyricist, producer, arranger, performer, mixer, mastering, other
-- ==============================================
