-- Добавление недостающих полей в таблицу releases
-- Запустите этот SQL в Supabase Dashboard → SQL Editor
-- Дата: 2026-01-05

-- Добавить колонку focus_track_promo
ALTER TABLE releases 
ADD COLUMN IF NOT EXISTS focus_track_promo TEXT;

-- Добавить колонку is_promo_skipped
ALTER TABLE releases 
ADD COLUMN IF NOT EXISTS is_promo_skipped BOOLEAN DEFAULT false;

-- Добавить колонку promo_photos (массив URL)
ALTER TABLE releases 
ADD COLUMN IF NOT EXISTS promo_photos TEXT[] DEFAULT '{}';

-- Добавить колонку album_description
ALTER TABLE releases 
ADD COLUMN IF NOT EXISTS album_description TEXT;

-- Добавить колонку focus_track
ALTER TABLE releases 
ADD COLUMN IF NOT EXISTS focus_track TEXT;

-- Добавить колонку subgenres
ALTER TABLE releases 
ADD COLUMN IF NOT EXISTS subgenres TEXT[] DEFAULT '{}';

-- Добавить колонку collaborators
ALTER TABLE releases 
ADD COLUMN IF NOT EXISTS collaborators JSONB DEFAULT '[]';

-- Добавить колонку countries
ALTER TABLE releases 
ADD COLUMN IF NOT EXISTS countries TEXT[] DEFAULT '{}';

-- Добавить колонку contract_agreed
ALTER TABLE releases 
ADD COLUMN IF NOT EXISTS contract_agreed BOOLEAN DEFAULT false;

-- Добавить колонку contract_agreed_at
ALTER TABLE releases 
ADD COLUMN IF NOT EXISTS contract_agreed_at TIMESTAMPTZ;

-- Добавить колонку payment_status
ALTER TABLE releases 
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';

-- Добавить колонку payment_receipt_url
ALTER TABLE releases 
ADD COLUMN IF NOT EXISTS payment_receipt_url TEXT;

-- Добавить колонку payment_comment
ALTER TABLE releases 
ADD COLUMN IF NOT EXISTS payment_comment TEXT;

-- Добавить колонку payment_amount
ALTER TABLE releases 
ADD COLUMN IF NOT EXISTS payment_amount INTEGER DEFAULT 500;

-- Добавить колонку status_updated_at
ALTER TABLE releases 
ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMPTZ;

-- Проверить результат - вывод всех колонок таблицы releases
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'releases'
ORDER BY ordinal_position;
