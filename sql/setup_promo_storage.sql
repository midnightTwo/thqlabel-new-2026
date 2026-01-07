-- ============================================
-- НАСТРОЙКА STORAGE ДЛЯ ПРОМО-ФОТО
-- ============================================

-- 1. Создаём бакет release-promo (если не существует)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'release-promo',
  'release-promo',
  true,  -- публичный доступ для чтения
  10485760, -- 10 МБ макс размер
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

-- 2. Удаляем старые политики (если есть)
DROP POLICY IF EXISTS "Users can upload promo photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own promo photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own promo photos" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for promo photos" ON storage.objects;
DROP POLICY IF EXISTS "Service role full access to promo" ON storage.objects;

-- 3. Политика: сервисная роль имеет полный доступ
CREATE POLICY "Service role full access to promo"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'release-promo')
WITH CHECK (bucket_id = 'release-promo');

-- 4. Политика: авторизованные пользователи могут загружать в свою папку
CREATE POLICY "Users can upload promo photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'release-promo'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 5. Политика: пользователи могут обновлять свои файлы
CREATE POLICY "Users can update own promo photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'release-promo'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'release-promo'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 6. Политика: пользователи могут удалять свои файлы
CREATE POLICY "Users can delete own promo photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'release-promo'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 7. Политика: публичный доступ на чтение
CREATE POLICY "Public read access for promo photos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'release-promo');

-- ============================================
-- ГОТОВО! Выполните этот SQL в Supabase Dashboard
-- SQL Editor -> New Query -> Вставить -> Run
-- ============================================
