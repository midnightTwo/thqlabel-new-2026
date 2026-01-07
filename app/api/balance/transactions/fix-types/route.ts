import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Исправляет constraint для типов транзакций
 * POST /api/balance/transactions/fix-types
 */
export async function POST(request: NextRequest) {
  try {
    // Выполняем SQL для исправления constraint
    const { data, error } = await supabaseAdmin.rpc('exec_sql', {
      sql_query: `
        -- Удаляем старый constraint
        ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_type_check;
        
        -- Добавляем новый с полным списком типов
        ALTER TABLE transactions 
        ADD CONSTRAINT transactions_type_check 
        CHECK (type IN ('deposit', 'withdrawal', 'purchase', 'payout', 'refund', 'adjustment', 'bonus', 'fee'));
        
        -- Убираем NOT NULL с description
        ALTER TABLE transactions ALTER COLUMN description DROP NOT NULL;
      `
    });

    if (error) {
      // Если RPC не существует, пробуем напрямую через schema
      console.log('RPC not available, trying direct approach...');
      
      // Пробуем создать тестовую транзакцию чтобы проверить constraint
      const testResult = await supabaseAdmin
        .from('transactions')
        .insert({
          user_id: '00000000-0000-0000-0000-000000000000', // фейковый UUID
          type: 'deposit',
          amount: 0,
          currency: 'RUB',
          balance_before: 0,
          balance_after: 0,
          status: 'test',
          description: 'constraint test',
        })
        .select();

      return NextResponse.json({
        success: false,
        message: 'Cannot execute SQL directly. Please run the fix manually in Supabase SQL Editor.',
        sqlToRun: `
-- Выполните этот SQL в Supabase SQL Editor:

ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_type_check;

ALTER TABLE transactions 
ADD CONSTRAINT transactions_type_check 
CHECK (type IN ('deposit', 'withdrawal', 'purchase', 'payout', 'refund', 'adjustment', 'bonus', 'fee'));

ALTER TABLE transactions ALTER COLUMN description DROP NOT NULL;

-- Добавляем недостающие колонки
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'completed';
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'RUB';
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);
        `,
        testError: testResult.error?.message,
        constraintIssue: testResult.error?.message?.includes('check constraint'),
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Constraint fixed successfully!',
      data,
    });

  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'POST to this endpoint to fix transaction types constraint',
    sqlFile: 'sql/FIX_TRANSACTIONS_TYPES.sql',
  });
}
