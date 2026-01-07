-- ============================================
-- ЕДИНАЯ СИСТЕМА ВЫВОДОВ THQ LABEL
-- Интеграция с новой системой баланса
-- ============================================

-- 1. Обновляем структуру withdrawal_requests для полной интеграции
ALTER TABLE withdrawal_requests 
ADD COLUMN IF NOT EXISTS transaction_id UUID REFERENCES transactions(id),
ADD COLUMN IF NOT EXISTS freeze_transaction_id UUID REFERENCES transactions(id),
ADD COLUMN IF NOT EXISTS unfreeze_transaction_id UUID REFERENCES transactions(id),
ADD COLUMN IF NOT EXISTS withdrawal_transaction_id UUID REFERENCES transactions(id),
ADD COLUMN IF NOT EXISTS method VARCHAR(50) DEFAULT 'card', -- 'card', 'sbp', 'crypto'
ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'RUB',
ADD COLUMN IF NOT EXISTS fee DECIMAL(12, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS net_amount DECIMAL(12, 2), -- сумма к выплате (amount - fee)
ADD COLUMN IF NOT EXISTS expected_payout_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS actual_payout_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS payment_details JSONB DEFAULT '{}';

-- Обновляем net_amount для существующих записей
UPDATE withdrawal_requests 
SET net_amount = amount - COALESCE(fee, 0)
WHERE net_amount IS NULL;

-- 2. Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status ON withdrawal_requests(status);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_user_id ON withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_created_at ON withdrawal_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_transaction_id ON withdrawal_requests(transaction_id);

-- 3. Функция создания заявки на вывод с автоматической заморозкой
CREATE OR REPLACE FUNCTION create_withdrawal_request(
  p_user_id UUID,
  p_amount DECIMAL(12, 2),
  p_bank_name VARCHAR(100),
  p_card_number VARCHAR(50),
  p_recipient_name VARCHAR(200),
  p_method VARCHAR(50) DEFAULT 'card',
  p_additional_info TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_balance DECIMAL(12, 2);
  v_frozen DECIMAL(12, 2);
  v_available DECIMAL(12, 2);
  v_fee DECIMAL(12, 2);
  v_net_amount DECIMAL(12, 2);
  v_withdrawal_id UUID;
  v_freeze_tx_id UUID;
  v_new_balance DECIMAL(12, 2);
  v_new_frozen DECIMAL(12, 2);
BEGIN
  -- Минимальная сумма вывода
  IF p_amount < 1000 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Минимальная сумма вывода: 1000 ₽'
    );
  END IF;

  -- Получаем баланс с блокировкой
  SELECT balance, frozen_balance 
  INTO v_balance, v_frozen
  FROM user_balances
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- Если записи нет - создаём
  IF v_balance IS NULL THEN
    INSERT INTO user_balances (user_id, balance, frozen_balance)
    VALUES (p_user_id, 0, 0)
    RETURNING balance, frozen_balance INTO v_balance, v_frozen;
  END IF;

  v_available := v_balance - v_frozen;

  -- Проверяем достаточность средств
  IF p_amount > v_available THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', format('Недостаточно средств. Доступно: %s ₽', v_available::TEXT),
      'available', v_available,
      'requested', p_amount
    );
  END IF;

  -- Рассчитываем комиссию (можно настроить)
  v_fee := 0; -- Пока без комиссии
  v_net_amount := p_amount - v_fee;

  -- Новые значения балансов
  v_new_balance := v_balance - p_amount;
  v_new_frozen := v_frozen + p_amount;

  -- Создаём заявку на вывод
  INSERT INTO withdrawal_requests (
    user_id, amount, fee, net_amount, method, currency,
    bank_name, card_number, recipient_name, additional_info, status,
    payment_details
  ) VALUES (
    p_user_id, p_amount, v_fee, v_net_amount, p_method, 'RUB',
    p_bank_name, p_card_number, p_recipient_name, p_additional_info, 'pending',
    jsonb_build_object(
      'bank_name', p_bank_name,
      'card_masked', '****' || RIGHT(p_card_number, 4),
      'recipient', p_recipient_name
    )
  )
  RETURNING id INTO v_withdrawal_id;

  -- Обновляем баланс (списываем и замораживаем)
  UPDATE user_balances
  SET 
    balance = v_new_balance,
    frozen_balance = v_new_frozen,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Синхронизируем profiles
  UPDATE profiles
  SET balance = v_new_balance
  WHERE id = p_user_id;

  -- Создаём транзакцию заморозки
  INSERT INTO transactions (
    user_id, type, amount, currency, balance_before, balance_after,
    status, description, reference_id, metadata
  ) VALUES (
    p_user_id, 'freeze', p_amount, 'RUB', v_balance, v_new_balance,
    'completed', 
    format('Заморозка средств для вывода #%s', v_withdrawal_id),
    v_withdrawal_id::TEXT,
    jsonb_build_object(
      'withdrawal_id', v_withdrawal_id,
      'bank_name', p_bank_name,
      'card_masked', '****' || RIGHT(p_card_number, 4)
    )
  )
  RETURNING id INTO v_freeze_tx_id;

  -- Связываем транзакцию с заявкой
  UPDATE withdrawal_requests
  SET freeze_transaction_id = v_freeze_tx_id
  WHERE id = v_withdrawal_id;

  RETURN jsonb_build_object(
    'success', true,
    'withdrawal_id', v_withdrawal_id,
    'transaction_id', v_freeze_tx_id,
    'amount', p_amount,
    'fee', v_fee,
    'net_amount', v_net_amount,
    'balance_before', v_balance,
    'balance_after', v_new_balance,
    'frozen_balance', v_new_frozen
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Функция одобрения заявки (админ)
CREATE OR REPLACE FUNCTION approve_withdrawal(
  p_withdrawal_id UUID,
  p_admin_id UUID,
  p_comment TEXT DEFAULT NULL,
  p_expected_payout_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_withdrawal RECORD;
BEGIN
  -- Получаем заявку с блокировкой
  SELECT * INTO v_withdrawal
  FROM withdrawal_requests
  WHERE id = p_withdrawal_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Заявка не найдена');
  END IF;

  IF v_withdrawal.status != 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Заявка уже обработана');
  END IF;

  -- Обновляем статус
  UPDATE withdrawal_requests
  SET 
    status = 'approved',
    admin_comment = p_comment,
    expected_payout_date = COALESCE(p_expected_payout_date, NOW() + INTERVAL '3 days'),
    processed_at = NOW()
  WHERE id = p_withdrawal_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Заявка одобрена',
    'withdrawal_id', p_withdrawal_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Функция отклонения заявки с возвратом средств
CREATE OR REPLACE FUNCTION reject_withdrawal(
  p_withdrawal_id UUID,
  p_admin_id UUID,
  p_comment TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_withdrawal RECORD;
  v_balance DECIMAL(12, 2);
  v_frozen DECIMAL(12, 2);
  v_new_balance DECIMAL(12, 2);
  v_new_frozen DECIMAL(12, 2);
  v_unfreeze_tx_id UUID;
BEGIN
  -- Получаем заявку с блокировкой
  SELECT * INTO v_withdrawal
  FROM withdrawal_requests
  WHERE id = p_withdrawal_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Заявка не найдена');
  END IF;

  IF v_withdrawal.status NOT IN ('pending', 'approved') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Заявка уже обработана');
  END IF;

  -- Получаем баланс пользователя
  SELECT balance, frozen_balance 
  INTO v_balance, v_frozen
  FROM user_balances
  WHERE user_id = v_withdrawal.user_id
  FOR UPDATE;

  -- Возвращаем средства
  v_new_balance := v_balance + v_withdrawal.amount;
  v_new_frozen := GREATEST(0, v_frozen - v_withdrawal.amount);

  -- Обновляем баланс
  UPDATE user_balances
  SET 
    balance = v_new_balance,
    frozen_balance = v_new_frozen,
    updated_at = NOW()
  WHERE user_id = v_withdrawal.user_id;

  -- Синхронизируем profiles
  UPDATE profiles
  SET balance = v_new_balance
  WHERE id = v_withdrawal.user_id;

  -- Создаём транзакцию разморозки
  INSERT INTO transactions (
    user_id, type, amount, currency, balance_before, balance_after,
    status, description, reference_id, metadata
  ) VALUES (
    v_withdrawal.user_id, 'unfreeze', v_withdrawal.amount, 'RUB', 
    v_balance, v_new_balance, 'completed',
    format('Возврат средств - заявка #%s отклонена%s', 
           p_withdrawal_id, 
           CASE WHEN p_comment IS NOT NULL THEN ': ' || p_comment ELSE '' END),
    p_withdrawal_id::TEXT,
    jsonb_build_object(
      'withdrawal_id', p_withdrawal_id,
      'reason', COALESCE(p_comment, 'Не указана')
    )
  )
  RETURNING id INTO v_unfreeze_tx_id;

  -- Обновляем заявку
  UPDATE withdrawal_requests
  SET 
    status = 'rejected',
    admin_comment = p_comment,
    unfreeze_transaction_id = v_unfreeze_tx_id,
    processed_at = NOW()
  WHERE id = p_withdrawal_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Заявка отклонена, средства возвращены',
    'withdrawal_id', p_withdrawal_id,
    'transaction_id', v_unfreeze_tx_id,
    'refunded_amount', v_withdrawal.amount,
    'new_balance', v_new_balance
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Функция завершения выплаты
CREATE OR REPLACE FUNCTION complete_withdrawal(
  p_withdrawal_id UUID,
  p_admin_id UUID,
  p_comment TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_withdrawal RECORD;
  v_frozen DECIMAL(12, 2);
  v_new_frozen DECIMAL(12, 2);
  v_total_withdrawn DECIMAL(12, 2);
  v_withdrawal_tx_id UUID;
BEGIN
  -- Получаем заявку с блокировкой
  SELECT * INTO v_withdrawal
  FROM withdrawal_requests
  WHERE id = p_withdrawal_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Заявка не найдена');
  END IF;

  IF v_withdrawal.status = 'completed' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Заявка уже выполнена');
  END IF;

  IF v_withdrawal.status = 'rejected' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Нельзя выполнить отклонённую заявку');
  END IF;

  -- Получаем баланс пользователя
  SELECT frozen_balance, total_withdrawn 
  INTO v_frozen, v_total_withdrawn
  FROM user_balances
  WHERE user_id = v_withdrawal.user_id
  FOR UPDATE;

  -- Снимаем заморозку
  v_new_frozen := GREATEST(0, v_frozen - v_withdrawal.amount);

  -- Обновляем баланс (добавляем к выведенным)
  UPDATE user_balances
  SET 
    frozen_balance = v_new_frozen,
    total_withdrawn = total_withdrawn + v_withdrawal.amount,
    updated_at = NOW()
  WHERE user_id = v_withdrawal.user_id;

  -- Создаём транзакцию вывода
  INSERT INTO transactions (
    user_id, type, amount, currency, balance_before, balance_after,
    status, description, reference_id, payment_method, metadata
  ) VALUES (
    v_withdrawal.user_id, 'withdrawal', v_withdrawal.amount, 'RUB',
    v_frozen, v_new_frozen, 'completed',
    format('Вывод средств #%s выполнен', p_withdrawal_id),
    p_withdrawal_id::TEXT,
    v_withdrawal.method,
    jsonb_build_object(
      'withdrawal_id', p_withdrawal_id,
      'bank_name', v_withdrawal.bank_name,
      'card_masked', '****' || RIGHT(v_withdrawal.card_number, 4),
      'net_amount', v_withdrawal.net_amount
    )
  )
  RETURNING id INTO v_withdrawal_tx_id;

  -- Обновляем заявку
  UPDATE withdrawal_requests
  SET 
    status = 'completed',
    admin_comment = COALESCE(p_comment, admin_comment),
    withdrawal_transaction_id = v_withdrawal_tx_id,
    actual_payout_date = NOW(),
    processed_at = NOW()
  WHERE id = p_withdrawal_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Выплата выполнена',
    'withdrawal_id', p_withdrawal_id,
    'transaction_id', v_withdrawal_tx_id,
    'amount', v_withdrawal.amount,
    'net_amount', v_withdrawal.net_amount
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Функция получения доступного для вывода баланса
CREATE OR REPLACE FUNCTION get_available_balance(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_balance DECIMAL(12, 2);
  v_frozen DECIMAL(12, 2);
  v_available DECIMAL(12, 2);
  v_total_deposited DECIMAL(12, 2);
  v_total_withdrawn DECIMAL(12, 2);
  v_total_spent DECIMAL(12, 2);
BEGIN
  SELECT 
    COALESCE(balance, 0),
    COALESCE(frozen_balance, 0),
    COALESCE(total_deposited, 0),
    COALESCE(total_withdrawn, 0),
    COALESCE(total_spent, 0)
  INTO v_balance, v_frozen, v_total_deposited, v_total_withdrawn, v_total_spent
  FROM user_balances
  WHERE user_id = p_user_id;

  v_available := COALESCE(v_balance, 0) - COALESCE(v_frozen, 0);

  RETURN jsonb_build_object(
    'balance', COALESCE(v_balance, 0),
    'frozen_balance', COALESCE(v_frozen, 0),
    'available_balance', v_available,
    'total_deposited', COALESCE(v_total_deposited, 0),
    'total_withdrawn', COALESCE(v_total_withdrawn, 0),
    'total_spent', COALESCE(v_total_spent, 0),
    'min_withdrawal', 1000
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Представление для админ-панели
CREATE OR REPLACE VIEW withdrawal_requests_admin AS
SELECT 
  wr.*,
  p.nickname as user_nickname,
  p.email as user_email,
  p.avatar as user_avatar,
  p.member_id as user_member_id,
  p.role as user_role,
  ub.balance as user_balance,
  ub.frozen_balance as user_frozen_balance,
  ub.total_withdrawn as user_total_withdrawn
FROM withdrawal_requests wr
LEFT JOIN profiles p ON wr.user_id = p.id
LEFT JOIN user_balances ub ON wr.user_id = ub.user_id
ORDER BY wr.created_at DESC;

-- 9. Статистика выводов для админ-дашборда
CREATE OR REPLACE FUNCTION get_withdrawal_stats()
RETURNS JSONB AS $$
DECLARE
  v_total_pending DECIMAL(12, 2);
  v_count_pending INT;
  v_total_approved DECIMAL(12, 2);
  v_count_approved INT;
  v_total_completed DECIMAL(12, 2);
  v_count_completed INT;
  v_total_rejected DECIMAL(12, 2);
  v_count_rejected INT;
  v_today_completed DECIMAL(12, 2);
  v_week_completed DECIMAL(12, 2);
  v_month_completed DECIMAL(12, 2);
BEGIN
  -- По статусам
  SELECT COALESCE(SUM(amount), 0), COUNT(*) INTO v_total_pending, v_count_pending
  FROM withdrawal_requests WHERE status = 'pending';

  SELECT COALESCE(SUM(amount), 0), COUNT(*) INTO v_total_approved, v_count_approved
  FROM withdrawal_requests WHERE status = 'approved';

  SELECT COALESCE(SUM(amount), 0), COUNT(*) INTO v_total_completed, v_count_completed
  FROM withdrawal_requests WHERE status = 'completed';

  SELECT COALESCE(SUM(amount), 0), COUNT(*) INTO v_total_rejected, v_count_rejected
  FROM withdrawal_requests WHERE status = 'rejected';

  -- За периоды
  SELECT COALESCE(SUM(amount), 0) INTO v_today_completed
  FROM withdrawal_requests 
  WHERE status = 'completed' AND actual_payout_date >= CURRENT_DATE;

  SELECT COALESCE(SUM(amount), 0) INTO v_week_completed
  FROM withdrawal_requests 
  WHERE status = 'completed' AND actual_payout_date >= CURRENT_DATE - INTERVAL '7 days';

  SELECT COALESCE(SUM(amount), 0) INTO v_month_completed
  FROM withdrawal_requests 
  WHERE status = 'completed' AND actual_payout_date >= CURRENT_DATE - INTERVAL '30 days';

  RETURN jsonb_build_object(
    'pending', jsonb_build_object('total', v_total_pending, 'count', v_count_pending),
    'approved', jsonb_build_object('total', v_total_approved, 'count', v_count_approved),
    'completed', jsonb_build_object('total', v_total_completed, 'count', v_count_completed),
    'rejected', jsonb_build_object('total', v_total_rejected, 'count', v_count_rejected),
    'periods', jsonb_build_object(
      'today', v_today_completed,
      'week', v_week_completed,
      'month', v_month_completed
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Готово!
SELECT '✅ Единая система выводов настроена!' as status;
