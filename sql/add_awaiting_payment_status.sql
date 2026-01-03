-- Добавление нового статуса awaiting_payment для релизов
-- Этот статус используется когда пользователь нажимает "Оплатить позже" при создании релиза

-- ⚠️ ВАЖНО: Выполните этот SQL в Supabase SQL Editor

-- Шаг 1: Удаляем старый CHECK constraint на поле status
ALTER TABLE releases_basic DROP CONSTRAINT IF EXISTS releases_basic_status_check;

-- Шаг 2: Добавляем новый CHECK constraint с поддержкой awaiting_payment и draft
ALTER TABLE releases_basic ADD CONSTRAINT releases_basic_status_check 
  CHECK (status IN ('draft', 'pending', 'rejected', 'distributed', 'published', 'awaiting_payment'));

-- Шаг 3: Добавим индекс для быстрого поиска релизов со статусом awaiting_payment
CREATE INDEX IF NOT EXISTS idx_releases_basic_awaiting_payment 
ON releases_basic (user_id, status) 
WHERE status = 'awaiting_payment';

-- Также обновим для таблицы releases_exclusive (если используется)
ALTER TABLE releases_exclusive DROP CONSTRAINT IF EXISTS releases_exclusive_status_check;
ALTER TABLE releases_exclusive ADD CONSTRAINT releases_exclusive_status_check 
  CHECK (status IN ('draft', 'pending', 'rejected', 'distributed', 'published', 'awaiting_payment'));

-- Комментарий к статусам:
-- draft - черновик (автосохранение)
-- awaiting_payment - ожидает оплаты (пользователь нажал "Оплатить позже")
-- pending - на модерации (оплачено, ожидает проверки)
-- rejected - отклонён
-- distributed - на дистрибьюции
-- published - опубликован
