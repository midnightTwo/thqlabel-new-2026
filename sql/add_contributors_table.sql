-- ==============================================
-- ТАБЛИЦА КОНТРИБЬЮТОРОВ (АВТОРОВ) ДЛЯ РЕЛИЗОВ
-- ==============================================
-- Выполните этот SQL в Supabase Dashboard -> SQL Editor

-- 1. Создаем таблицу контрибьюторов
CREATE TABLE IF NOT EXISTS release_contributors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  release_id UUID NOT NULL,
  release_type TEXT NOT NULL CHECK (release_type IN ('basic', 'exclusive')),
  role TEXT NOT NULL CHECK (role IN ('composer', 'lyricist', 'producer', 'arranger', 'performer', 'mixer', 'mastering', 'other')),
  full_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(release_id, release_type, role, full_name)
);

-- 2. Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_contributors_release ON release_contributors(release_id, release_type);
CREATE INDEX IF NOT EXISTS idx_contributors_role ON release_contributors(role);

-- 3. RLS политики
ALTER TABLE release_contributors ENABLE ROW LEVEL SECURITY;

-- Политика чтения - все могут читать контрибьюторов
CREATE POLICY "Public can read contributors" ON release_contributors
  FOR SELECT USING (true);

-- Политика вставки - авторизованные пользователи могут добавлять
CREATE POLICY "Authenticated can insert contributors" ON release_contributors
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Политика обновления - авторизованные пользователи могут обновлять
CREATE POLICY "Authenticated can update contributors" ON release_contributors
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Политика удаления - авторизованные пользователи могут удалять
CREATE POLICY "Authenticated can delete contributors" ON release_contributors
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- 4. Проверяем создание таблицы
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'release_contributors'
ORDER BY ordinal_position;

-- ==============================================
-- ПРИМЕЧАНИЯ:
-- ==============================================
-- Роли контрибьюторов:
-- - composer: Композитор (автор музыки)
-- - lyricist: Автор текста
-- - producer: Продюсер
-- - arranger: Аранжировщик
-- - performer: Исполнитель
-- - mixer: Сведение
-- - mastering: Мастеринг
-- - other: Другое
-- ==============================================
