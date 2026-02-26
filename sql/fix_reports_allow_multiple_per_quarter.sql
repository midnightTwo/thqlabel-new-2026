-- ============================================
-- РАЗРЕШАЕМ НЕСКОЛЬКО ОТЧЁТОВ ЗА ОДИН КВАРТАЛ
-- ============================================
-- Удаляем уникальный индекс по (quarter, year) чтобы можно было 
-- загружать несколько отчётов за один квартал с разными названиями

-- Удаляем уникальный индекс
DROP INDEX IF EXISTS idx_royalty_reports_quarter_unique;

-- Создаём обычный (не уникальный) индекс для поиска
CREATE INDEX IF NOT EXISTS idx_royalty_reports_quarter_year ON royalty_reports(quarter, year);

-- Поле notes уже есть в таблице — используем его для хранения пользовательского названия отчёта
-- Если нужно добавить отдельное поле:
-- ALTER TABLE royalty_reports ADD COLUMN IF NOT EXISTS display_name TEXT;
