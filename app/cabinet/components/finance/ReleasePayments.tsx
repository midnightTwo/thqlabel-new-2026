'use client';
import React, { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase/client';

interface ReleasePayment {
  id: string;
  release_id: string | null;
  release_title: string;
  release_artist: string | null;
  release_type: string;
  amount: number;
  status: 'completed' | 'refunded' | 'pending_refund';
  created_at: string;
  refunded_at: string | null;
  // Дополнительно из releases_basic
  release_status?: string;
  can_refund?: boolean;
}

interface ReleasePaymentsProps {
  userId: string;
  onRefundSuccess?: () => void;
}

export default function ReleasePayments({ userId, onRefundSuccess }: ReleasePaymentsProps) {
  const [payments, setPayments] = useState<ReleasePayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refundLoading, setRefundLoading] = useState<string | null>(null);
  const { themeName } = useTheme();
  const isLight = themeName === 'light';

  useEffect(() => {
    loadPayments();
  }, [userId]);

  const loadPayments = async () => {
    if (!supabase) return;
    
    try {
      // Загружаем оплаты релизов
      // Сначала пробуем из release_payments, если нет - fallback на transactions
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('release_payments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (paymentsError && paymentsError.code !== '42P01') {
        console.error('Ошибка загрузки оплат:', paymentsError);
      }

      if (paymentsData && paymentsData.length > 0) {
        // Получаем статусы релизов для определения возможности возврата
        const releaseIds = paymentsData
          .filter(p => p.release_id)
          .map(p => p.release_id);
        
        let releasesMap: Record<string, string> = {};
        
        if (releaseIds.length > 0) {
          const { data: releases } = await supabase
            .from('releases_basic')
            .select('id, status')
            .in('id', releaseIds);
          
          if (releases) {
            releasesMap = releases.reduce((acc, r) => ({ ...acc, [r.id]: r.status }), {});
          }
        }

        const paymentsWithStatus = paymentsData.map(p => ({
          ...p,
          release_status: p.release_id ? releasesMap[p.release_id] : null,
          // Можно вернуть только если релиз в статусе draft или awaiting_payment
          can_refund: p.status === 'completed' && p.release_id && 
            ['draft', 'awaiting_payment'].includes(releasesMap[p.release_id] || '')
        }));

        setPayments(paymentsWithStatus);
      } else {
        // Fallback: ищем в transactions с type = 'purchase'
        const { data: txData } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', userId)
          .eq('type', 'purchase')
          .order('created_at', { ascending: false });

        if (txData) {
          const paymentsFromTx = txData.map(tx => ({
            id: tx.id,
            release_id: tx.metadata?.release_id || null,
            release_title: tx.metadata?.release_title || tx.description?.replace('Оплата релиза: ', '') || 'Релиз',
            release_artist: tx.metadata?.release_artist || null,
            release_type: tx.metadata?.release_type || 'basic',
            amount: tx.amount,
            status: tx.status === 'completed' ? 'completed' : 'pending_refund',
            created_at: tx.created_at,
            refunded_at: null,
            can_refund: false // Без release_id не можем точно определить
          }));
          setPayments(paymentsFromTx as ReleasePayment[]);
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки оплат релизов:', error);
    } finally {
      setLoading(false);
    }
  };

  const requestRefund = async (payment: ReleasePayment) => {
    if (!supabase || !payment.release_id) return;
    
    if (!confirm(`Запросить возврат ${payment.amount}₽ за релиз "${payment.release_title}"?\n\nВозврат возможен только для неотправленных релизов.`)) {
      return;
    }

    setRefundLoading(payment.id);
    
    try {
      // Получаем токен
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        alert('Ошибка авторизации');
        return;
      }

      const response = await fetch('/api/balance/refund', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          paymentId: payment.id,
          releaseId: payment.release_id,
          amount: payment.amount
        })
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Ошибка возврата');
        return;
      }

      alert('✅ Средства возвращены на баланс!');
      loadPayments();
      onRefundSuccess?.();
    } catch (error) {
      console.error('Ошибка возврата:', error);
      alert('Произошла ошибка при возврате');
    } finally {
      setRefundLoading(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
            Оплачено
          </span>
        );
      case 'refunded':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400">
            Возвращено
          </span>
        );
      case 'pending_refund':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-400">
            Ожидает возврата
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="text-center py-8">
        <svg 
          className={`w-12 h-12 mx-auto mb-3 ${isLight ? 'text-[#8a63d2]/30' : 'text-zinc-700'}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className={`text-sm ${isLight ? 'text-[#5c5580]' : 'text-zinc-500'}`}>
          У вас пока нет оплаченных релизов
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {payments.map((payment) => (
        <div
          key={payment.id}
          className={`p-3 rounded-xl transition-all ${
            isLight 
              ? 'bg-white/50 border border-purple-100 hover:border-purple-200' 
              : 'bg-white/5 border border-white/5 hover:border-white/10'
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {/* Иконка */}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                payment.status === 'refunded' 
                  ? 'bg-amber-500/20' 
                  : 'bg-emerald-500/20'
              }`}>
                {payment.status === 'refunded' ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-400">
                    <polyline points="1 4 1 10 7 10"/>
                    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-400">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                    <line x1="1" y1="10" x2="23" y2="10"/>
                  </svg>
                )}
              </div>
              
              {/* Инфо */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className={`font-bold text-sm truncate ${isLight ? 'text-[#1a1535]' : 'text-white'}`}>
                    {payment.release_title}
                  </h4>
                  {getStatusBadge(payment.status)}
                </div>
                <div className={`flex items-center gap-2 text-xs ${isLight ? 'text-[#5c5580]' : 'text-zinc-500'}`}>
                  {payment.release_artist && (
                    <>
                      <span>{payment.release_artist}</span>
                      <span>•</span>
                    </>
                  )}
                  <span className="capitalize">{payment.release_type}</span>
                  <span>•</span>
                  <span>{formatDate(payment.created_at)}</span>
                </div>
              </div>
            </div>

            {/* Сумма и действия */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="text-right">
                <div className={`font-bold ${
                  payment.status === 'refunded' 
                    ? 'text-amber-400' 
                    : isLight ? 'text-emerald-600' : 'text-emerald-400'
                }`}>
                  {payment.status === 'refunded' ? '+' : '-'}{payment.amount}₽
                </div>
                {payment.refunded_at && (
                  <div className="text-[10px] text-zinc-500">
                    Возврат: {formatDate(payment.refunded_at)}
                  </div>
                )}
              </div>

              {/* Кнопка возврата */}
              {payment.can_refund && (
                <button
                  onClick={() => requestRefund(payment)}
                  disabled={refundLoading === payment.id}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    refundLoading === payment.id
                      ? 'bg-zinc-500/20 text-zinc-400 cursor-wait'
                      : 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                  }`}
                >
                  {refundLoading === payment.id ? (
                    <span className="flex items-center gap-1">
                      <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      Возврат...
                    </span>
                  ) : (
                    'Вернуть'
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
      
      {/* Подсказка */}
      <div className={`mt-4 p-3 rounded-xl text-xs ${
        isLight 
          ? 'bg-amber-50 border border-amber-100 text-amber-700' 
          : 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
      }`}>
        <div className="flex items-start gap-2">
          <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <p>
            <strong>Возврат возможен</strong> только для релизов, которые ещё не отправлены на модерацию. 
            После отправки релиза возврат невозможен.
          </p>
        </div>
      </div>
    </div>
  );
}
