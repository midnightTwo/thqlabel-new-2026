-- Добавление поля bandlink для релизов
-- Ссылка на релиз (например, linkby.io или подобный сервис)
-- Админ добавляет при модерации, пользователь видит в кабинете

-- Добавляем поле bandlink в releases_basic
ALTER TABLE releases_basic 
ADD COLUMN IF NOT EXISTS bandlink TEXT DEFAULT NULL;

-- Добавляем поле bandlink в releases_exclusive  
ALTER TABLE releases_exclusive
ADD COLUMN IF NOT EXISTS bandlink TEXT DEFAULT NULL;

-- Комментарии
COMMENT ON COLUMN releases_basic.bandlink IS 'Ссылка на релиз (bandlink, linkby.io и т.д.) - добавляется админом после публикации';
COMMENT ON COLUMN releases_exclusive.bandlink IS 'Ссылка на релиз (bandlink, linkby.io и т.д.) - добавляется админом после публикации';
