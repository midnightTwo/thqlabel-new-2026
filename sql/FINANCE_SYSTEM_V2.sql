-- ==============================================================
-- ФИНАНСОВАЯ СИСТЕМА V2 - ПОЛНЫЙ АУДИТ ТРАНЗАКЦИЙ
-- ==============================================================

-- 1. ДОБАВЛЯЕМ НОВЫЕ ПОЛЯ В ТАБЛИЦУ ТРАНЗАКЦИЙ (если их нет)
DO $$ 
BEGIN
  -- Добавляем поле currency если его нет
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transactions' AND column_name = 'currency'
  ) THEN
    ALTER TABLE transactions ADD COLUMN currency VARCHAR(10) DEFAULT 'RUB';
  END IF;

  -- Добавляем поле payment_method если его нет
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transactions' AND column_name = 'payment_method'
  ) THEN
    ALTER TABLE transactions ADD COLUMN payment_method VARCHAR(50);
  END IF;

  -- Добавляем поле ip_address для логирования
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transactions' AND column_name = 'ip_address'
  ) THEN
    ALTER TABLE transactions ADD COLUMN ip_address VARCHAR(50);
  END IF;

  -- Добавляем поле user_agent для логирования
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transactions' AND column_name = 'user_agent'
  ) THEN
    ALTER TABLE transactions ADD COLUMN user_agent TEXT;
  END IF;

  -- Добавляем поле admin_id - кто обработал транзакцию
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transactions' AND column_name = 'admin_id'
  ) THEN
    ALTER TABLE transactions ADD COLUMN admin_id UUID REFERENCES profiles(id);
  END IF;

  -- Добавляем поле admin_comment
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transactions' AND column_name = 'admin_comment'
  ) THEN
    ALTER TABLE transactions ADD COLUMN admin_comment TEXT;
  END IF;

  -- Изменяем reference_id на UUID если нужно
  BEGIN
    ALTER TABLE transactions ALTER COLUMN reference_id TYPE UUID USING reference_id::UUID;
  EXCEPTION
    WHEN invalid_text_representation THEN NULL;
    WHEN others THEN NULL;
  END;
END $$;

-- 2. ОБНОВЛЯЕМ CHECK CONSTRAINT ДЛЯ TYPE
DO $$
BEGIN
  -- Удаляем старый constraint
  ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_type_check;
  
  -- Добавляем новый с большим количеством типов
  ALTER TABLE transactions ADD CONSTRAINT transactions_type_check 
    CHECK (type IN (
      'deposit',      -- пополнение баланса
      'withdrawal',   -- вывод средств
      'payout',       -- начисление роялти
      'purchase',     -- покупка услуги
      'refund',       -- возврат средств
      'correction',   -- коррекция баланса
      'adjustment',   -- корректировка (синоним correction)
      'bonus',        -- бонусное начисление
      'fee',          -- комиссия
      'freeze',       -- заморозка средств
      'unfreeze',     -- разморозка средств
      'withdrawal_request', -- заявка на вывод
      'withdrawal_cancelled' -- отменённый вывод
    ));
EXCEPTION
  WHEN others THEN NULL;
END $$;

-- 3. СОЗДАЁМ ИНДЕКСЫ ДЛЯ БЫСТРОГО ПОИСКА
CREATE INDEX IF NOT EXISTS idx_transactions_admin_id ON transactions(admin_id);
CREATE INDEX IF NOT EXISTS idx_transactions_metadata ON transactions USING GIN(metadata);
CREATE INDEX IF NOT EXISTS idx_transactions_description ON transactions USING GIN(to_tsvector('russian', COALESCE(description, '')));

