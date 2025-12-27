-- Таблица для хранения черновиков новостей
CREATE TABLE IF NOT EXISTS news_drafts (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT,
  category TEXT DEFAULT 'Новость',
  image TEXT,
  scheduled_for TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индекс для быстрого поиска по пользователю
CREATE INDEX IF NOT EXISTS idx_news_drafts_user_id ON news_drafts(user_id);

-- Политики доступа (пользователь может управлять только своими черновиками)
ALTER TABLE news_drafts ENABLE ROW LEVEL SECURITY;

-- Политика: пользователь видит только свои черновики
CREATE POLICY "Users can view own drafts"
  ON news_drafts
  FOR SELECT
  USING (auth.uid() = user_id);

-- Политика: пользователь может создавать черновики
CREATE POLICY "Users can create own drafts"
  ON news_drafts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Политика: пользователь может обновлять свои черновики
CREATE POLICY "Users can update own drafts"
  ON news_drafts
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Политика: пользователь может удалять свои черновики
CREATE POLICY "Users can delete own drafts"
  ON news_drafts
  FOR DELETE
  USING (auth.uid() = user_id);

-- Триггер для автообновления updated_at
CREATE OR REPLACE FUNCTION update_news_drafts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_news_drafts_updated_at
  BEFORE UPDATE ON news_drafts
  FOR EACH ROW
  EXECUTE FUNCTION update_news_drafts_updated_at();
