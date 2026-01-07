-- Добавление поля is_promo_skipped для сохранения статуса "пропущено" промо
-- Выполните в Supabase Dashboard -> SQL Editor

-- Для таблицы releases_basic
ALTER TABLE releases_basic 
ADD COLUMN IF NOT EXISTS is_promo_skipped BOOLEAN DEFAULT FALSE;

-- Для таблицы releases_exclusive
ALTER TABLE releases_exclusive 
ADD COLUMN IF NOT EXISTS is_promo_skipped BOOLEAN DEFAULT FALSE;

-- Готово! Теперь статус "пропущено" для промо будет сохраняться в базе
