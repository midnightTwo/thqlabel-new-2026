-- Миграция: Создание таблицы artist_contracts
-- Хранит подписанные договоры артистов (основной лицензионный договор)
-- Артист подписывает основной договор один раз, затем только приложения к релизам
-- Дата: 2026-02-25

-- Создаём таблицу для хранения подписанных договоров артистов
CREATE TABLE IF NOT EXISTS artist_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Тип договора: 'license_agreement' = основной лицензионный договор (публичная оферта)
  contract_type TEXT NOT NULL DEFAULT 'license_agreement',
  
  -- Подпись (base64 PNG data URL)
  signature TEXT NOT NULL,
  
  -- Метаданные подписания
  signed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  
  -- Версия договора (для отслеживания изменений текста оферты)
  contract_version TEXT NOT NULL DEFAULT '1.0',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_artist_contracts_user_id ON artist_contracts(user_id);
CREATE INDEX IF NOT EXISTS idx_artist_contracts_type ON artist_contracts(contract_type);
CREATE UNIQUE INDEX IF NOT EXISTS idx_artist_contracts_unique_license 
  ON artist_contracts(user_id, contract_type) 
  WHERE contract_type = 'license_agreement';

-- RLS политики
ALTER TABLE artist_contracts ENABLE ROW LEVEL SECURITY;

-- Пользователь видит только свои договоры
CREATE POLICY "Users can view own contracts" ON artist_contracts
  FOR SELECT USING (auth.uid() = user_id);

-- Пользователь может создавать свои договоры
CREATE POLICY "Users can insert own contracts" ON artist_contracts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Комментарии
COMMENT ON TABLE artist_contracts IS 'Подписанные договоры артистов (основной лицензионный договор подписывается один раз)';
COMMENT ON COLUMN artist_contracts.contract_type IS 'Тип договора: license_agreement = основная публичная оферта';
COMMENT ON COLUMN artist_contracts.signature IS 'Подпись пользователя (base64 PNG data URL)';
COMMENT ON COLUMN artist_contracts.contract_version IS 'Версия текста договора на момент подписания';

-- Добавляем столбец appendix_number к релизам для нумерации приложений
ALTER TABLE releases_basic 
ADD COLUMN IF NOT EXISTS appendix_number INTEGER;

ALTER TABLE releases_exclusive 
ADD COLUMN IF NOT EXISTS appendix_number INTEGER;

COMMENT ON COLUMN releases_basic.appendix_number IS 'Номер приложения к договору';
COMMENT ON COLUMN releases_exclusive.appendix_number IS 'Номер приложения к договору';
