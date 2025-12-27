# 📧 НАСТРОЙКА EMAIL ДЛЯ ХОСТА

## Шаг 1: Настройка URL в Supabase

1. Откройте https://supabase.com/dashboard
2. Выберите свой проект
3. Перейдите в **Authentication → URL Configuration**

### Site URL
```
https://thq-git-main-nazarbekansar2108-svgs-projects.vercel.app
```

### Redirect URLs
Добавьте все эти URL:
```
https://thq-git-main-nazarbekansar2108-svgs-projects.vercel.app/**
https://thq-git-main-nazarbekansar2108-svgs-projects.vercel.app/auth
https://thq-git-main-nazarbekansar2108-svgs-projects.vercel.app/auth/callback
https://thq-git-main-nazarbekansar2108-svgs-projects.vercel.app/reset-password
https://thq-git-main-nazarbekansar2108-svgs-projects.vercel.app/cabinet
```

---

## Шаг 2: Email Templates (Шаблоны писем)

Перейдите в **Authentication → Email Templates**

### 📝 Confirm Signup (Подтверждение регистрации)

**Subject:**
```
Подтвердите email для THQ Label
```

**Message Body (HTML):**
```html
<h2>Добро пожаловать в THQ Label!</h2>
<p>Нажмите на кнопку ниже, чтобы подтвердить email:</p>
<p><a href="{{ .ConfirmationURL }}" style="background: #6050ba; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Подтвердить email</a></p>
<p>Или скопируйте эту ссылку:</p>
<p>{{ .ConfirmationURL }}</p>
```

### 🔑 Reset Password (Сброс пароля)

**Subject:**
```
Сброс пароля для THQ Label
```

**Message Body (HTML):**
```html
<h2>Сброс пароля</h2>
<p>Вы запросили сброс пароля. Нажмите на кнопку ниже:</p>
<p><a href="{{ .ConfirmationURL }}" style="background: #6050ba; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Сбросить пароль</a></p>
<p>Или скопируйте эту ссылку:</p>
<p>{{ .ConfirmationURL }}</p>
<p>Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо.</p>
```

### ✉️ Change Email (Смена email)

**Subject:**
```
Подтвердите смену email для THQ Label
```

**Message Body (HTML):**
```html
<h2>Подтверждение смены email</h2>
<p>Вы запросили смену email. Нажмите на кнопку ниже для подтверждения:</p>
<p><a href="{{ .ConfirmationURL }}" style="background: #6050ba; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Подтвердить новый email</a></p>
<p>Или скопируйте эту ссылку:</p>
<p>{{ .ConfirmationURL }}</p>
```

---

## Шаг 3: Email Settings

Перейдите в **Authentication → Providers → Email**

### ВАЖНО! Включите:
- ✅ **Enable Email provider** - должен быть включён!
- ✅ **Confirm email** - ОБЯЗАТЕЛЬНО включить для подтверждения
- ⚠️ **Enable auto-confirm** - должен быть ВЫКЛЮЧЕН (иначе письма не шлются)

### Дополнительно:
- ✅ **Secure email change enabled** - двойное подтверждение при смене email

### Rate Limiting:
- Emails per hour: `10` (защита от спама)

---

## Шаг 3.1: Проверьте SMTP

Перейдите в **Project Settings → Auth**

### Убедитесь:
- **SMTP Host** должен быть настроен (или оставить пустым для Supabase SMTP)
- Если пусто - Supabase будет использовать свой встроенный SMTP (работает!)

---

## Шаг 4: SMTP Settings (Отправка email)

По умолчанию Supabase использует свой SMTP. Это работает, но:
- Может попадать в спам
- Ограничение 4 письма в час на бесплатном плане

### Опционально: Свой SMTP (Gmail)

Если хочешь использовать свой email:

1. **Settings → Project Settings → SMTP Settings**
2. Enable Custom SMTP Server

**Настройки для Gmail:**
```
Host: smtp.gmail.com
Port: 587
Username: your-email@gmail.com
Password: [App Password - создай в настройках Google]
Sender email: your-email@gmail.com
Sender name: THQ Label
```

**Получить App Password:**
1. https://myaccount.google.com/security
2. Включить двухфакторную аутентификацию
3. App passwords → Создать пароль

---

## ✅ Проверка работы

После настройки проверь:

1. **Регистрация нового пользователя:**
   - https://thq-git-main-nazarbekansar2108-svgs-projects.vercel.app/auth
   - Зарегистрируйся с новым email
   - Проверь почту - должно прийти письмо

2. **Сброс пароля:**
   - https://thq-git-main-nazarbekansar2108-svgs-projects.vercel.app/auth
   - Нажми "Забыли пароль?"
   - Введи email
   - Проверь почту

3. **Смена email (в кабинете):**
   - https://thq-git-main-nazarbekansar2108-svgs-projects.vercel.app/change-email
   - Смени email
   - Проверь обе почты (старую и новую)

---

## 🔍 Проверка логов

Если email не приходят:

1. Supabase Dashboard → **Logs → Edge Functions**
2. Ищи ошибки с email
3. Проверь спам в почте
4. Проверь что URL правильные

---

## 📋 Checklist

- [ ] Site URL настроен (`https://thq-git-main-nazarbekansar2108-svgs-projects.vercel.app`)
- [ ] Redirect URLs добавлены (все 5 штук)
- [ ] Email templates обновлены (русский текст + THQ Label)
- [ ] Email confirmations включены
- [ ] Проверена регистрация - письмо приходит
- [ ] Проверен сброс пароля - письмо приходит
- [ ] (Опционально) SMTP настроен, если используешь Gmail

---

**Готово! Теперь email будут работать на хосте! ✅**
