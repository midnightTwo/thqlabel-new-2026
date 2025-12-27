-- ⚠️ ВНИМАНИЕ: НЕ ЗАПУСКАЙТЕ ЭТОТ СКРИПТ БЕЗ БЭКАПА!
-- Этот скрипт заменяет только название бренда, НЕ все вхождения THQ

-- БЕЗОПАСНАЯ замена "THQ LABEL" и "THQ Label" на "thq label"

-- Обновляем заголовки
UPDATE news
SET title = REPLACE(REPLACE(title, 'THQ LABEL', 'thq label'), 'THQ Label', 'thq label')
WHERE title LIKE '%THQ LABEL%' OR title LIKE '%THQ Label%';

-- Обновляем контент
UPDATE news
SET content = REPLACE(REPLACE(content, 'THQ LABEL', 'thq label'), 'THQ Label', 'thq label')
WHERE content LIKE '%THQ LABEL%' OR content LIKE '%THQ Label%';

-- Обновляем category если там есть THQ
UPDATE news
SET category = REPLACE(REPLACE(category, 'THQ LABEL', 'thq label'), 'THQ Label', 'thq label')
WHERE category LIKE '%THQ LABEL%' OR category LIKE '%THQ Label%';

-- Проверка результата
SELECT id, title, category, created_at,
  CASE 
    WHEN title LIKE '%THQ LABEL%' OR title LIKE '%THQ Label%' THEN '⚠️ Ещё есть заглавные'
    ELSE '✅ OK'
  END as status
FROM news
ORDER BY created_at DESC;
