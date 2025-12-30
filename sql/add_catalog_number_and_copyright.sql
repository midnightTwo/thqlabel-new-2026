-- ============================================
-- ДОБАВЛЕНИЕ КАТАЛОЖНОГО НОМЕРА И КОПИРАЙТА
-- ============================================
-- Этап 1: Добавление полей для Catalog Number и Copyright
-- ============================================

-- ============================================
-- 1. ДОБАВЛЕНИЕ ПОЛЯ catalog_number
-- ============================================

-- Добавляем поле в releases_basic
ALTER TABLE releases_basic 
ADD COLUMN IF NOT EXISTS catalog_number TEXT UNIQUE;

-- Добавляем поле в releases_exclusive
ALTER TABLE releases_exclusive 
ADD COLUMN IF NOT EXISTS catalog_number TEXT UNIQUE;

-- Создаем индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_releases_basic_catalog_number 
  ON releases_basic(catalog_number) WHERE catalog_number IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_releases_exclusive_catalog_number 
  ON releases_exclusive(catalog_number) WHERE catalog_number IS NOT NULL;

-- ============================================
-- 2. ДОБАВЛЕНИЕ ПОЛЕЙ КОПИРАЙТА
-- ============================================

-- Добавляем поля ℗ (phonographic copyright) и © (copyright)
ALTER TABLE releases_basic 
ADD COLUMN IF NOT EXISTS phonographic_copyright TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS copyright_text TEXT DEFAULT NULL;

ALTER TABLE releases_exclusive 
ADD COLUMN IF NOT EXISTS phonographic_copyright TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS copyright_text TEXT DEFAULT NULL;

-- ============================================
-- 3. СОЗДАНИЕ ФУНКЦИИ ГЕНЕРАЦИИ CATALOG NUMBER
-- ============================================

-- Удаляем старую версию функции если существует (вместе с зависимыми триггерами)
DROP FUNCTION IF EXISTS generate_catalog_number() CASCADE;

CREATE OR REPLACE FUNCTION generate_catalog_number()
RETURNS TEXT AS $$
DECLARE
  v_max_number INTEGER;
  v_new_number INTEGER;
  v_catalog_number TEXT;
BEGIN
  -- Находим максимальный номер из обеих таблиц
  SELECT COALESCE(MAX(
    CASE 
      WHEN catalog_number ~ '^REL-[0-9]+$' 
      THEN CAST(SUBSTRING(catalog_number FROM 5) AS INTEGER)
      ELSE 0
    END
  ), 0) INTO v_max_number
  FROM (
    SELECT catalog_number FROM releases_basic WHERE catalog_number IS NOT NULL
    UNION ALL
    SELECT catalog_number FROM releases_exclusive WHERE catalog_number IS NOT NULL
  ) AS all_releases;
  
  -- Генерируем новый номер
  v_new_number := v_max_number + 1;
  v_catalog_number := 'REL-' || LPAD(v_new_number::TEXT, 3, '0');
  
  RETURN v_catalog_number;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 4. СОЗДАНИЕ ФУНКЦИИ УСТАНОВКИ КОПИРАЙТА
-- ============================================

-- Удаляем старую версию функции если существует (вместе с зависимыми триггерами)
DROP FUNCTION IF EXISTS set_default_copyright() CASCADE;

CREATE OR REPLACE FUNCTION set_default_copyright()
RETURNS TRIGGER AS $$
DECLARE
  v_year TEXT;
BEGIN
  -- Получаем текущий год
  v_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  
  -- Устанавливаем значения по умолчанию, если они не заданы
  IF NEW.phonographic_copyright IS NULL THEN
    NEW.phonographic_copyright := v_year || ' thqlabel';
  END IF;
  
  IF NEW.copyright_text IS NULL THEN
    NEW.copyright_text := v_year || ' thqlabel';
  END IF;
  
  -- Принудительно переводим название лейбла в lowercase
  NEW.phonographic_copyright := LOWER(NEW.phonographic_copyright);
  NEW.copyright_text := LOWER(NEW.copyright_text);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. СОЗДАНИЕ ТРИГГЕРОВ ДЛЯ КОПИРАЙТА
