-- ============================================
-- ДОБАВЛЕНИЕ ПОЛЯ transaction_id В ТИКЕТЫ
-- Для связи тикетов о выплатах с конкретными транзакциями
-- ============================================

-- Добавляем колонку transaction_id
ALTER TABLE support_tickets 
ADD COLUMN IF NOT EXISTS transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL;

-- Создаём индекс для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_support_tickets_transaction_id 
ON support_tickets(transaction_id) 
WHERE transaction_id IS NOT NULL;

-- Комментарий для документации
COMMENT ON COLUMN support_tickets.transaction_id IS 'Связь с конкретной транзакцией для тикетов о выплатах';

SELECT '✅ Колонка transaction_id успешно добавлена в support_tickets' as status;
