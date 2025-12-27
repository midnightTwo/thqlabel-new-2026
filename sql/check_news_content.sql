-- Просмотр всех новостей и их содержимого

SELECT 
  id,
  title,
  LEFT(content, 100) as content_preview,
  category,
  created_at,
  updated_at
FROM news
ORDER BY created_at DESC;

-- Если нужно увидеть полный контент конкретной новости:
-- SELECT * FROM news WHERE id = 'ваш-id-новости';
