-- Удаление всех тестовых новостей с "THQ" или "thq" в названии

-- Сначала посмотрим какие новости есть
SELECT id, title, category, created_at 
FROM news 
ORDER BY created_at DESC;

-- Если хотите удалить конкретную новость по ID:
-- DELETE FROM news WHERE id = 'ваш-uuid-новости';

-- Или удалить все новости с "Добро пожаловать":
-- DELETE FROM news WHERE title LIKE '%Добро пожаловать%';

-- Или удалить ВСЕ новости (ОСТОРОЖНО!):
-- DELETE FROM news;
