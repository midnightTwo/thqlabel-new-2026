-- ============================================
-- Настройка Storage бакета для аудиофайлов релизов
-- ============================================

-- 1. СОЗДАНИЕ БАКЕТА release-audio (ВЫПОЛНИТЬ ПЕРВЫМ!)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'release-audio',
  'release-audio', 
  true,
  524288000, -- 500MB лимит
  ARRAY['audio/wav', 'audio/x-wav', 'audio/flac', 'audio/x-flac', 'audio/mpeg', 'audio/mp3']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Политики безопасности для бакета release-audio
DROP POLICY IF EXISTS "Users can upload audio to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own audio files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own audio files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read audio files" ON storage.objects;
-- Разрешить аутентифицированным пользователям загружать файлы в свою папку
CREATE POLICY "Users can upload audio to own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'release-audio' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Разрешить пользователям обновлять свои файлы
CREATE POLICY "Users can update own audio files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'release-audio' 
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'release-audio' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Разрешить пользователям удалять свои файлы
CREATE POLICY "Users can delete own audio files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'release-audio' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Разрешить всем читать аудиофайлы (публичный доступ для воспроизведения)
CREATE POLICY "Anyone can read audio files"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'release-audio');

-- ============================================
-- Проверка создания
-- ============================================

-- SELECT * FROM storage.buckets WHERE id = 'release-audio';