-- 4. ФУНКЦИЯ ДЛЯ СОЗДАНИЯ ТРАНЗАКЦИИ С ПОЛНЫМ ЛОГИРОВАНИЕМ
CREATE OR REPLACE FUNCTION create_logged_transaction(
  p_user_id UUID,
  p_type TEXT,
  p_amount DECIMAL(12, 2),
  p_description TEXT DEFAULT '',
  p_reference_id UUID DEFAULT NULL,
  p_reference_table TEXT DEFAULT NULL,
  p_payment_method TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_admin_id UUID DEFAULT NULL,
  p_admin_comment TEXT DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_balance_before DECIMAL(12, 2);
  v_balance_after DECIMAL(12, 2);
  v_transaction_id UUID;
  v_amount_delta DECIMAL(12, 2);
BEGIN
  -- Получаем текущий баланс с блокировкой
  SELECT COALESCE(balance, 0) INTO v_balance_before
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Пользователь не найден: %', p_user_id;
  END IF;

  -- Вычисляем изменение баланса в зависимости от типа
  CASE p_type
    WHEN 'deposit' THEN v_amount_delta := p_amount;
    WHEN 'payout' THEN v_amount_delta := p_amount;
    WHEN 'bonus' THEN v_amount_delta := p_amount;
    WHEN 'refund' THEN v_amount_delta := p_amount;
    WHEN 'unfreeze' THEN v_amount_delta := p_amount;
    WHEN 'withdrawal' THEN v_amount_delta := -p_amount;
    WHEN 'purchase' THEN v_amount_delta := -p_amount;
    WHEN 'fee' THEN v_amount_delta := -p_amount;
    WHEN 'freeze' THEN v_amount_delta := -p_amount;
    WHEN 'correction' THEN v_amount_delta := p_amount; -- может быть + или -
    ELSE RAISE EXCEPTION 'Неизвестный тип транзакции: %', p_type;
  END CASE;

  v_balance_after := v_balance_before + v_amount_delta;

  -- Проверяем достаточность средств для списания
  IF v_balance_after < 0 AND p_type IN ('withdrawal', 'purchase', 'fee', 'freeze') THEN
    RAISE EXCEPTION 'Недостаточно средств. Баланс: %, запрошено: %', 
      v_balance_before, ABS(v_amount_delta);
  END IF;

  -- Создаём запись транзакции
  INSERT INTO transactions (
    user_id, type, amount, currency, balance_before, balance_after,
    description, reference_id, reference_table, payment_method,
    metadata, admin_id, admin_comment, ip_address, user_agent, status
  ) VALUES (
    p_user_id, p_type, ABS(p_amount), 'RUB', v_balance_before, v_balance_after,
    p_description, p_reference_id, p_reference_table, p_payment_method,
    p_metadata, p_admin_id, p_admin_comment, p_ip_address, p_user_agent, 'completed'
  ) RETURNING id INTO v_transaction_id;

  -- Обновляем баланс пользователя в profiles
  UPDATE profiles
  SET balance = v_balance_after
  WHERE id = p_user_id;

  -- Синхронизируем с user_balances
  UPDATE user_balances
  SET 
    balance = v_balance_after,
    total_deposited = CASE 
      WHEN p_type IN ('deposit', 'payout', 'bonus', 'refund') 
      THEN COALESCE(total_deposited, 0) + ABS(p_amount)
      ELSE total_deposited
    END,
    total_withdrawn = CASE 
      WHEN p_type = 'withdrawal' 
      THEN COALESCE(total_withdrawn, 0) + ABS(p_amount)
      ELSE total_withdrawn
    END,
    total_spent = CASE 
      WHEN p_type IN ('purchase', 'fee') 
      THEN COALESCE(total_spent, 0) + ABS(p_amount)
      ELSE total_spent
    END,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. ФУНКЦИЯ ДЛЯ ЗАМОРОЗКИ СРЕДСТВ (для заявок на вывод)
CREATE OR REPLACE FUNCTION freeze_balance(
  p_user_id UUID,
  p_amount DECIMAL(12, 2),
  p_reference_id UUID DEFAULT NULL,
  p_admin_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_balance DECIMAL(12, 2);
  v_frozen DECIMAL(12, 2);
  v_tx_id UUID;
BEGIN
  -- Получаем баланс
  SELECT balance, COALESCE(frozen_balance, 0) 
  INTO v_balance, v_frozen
  FROM user_balances
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND OR v_balance < p_amount THEN
    RAISE EXCEPTION 'Недостаточно средств для заморозки. Баланс: %, запрошено: %', COALESCE(v_balance, 0), p_amount;
  END IF;

  -- Создаём транзакцию заморозки
  v_tx_id := create_logged_transaction(
    p_user_id,
    'freeze',
    p_amount,
    'Заморозка средств для вывода',
    p_reference_id,
    'withdrawal_requests',
    NULL,
    jsonb_build_object('action', 'freeze'),
    p_admin_id
  );

  -- Обновляем замороженный баланс
  UPDATE user_balances
  SET 
    frozen_balance = v_frozen + p_amount,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  RETURN v_tx_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. ФУНКЦИЯ ДЛЯ РАЗМОРОЗКИ СРЕДСТВ (при отмене заявки)
CREATE OR REPLACE FUNCTION unfreeze_balance(
  p_user_id UUID,
  p_amount DECIMAL(12, 2),
  p_reference_id UUID DEFAULT NULL,
  p_admin_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_frozen DECIMAL(12, 2);
  v_tx_id UUID;
BEGIN
  -- Получаем замороженный баланс
  SELECT COALESCE(frozen_balance, 0) INTO v_frozen
  FROM user_balances
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- Создаём транзакцию разморозки
  v_tx_id := create_logged_transaction(
    p_user_id,
    'unfreeze',
    p_amount,
    'Разморозка средств - заявка отклонена',
    p_reference_id,
    'withdrawal_requests',
    NULL,
    jsonb_build_object('action', 'unfreeze'),
    p_admin_id
  );

  -- Уменьшаем замороженный баланс
  UPDATE user_balances
  SET 
    frozen_balance = GREATEST(0, v_frozen - p_amount),
    updated_at = NOW()
  WHERE user_id = p_user_id;

  RETURN v_tx_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. VIEW ДЛЯ СТАТИСТИКИ ТРАНЗАКЦИЙ
CREATE OR REPLACE VIEW finance_stats AS
SELECT 
  -- Общая статистика
  COUNT(*) as total_transactions,
  SUM(CASE WHEN type = 'deposit' THEN amount ELSE 0 END) as total_deposits,
  SUM(CASE WHEN type = 'withdrawal' THEN amount ELSE 0 END) as total_withdrawals,
  SUM(CASE WHEN type = 'payout' THEN amount ELSE 0 END) as total_payouts,
  SUM(CASE WHEN type = 'purchase' THEN amount ELSE 0 END) as total_purchases,
  SUM(CASE WHEN type = 'refund' THEN amount ELSE 0 END) as total_refunds,
  
  -- За последние 24 часа
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as transactions_24h,
  SUM(CASE WHEN type = 'deposit' AND created_at > NOW() - INTERVAL '24 hours' THEN amount ELSE 0 END) as deposits_24h,
  SUM(CASE WHEN type = 'withdrawal' AND created_at > NOW() - INTERVAL '24 hours' THEN amount ELSE 0 END) as withdrawals_24h,
  
  -- За последние 7 дней
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as transactions_7d,
  SUM(CASE WHEN type = 'deposit' AND created_at > NOW() - INTERVAL '7 days' THEN amount ELSE 0 END) as deposits_7d,
  SUM(CASE WHEN type = 'withdrawal' AND created_at > NOW() - INTERVAL '7 days' THEN amount ELSE 0 END) as withdrawals_7d,
  
  -- За последние 30 дней
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as transactions_30d,
  SUM(CASE WHEN type = 'deposit' AND created_at > NOW() - INTERVAL '30 days' THEN amount ELSE 0 END) as deposits_30d,
  SUM(CASE WHEN type = 'withdrawal' AND created_at > NOW() - INTERVAL '30 days' THEN amount ELSE 0 END) as withdrawals_30d
FROM transactions
WHERE status = 'completed';

-- 8. VIEW ДЛЯ ТРАНЗАКЦИЙ С ДАННЫМИ ПОЛЬЗОВАТЕЛЯ
CREATE OR REPLACE VIEW transactions_with_user AS
SELECT 
  t.*,
  p.display_name as user_display_name,
  p.nickname as user_nickname,
  p.email as user_email,
  p.avatar as user_avatar,
  p.member_id as user_member_id,
  admin.display_name as admin_display_name,
  admin.email as admin_email
FROM transactions t
LEFT JOIN profiles p ON t.user_id = p.id
LEFT JOIN profiles admin ON t.admin_id = admin.id;

-- 9. ФУНКЦИЯ ДЛЯ ПОЛУЧЕНИЯ СТАТИСТИКИ ПО ПЕРИОДАМ
CREATE OR REPLACE FUNCTION get_finance_stats_by_period(
  p_period TEXT DEFAULT 'month' -- 'day', 'week', 'month', 'year'
) RETURNS TABLE (
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  deposits_count BIGINT,
  deposits_sum DECIMAL,
  withdrawals_count BIGINT,
  withdrawals_sum DECIMAL,
  purchases_count BIGINT,
  purchases_sum DECIMAL,
  payouts_count BIGINT,
  payouts_sum DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    date_trunc(p_period, t.created_at) as period_start,
    date_trunc(p_period, t.created_at) + ('1 ' || p_period)::INTERVAL as period_end,
    COUNT(*) FILTER (WHERE t.type = 'deposit') as deposits_count,
    COALESCE(SUM(t.amount) FILTER (WHERE t.type = 'deposit'), 0) as deposits_sum,
    COUNT(*) FILTER (WHERE t.type = 'withdrawal') as withdrawals_count,
    COALESCE(SUM(t.amount) FILTER (WHERE t.type = 'withdrawal'), 0) as withdrawals_sum,
    COUNT(*) FILTER (WHERE t.type = 'purchase') as purchases_count,
    COALESCE(SUM(t.amount) FILTER (WHERE t.type = 'purchase'), 0) as purchases_sum,
    COUNT(*) FILTER (WHERE t.type = 'payout') as payouts_count,
    COALESCE(SUM(t.amount) FILTER (WHERE t.type = 'payout'), 0) as payouts_sum
  FROM transactions t
  WHERE t.status = 'completed'
  GROUP BY date_trunc(p_period, t.created_at)
  ORDER BY period_start DESC
  LIMIT 12;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. ПОЛИТИКИ RLS ДЛЯ VIEW
DROP POLICY IF EXISTS "Admin view transactions_with_user" ON transactions;
CREATE POLICY "Admin view transactions_with_user" ON transactions
  FOR SELECT
  USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'owner')
    )
  );

SELECT '✅ Финансовая система V2 установлена!' as status;
