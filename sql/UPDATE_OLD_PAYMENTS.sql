-- ============================================
-- ОБНОВЛЕНИЕ СТАРЫХ ПЛАТЕЖЕЙ
-- ============================================
-- Этот скрипт обновляет релизы у которых был payment_status = 'verified'
-- (старая система) на новую систему с is_paid = true

-- ШАГ 1: Обновляем releases_basic
-- ============================================
-- Устанавливаем is_paid = true для релизов где payment_status = 'verified'

UPDATE releases_basic
SET 
  is_paid = TRUE,
  payment_amount = COALESCE(payment_amount, 299),
  paid_at = COALESCE(paid_at, updated_at, created_at)
WHERE 
  payment_status = 'verified'
  AND (is_paid IS NULL OR is_paid = FALSE);

-- Также для релизов в статусе pending и published (они точно оплачены)
UPDATE releases_basic
SET 
  is_paid = TRUE,
  payment_amount = COALESCE(payment_amount, 299),
  paid_at = COALESCE(paid_at, updated_at, created_at)
WHERE 
  status IN ('pending', 'approved', 'published')
  AND (is_paid IS NULL OR is_paid = FALSE);

-- ШАГ 2: Обновляем releases (exclusive)
-- ============================================

UPDATE releases
SET 
  is_paid = TRUE,
  payment_amount = COALESCE(payment_amount, 299),
  paid_at = COALESCE(paid_at, updated_at, created_at)
WHERE 
  payment_status = 'verified'
  AND (is_paid IS NULL OR is_paid = FALSE);

UPDATE releases
SET 
  is_paid = TRUE,
  payment_amount = COALESCE(payment_amount, 299),
  paid_at = COALESCE(paid_at, updated_at, created_at)
WHERE 
  status IN ('pending', 'approved', 'published')
  AND (is_paid IS NULL OR is_paid = FALSE);

-- ШАГ 3: Создаём записи в release_payments для старых оплат
-- ============================================
-- Только для тех релизов, где ещё нет записи в release_payments

INSERT INTO release_payments (
  user_id, release_id, release_type, 
  release_title, release_artist, tracks_count,
  amount, payment_method, status, created_at
)
SELECT 
  rb.user_id,
  rb.id,
  'basic',
  rb.title,
  rb.artist_name,
  COALESCE(jsonb_array_length(rb.tracks), 1),
  COALESCE(rb.payment_amount, 299),
  'balance',
  'completed',
  COALESCE(rb.paid_at, rb.updated_at, rb.created_at)
FROM releases_basic rb
WHERE rb.is_paid = TRUE
  AND NOT EXISTS (
    SELECT 1 FROM release_payments rp 
    WHERE rp.release_id = rb.id
  );

-- То же для exclusive релизов
INSERT INTO release_payments (
  user_id, release_id, release_type, 
  release_title, release_artist, tracks_count,
  amount, payment_method, status, created_at
)
SELECT 
  r.user_id,
  r.id,
  'exclusive',
  r.title,
  r.artist_name,
  COALESCE(jsonb_array_length(r.tracks), 1),
  COALESCE(r.payment_amount, 299),
  'balance',
  'completed',
  COALESCE(r.paid_at, r.updated_at, r.created_at)
FROM releases r
WHERE r.is_paid = TRUE
  AND NOT EXISTS (
    SELECT 1 FROM release_payments rp 
    WHERE rp.release_id = r.id
  );

-- ШАГ 4: Статистика
-- ============================================

SELECT 'releases_basic оплаченных:' as info, COUNT(*) as count 
FROM releases_basic WHERE is_paid = TRUE;

SELECT 'releases оплаченных:' as info, COUNT(*) as count 
FROM releases WHERE is_paid = TRUE;

SELECT 'release_payments записей:' as info, COUNT(*) as count 
FROM release_payments;

SELECT '✅ Обновление старых платежей завершено!' as status;
