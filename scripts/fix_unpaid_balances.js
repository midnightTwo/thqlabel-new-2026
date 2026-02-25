/**
 * Скрипт поиска и исправления несписанных оплат за Basic-релизы.
 *
 * Логика:
 * 1. Берём все releases_basic где is_paid = true
 * 2. Для каждого проверяем, есть ли соответствующая транзакция типа 'purchase' в transactions
 * 3. Если транзакция есть — проверяем что баланс реально уменьшился (balance_after < balance_before)
 * 4. Если транзакции нет — значит деньги не списались → исправляем
 *
 * Запуск: node scripts/fix_unpaid_balances.js
 * Тестовый режим (без изменений): node scripts/fix_unpaid_balances.js --dry-run
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const DRY_RUN = process.argv.includes('--dry-run');

async function main() {
  console.log('='.repeat(60));
  console.log(DRY_RUN ? '🔍 ТЕСТОВЫЙ РЕЖИМ (без изменений)' : '⚡ БОЕВОЙ РЕЖИМ (будут применены исправления)');
  console.log('='.repeat(60));

  // 1. Получаем все оплаченные basic-релизы
  const { data: paidReleases, error: relErr } = await supabase
    .from('releases_basic')
    .select('id, user_id, title, is_paid, payment_amount, payment_transaction_id, paid_at, created_at, release_type')
    .eq('is_paid', true);

  if (relErr) {
    console.error('❌ Ошибка загрузки релизов:', relErr.message);
    return;
  }

  console.log(`\n📦 Найдено оплаченных Basic-релизов: ${paidReleases?.length || 0}\n`);

  if (!paidReleases || paidReleases.length === 0) {
    console.log('✅ Нет оплаченных релизов — нечего проверять.');
    return;
  }

  // 2. Получаем все purchase-транзакции
  const { data: allPurchases, error: txErr } = await supabase
    .from('transactions')
    .select('id, user_id, amount, balance_before, balance_after, status, metadata, created_at, description')
    .eq('type', 'purchase')
    .eq('status', 'completed');

  if (txErr) {
    console.error('❌ Ошибка загрузки транзакций:', txErr.message);
    return;
  }

  console.log(`💳 Найдено purchase-транзакций: ${allPurchases?.length || 0}\n`);

  // 3. Получаем все балансы пользователей
  const { data: allBalances, error: balErr } = await supabase
    .from('user_balances')
    .select('user_id, balance, total_spent, total_deposited');

  if (balErr) {
    console.error('❌ Ошибка загрузки балансов:', balErr.message);
    return;
  }

  const balanceMap = {};
  for (const b of (allBalances || [])) {
    balanceMap[b.user_id] = b;
  }

  // 4. Получаем release_payments записи
  const { data: releasePayments, error: rpErr } = await supabase
    .from('release_payments')
    .select('id, user_id, release_id, transaction_id, amount, status');

  const releasePaymentMap = {};
  for (const rp of (releasePayments || [])) {
    releasePaymentMap[rp.release_id] = rp;
  }

  // 5. Анализируем каждый оплаченный релиз
  const problems = [];

  for (const release of paidReleases) {
    // Ищем транзакцию, привязанную к этому релизу
    let matchingTx = null;

    // Сначала ищем по payment_transaction_id
    if (release.payment_transaction_id) {
      matchingTx = (allPurchases || []).find(tx => tx.id === release.payment_transaction_id);
    }

    // Если не нашли — ищем по metadata.release_id
    if (!matchingTx) {
      matchingTx = (allPurchases || []).find(tx => 
        tx.metadata && tx.metadata.release_id === release.id
      );
    }

    // Если не нашли — ищем по user_id + сумме + времени ±5 минут
    if (!matchingTx && release.paid_at) {
      const paidTime = new Date(release.paid_at).getTime();
      matchingTx = (allPurchases || []).find(tx => {
        if (tx.user_id !== release.user_id) return false;
        const txTime = new Date(tx.created_at).getTime();
        const timeDiff = Math.abs(paidTime - txTime);
        return timeDiff < 5 * 60 * 1000; // 5 минут
      });
    }

    const balance = balanceMap[release.user_id];
    const releasePayment = releasePaymentMap[release.id];

    if (!matchingTx) {
      // Нет транзакции списания — явная проблема
      problems.push({
        type: 'NO_TRANSACTION',
        release,
        balance,
        releasePayment,
        matchingTx: null,
      });
    } else {
      // Транзакция есть — проверяем что баланс реально уменьшился
      const balanceBefore = parseFloat(matchingTx.balance_before);
      const balanceAfter = parseFloat(matchingTx.balance_after);
      const amount = parseFloat(matchingTx.amount);

      if (balanceAfter >= balanceBefore) {
        problems.push({
          type: 'BALANCE_NOT_DECREASED',
          release,
          balance,
          releasePayment,
          matchingTx,
        });
      }
    }
  }

  // 6. Выводим результаты
  console.log('='.repeat(60));
  if (problems.length === 0) {
    console.log('✅ Все оплаченные релизы имеют корректные транзакции списания!');
    console.log('   Баланс был списан правильно для всех покупок.');
  } else {
    console.log(`⚠️  Найдено проблем: ${problems.length}`);
    console.log('');

    for (const prob of problems) {
      const r = prob.release;
      const amount = parseFloat(r.payment_amount) || 500;
      console.log(`─── Проблема: ${prob.type} ───`);
      console.log(`   Релиз: "${r.title}" (${r.id})`);
      console.log(`   Пользователь: ${r.user_id}`);
      console.log(`   Сумма: ${amount} ₽`);
      console.log(`   Оплата: ${r.paid_at || 'дата неизвестна'}`);
      console.log(`   Текущий баланс: ${prob.balance ? prob.balance.balance : 'не найден'} ₽`);
      console.log(`   transaction_id: ${r.payment_transaction_id || 'нет'}`);
      console.log(`   release_payment: ${prob.releasePayment ? 'есть' : 'нет'}`);
      if (prob.matchingTx) {
        console.log(`   Транзакция: ${prob.matchingTx.id}`);
        console.log(`     before: ${prob.matchingTx.balance_before} / after: ${prob.matchingTx.balance_after}`);
      }
      console.log('');
    }

    // 7. Исправляем
    if (!DRY_RUN) {
      console.log('='.repeat(60));
      console.log('🔧 Исправляем...\n');

      for (const prob of problems) {
        const r = prob.release;
        const amount = parseFloat(r.payment_amount) || 500;

        if (prob.type === 'NO_TRANSACTION') {
          // Нужно списать с баланса и создать транзакцию
          const currentBalance = prob.balance ? parseFloat(prob.balance.balance) : 0;
          const currentSpent = prob.balance ? parseFloat(prob.balance.total_spent || '0') : 0;
          const newBalance = currentBalance - amount;
          const newSpent = currentSpent + amount;

          console.log(`📝 Списание ${amount}₽ за "${r.title}" у ${r.user_id}`);
          console.log(`   Баланс: ${currentBalance} → ${newBalance}`);

          if (newBalance < 0) {
            console.log(`   ⚠️  Баланс уйдёт в минус (${newBalance})! Списываем, т.к. релиз уже получен.`);
          }

          // Создаём транзакцию
          const { data: newTx, error: txInsertErr } = await supabase
            .from('transactions')
            .insert({
              user_id: r.user_id,
              type: 'purchase',
              amount: amount,
              balance_before: currentBalance,
              balance_after: newBalance,
              currency: 'RUB',
              status: 'completed',
              description: `Оплата релиза: ${r.title} (исправление)`,
              metadata: {
                release_id: r.id,
                release_type: r.release_type || 'basic',
                release_title: r.title,
                fix: 'balance_not_deducted',
                fixed_at: new Date().toISOString()
              }
            })
            .select()
            .single();

          if (txInsertErr) {
            console.log(`   ❌ Ошибка создания транзакции: ${txInsertErr.message}`);
            continue;
          }

          // Обновляем баланс
          const { error: balUpdateErr } = await supabase
            .from('user_balances')
            .update({
              balance: newBalance,
              total_spent: newSpent,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', r.user_id);

          if (balUpdateErr) {
            console.log(`   ❌ Ошибка обновления баланса: ${balUpdateErr.message}`);
            continue;
          }

          // Обновляем релиз с transaction_id
          if (newTx?.id) {
            await supabase
              .from('releases_basic')
              .update({ payment_transaction_id: newTx.id })
              .eq('id', r.id);
          }

          console.log(`   ✅ Исправлено! Транзакция: ${newTx?.id}`);
        } else if (prob.type === 'BALANCE_NOT_DECREASED') {
          console.log(`📝 Баланс не уменьшился для "${r.title}" — транзакция ${prob.matchingTx.id}`);
          
          // Пересчитываем баланс
          const currentBalance = prob.balance ? parseFloat(prob.balance.balance) : 0;
          const currentSpent = prob.balance ? parseFloat(prob.balance.total_spent || '0') : 0;
          const newBalance = currentBalance - amount;
          const newSpent = currentSpent + amount;

          console.log(`   Баланс: ${currentBalance} → ${newBalance}`);

          const { error: balFixErr } = await supabase
            .from('user_balances')
            .update({
              balance: newBalance,
              total_spent: newSpent,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', r.user_id);

          if (balFixErr) {
            console.log(`   ❌ Ошибка: ${balFixErr.message}`);
          } else {
            console.log(`   ✅ Баланс исправлен!`);
          }
        }

        console.log('');
      }
    }
  }

  // 8. Итоговая проверка: сверяем балансы с суммой транзакций
  console.log('\n' + '='.repeat(60));
  console.log('📊 ИТОГОВАЯ СВЕРКА БАЛАНСОВ\n');

  const { data: allUsers } = await supabase
    .from('user_balances')
    .select('user_id, balance, total_spent, total_deposited');

  let discrepancies = 0;

  for (const user of (allUsers || [])) {
    // Суммируем все транзакции пользователя
    const { data: userTxs } = await supabase
      .from('transactions')
      .select('type, amount, status')
      .eq('user_id', user.user_id)
      .eq('status', 'completed');

    if (!userTxs || userTxs.length === 0) continue;

    let calculatedBalance = 0;
    for (const tx of userTxs) {
      const amt = parseFloat(tx.amount);
      if (tx.type === 'deposit') {
        calculatedBalance += amt;
      } else if (tx.type === 'purchase') {
        calculatedBalance -= amt;
      } else if (tx.type === 'withdrawal') {
        calculatedBalance -= Math.abs(amt);
      } else if (tx.type === 'refund') {
        calculatedBalance += amt; // refund amount может быть отрицательным
      }
    }

    const actualBalance = parseFloat(user.balance);
    const diff = Math.abs(actualBalance - calculatedBalance);

    if (diff > 0.01) {
      discrepancies++;
      console.log(`⚠️  User ${user.user_id}:`);
      console.log(`   Баланс в БД:      ${actualBalance} ₽`);
      console.log(`   По транзакциям:    ${calculatedBalance.toFixed(2)} ₽`);
      console.log(`   Расхождение:       ${(actualBalance - calculatedBalance).toFixed(2)} ₽`);
      console.log('');
    }
  }

  if (discrepancies === 0) {
    console.log('✅ Все балансы совпадают с суммой транзакций!');
  } else {
    console.log(`⚠️  Найдено расхождений: ${discrepancies}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('Готово!');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
