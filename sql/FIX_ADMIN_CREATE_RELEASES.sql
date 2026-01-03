-- ============================================
-- ИСПРАВЛЕНИЕ RLS ПОЛИТИКИ ДЛЯ СОЗДАНИЯ РЕЛИЗОВ АДМИНАМИ
-- ============================================
-- Проблема: Админы не могут создавать релизы от имени других пользователей
-- из-за политики INSERT которая требует auth.uid() = user_id

-- Удаляем старые политики INSERT
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON releases_basic;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON releases_exclusive;

-- ============================================
-- НОВЫЕ ПОЛИТИКИ INSERT С ПОДДЕРЖКОЙ АДМИНОВ
-- ============================================

-- Политика INSERT для releases_basic
-- Пользователи могут создавать свои релизы, админы могут создавать для любых
CREATE POLICY "Enable insert for users and admins"
ON releases_basic FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  OR 
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'owner')
  )
);

-- Политика INSERT для releases_exclusive
-- Пользователи могут создавать свои релизы, админы могут создавать для любых
CREATE POLICY "Enable insert for users and admins"
ON releases_exclusive FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  OR 
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'owner')
  )
);

-- ============================================
-- ДОБАВЛЯЕМ ПОЛИТИКУ DELETE ДЛЯ АДМИНОВ
-- ============================================

-- Удаляем старые политики DELETE если есть
DROP POLICY IF EXISTS "Enable delete for admins" ON releases_basic;
DROP POLICY IF EXISTS "Enable delete for admins" ON releases_exclusive;
DROP POLICY IF EXISTS "Admins can delete releases" ON releases_basic;
DROP POLICY IF EXISTS "Admins can delete releases" ON releases_exclusive;

-- Политика DELETE для releases_basic - только админы
CREATE POLICY "Enable delete for admins"
ON releases_basic FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'owner')
  )
);

-- Политика DELETE для releases_exclusive - только админы
CREATE POLICY "Enable delete for admins"
ON releases_exclusive FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'owner')
  )
);

-- ============================================
-- ПРОВЕРКА
-- ============================================

-- Проверить что политики созданы
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('releases_basic', 'releases_exclusive')
ORDER BY tablename, cmd;

-- ============================================
-- ГОТОВО!
-- Теперь админы могут:
-- 1. Создавать релизы от имени любых пользователей
-- 2. Удалять любые релизы
-- ============================================

-- ============================================
-- ИСПРАВЛЕНИЕ STORAGE ПОЛИТИК ДЛЯ АДМИНОВ
-- ============================================

-- Удаляем старые политики для release-covers bucket
DROP POLICY IF EXISTS "Users can upload release covers" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload release covers" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view release covers" ON storage.objects;
DROP POLICY IF EXISTS "Enable upload for users and admins" ON storage.objects;
DROP POLICY IF EXISTS "Enable read for all" ON storage.objects;

-- Политика для чтения обложек (публичный доступ)
CREATE POLICY "Anyone can view release covers"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'release-covers');

-- Политика для загрузки обложек (пользователи в свою папку, админы везде)
CREATE POLICY "Users and admins can upload release covers"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'release-covers'
  AND (
    -- Пользователь загружает в свою папку
    (storage.foldername(name))[1] = auth.uid()::text
    OR
    -- Админ может загружать куда угодно
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'owner')
    )
  )
);

-- Политика для обновления обложек
CREATE POLICY "Users and admins can update release covers"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'release-covers'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'owner')
    )
  )
);

-- Политика для удаления обложек
CREATE POLICY "Users and admins can delete release covers"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'release-covers'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'owner')
    )
  )
);

-- ============================================
-- STORAGE ГОТОВО!
-- ============================================
