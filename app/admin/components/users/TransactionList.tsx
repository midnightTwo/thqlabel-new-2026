'use client';

import { Transaction } from './types';

interface TransactionListProps {
  transactions: Transaction[];
}

// Иконки для типов транзакций
const TransactionIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'deposit':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      );
    case 'withdrawal':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
      );
    case 'payout':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" />
        </svg>
      );
    case 'purchase':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      );
    case 'bonus':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
        </svg>
      );
    case 'refund':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
        </svg>
      );
    case 'freeze':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      );
    case 'unfreeze':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      );
    case 'adjustment':
    case 'correction':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
      );
    default:
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
  }
};

export function TransactionList({ transactions }: TransactionListProps) {
  const typeConfig: Record<string, { bg: string; text: string; label: string }> = {
    deposit: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Пополнение' },
    withdrawal: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Вывод' },
    payout: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'Роялти' },
    purchase: { bg: 'bg-violet-500/20', text: 'text-violet-400', label: 'Покупка' },
    bonus: { bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'Бонус' },
    refund: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', label: 'Возврат' },
    freeze: { bg: 'bg-blue-900/30', text: 'text-blue-300', label: 'Заморозка' },
    unfreeze: { bg: 'bg-orange-500/20', text: 'text-orange-400', label: 'Разморозка' },
    adjustment: { bg: 'bg-purple-500/20', text: 'text-purple-400', label: 'Корректировка' },
    correction: { bg: 'bg-purple-500/20', text: 'text-purple-400', label: 'Корректировка' },
  };

  const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
    pending: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', label: 'В обработке' },
    approved: { bg: 'bg-blue-500/10', text: 'text-blue-400', label: 'Одобрено' },
    rejected: { bg: 'bg-red-500/10', text: 'text-red-400', label: 'Отклонено' },
    completed: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', label: 'Завершена' },
    cancelled: { bg: 'bg-red-500/10', text: 'text-red-400', label: 'Отменена' },
    failed: { bg: 'bg-orange-500/10', text: 'text-orange-400', label: 'Ошибка' },
  };

  // Определяем, является ли сумма положительной
  const isPositiveAmount = (tx: any) => {
    const positiveTypes = ['deposit', 'payout', 'bonus', 'refund', 'unfreeze'];
    return positiveTypes.includes(tx.type);
  };

  return (
    <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
      <h3 className="font-bold mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
        Все транзакции ({transactions.length})
      </h3>
      {transactions.length === 0 ? (
        <p className="text-zinc-500 text-sm text-center py-8">Нет транзакций</p>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
          {transactions.map((tx: any) => {
            const isWithdrawalRequest = tx.source === 'withdrawal_request';
            const type = typeConfig[tx.type] || { bg: 'bg-zinc-500/20', text: 'text-zinc-400', label: tx.type };
            const displayLabel = isWithdrawalRequest && tx.type === 'withdrawal' ? 'Заявка на вывод' : type.label;
            const status = statusConfig[tx.status] || statusConfig.pending;
            const isPositive = isPositiveAmount(tx);
            
            return (
              <div key={`${tx.source}-${tx.id}`} className="p-3 bg-black/30 rounded-lg border border-white/5 hover:border-white/10 transition">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {/* Иконка типа */}
                    <span className={`flex items-center justify-center w-8 h-8 rounded-lg ${type.bg} ${type.text}`}>
                      <TransactionIcon type={tx.type} />
                    </span>
                    <div>
                      <span className={`text-sm font-bold ${type.text}`}>
                        {displayLabel}
                      </span>
                      <span className={`ml-2 text-[10px] px-2 py-0.5 rounded-full ${status.bg} ${status.text}`}>
                        {status.label}
                      </span>
                    </div>
                  </div>
                  <div className={`font-bold text-sm ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                    {isPositive ? '+' : '−'}{Number(tx.amount).toLocaleString('ru-RU')} ₽
                  </div>
                </div>
                <div className="space-y-1 pl-10">
                  {isWithdrawalRequest ? (
                    <>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-red-400 font-mono font-bold">№:</span>
                        <span className="text-red-300 font-mono text-[10px]">{tx.id?.slice(0, 8)}</span>
                      </div>
                      {tx.bank_name && (
                        <div className="text-xs text-zinc-500">
                          <span className="text-zinc-600">Банк:</span> {tx.bank_name} | <span className="text-zinc-600">Карта:</span> ****{tx.card_number?.slice(-4)}
                        </div>
                      )}
                      {tx.admin_comment && (
                        <div className="text-xs text-blue-400 italic">💬 {tx.admin_comment}</div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-purple-400 font-mono font-bold">TX:</span>
                        <span className="text-purple-300 font-mono text-[10px]">{tx.id?.slice(0, 8)}</span>
                      </div>
                      {tx.reference_id && (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-blue-400 font-mono font-bold">REF:</span>
                          <span className="text-blue-300 font-mono text-[10px]">{tx.reference_id?.slice(0, 8)}</span>
                        </div>
                      )}
                      {tx.description && (
                        <div className="text-xs text-zinc-400">{tx.description}</div>
                      )}
                      {tx.admin_comment && (
                        <div className="text-xs text-blue-400 italic">💬 {tx.admin_comment}</div>
                      )}
                    </>
                  )}
                  <div className="text-[10px] text-zinc-600">
                    {new Date(tx.created_at).toLocaleString('ru-RU', { 
                      day: 'numeric', 
                      month: 'long', 
                      year: 'numeric', 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
