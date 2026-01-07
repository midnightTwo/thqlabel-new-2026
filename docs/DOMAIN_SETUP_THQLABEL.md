# 🌐 НАСТРОЙКА ДОМЕНА thqlabel.ru

## ⚡ БЫСТРАЯ НАСТРОЙКА SUPABASE

### Шаг 1: URL Configuration

1. Откройте https://supabase.com/dashboard
2. Выберите ваш проект
3. Перейдите в **Authentication → URL Configuration**

### Site URL (ОБЯЗАТЕЛЬНО ИЗМЕНИТЬ!)
```
https://thqlabel.ru
```

### Redirect URLs (добавить все):
```
https://thqlabel.ru/**
https://thqlabel.ru/auth
https://thqlabel.ru/auth/callback
https://thqlabel.ru/reset-password
https://thqlabel.ru/cabinet
https://thqlabel.ru/change-email
https://www.thqlabel.ru/**
```

---

## 📧 Email Templates (Шаблоны писем)

Перейдите в **Authentication → Email Templates**

### 1. Confirm signup (Подтверждение регистрации)

**Subject:**
```
Подтверждение регистрации на THQ Label
```

**Message Body:**
Скопируйте содержимое файла: `email-templates/email-verification-template.html`

### 2. Reset password (Восстановление пароля)

**Subject:**
```
Восстановление пароля THQ Label
```

**Message Body:**
Скопируйте содержимое файла: `email-templates/password-reset-template-new.html`

### 3. Change Email Address (Смена email)

**Subject:**
```
Подтверждение смены email на THQ Label
```

**Message Body:**
Скопируйте содержимое файла: `email-templates/email-change-template.html`

---

## ✅ Проверка настроек

После изменения настроек протестируйте:

1. **Регистрация:** https://thqlabel.ru/auth
   - Зарегистрируйте новый аккаунт
   - Проверьте что письмо пришло
   - Ссылка должна вести на https://thqlabel.ru/...

2. **Восстановление пароля:** https://thqlabel.ru/auth
   - Нажмите "Забыли пароль?"
   - Проверьте письмо
   - Ссылка должна вести на https://thqlabel.ru/reset-password...

3. **Смена email:** https://thqlabel.ru/cabinet
   - Зайдите в настройки
   - Попробуйте сменить email
   - Проверьте оба email

---

## 🔧 Дополнительные настройки

### Email Settings (Authentication → Providers → Email)

- ✅ **Enable Email provider** - включено
- ✅ **Confirm email** - включено (ОБЯЗАТЕЛЬНО!)
- ❌ **Enable auto-confirm** - ВЫКЛЮЧЕНО
- ✅ **Secure email change enabled** - включено

### Rate Limiting
- Emails per hour: `10`

---

## 📝 Что изменяется автоматически

В коде используется `window.location.origin`, поэтому все ссылки в письмах автоматически будут использовать текущий домен:

- При деплое на https://thqlabel.ru все редиректы будут на https://thqlabel.ru
- Не нужно менять код, только настройки в Supabase Dashboard

---

## ✅ Checklist

- [ ] Site URL = `https://thqlabel.ru`
- [ ] Добавлены все Redirect URLs
- [ ] Обновлены Email Templates
- [ ] Confirm email включено
- [ ] Auto-confirm ВЫКЛЮЧЕНО
- [ ] Протестирована регистрация
- [ ] Протестирован сброс пароля
- [ ] Протестирована смена email

---

**Готово! Домен thqlabel.ru настроен! 🎉**
