-- ============================================
-- МИГРАЦИЯ: Добавление статуса 'draft' в releases_exclusive
-- ============================================
-- Дата: 2026-01-03
-- Описание: Позволяет сохранять черновики релизов до отправки на модерацию

-- 1. Обновляем constraint для releases_exclusive
ALTER TABLE releases_exclusive 
DROP CONSTRAINT IF EXISTS releases_exclusive_status_check;

ALTER TABLE releases_exclusive 
ADD CONSTRAINT releases_exclusive_status_check 
CHECK (status IN ('draft', 'pending', 'approved', 'rejected', 'published'));

-- 2. Добавляем поля для хранения промежуточных данных черновика
ALTER TABLE releases_exclusive 
ADD COLUMN IF NOT EXISTS release_type TEXT DEFAULT 'single' CHECK (release_type IN ('single', 'ep', 'album'));

ALTER TABLE releases_exclusive 
ADD COLUMN IF NOT EXISTS focus_track_promo TEXT;

ALTER TABLE releases_exclusive 
ADD COLUMN IF NOT EXISTS promo_photos TEXT[] DEFAULT '{}';

ALTER TABLE releases_exclusive 
ADD COLUMN IF NOT EXISTS wizard_step TEXT DEFAULT 'release';

-- 3. Делаем некоторые поля опциональными для черновиков
-- title и artist_name уже NOT NULL, но мы можем использовать placeholder
-- genre нужно сделать опциональным для черновиков

-- Сначала проверяем и меняем constraint
ALTER TABLE releases_exclusive 
ALTER COLUMN genre DROP NOT NULL;

-- 4. Добавляем RLS политику для удаления черновиков
DROP POLICY IF EXISTS "Users can delete own draft releases" ON releases_exclusive;

CREATE POLICY "Users can delete own draft releases" 
ON releases_exclusive 
FOR DELETE 
USING (auth.uid() = user_id AND status = 'draft');

-- 5. Обновляем политику update для черновиков
DROP POLICY IF EXISTS "Users can update own pending exclusive releases" ON releases_exclusive;
DROP POLICY IF EXISTS "Users can update own draft or pending exclusive releases" ON releases_exclusive;

CREATE POLICY "Users can update own draft or pending exclusive releases" 
ON releases_exclusive 
FOR UPDATE 
USING (auth.uid() = user_id AND status IN ('draft', 'pending', 'rejected'));

-- 6. Аналогично для releases_basic
ALTER TABLE releases_basic 
DROP CONSTRAINT IF EXISTS releases_basic_status_check;

ALTER TABLE releases_basic 
ADD CONSTRAINT releases_basic_status_check 
CHECK (status IN ('draft', 'pending', 'approved', 'rejected', 'published', 'awaiting_payment'));

ALTER TABLE releases_basic 
ADD COLUMN IF NOT EXISTS release_type TEXT DEFAULT 'single' CHECK (release_type IN ('single', 'ep', 'album'));

ALTER TABLE releases_basic 
ADD COLUMN IF NOT EXISTS focus_track_promo TEXT;

ALTER TABLE releases_basic 
ADD COLUMN IF NOT EXISTS promo_photos TEXT[] DEFAULT '{}';

ALTER TABLE releases_basic 
ADD COLUMN IF NOT EXISTS wizard_step TEXT DEFAULT 'release';

ALTER TABLE releases_basic 
ALTER COLUMN genre DROP NOT NULL;

DROP POLICY IF EXISTS "Users can delete own draft basic releases" ON releases_basic;

CREATE POLICY "Users can delete own draft basic releases" 
ON releases_basic 
FOR DELETE 
USING (auth.uid() = user_id AND status = 'draft');

-- ============================================
-- ИНСТРУКЦИИ ПО ЗАПУСКУ:
-- ============================================
-- 1. Откройте Supabase Dashboard
-- 2. Перейдите в SQL Editor
-- 3. Выполните этот скрипт
-- 4. Проверьте отсутствие ошибок
-- ============================================
