-- ============================================
-- ИСПРАВЛЕНИЕ СТАТУСОВ ПОСЛЕ ОПЛАТЫ
-- ============================================
-- Релизы со статусом awaiting_payment которые оплачены 
-- нужно перевести обратно в draft

-- Исправляем releases_basic
UPDATE releases_basic
SET status = 'draft'
WHERE 
  status = 'awaiting_payment'
  AND is_paid = TRUE;

-- Исправляем releases
UPDATE releases
SET status = 'draft'
WHERE 
  status = 'awaiting_payment'
  AND is_paid = TRUE;

-- Показываем результат
SELECT 'Исправленные релизы:' as info;

SELECT id, title, status, is_paid 
FROM releases_basic 
WHERE status = 'draft' AND is_paid = TRUE;

SELECT '✅ Статусы исправлены!' as status;
