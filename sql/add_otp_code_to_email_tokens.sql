-- ============================================
-- Добавляем поле otp_code в email_tokens
-- для 6-значной верификации вместо ссылки
-- ============================================

ALTER TABLE email_tokens
  ADD COLUMN IF NOT EXISTS otp_code TEXT;

-- Индекс для быстрого поиска по email + код
CREATE INDEX IF NOT EXISTS idx_email_tokens_email_otp
  ON email_tokens (email, otp_code)
  WHERE otp_code IS NOT NULL;
