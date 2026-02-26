-- Таблица настроек сайта (одна строка)
CREATE TABLE IF NOT EXISTS site_settings (
  id INT PRIMARY KEY DEFAULT 1,
  maintenance_mode BOOLEAN DEFAULT FALSE,
  maintenance_message TEXT DEFAULT 'Ведутся технические работы',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by TEXT
);

-- Вставляем дефолтную строку если нет
INSERT INTO site_settings (id, maintenance_mode) VALUES (1, false)
ON CONFLICT (id) DO NOTHING;

-- RLS: только owner может менять, все могут читать
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read settings" ON site_settings
  FOR SELECT USING (true);

CREATE POLICY "Only owner can update settings" ON site_settings
  FOR UPDATE USING (
    auth.jwt() ->> 'email' = 'maksbroska@gmail.com'
  );
