-- Миграция: Добавление полей данных договора к releases_basic
-- Хранит все данные лицензионного договора артиста
-- Все поля обязательны для генерации/подписания договора
-- Дата: 2026-02-25

-- === Поля данных договора (персональные данные Лицензиара) ===

-- ФИО артиста (полное)
ALTER TABLE releases_basic ADD COLUMN IF NOT EXISTS contract_full_name TEXT;

-- Страна
ALTER TABLE releases_basic ADD COLUMN IF NOT EXISTS contract_country TEXT;

-- Паспорт: серия и номер
ALTER TABLE releases_basic ADD COLUMN IF NOT EXISTS contract_passport TEXT;

-- Паспорт: кем выдан
ALTER TABLE releases_basic ADD COLUMN IF NOT EXISTS contract_passport_issued_by TEXT;

-- Паспорт: код подразделения
ALTER TABLE releases_basic ADD COLUMN IF NOT EXISTS contract_passport_code TEXT;

-- Паспорт: дата выдачи
ALTER TABLE releases_basic ADD COLUMN IF NOT EXISTS contract_passport_date TEXT;

-- E-mail
ALTER TABLE releases_basic ADD COLUMN IF NOT EXISTS contract_email TEXT;

-- Банковские реквизиты: номер счета
ALTER TABLE releases_basic ADD COLUMN IF NOT EXISTS contract_bank_account TEXT;

-- Банковские реквизиты: БИК
ALTER TABLE releases_basic ADD COLUMN IF NOT EXISTS contract_bank_bik TEXT;

-- Банковские реквизиты: корр. счет
ALTER TABLE releases_basic ADD COLUMN IF NOT EXISTS contract_bank_corr TEXT;

-- ИЛИ номер карты
ALTER TABLE releases_basic ADD COLUMN IF NOT EXISTS contract_card_number TEXT;

-- Полный JSON с данными договора (для надёжности и генерации PDF)
ALTER TABLE releases_basic ADD COLUMN IF NOT EXISTS contract_data JSONB;

-- Дата подписания договора
ALTER TABLE releases_basic ADD COLUMN IF NOT EXISTS contract_signed_at TIMESTAMPTZ;

-- Номер договора (генерируется автоматически)
ALTER TABLE releases_basic ADD COLUMN IF NOT EXISTS contract_number TEXT;

-- Комментарии
COMMENT ON COLUMN releases_basic.contract_full_name IS 'ФИО Лицензиара (артиста) для договора';
COMMENT ON COLUMN releases_basic.contract_country IS 'Страна гражданства Лицензиара';
COMMENT ON COLUMN releases_basic.contract_passport IS 'Серия и номер паспорта Лицензиара';
COMMENT ON COLUMN releases_basic.contract_passport_issued_by IS 'Кем выдан паспорт Лицензиара';
COMMENT ON COLUMN releases_basic.contract_passport_code IS 'Код подразделения паспорта Лицензиара';
COMMENT ON COLUMN releases_basic.contract_passport_date IS 'Дата выдачи паспорта Лицензиара';
COMMENT ON COLUMN releases_basic.contract_email IS 'E-mail Лицензиара для договора';
COMMENT ON COLUMN releases_basic.contract_bank_account IS 'Номер банковского счета Лицензиара';
COMMENT ON COLUMN releases_basic.contract_bank_bik IS 'БИК банка Лицензиара';
COMMENT ON COLUMN releases_basic.contract_bank_corr IS 'Корреспондентский счет банка Лицензиара';
COMMENT ON COLUMN releases_basic.contract_card_number IS 'Номер карты Лицензиара (альтернатива счету)';
COMMENT ON COLUMN releases_basic.contract_data IS 'Полные данные договора в JSON формате';
COMMENT ON COLUMN releases_basic.contract_signed_at IS 'Дата и время подписания договора';
COMMENT ON COLUMN releases_basic.contract_number IS 'Номер лицензионного договора';
