-- ИСПРАВЛЕНИЕ RLS ПОЛИТИК ДЛЯ ТАБЛИЦЫ NEWS

-- Удаляем старые политики
DROP POLICY IF EXISTS "Anyone can view published news" ON news;
DROP POLICY IF EXISTS "Admins can manage news" ON news;

-- Включаем RLS
ALTER TABLE news ENABLE ROW LEVEL SECURITY;

-- Любой может просматривать опубликованные новости
CREATE POLICY "Anyone can view published news" ON news
  FOR SELECT USING (TRUE);

-- Админы могут ЧИТАТЬ все новости (даже неопубликованные)
CREATE POLICY "Admins can view all news" ON news
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner'))
  );

-- Админы могут СОЗДАВАТЬ новости
CREATE POLICY "Admins can create news" ON news
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner'))
  );

-- Админы могут ОБНОВЛЯТЬ новости
CREATE POLICY "Admins can update news" ON news
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner'))
  );

-- Админы могут УДАЛЯТЬ новости
CREATE POLICY "Admins can delete news" ON news
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner'))
  );

-- Проверка политик
SELECT schemaname, tablename, policyname, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'news';

SELECT '✅ RLS политики для news обновлены!' as status;
