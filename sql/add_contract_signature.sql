-- Миграция: Добавление поля contract_signature для хранения подписи пользователя
-- Подпись сохраняется как base64 data URL (PNG)
-- Дата: 2026-02-25

-- Добавляем столбец contract_signature в releases_basic
ALTER TABLE releases_basic 
ADD COLUMN IF NOT EXISTS contract_signature TEXT;

-- Добавляем столбец contract_signature в releases_exclusive
ALTER TABLE releases_exclusive 
ADD COLUMN IF NOT EXISTS contract_signature TEXT;

-- Комментарии к столбцам
COMMENT ON COLUMN releases_basic.contract_signature IS 'Подпись пользователя (base64 PNG data URL), сохраняется при принятии публичной оферты';
COMMENT ON COLUMN releases_exclusive.contract_signature IS 'Подпись пользователя (base64 PNG data URL), сохраняется при принятии публичной оферты';
