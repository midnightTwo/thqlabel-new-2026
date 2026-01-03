-- Добавление колонки payment_comment в таблицу releases_basic
-- Выполните этот SQL в Supabase SQL Editor

-- Добавляем колонку для комментария к оплате
ALTER TABLE releases_basic 
ADD COLUMN IF NOT EXISTS payment_comment TEXT;

-- Комментарий к колонке
COMMENT ON COLUMN releases_basic.payment_comment IS 'Комментарий пользователя к оплате (имя отправителя, время перевода и т.д.)';
