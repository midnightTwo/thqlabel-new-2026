import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================
// ПОЛУЧЕНИЕ ЧЕКА ОПЛАТЫ
// ============================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: transactionId } = await params;

    if (!transactionId) {
      return NextResponse.json(
        { error: 'ID транзакции не указан' },
        { status: 400 }
      );
    }

    // Получаем данные транзакции
    const { data: transaction, error: transactionError } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .single();

    if (transactionError || !transaction) {
      return NextResponse.json(
        { error: 'Транзакция не найдена' },
        { status: 404 }
      );
    }

    // Получаем данные пользователя
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('nickname, email')
      .eq('id', transaction.user_id)
      .single();

    // Формируем HTML чека
    const receiptHtml = `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Чек оплаты #${transactionId.slice(0, 8).toUpperCase()}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #1a1a1f 0%, #2d1f4e 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .receipt {
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 24px;
      padding: 32px;
      max-width: 400px;
      width: 100%;
      color: white;
    }
    .logo {
      text-align: center;
      margin-bottom: 24px;
    }
    .logo h1 {
      font-size: 24px;
      font-weight: 900;
      color: white;
    }
    .logo span {
      display: block;
      font-size: 12px;
      color: #71717a;
      margin-top: 4px;
    }
    .divider {
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
      margin: 20px 0;
    }
    .status {
      text-align: center;
      margin-bottom: 24px;
    }
    .status-icon {
      width: 64px;
      height: 64px;
      background: rgba(16, 185, 129, 0.2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 12px;
    }
    .status-icon svg {
      width: 32px;
      height: 32px;
      color: #10b981;
    }
    .status-text {
      font-size: 18px;
      font-weight: 700;
      color: #10b981;
    }
    .amount {
      text-align: center;
      font-size: 36px;
      font-weight: 900;
      color: white;
      margin-bottom: 24px;
    }
    .amount span {
      font-size: 20px;
      color: #a1a1aa;
    }
    .details {
      background: rgba(0, 0, 0, 0.2);
      border-radius: 16px;
      padding: 16px;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }
    .detail-row:last-child {
      border-bottom: none;
    }
    .detail-label {
      color: #71717a;
      font-size: 13px;
    }
    .detail-value {
      color: white;
      font-size: 13px;
      font-weight: 500;
      text-align: right;
      max-width: 200px;
      word-break: break-word;
    }
    .footer {
      text-align: center;
      margin-top: 24px;
      color: #52525b;
      font-size: 11px;
    }
    .print-btn {
      display: block;
      width: 100%;
      margin-top: 20px;
      padding: 12px;
      background: linear-gradient(135deg, #a855f7, #6050ba);
      border: none;
      border-radius: 12px;
      color: white;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.2s;
    }
    .print-btn:hover {
      opacity: 0.9;
    }
    @media print {
      body { background: white; }
      .receipt { 
        background: white; 
        border: 1px solid #e5e5e5;
        color: black;
      }
      .logo h1 { -webkit-text-fill-color: #6050ba; }
      .status-text { color: #10b981; }
      .amount { color: black; }
      .detail-value { color: black; }
      .print-btn { display: none; }
    }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="logo">
      <h1>THQ Label</h1>
      <span>Чек об оплате</span>
    </div>
    
    <div class="divider"></div>
    
    <div class="status">
      <div class="status-icon">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
        </svg>
      </div>
      <div class="status-text">Оплачено</div>
    </div>
    
    <div class="amount">
      ${transaction.amount} <span>₽</span>
    </div>
    
    <div class="details">
      <div class="detail-row">
        <span class="detail-label">Номер чека</span>
        <span class="detail-value">#${transactionId.slice(0, 8).toUpperCase()}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Дата и время</span>
        <span class="detail-value">${new Date(transaction.created_at).toLocaleString('ru-RU', { 
          day: '2-digit',
          month: '2-digit', 
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Плательщик</span>
        <span class="detail-value">${profile?.nickname || profile?.email || 'Пользователь'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Назначение</span>
        <span class="detail-value">${transaction.description || 'Оплата релиза'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Способ оплаты</span>
        <span class="detail-value">Баланс THQ Label</span>
      </div>
      ${transaction.metadata?.release_title ? `
      <div class="detail-row">
        <span class="detail-label">Релиз</span>
        <span class="detail-value">${transaction.metadata.release_title}</span>
      </div>
      ` : ''}
      ${transaction.metadata?.tracks_count ? `
      <div class="detail-row">
        <span class="detail-label">Треков</span>
        <span class="detail-value">${transaction.metadata.tracks_count}</span>
      </div>
      ` : ''}
    </div>
    
    <button class="print-btn" onclick="window.print()">
      <svg style="display:inline-block;vertical-align:middle;margin-right:8px;width:18px;height:18px" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
      </svg>
      Распечатать чек
    </button>
    
    <div class="footer">
      THQ Label • ${new Date().getFullYear()}<br>
      Электронный чек сформирован автоматически
    </div>
  </div>
</body>
</html>
    `;

    return new NextResponse(receiptHtml, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });

  } catch (error) {
    console.error('Receipt API error:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении чека' },
      { status: 500 }
    );
  }
}
