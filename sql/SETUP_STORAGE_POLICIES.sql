-- ============================================
-- НАСТРОЙКА ПОЛИТИК ХРАНИЛИЩА ДЛЯ РЕЛИЗОВ
-- ============================================
-- Дата: 2026-01-03
-- Решает ошибку: StorageApiError: new row violates row-level security policy

-- 1. Создаём бакет release-covers если не существует
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'release-covers', 
  'release-covers', 
  true,
  52428800, -- 50 MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

-- 2. Создаём бакет release-audio если не существует
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'release-audio', 
  'release-audio', 
  true,
  524288000, -- 500 MB
  ARRAY['audio/wav', 'audio/x-wav', 'audio/flac', 'audio/x-flac', 'audio/mpeg', 'audio/mp3']
)
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  file_size_limit = 524288000,
  allowed_mime_types = ARRAY['audio/wav', 'audio/x-wav', 'audio/flac', 'audio/x-flac', 'audio/mpeg', 'audio/mp3'];

-- 3. ПОЛИТИКИ ДЛЯ release-covers

-- Удаляем старые политики
DROP POLICY IF EXISTS "Anyone can view release covers" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload release covers" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own release covers" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own release covers" ON storage.objects;

-- Публичный просмотр
CREATE POLICY "Anyone can view release covers"
ON storage.objects FOR SELECT
USING (bucket_id = 'release-covers');

-- Загрузка (авторизованные пользователи могут загружать в свою папку или drafts)
CREATE POLICY "Users can upload release covers"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'release-covers' 
  AND (
    -- Пользователь может загружать в папку со своим ID
    (storage.foldername(name))[1] = auth.uid()::text
    OR
    -- Или в папку drafts с префиксом своего ID
    (storage.foldername(name))[1] = 'drafts' AND position(auth.uid()::text in name) > 0
  )
);

-- Обновление своих файлов
CREATE POLICY "Users can update own release covers"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'release-covers'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR
    ((storage.foldername(name))[1] = 'drafts' AND position(auth.uid()::text in name) > 0)
  )
);

-- Удаление своих файлов
CREATE POLICY "Users can delete own release covers"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'release-covers'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR
    ((storage.foldername(name))[1] = 'drafts' AND position(auth.uid()::text in name) > 0)
  )
);

-- 4. ПОЛИТИКИ ДЛЯ release-audio

DROP POLICY IF EXISTS "Anyone can view release audio" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload release audio" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own release audio" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own release audio" ON storage.objects;

-- Публичный просмотр
CREATE POLICY "Anyone can view release audio"
ON storage.objects FOR SELECT
USING (bucket_id = 'release-audio');

-- Загрузка
CREATE POLICY "Users can upload release audio"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'release-audio' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Обновление
CREATE POLICY "Users can update own release audio"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'release-audio'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Удаление
CREATE POLICY "Users can delete own release audio"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'release-audio'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- ИНСТРУКЦИИ:
-- 1. Откройте Supabase Dashboard → SQL Editor
-- 2. Выполните этот скрипт
-- 3. Проверьте бакеты в Storage
-- ============================================
