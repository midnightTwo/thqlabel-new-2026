-- Добавление статуса 'approved' и удаление 'distributed'
-- ⚠️ ВАЖНО: Выполните этот SQL в Supabase SQL Editor

-- Шаг 1: Сначала обновим все релизы со статусом 'distributed' на 'approved'
UPDATE releases_basic SET status = 'pending' WHERE status = 'distributed';
UPDATE releases_exclusive SET status = 'pending' WHERE status = 'distributed';

-- Шаг 2: Удаляем старые CHECK constraints
ALTER TABLE releases_basic DROP CONSTRAINT IF EXISTS releases_basic_status_check;
ALTER TABLE releases_exclusive DROP CONSTRAINT IF EXISTS releases_exclusive_status_check;

-- Шаг 3: Добавляем новые CHECK constraints с 'approved' вместо 'distributed'
ALTER TABLE releases_basic ADD CONSTRAINT releases_basic_status_check 
  CHECK (status IN ('draft', 'pending', 'rejected', 'approved', 'published', 'awaiting_payment'));

ALTER TABLE releases_exclusive ADD CONSTRAINT releases_exclusive_status_check 
  CHECK (status IN ('draft', 'pending', 'rejected', 'approved', 'published', 'awaiting_payment'));

-- Комментарий к статусам:
-- draft - черновик (автосохранение)
-- awaiting_payment - ожидает оплаты
-- pending - на модерации
-- approved - одобрен (готов к публикации)
-- published - выложен (опубликован)
-- rejected - отклонён

-- Проверяем результат
SELECT 'releases_basic' as table_name, status, count(*) 
FROM releases_basic GROUP BY status
UNION ALL
SELECT 'releases_exclusive' as table_name, status, count(*) 
FROM releases_exclusive GROUP BY status;
