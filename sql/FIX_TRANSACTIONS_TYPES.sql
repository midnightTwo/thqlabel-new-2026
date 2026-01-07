-- ============================================
-- ИСПРАВЛЕНИЕ ТИПОВ ТРАНЗАКЦИЙ
-- ============================================
-- Проблема: constraint не позволяет создавать deposit и purchase транзакции
-- Решение: обновить constraint чтобы разрешить все нужные типы

-- Шаг 1: Удаляем старый constraint
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_type_check;

-- Шаг 2: Добавляем новый constraint с полным списком типов
ALTER TABLE transactions 
ADD CONSTRAINT transactions_type_check 
CHECK (type IN ('deposit', 'withdrawal', 'purchase', 'payout', 'refund', 'adjustment', 'bonus', 'fee'));

-- Шаг 3: Проверяем что поля соответствуют balance_system.sql
-- Добавляем недостающие колонки если их нет

-- status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transactions' AND column_name = 'status'
  ) THEN
    ALTER TABLE transactions ADD COLUMN status VARCHAR(20) DEFAULT 'completed';
  END IF;
END $$;

-- currency
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transactions' AND column_name = 'currency'
  ) THEN
    ALTER TABLE transactions ADD COLUMN currency VARCHAR(10) DEFAULT 'RUB';
  END IF;
END $$;

-- payment_method
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transactions' AND column_name = 'payment_method'
  ) THEN
    ALTER TABLE transactions ADD COLUMN payment_method VARCHAR(50);
  END IF;
END $$;

-- reference_id как VARCHAR (если UUID - переделать)
-- Пропускаем, может вызвать проблемы с существующими данными

-- Шаг 4: Убираем NOT NULL с description если есть
ALTER TABLE transactions ALTER COLUMN description DROP NOT NULL;

-- Шаг 5: Проверяем результат
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'transactions'
ORDER BY ordinal_position;

-- Готово!
SELECT '✅ Типы транзакций обновлены! Теперь deposit и purchase работают.' as status;
