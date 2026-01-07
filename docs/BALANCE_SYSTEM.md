# 💰 Система Баланса THQ Label

## Быстрый старт

### 1. Примени SQL миграцию
```sql
-- Выполни в Supabase SQL Editor:
-- sql/balance_system.sql
```

### 2. Добавь переменные окружения в `.env.local`
```env
# YooKassa
YOOKASSA_SHOP_ID=your_shop_id
YOOKASSA_SECRET_KEY=your_secret_key
YOOKASSA_TEST_MODE=true

# CryptoCloud (опционально)
CRYPTOCLOUD_SHOP_ID=your_shop_id
CRYPTOCLOUD_API_KEY=your_api_key
```

### 3. Настрой webhook в YooKassa
URL: `https://yourdomain.com/api/payments/webhook/yookassa`

---

## 🏗 Архитектура

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────────┐
│  Страница       │────▶│  API Create  │────▶│  YooKassa/      │
│  /cabinet/      │     │  Payment     │     │  CryptoCloud    │
│  balance        │     └──────────────┘     └────────┬────────┘
└─────────────────┘                                   │
                                                      │ Webhook
┌─────────────────┐     ┌──────────────┐     ┌───────▼────────┐
│  Баланс         │◀────│  deposit_    │◀────│  Webhook       │
│  обновлён       │     │  balance()   │     │  Handler       │
└─────────────────┘     └──────────────┘     └────────────────┘
```

---

## 📦 Структура файлов

```
app/
├── api/
│   ├── balance/
│   │   ├── route.ts              # GET баланс
│   │   └── transactions/route.ts # GET транзакции
│   └── payments/
│       ├── create/route.ts       # POST создать платёж
│       └── webhook/
│           ├── yookassa/route.ts # Webhook YooKassa
│           └── cryptocloud/route.ts # Webhook CryptoCloud
├── cabinet/
│   └── balance/
│       └── page.tsx              # UI страница баланса

sql/
└── balance_system.sql            # Таблицы и функции БД
```

---

## 🔒 Безопасность

1. **Webhook'и**
   - Проверка подписи от провайдера
   - Проверка суммы платежа
   - Идемпотентность (повторный webhook не изменит баланс)

2. **База данных**
   - RLS политики для изоляции пользователей
   - Функции с SECURITY DEFINER
   - Блокировка строки при изменении баланса (FOR UPDATE)

3. **API**
   - Проверка авторизации
   - Валидация сумм
   - Rate limiting (рекомендуется добавить)

---

## 🧪 Тестирование

### YooKassa тестовые карты:
| Карта | Результат |
|-------|-----------|
| 5555 5555 5555 4444 | Успешный платёж |
| 5555 5555 5555 4002 | Отклонён |
| 5555 5555 5555 4012 | 3D Secure |

CVV: любые 3 цифры
Дата: любая в будущем

### Как тестировать локально:
1. Используй ngrok: `ngrok http 3000`
2. Обнови webhook URL в YooKassa на ngrok URL
3. Создай платёж и оплати тестовой картой

---

## 📱 API Reference

### GET /api/balance
Получить баланс текущего пользователя.

**Response:**
```json
{
  "balance": 1500.00,
  "frozen_balance": 0.00,
  "total_deposited": 5000.00,
  "total_spent": 3500.00,
  "currency": "RUB"
}
```

### GET /api/balance/transactions
Получить историю транзакций.

**Query params:**
- `page` - номер страницы (default: 1)
- `limit` - записей на страницу (default: 20)
- `type` - фильтр по типу (deposit, purchase, withdrawal)

### POST /api/payments/create
Создать платёж для пополнения.

**Body:**
```json
{
  "amount": 1000,
  "provider": "yookassa",
  "paymentMethod": "sbp",
  "userId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "orderId": "uuid",
  "paymentUrl": "https://..."
}
```

---

## 🎯 Следующие шаги

1. [ ] Добавить пункт "Баланс" в меню кабинета
2. [ ] Интегрировать оплату услуг с баланса
3. [ ] Добавить систему бонусов/кэшбэка
4. [ ] Добавить вывод средств
5. [ ] Email уведомления о платежах

---

## ⚙️ Полезные SQL запросы

```sql
-- Посмотреть все балансы
SELECT u.email, b.* 
FROM user_balances b 
JOIN auth.users u ON u.id = b.user_id;

-- Посмотреть последние транзакции
SELECT t.*, u.email 
FROM transactions t 
JOIN auth.users u ON u.id = t.user_id 
ORDER BY t.created_at DESC 
LIMIT 20;

-- Ручное пополнение баланса (для тестов)
SELECT deposit_balance(
  'user-uuid-here',
  1000.00,
  'Тестовое пополнение',
  '{"test": true}'::jsonb
);
```
