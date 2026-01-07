# 💸 Единая система выводов THQ Label

## Обзор

Новая единая система выводов полностью интегрирована с системой баланса и обеспечивает:
- Автоматическую заморозку средств при создании заявки
- Прозрачную историю транзакций (freeze → withdrawal/unfreeze)
- Статистику для администраторов
- Безопасность через функции БД с SECURITY DEFINER

---

## 🏗 Архитектура

```
┌─────────────────────────────────────────────────────────────────┐
│                     ПОЛЬЗОВАТЕЛЬ                                │
│  Создаёт заявку на вывод через WithdrawalForm                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API /api/withdrawals/v2                       │
│  POST - создать заявку с автоматической заморозкой              │
│  GET  - получить доступный баланс                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              БАЗА ДАННЫХ (Supabase)                             │
├─────────────────────────────────────────────────────────────────┤
│  withdrawal_requests   - заявки на вывод                        │
│  user_balances         - балансы (balance, frozen_balance)      │
│  transactions          - транзакции (freeze, unfreeze, withdrawal)│
│  profiles              - синхронизация баланса                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      АДМИН-ПАНЕЛЬ                               │
│  WithdrawalsTab - управление заявками, статистика               │
│  API /api/withdrawals/v2/[id] - approve/reject/complete         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📦 Структура файлов

```
app/
├── api/
│   └── withdrawals/
│       ├── v2/
│       │   ├── route.ts           # POST создать, GET баланс
│       │   └── [id]/route.ts      # PATCH статус (админ)
│       ├── route.ts               # Старый API (совместимость)
│       └── [id]/route.ts          # Старый API
├── admin/
│   └── components/
│       └── withdrawals/
│           └── WithdrawalsTab.tsx # Админ-панель выводов
├── cabinet/
│   └── components/
│       └── finance/
│           ├── WithdrawalForm.tsx # Форма вывода
│           └── OperationsHistory.tsx # История операций

sql/
└── unified_withdrawal_system.sql  # SQL функции и таблицы
```

---

## 🔄 Жизненный цикл заявки

### 1. Создание заявки (пользователь)
```
POST /api/withdrawals/v2
{
  "amount": 5000,
  "bankName": "Сбербанк",
  "cardNumber": "4276 **** **** 1234",
  "recipientName": "Иванов Иван Иванович",
  "method": "card"
}
```

**Происходит:**
1. Проверка доступного баланса
2. Создание записи в `withdrawal_requests` (status: pending)
3. Списание с `balance`, добавление в `frozen_balance`
4. Создание транзакции типа `freeze`
5. Синхронизация `profiles.balance`

### 2. Одобрение (админ)
```
PATCH /api/withdrawals/v2/{id}
{ "status": "approved" }
```

**Происходит:**
- Статус меняется на `approved`
- Средства остаются замороженными

### 3a. Завершение выплаты (админ)
```
PATCH /api/withdrawals/v2/{id}
{ "status": "completed" }
```

**Происходит:**
1. Снятие заморозки (`frozen_balance -= amount`)
2. Добавление к `total_withdrawn`
3. Создание транзакции типа `withdrawal`
4. Статус → `completed`

### 3b. Отклонение (админ)
```
PATCH /api/withdrawals/v2/{id}
{ "status": "rejected", "adminComment": "Причина" }
```

**Происходит:**
1. Возврат средств (`balance += amount`)
2. Снятие заморозки (`frozen_balance -= amount`)
3. Создание транзакции типа `unfreeze`
4. Статус → `rejected`

---

## 💰 Таблица балансов

```sql
CREATE TABLE user_balances (
  user_id UUID PRIMARY KEY,
  balance DECIMAL(12, 2) DEFAULT 0,           -- Текущий баланс
  frozen_balance DECIMAL(12, 2) DEFAULT 0,    -- Заморожено для выводов
  total_deposited DECIMAL(12, 2) DEFAULT 0,   -- Всего пополнено
  total_withdrawn DECIMAL(12, 2) DEFAULT 0,   -- Всего выведено
  total_spent DECIMAL(12, 2) DEFAULT 0        -- Всего потрачено
);
```

**Формула доступного баланса:**
```
available_balance = balance - frozen_balance
```

---

## 📊 Типы транзакций

| Тип | Описание | Влияние на баланс |
|-----|----------|-------------------|
| `deposit` | Пополнение баланса | balance + |
| `purchase` | Покупка услуги | balance - |
| `freeze` | Заморозка для вывода | balance -, frozen + |
| `unfreeze` | Разморозка (отмена вывода) | balance +, frozen - |
| `withdrawal` | Вывод выполнен | frozen -, total_withdrawn + |
| `payout` | Начисление роялти | balance + |
| `bonus` | Бонус | balance + |
| `refund` | Возврат | balance + |

---

## 🔧 Установка

### 1. Применить SQL миграцию
```sql
-- В Supabase SQL Editor выполнить:
-- sql/unified_withdrawal_system.sql
```

### 2. Проверить функции
```sql
-- Проверить создание функций
SELECT proname FROM pg_proc WHERE proname LIKE '%withdrawal%';
```

### 3. Тестирование
```sql
-- Получить статистику
SELECT * FROM get_withdrawal_stats();

-- Проверить баланс пользователя
SELECT * FROM get_available_balance('user-uuid-here');
```

---

## 🛡 Безопасность

1. **Функции с SECURITY DEFINER** - выполняются от имени создателя
2. **Блокировка строк (FOR UPDATE)** - предотвращение гонок
3. **Проверка прав** - только админы могут менять статус
4. **RLS политики** - изоляция данных пользователей

---

## 📱 UI Компоненты

### WithdrawalForm
- Автозаполнение популярных банков
- Форматирование номера карты
- Быстрый выбор суммы
- Валидация в реальном времени
- Поддержка карт и СБП

### WithdrawalsTab (админ)
- Статистика по статусам
- Фильтрация и поиск
- Боковая панель деталей
- Одобрение/отклонение/завершение

### OperationsHistory
- Поддержка freeze/unfreeze транзакций
- Цветовая индикация типов
- Копирование ID транзакции

---

## 🔗 API Reference

### POST /api/withdrawals/v2
Создать заявку на вывод.

**Тело запроса:**
```json
{
  "amount": 5000,
  "bankName": "Сбербанк",
  "cardNumber": "4276123456781234",
  "recipientName": "Иванов Иван Иванович",
  "method": "card",
  "additionalInfo": "Комментарий"
}
```

**Ответ:**
```json
{
  "success": true,
  "withdrawal_id": "uuid",
  "transaction_id": "uuid",
  "amount": 5000,
  "balance_after": 15000,
  "frozen_balance": 5000
}
```

### GET /api/withdrawals/v2
Получить информацию о балансе.

**Ответ:**
```json
{
  "success": true,
  "balance": 20000,
  "frozen_balance": 5000,
  "available_balance": 15000,
  "min_withdrawal": 1000
}
```

### PATCH /api/withdrawals/v2/{id}
Обновить статус заявки (только для админов).

**Тело запроса:**
```json
{
  "status": "approved|rejected|completed",
  "adminComment": "Причина"
}
```

---

## ✅ Готово!

Система выводов полностью интегрирована с балансом и готова к использованию.
