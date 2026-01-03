-- Добавление поля reply_to для системы ответов на сообщения в тикетах

-- Добавляем поле reply_to в ticket_messages
ALTER TABLE ticket_messages
ADD COLUMN IF NOT EXISTS reply_to UUID REFERENCES ticket_messages(id) ON DELETE SET NULL;

-- Создаем индекс для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_ticket_messages_reply_to ON ticket_messages(reply_to);

-- Комментарий к полю
COMMENT ON COLUMN ticket_messages.reply_to IS 'ID сообщения на которое отвечает данное сообщение';
