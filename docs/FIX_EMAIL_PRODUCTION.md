# Исправление email писем в production (thqlabel.ru)

## Проблема

Email письма (регистрация, сброс пароля) работали локально, но не работали на production сервере.

## Причины

1. **Жёстко прописанный localhost в ссылках сброса пароля** - ссылки в письмах вели на `http://localhost:3000` вместо реального домена

2. **Хранение токенов в памяти (Map)** - на serverless платформах (Vercel) каждый запрос может попасть на разный инстанс сервера. Токены создавались на одном инстансе, а верификация происходила на другом, где токена не было

## Исправления

### 1. Динамические ссылки

Заменено:
```javascript
const resetLink = `http://localhost:3000/reset-password?token=${resetToken}`;
```

На:
```javascript
const host = request.headers.get('host') || 'localhost:3000';
const protocol = host.includes('localhost') ? 'http' : 'https';
const resetLink = `${protocol}://${host}/reset-password?token=${resetToken}`;
```

### 2. Хранение токенов в базе данных

Вместо `Map` в памяти, токены теперь хранятся в таблице `email_tokens` в Supabase.

## Действия для деплоя

### Шаг 1: Создать таблицу в Supabase

Выполните SQL из файла `sql/create_email_tokens_table.sql` в SQL Editor Supabase:

```sql
-- Создаём таблицу email_tokens
CREATE TABLE IF NOT EXISTS email_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE,
  token_type TEXT NOT NULL CHECK (token_type IN ('verification', 'password_reset')),
  email TEXT NOT NULL,
  password_hash TEXT,
  nickname TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_email_tokens_token ON email_tokens(token);
CREATE INDEX IF NOT EXISTS idx_email_tokens_expires_at ON email_tokens(expires_at);

-- RLS
ALTER TABLE email_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to email_tokens"
  ON email_tokens
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

### Шаг 2: Деплой кода

```bash
git add .
git commit -m "fix: email tokens stored in database instead of memory"
git push
```

### Шаг 3: Проверка

1. Попробуйте зарегистрироваться на thqlabel.ru
2. Проверьте письмо - ссылка должна вести на https://thqlabel.ru/...
3. Перейдите по ссылке из письма
4. Регистрация должна завершиться успешно

## Изменённые файлы

- `app/api/send-verification-email/route.ts` - сохранение токена в БД
- `app/api/verify-email/route.ts` - чтение токена из БД
- `app/api/send-password-reset/route.ts` - динамический URL + БД
- `app/api/reset-password/route.ts` - чтение токена из БД
- `sql/create_email_tokens_table.sql` - SQL скрипт для таблицы