-- ============================================

-- Триггер для releases_basic
DROP TRIGGER IF EXISTS set_copyright_basic ON releases_basic;
CREATE TRIGGER set_copyright_basic
  BEFORE INSERT OR UPDATE ON releases_basic
  FOR EACH ROW
  EXECUTE FUNCTION set_default_copyright();

-- Триггер для releases_exclusive
DROP TRIGGER IF EXISTS set_copyright_exclusive ON releases_exclusive;
CREATE TRIGGER set_copyright_exclusive
  BEFORE INSERT OR UPDATE ON releases_exclusive
  FOR EACH ROW
  EXECUTE FUNCTION set_default_copyright();

-- ============================================
-- 6. ФУНКЦИЯ ПРИСВОЕНИЯ CATALOG NUMBER ПРИ ПУБЛИКАЦИИ
-- ============================================

-- Удаляем старую версию функции если существует (вместе с зависимыми триггерами)
DROP FUNCTION IF EXISTS assign_catalog_number_on_publish() CASCADE;

CREATE OR REPLACE FUNCTION assign_catalog_number_on_publish()
RETURNS TRIGGER AS $$
BEGIN
  -- Присваиваем catalog_number только при переходе в статус 'published'
  -- и если номер еще не присвоен
  IF NEW.status = 'published' AND NEW.catalog_number IS NULL THEN
    NEW.catalog_number := generate_catalog_number();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 7. СОЗДАНИЕ ТРИГГЕРОВ ДЛЯ AUTO-ГЕНЕРАЦИИ CATALOG NUMBER
-- ============================================

-- Триггер для releases_basic
DROP TRIGGER IF EXISTS assign_catalog_number_basic ON releases_basic;
CREATE TRIGGER assign_catalog_number_basic
  BEFORE INSERT OR UPDATE ON releases_basic
  FOR EACH ROW
  EXECUTE FUNCTION assign_catalog_number_on_publish();

-- Триггер для releases_exclusive
DROP TRIGGER IF EXISTS assign_catalog_number_exclusive ON releases_exclusive;
CREATE TRIGGER assign_catalog_number_exclusive
  BEFORE INSERT OR UPDATE ON releases_exclusive
  FOR EACH ROW
  EXECUTE FUNCTION assign_catalog_number_on_publish();

-- ============================================
-- 8. КОММЕНТАРИИ К ПОЛЯМ
-- ============================================

COMMENT ON COLUMN releases_basic.catalog_number IS 'Каталожный номер релиза (формат: REL-XXX). Присваивается автоматически при публикации';
COMMENT ON COLUMN releases_basic.phonographic_copyright IS 'Phonographic copyright (℗). По умолчанию: [год] thqlabel';
COMMENT ON COLUMN releases_basic.copyright_text IS 'Copyright (©). По умолчанию: [год] thqlabel';

COMMENT ON COLUMN releases_exclusive.catalog_number IS 'Каталожный номер релиза (формат: REL-XXX). Присваивается автоматически при публикации';
COMMENT ON COLUMN releases_exclusive.phonographic_copyright IS 'Phonographic copyright (℗). По умолчанию: [год] thqlabel';
COMMENT ON COLUMN releases_exclusive.copyright_text IS 'Copyright (©). По умолчанию: [год] thqlabel';

-- ============================================
-- ГОТОВО!
-- ============================================
-- 
-- Теперь:
-- 1. ✅ При создании релиза автоматически устанавливается копирайт
-- 2. ✅ При публикации релиза автоматически присваивается catalog_number
-- 3. ✅ Catalog number уникален и генерируется сквозной нумерацией
-- 4. ✅ Название лейбла принудительно в lowercase
-- 
-- Следующий шаг: Миграция для присвоения номеров старым релизам
-- ============================================
