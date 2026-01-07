-- Добавление колонки release_artists в таблицы релизов
-- Выполните этот SQL в Supabase SQL Editor

-- Для basic релизов
ALTER TABLE releases_basic 
ADD COLUMN IF NOT EXISTS release_artists TEXT[] DEFAULT '{}';

-- Для exclusive релизов
ALTER TABLE releases 
ADD COLUMN IF NOT EXISTS release_artists TEXT[] DEFAULT '{}';

-- Если есть таблица releases_exclusive
ALTER TABLE releases_exclusive 
ADD COLUMN IF NOT EXISTS release_artists TEXT[] DEFAULT '{}';

-- Миграция существующих данных: копируем artist_name в release_artists если пусто
UPDATE releases_basic 
SET release_artists = ARRAY[artist_name] 
WHERE (release_artists IS NULL OR release_artists = '{}') 
AND artist_name IS NOT NULL AND artist_name != '';

UPDATE releases 
SET release_artists = ARRAY[artist_name] 
WHERE (release_artists IS NULL OR release_artists = '{}') 
AND artist_name IS NOT NULL AND artist_name != '';

-- Комментарии к колонкам
COMMENT ON COLUMN releases_basic.release_artists IS 'Массив артистов релиза (первый - основной)';
COMMENT ON COLUMN releases.release_artists IS 'Массив артистов релиза (первый - основной)';
