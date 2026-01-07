'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/contexts/ThemeContext';

interface ReleasePayment {
  id: string;
  release_id: string;
  release_type: string;
  transaction_id: string;
  release_title: string;
  release_artist?: string;
  tracks_count: number;
  amount: number;
  currency: string;
  payment_method: string;
  status: string;
  created_at: string;
  refunded_at?: string;
}

export default function ReleasePaymentsPage() {
  const [payments, setPayments] = useState<ReleasePayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { themeName } = useTheme();
  const isLight = themeName === 'light';

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      if (!supabase) {
        setError('Supabase не инициализирован');
        setLoading(false);
        return;
      }
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError('Не авторизован');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/releases/payments', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка загрузки');
      }

      setPayments(data.payments || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatPrice = (amount: number, currency: string = 'RUB') => {
    const symbol = currency === 'RUB' ? '₽' : currency === 'USD' ? '$' : currency;
    return `${amount.toLocaleString('ru-RU')} ${symbol}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'Оплачено' };
      case 'refunded':
        return { bg: 'bg-orange-500/20', text: 'text-orange-400', label: 'Возвращено' };
      case 'failed':
        return { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Ошибка' };
      default:
        return { bg: 'bg-zinc-500/20', text: 'text-zinc-400', label: status };
    }
  };

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Заголовок */}
        <div className="mb-8">
          <h1 className={`text-2xl sm:text-3xl font-black ${isLight ? 'text-[#1a1535]' : 'text-white'}`}>
            История оплат релизов
          </h1>
          <p className={`text-sm mt-2 ${isLight ? 'text-[#5c5580]' : 'text-zinc-500'}`}>
            Здесь вы можете найти подтверждение оплаты любого вашего релиза
          </p>
        </div>

        {/* Информационный блок */}
        <div 
          className="p-4 rounded-2xl mb-6"
          style={{
            background: isLight 
              ? 'linear-gradient(135deg, rgba(138, 99, 210, 0.1) 0%, rgba(167, 139, 250, 0.05) 100%)' 
              : 'linear-gradient(135deg, rgba(96, 80, 186, 0.15) 0%, rgba(157, 141, 241, 0.05) 100%)',
            border: isLight ? '1px solid rgba(138, 99, 210, 0.2)' : '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#6050ba]/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-[#9d8df1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className={`text-sm ${isLight ? 'text-[#5c5580]' : 'text-zinc-400'}`}>
                <strong className={isLight ? 'text-[#1a1535]' : 'text-white'}>Как использовать:</strong> 
                {' '}Каждая запись содержит уникальный ID транзакции, который можно использовать как 
                доказательство оплаты при обращении в поддержку. Нажмите на ID чтобы скопировать.
              </p>
            </div>
          </div>
        </div>

        {/* Состояние загрузки */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-[#6050ba] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Ошибка */}
        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Пустой список */}
        {!loading && !error && payments.length === 0 && (
          <div 
            className="text-center py-12 rounded-2xl"
            style={{
              border: isLight ? '1px dashed rgba(138, 99, 210, 0.3)' : '1px dashed rgba(255, 255, 255, 0.1)'
            }}
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#6050ba]/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-[#9d8df1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className={isLight ? 'text-[#5c5580]' : 'text-zinc-500'}>У вас пока нет оплаченных релизов</p>
          </div>
        )}

        {/* Список оплат */}
        {!loading && payments.length > 0 && (
          <div className="space-y-3">
            {payments.map((payment) => {
              const status = getStatusBadge(payment.status);
              
              return (
                <div
                  key={payment.id}
                  className="p-4 sm:p-5 rounded-2xl transition-all"
                  style={{
                    background: isLight ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 255, 255, 0.03)',
                    border: isLight ? '1px solid rgba(255, 255, 255, 0.9)' : '1px solid rgba(255, 255, 255, 0.05)'
                  }}
                >
                  {/* Верхняя строка: название и сумма */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-bold truncate ${isLight ? 'text-[#1a1535]' : 'text-white'}`}>
                        {payment.release_title}
                      </h3>
                      {payment.release_artist && (
                        <p className={`text-sm ${isLight ? 'text-[#5c5580]' : 'text-zinc-500'}`}>
                          {payment.release_artist}
                        </p>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <div className={`text-lg font-black ${status.text}`}>
                        {formatPrice(payment.amount, payment.currency)}
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${status.bg} ${status.text}`}>
                        {status.label}
                      </span>
                    </div>
                  </div>

                  {/* Детали */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-3">
                    <div>
                      <div className={isLight ? 'text-[#7a7596]' : 'text-zinc-600'}>Дата</div>
                      <div className={isLight ? 'text-[#5c5580]' : 'text-zinc-400'}>
                        {formatDate(payment.created_at)}
                      </div>
                    </div>
                    <div>
                      <div className={isLight ? 'text-[#7a7596]' : 'text-zinc-600'}>Тип</div>
                      <div className={isLight ? 'text-[#5c5580]' : 'text-zinc-400'}>
                        {payment.release_type === 'basic' ? 'Basic' : 'Exclusive'}
                      </div>
                    </div>
                    <div>
                      <div className={isLight ? 'text-[#7a7596]' : 'text-zinc-600'}>Треков</div>
                      <div className={isLight ? 'text-[#5c5580]' : 'text-zinc-400'}>
                        {payment.tracks_count}
                      </div>
                    </div>
                    <div>
                      <div className={isLight ? 'text-[#7a7596]' : 'text-zinc-600'}>Способ</div>
                      <div className={isLight ? 'text-[#5c5580]' : 'text-zinc-400'}>
                        {payment.payment_method === 'balance' ? 'Баланс' : payment.payment_method}
                      </div>
                    </div>
                  </div>

                  {/* ID транзакции */}
                  <div 
                    className="p-3 rounded-xl flex items-center justify-between gap-2"
                    style={{
                      background: isLight ? 'rgba(138, 99, 210, 0.08)' : 'rgba(96, 80, 186, 0.15)'
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className={`text-[10px] uppercase tracking-wide mb-1 ${isLight ? 'text-[#7a7596]' : 'text-zinc-600'}`}>
                        ID транзакции (для поддержки)
                      </div>
                      <div className="font-mono text-xs text-[#9d8df1] truncate">
                        {payment.transaction_id}
                      </div>
                    </div>
                    <button
                      onClick={() => copyToClipboard(payment.transaction_id, payment.id)}
                      className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        copiedId === payment.id
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-[#6050ba]/20 text-[#9d8df1] hover:bg-[#6050ba]/30'
                      }`}
                    >
                      {copiedId === payment.id ? (
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                          </svg>
                          Скопировано
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"/>
                            <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z"/>
                          </svg>
                          Копировать
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
