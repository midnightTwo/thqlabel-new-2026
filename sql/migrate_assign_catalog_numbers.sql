-- ============================================
-- МИГРАЦИЯ: ПРИСВОЕНИЕ КАТАЛОЖНЫХ НОМЕРОВ СТАРЫМ РЕЛИЗАМ
-- ============================================
-- Выполнять ПОСЛЕ add_catalog_number_and_copyright.sql
-- ============================================

-- ============================================
-- 0. ПРОВЕРКА НАЛИЧИЯ НЕОБХОДИМЫХ ПОЛЕЙ
-- ============================================

DO $$
BEGIN
  -- Проверяем наличие поля catalog_number
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'releases_basic' AND column_name = 'catalog_number'
  ) THEN
    RAISE EXCEPTION 'Поле catalog_number не найдено в releases_basic. Сначала выполните add_catalog_number_and_copyright.sql';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'releases_exclusive' AND column_name = 'catalog_number'
  ) THEN
    RAISE EXCEPTION 'Поле catalog_number не найдено в releases_exclusive. Сначала выполните add_catalog_number_and_copyright.sql';
  END IF;
  
  RAISE NOTICE '✓ Все необходимые поля найдены. Продолжаем миграцию...';
END $$;

-- ============================================
-- 1. ПРИСВОЕНИЕ НОМЕРОВ ОПУБЛИКОВАННЫМ РЕЛИЗАМ
-- ============================================

DO $$
DECLARE
  v_counter INTEGER := 1;
  v_release RECORD;
BEGIN
  RAISE NOTICE 'Начинаем присвоение каталожных номеров...';
  
  -- Обрабатываем все опубликованные релизы из обеих таблиц
  -- Сортируем по дате создания (старые получают меньшие номера)
  FOR v_release IN (
    SELECT id, 'basic' as table_name, created_at 
    FROM releases_basic 
    WHERE status = 'published' AND catalog_number IS NULL
    UNION ALL
    SELECT id, 'exclusive' as table_name, created_at 
    FROM releases_exclusive 
    WHERE status = 'published' AND catalog_number IS NULL
    ORDER BY created_at ASC
  )
  LOOP
    -- Присваиваем номер в зависимости от таблицы
    IF v_release.table_name = 'basic' THEN
      UPDATE releases_basic 
      SET catalog_number = 'REL-' || LPAD(v_counter::TEXT, 3, '0')
      WHERE id = v_release.id;
    ELSE
      UPDATE releases_exclusive 
      SET catalog_number = 'REL-' || LPAD(v_counter::TEXT, 3, '0')
      WHERE id = v_release.id;
    END IF;
    
    RAISE NOTICE 'Присвоен номер REL-% релизу %', LPAD(v_counter::TEXT, 3, '0'), v_release.id;
    v_counter := v_counter + 1;
  END LOOP;
  
  RAISE NOTICE 'Миграция завершена. Присвоено % каталожных номеров.', v_counter - 1;
END $$;

-- ============================================
-- 2. УСТАНОВКА КОПИРАЙТА ДЛЯ СТАРЫХ РЕЛИЗОВ
-- ============================================

DO $$
DECLARE
  v_year TEXT;
  v_updated_count INTEGER := 0;
  v_has_copyright_fields BOOLEAN;
  v_record RECORD;
  v_skipped_count INTEGER := 0;
BEGIN
  -- Проверяем наличие полей копирайта
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'releases_basic' AND column_name = 'phonographic_copyright'
  ) INTO v_has_copyright_fields;
  
  IF NOT v_has_copyright_fields THEN
    RAISE NOTICE 'Поля копирайта не найдены. Пропускаем обновление копирайта.';
    RAISE NOTICE 'Выполните сначала add_catalog_number_and_copyright.sql для добавления полей.';
    RETURN;
  END IF;
  
  -- Получаем текущий год для копирайта
  v_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  
  RAISE NOTICE 'Обновляем копирайт для старых релизов...';
  
  -- Обновляем releases_basic построчно с обработкой ошибок
  FOR v_record IN (
    SELECT id FROM releases_basic 
    WHERE phonographic_copyright IS NULL OR copyright_text IS NULL
  )
  LOOP
    BEGIN
      UPDATE releases_basic
      SET 
        phonographic_copyright = COALESCE(phonographic_copyright, v_year || ' thqlabel'),
        copyright_text = COALESCE(copyright_text, v_year || ' thqlabel')
      WHERE id = v_record.id;
      
      v_updated_count := v_updated_count + 1;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Пропущен релиз % (ошибка: %)', v_record.id, SQLERRM;
      v_skipped_count := v_skipped_count + 1;
    END;
  END LOOP;
  
  RAISE NOTICE 'Обновлено % релизов в releases_basic (пропущено: %)', v_updated_count, v_skipped_count;
  
  -- Сбрасываем счетчики
  v_updated_count := 0;
  v_skipped_count := 0;
  
  -- Обновляем releases_exclusive построчно с обработкой ошибок
  FOR v_record IN (
    SELECT id FROM releases_exclusive 
    WHERE phonographic_copyright IS NULL OR copyright_text IS NULL
  )
  LOOP
    BEGIN
      UPDATE releases_exclusive
      SET 
        phonographic_copyright = COALESCE(phonographic_copyright, v_year || ' thqlabel'),
        copyright_text = COALESCE(copyright_text, v_year || ' thqlabel')
      WHERE id = v_record.id;
      
      v_updated_count := v_updated_count + 1;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Пропущен релиз % (ошибка: %)', v_record.id, SQLERRM;
      v_skipped_count := v_skipped_count + 1;
    END;
  END LOOP;
  
  RAISE NOTICE 'Обновлено % релизов в releases_exclusive (пропущено: %)', v_updated_count, v_skipped_count;
  
  RAISE NOTICE 'Копирайт успешно обновлен!';
END $$;

-- ============================================
-- 3. ПРОВЕРКА РЕЗУЛЬТАТОВ
-- ============================================

-- Показываем статистику по каталожным номерам
SELECT 
  'Basic релизы' as type,
  COUNT(*) as total_releases,
  COUNT(catalog_number) as with_catalog_number,
  COUNT(*) - COUNT(catalog_number) as without_catalog_number
FROM releases_basic
UNION ALL
SELECT 
  'Exclusive релизы' as type,
  COUNT(*) as total_releases,
  COUNT(catalog_number) as with_catalog_number,
  COUNT(*) - COUNT(catalog_number) as without_catalog_number
FROM releases_exclusive;

-- Показываем последние присвоенные номера
SELECT 
  catalog_number,
  title,
  artist_name,
  status,
  'basic' as type,
  created_at
FROM releases_basic
WHERE catalog_number IS NOT NULL
UNION ALL
SELECT 
  catalog_number,
  title,
  artist_name,
  status,
  'exclusive' as type,
  created_at
FROM releases_exclusive
WHERE catalog_number IS NOT NULL
ORDER BY catalog_number DESC
LIMIT 10;

-- ============================================
-- ГОТОВО!
-- ============================================
