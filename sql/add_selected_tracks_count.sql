-- ============================================
-- ДОБАВЛЕНИЕ ПОЛЯ selected_tracks_count
-- Для сохранения выбранного количества треков при создании релиза
-- ============================================

-- Добавляем в releases_basic
ALTER TABLE releases_basic
ADD COLUMN IF NOT EXISTS selected_tracks_count INTEGER DEFAULT NULL;

-- Добавляем в releases_exclusive  
ALTER TABLE releases_exclusive
ADD COLUMN IF NOT EXISTS selected_tracks_count INTEGER DEFAULT NULL;

-- Комментарии
COMMENT ON COLUMN releases_basic.selected_tracks_count IS 'Выбранное пользователем максимальное количество треков для EP/Album';
COMMENT ON COLUMN releases_exclusive.selected_tracks_count IS 'Выбранное пользователем максимальное количество треков для EP/Album';

-- ============================================
-- ГОТОВО! Выполните этот SQL в Supabase Dashboard
-- SQL Editor -> New Query -> Вставить -> Run
-- ============================================
