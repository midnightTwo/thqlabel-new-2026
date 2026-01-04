-- ============================================
-- ИСПРАВЛЕНИЕ ГЕНЕРАЦИИ CUSTOM_ID
-- ============================================

-- ШАГ 1: Проверяем текущие custom_id в базе
SELECT 'releases_basic' as table_name, id, custom_id, status, created_at 
FROM releases_basic 
WHERE custom_id IS NOT NULL 
ORDER BY created_at DESC 
LIMIT 10;

SELECT 'releases_exclusive' as table_name, id, custom_id, status, created_at 
FROM releases_exclusive 
WHERE custom_id IS NOT NULL 
ORDER BY created_at DESC 
LIMIT 10;

-- ШАГ 2: Удаляем старую функцию и создаем новую
DROP FUNCTION IF EXISTS generate_release_custom_id();

CREATE OR REPLACE FUNCTION generate_release_custom_id()
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
  new_id TEXT;
BEGIN
  -- Получаем максимальный номер из обеих таблиц
  SELECT COALESCE(MAX(num), 0) + 1 INTO next_num
  FROM (
    SELECT NULLIF(regexp_replace(custom_id, '^thqrel-', ''), '')::INTEGER AS num
    FROM releases_basic WHERE custom_id ~ '^thqrel-[0-9]+$'
    UNION ALL
    SELECT NULLIF(regexp_replace(custom_id, '^thqrel-', ''), '')::INTEGER AS num
    FROM releases_exclusive WHERE custom_id ~ '^thqrel-[0-9]+$'
  ) combined;
  
  -- Форматируем как thqrel-0001, thqrel-0002, и т.д.
  new_id := 'thqrel-' || LPAD(next_num::TEXT, 4, '0');
  
  RAISE NOTICE 'Генерируется custom_id: %', new_id;
  
  RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- ШАГ 3: Тестируем функцию
SELECT generate_release_custom_id() as next_custom_id;

-- ШАГ 4: Пересоздаем триггерную функцию
DROP FUNCTION IF EXISTS auto_generate_release_custom_id() CASCADE;

CREATE OR REPLACE FUNCTION auto_generate_release_custom_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Генерируем custom_id только если:
  -- 1. При INSERT со статусом pending и custom_id пустой
  -- 2. При UPDATE когда статус меняется с draft на pending и custom_id пустой
  IF (TG_OP = 'INSERT' AND NEW.status = 'pending' AND NEW.custom_id IS NULL) OR
     (TG_OP = 'UPDATE' AND OLD.status = 'draft' AND NEW.status = 'pending' AND NEW.custom_id IS NULL) THEN
    NEW.custom_id := generate_release_custom_id();
    RAISE NOTICE 'Триггер установил custom_id: %', NEW.custom_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ШАГ 5: Пересоздаем триггеры
DROP TRIGGER IF EXISTS auto_custom_id_basic ON releases_basic;
CREATE TRIGGER auto_custom_id_basic 
  BEFORE INSERT OR UPDATE ON releases_basic
  FOR EACH ROW 
  EXECUTE FUNCTION auto_generate_release_custom_id();

DROP TRIGGER IF EXISTS auto_custom_id_exclusive ON releases_exclusive;
CREATE TRIGGER auto_custom_id_exclusive 
  BEFORE INSERT OR UPDATE ON releases_exclusive
  FOR EACH ROW 
  EXECUTE FUNCTION auto_generate_release_custom_id();

-- ШАГ 6: Проверяем что триггеры созданы
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name IN ('auto_custom_id_basic', 'auto_custom_id_exclusive');

-- ШАГ 7: Очищаем неправильные custom_id (опционально - раскомментируй если нужно)
-- UPDATE releases_basic SET custom_id = NULL WHERE custom_id !~ '^thqrel-[0-9]{4}$';
-- UPDATE releases_exclusive SET custom_id = NULL WHERE custom_id !~ '^thqrel-[0-9]{4}$';

-- ШАГ 8: Устанавливаем правильные custom_id для существующих релизов на модерации (опционально)
-- WITH numbered_basic AS (
--   SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as num
--   FROM releases_basic 
--   WHERE status = 'pending' AND custom_id IS NULL
-- )
-- UPDATE releases_basic SET custom_id = 'thqrel-' || LPAD(num::TEXT, 4, '0')
-- FROM numbered_basic WHERE releases_basic.id = numbered_basic.id;

-- WITH numbered_exclusive AS (
--   SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as num
--   FROM releases_exclusive 
--   WHERE status = 'pending' AND custom_id IS NULL
-- )
-- UPDATE releases_exclusive SET custom_id = 'thqrel-' || LPAD(num::TEXT, 4, '0')
-- FROM numbered_exclusive WHERE releases_exclusive.id = numbered_exclusive.id;

-- ШАГ 9: Финальная проверка
SELECT '✅ Функции и триггеры обновлены' as status;
SELECT generate_release_custom_id() as next_custom_id;
