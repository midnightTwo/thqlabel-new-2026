-- Добавление новых полей для Release Wizard
-- Выполнить в Supabase SQL Editor

-- Добавляем поле release_type (тип релиза)
ALTER TABLE releases 
ADD COLUMN IF NOT EXISTS release_type TEXT CHECK (release_type IN ('single', 'ep', 'album'));

-- Добавляем поле для типа географии
ALTER TABLE releases 
ADD COLUMN IF NOT EXISTS geography_type TEXT DEFAULT 'worldwide' CHECK (geography_type IN ('worldwide', 'whitelist'));

-- Добавляем поле для выбранных стран (массив)
ALTER TABLE releases 
ADD COLUMN IF NOT EXISTS selected_countries TEXT[];

-- Добавляем флаг автоматической отправки в будущие магазины
ALTER TABLE releases 
ADD COLUMN IF NOT EXISTS auto_future_stores BOOLEAN DEFAULT true;

-- Добавляем поле для чека оплаты (только для Basic)
ALTER TABLE releases 
ADD COLUMN IF NOT EXISTS payment_receipt_url TEXT;

-- Добавляем сумму оплаты
ALTER TABLE releases 
ADD COLUMN IF NOT EXISTS payment_amount INTEGER;

-- Добавляем статус оплаты
ALTER TABLE releases 
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'confirmed', 'rejected'));

-- Добавляем поля для композиторов и текстовиков на уровне трека
-- Предполагается, что есть таблица tracks связанная с releases

-- Если таблица tracks существует:
ALTER TABLE tracks 
ADD COLUMN IF NOT EXISTS is_instrumental BOOLEAN DEFAULT false;

ALTER TABLE tracks 
ADD COLUMN IF NOT EXISTS tiktok_preview_start TEXT; -- формат "мм:сс"

ALTER TABLE tracks 
ADD COLUMN IF NOT EXISTS composers TEXT[]; -- массив композиторов

ALTER TABLE tracks 
ADD COLUMN IF NOT EXISTS lyricists TEXT[]; -- массив текстовиков

-- Добавляем поле для аудио файла (если еще нет)
ALTER TABLE tracks 
ADD COLUMN IF NOT EXISTS audio_file_url TEXT;

-- Добавляем поле для метаданных аудио
ALTER TABLE tracks 
ADD COLUMN IF NOT EXISTS audio_metadata JSONB; -- { format, duration, bitrate, sampleRate, size }

-- Добавляем поля для промо-фото релиза
ALTER TABLE releases 
ADD COLUMN IF NOT EXISTS promo_photo_urls TEXT[]; -- массив URL промо-фотографий

-- Комментарии для документации
COMMENT ON COLUMN releases.release_type IS 'Тип релиза: single (1 трек), ep (2-7 треков), album (8-50 треков)';
COMMENT ON COLUMN releases.geography_type IS 'Тип географии: worldwide (весь мир) или whitelist (выбранные страны)';
COMMENT ON COLUMN releases.selected_countries IS 'Массив выбранных стран (только если geography_type = whitelist)';
COMMENT ON COLUMN releases.auto_future_stores IS 'Автоматическая отправка в будущие музыкальные площадки';
COMMENT ON COLUMN releases.payment_receipt_url IS 'URL чека оплаты (только для Basic подписки)';
COMMENT ON COLUMN releases.payment_amount IS 'Сумма оплаты в рублях';
COMMENT ON COLUMN releases.payment_status IS 'Статус оплаты: pending, confirmed, rejected';
COMMENT ON COLUMN releases.promo_photo_urls IS 'Массив URL промо-фотографий релиза';

COMMENT ON COLUMN tracks.is_instrumental IS 'Инструментальный трек (без слов)';
COMMENT ON COLUMN tracks.tiktok_preview_start IS 'Время начала превью для TikTok в формате мм:сс';
COMMENT ON COLUMN tracks.composers IS 'Массив композиторов трека';
COMMENT ON COLUMN tracks.lyricists IS 'Массив авторов текста трека';
COMMENT ON COLUMN tracks.audio_file_url IS 'URL аудиофайла трека';
COMMENT ON COLUMN tracks.audio_metadata IS 'JSON метаданные аудио: формат, длительность, битрейт, частота дискретизации, размер';

-- Создаем индексы для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_releases_release_type ON releases(release_type);
CREATE INDEX IF NOT EXISTS idx_releases_payment_status ON releases(payment_status);
CREATE INDEX IF NOT EXISTS idx_releases_geography_type ON releases(geography_type);
CREATE INDEX IF NOT EXISTS idx_tracks_is_instrumental ON tracks(is_instrumental);
