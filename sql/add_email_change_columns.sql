-- Добавляем колонки для смены email
ALTER TABLE email_tokens ADD COLUMN IF NOT EXISTS new_email TEXT;
ALTER TABLE email_tokens ADD COLUMN IF NOT EXISTS user_id UUID;

-- Обновляем constraint для token_type
ALTER TABLE email_tokens DROP CONSTRAINT IF EXISTS email_tokens_token_type_check;
ALTER TABLE email_tokens ADD CONSTRAINT email_tokens_token_type_check 
  CHECK (token_type IN ('verification', 'password_reset', 'email_change'));

-- Комментарии
COMMENT ON COLUMN email_tokens.new_email IS 'Новый email для смены (только для email_change)';
COMMENT ON COLUMN email_tokens.user_id IS 'ID пользователя (только для email_change)';
