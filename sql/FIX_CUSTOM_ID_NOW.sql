-- =====================================================
-- СРОЧНОЕ ИСПРАВЛЕНИЕ: duplicate key custom_id
-- ОБНОВЛЕНО: с учётом новой системы оплаты через user_balances
-- Выполни этот SQL в Supabase SQL Editor
-- =====================================================

-- ШАГ 1: Находим текущий максимальный номер
DO $$
DECLARE
  max_basic INTEGER := 0;
  max_exclusive INTEGER := 0;
  max_total INTEGER := 0;
BEGIN
  -- Макс в releases_basic
  SELECT COALESCE(MAX(NULLIF(regexp_replace(custom_id, '^thqrel-', ''), '')::INTEGER), 0)
  INTO max_basic
  FROM releases_basic WHERE custom_id ~ '^thqrel-[0-9]+$';
  
  -- Макс в releases_exclusive
  SELECT COALESCE(MAX(NULLIF(regexp_replace(custom_id, '^thqrel-', ''), '')::INTEGER), 0)
  INTO max_exclusive
  FROM releases_exclusive WHERE custom_id ~ '^thqrel-[0-9]+$';
  
  max_total := GREATEST(max_basic, max_exclusive);
  
  RAISE NOTICE 'Max basic: %, Max exclusive: %, Total max: %', max_basic, max_exclusive, max_total;
  
  -- Удаляем старую последовательность если есть
  DROP SEQUENCE IF EXISTS release_custom_id_seq CASCADE;
  
  -- Создаём новую последовательность начиная с СЛЕДУЮЩЕГО номера
  EXECUTE format('CREATE SEQUENCE release_custom_id_seq START WITH %s INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1', max_total + 1);
  
  RAISE NOTICE 'Created sequence starting from %', max_total + 1;
END $$;

-- ШАГ 2: Функция генерации (использует sequence для атомарности)
CREATE OR REPLACE FUNCTION generate_release_custom_id()
RETURNS TEXT AS $$
BEGIN
  RETURN 'thqrel-' || LPAD(nextval('release_custom_id_seq')::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- ШАГ 3: Триггерная функция
-- ВАЖНО: Генерируем custom_id ТОЛЬКО при переходе в pending/moderation, НЕ для draft!
CREATE OR REPLACE FUNCTION auto_generate_release_custom_id()
RETURNS TRIGGER AS $$
BEGIN
  -- ВАЖНО: Если custom_id уже есть - НЕ трогаем его!
  IF NEW.custom_id IS NOT NULL AND NEW.custom_id != '' THEN
    RETURN NEW;
  END IF;
  
  -- Генерируем custom_id ТОЛЬКО когда релиз переходит на модерацию
  -- НЕ для черновиков и НЕ для других статусов
  IF NEW.status IN ('pending', 'moderation', 'approved', 'distributed') THEN
    -- Проверяем что это либо INSERT сразу в pending, либо UPDATE из draft
    IF TG_OP = 'INSERT' THEN
      NEW.custom_id := generate_release_custom_id();
    ELSIF TG_OP = 'UPDATE' THEN
      -- Генерируем только если переходим ИЗ draft/awaiting_payment
      IF OLD.status IN ('draft', 'awaiting_payment') OR OLD.custom_id IS NULL THEN
        NEW.custom_id := generate_release_custom_id();
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ШАГ 4: Пересоздаём триггеры
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

-- ШАГ 5: Очистка custom_id у черновиков 
-- (они получат новый при отправке на модерацию)
UPDATE releases_basic 
SET custom_id = NULL 
WHERE status IN ('draft', 'awaiting_payment') AND custom_id IS NOT NULL;

UPDATE releases_exclusive 
SET custom_id = NULL 
WHERE status IN ('draft', 'awaiting_payment') AND custom_id IS NOT NULL;

-- ШАГ 6: Проверка
SELECT 
  'Sequence value' as check_type,
  last_value::TEXT as value
FROM release_custom_id_seq
UNION ALL
SELECT 
  'Max in basic' as check_type,
  COALESCE(MAX(custom_id), 'none') as value
FROM releases_basic WHERE custom_id IS NOT NULL
UNION ALL
SELECT 
  'Max in exclusive' as check_type,
  COALESCE(MAX(custom_id), 'none') as value
FROM releases_exclusive WHERE custom_id IS NOT NULL;
