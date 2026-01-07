'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

export default function WithdrawalsTab({ supabase, currentUserRole }: { supabase: any; currentUserRole: 'admin' | 'owner' }) {
  const { themeName } = useTheme();
  const isLight = themeName === 'light';
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'completed'>('all');
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [adminComment, setAdminComment] = useState('');
  const [processing, setProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState<{show: boolean; message: string; type: 'success' | 'error'}>({show: false, message: '', type: 'success'});
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    show: boolean;
    action: 'approved' | 'rejected' | 'completed' | null;
    title: string;
    message: string;
    confirmText: string;
    confirmColor: string;
  }>({ show: false, action: null, title: '', message: '', confirmText: '', confirmColor: '' });
  const [stats, setStats] = useState<{
    pending: { total: number; count: number };
    approved: { total: number; count: number };
    completed: { total: number; count: number };
    rejected: { total: number; count: number };
  } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({show: true, message, type});
    setTimeout(() => setNotification(prev => ({...prev, show: false})), 3000);
  };

  // Функция копирования
  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  // Компонент кнопки копирования - компактная иконка
  const CopyButton = ({ value, field, label }: { value: string; field: string; label?: string }) => (
    <button
      onClick={(e) => { e.stopPropagation(); copyToClipboard(value, field); }}
      className={`w-8 h-8 min-w-[32px] min-h-[32px] rounded-lg flex items-center justify-center transition-all ${
        copiedField === field 
          ? 'bg-emerald-500/20 text-emerald-400' 
          : isLight
            ? 'bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700'
            : 'bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white'
      }`}
      title={copiedField === field ? 'Скопировано!' : `Копировать ${label || ''}`}
    >
      {copiedField === field ? (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"/>
          <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z"/>
        </svg>
      )}
    </button>
  );

  // Показать диалог подтверждения
  const showConfirmDialog = (action: 'approved' | 'rejected' | 'completed') => {
    const configs = {
      approved: {
        title: 'Одобрить заявку?',
        message: `Вы уверены, что хотите одобрить заявку на вывод ${Number(selectedRequest?.amount).toLocaleString('ru-RU')} ₽ для ${selectedRequest?.user?.nickname || 'пользователя'}?`,
        confirmText: 'Одобрить',
        confirmColor: 'from-blue-500/20 to-blue-600/20 border-blue-500/30 text-blue-300 hover:from-blue-500/30 hover:to-blue-600/30'
      },
      rejected: {
        title: 'Отклонить заявку?',
        message: `Вы уверены, что хотите отклонить заявку на вывод ${Number(selectedRequest?.amount).toLocaleString('ru-RU')} ₽? Средства будут возвращены на баланс пользователя.`,
        confirmText: 'Отклонить',
        confirmColor: 'from-red-500/20 to-red-600/20 border-red-500/30 text-red-300 hover:from-red-500/30 hover:to-red-600/30'
      },
      completed: {
        title: 'Подтвердить выплату?',
        message: `Подтвердите, что вы перевели ${Number(selectedRequest?.amount).toLocaleString('ru-RU')} ₽ на карту ${selectedRequest?.card_number}. Это действие нельзя отменить.`,
        confirmText: 'Выплачено',
        confirmColor: 'from-emerald-500/20 to-emerald-600/20 border-emerald-500/30 text-emerald-300 hover:from-emerald-500/30 hover:to-emerald-600/30'
      }
    };
    const config = configs[action];
    setConfirmDialog({
      show: true,
      action,
      ...config
    });
  };

  // Подтвердить действие
  const confirmAction = () => {
    if (confirmDialog.action && selectedRequest) {
      executeStatusUpdate(selectedRequest.id, confirmDialog.action);
    }
    setConfirmDialog({ show: false, action: null, title: '', message: '', confirmText: '', confirmColor: '' });
  };

  // Загрузка статистики
  const loadStats = async () => {
    try {
      const { data, error } = await supabase.rpc('get_withdrawal_stats');
      if (!error && data) {
        setStats(data);
      } else {
        // Fallback - считаем вручную
        const { data: all } = await supabase
          .from('withdrawal_requests')
          .select('status, amount');
        
        if (all) {
          const calcStats = {
            pending: { total: 0, count: 0 },
            approved: { total: 0, count: 0 },
            completed: { total: 0, count: 0 },
            rejected: { total: 0, count: 0 }
          };
          
          all.forEach((r: any) => {
            const status = r.status as keyof typeof calcStats;
            if (calcStats[status]) {
              calcStats[status].count++;
              calcStats[status].total += parseFloat(r.amount) || 0;
            }
          });
          
          setStats(calcStats);
        }
      }
    } catch (e) {
      console.error('Stats error:', e);
    }
  };

  const loadRequests = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('withdrawal_requests')
        .select(`
          *,
          user:profiles!user_id (
            nickname,
            email,
            avatar,
            member_id,
            role
          )
        `)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      // Загружаем transaction_id для каждой заявки
      if (data && data.length > 0) {
        const requestsWithTx = await Promise.all(
          data.map(async (request: any) => {
            const { data: tx } = await supabase
              .from('transactions')
              .select('id')
              .eq('reference_table', 'withdrawal_requests')
              .eq('reference_id', request.id)
              .maybeSingle();
            return { ...request, transaction_id: tx?.id || null };
          })
        );
        setRequests(requestsWithTx || []);
      } else {
        setRequests([]);
      }
    } catch (e: any) {
      showNotification('Ошибка загрузки: ' + e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
    loadStats();
  }, [filter]);

  // Открыть диалог подтверждения
  const handleStatusUpdate = (requestId: string, newStatus: 'approved' | 'rejected' | 'completed') => {
    if (!selectedRequest) return;
    showConfirmDialog(newStatus);
  };

  // Выполнить обновление статуса
  const executeStatusUpdate = async (requestId: string, newStatus: 'approved' | 'rejected' | 'completed') => {
    if (!selectedRequest) return;
    
    const statusMessages = {
      approved: 'одобрить',
      rejected: 'отклонить',
      completed: 'завершить'
    };

    setProcessing(true);
    try {
      // Блокируем отклонение только для завершённых и уже отклонённых заявок
      if ((selectedRequest.status === 'completed' || selectedRequest.status === 'rejected') && newStatus === 'rejected') {
        showNotification('Нельзя отклонить завершённую или уже отклонённую заявку', 'error');
        setProcessing(false);
        return;
      }

      // Используем новый API v2
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        showNotification('Необходима авторизация', 'error');
        setProcessing(false);
        return;
      }

      const response = await fetch(`/api/withdrawals/v2/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: newStatus,
          adminComment: adminComment || null
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Ошибка обновления заявки');
      }

      showNotification(`✓ Заявка ${statusMessages[newStatus]}а успешно`, 'success');
      setSelectedRequest(null);
      setAdminComment('');
      await loadRequests();
    } catch (e: any) {
      showNotification('Ошибка: ' + e.message, 'error');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; bgLight: string; text: string; textLight: string; label: string }> = {
      pending: { bg: 'bg-yellow-500/20', bgLight: 'bg-amber-100', text: 'text-yellow-400', textLight: 'text-amber-700', label: 'На рассмотрении' },
      approved: { bg: 'bg-blue-500/20', bgLight: 'bg-blue-100', text: 'text-blue-400', textLight: 'text-blue-700', label: 'Одобрено' },
      rejected: { bg: 'bg-red-500/20', bgLight: 'bg-red-100', text: 'text-red-400', textLight: 'text-red-700', label: 'Отклонено' },
      completed: { bg: 'bg-emerald-500/20', bgLight: 'bg-emerald-100', text: 'text-emerald-400', textLight: 'text-emerald-700', label: 'Выплачено' },
    };
    const badge = badges[status] || badges.pending;
    return (
      <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${isLight ? badge.bgLight : badge.bg} ${isLight ? badge.textLight : badge.text}`}>
        {badge.label}
      </span>
    );
  };

  return (
    <div className="space-y-6 relative">
      {/* Уведомление */}
      {notification.show && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-4 duration-300">
          <div className={`px-6 py-3 rounded-xl shadow-2xl border backdrop-blur-sm ${
            notification.type === 'success' 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
              : 'bg-red-500/10 border-red-500/30 text-red-300'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${notification.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`} />
              <span className="font-medium">{notification.message}</span>
            </div>
          </div>
        </div>
      )}

      {/* Красивый диалог подтверждения */}
      {confirmDialog.show && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
            onClick={() => setConfirmDialog({ show: false, action: null, title: '', message: '', confirmText: '', confirmColor: '' })}
          />
          <div className="relative w-full max-w-md bg-gradient-to-b from-zinc-900 to-black rounded-2xl border border-white/10 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header с иконкой */}
            <div className="px-6 pt-6 pb-4 flex flex-col items-center text-center">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${
                confirmDialog.action === 'rejected' 
                  ? 'bg-red-500/20' 
                  : confirmDialog.action === 'approved' 
                    ? 'bg-blue-500/20' 
                    : 'bg-emerald-500/20'
              }`}>
                {confirmDialog.action === 'rejected' ? (
                  <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : confirmDialog.action === 'approved' ? (
                  <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{confirmDialog.title}</h3>
              <p className="text-zinc-400 text-sm">{confirmDialog.message}</p>
            </div>

            {/* Кнопки */}
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setConfirmDialog({ show: false, action: null, title: '', message: '', confirmText: '', confirmColor: '' })}
                className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-zinc-300 rounded-xl font-bold transition-all border border-white/10"
              >
                Отмена
              </button>
              <button
                onClick={confirmAction}
                disabled={processing}
                className={`flex-1 py-3 rounded-xl font-bold transition-all border disabled:opacity-50 bg-gradient-to-r ${confirmDialog.confirmColor}`}
              >
                {processing ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Обработка...
                  </span>
                ) : confirmDialog.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Статистика */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          <div className={`p-3 sm:p-4 rounded-xl border ${isLight ? 'bg-amber-50 border-amber-200' : 'bg-yellow-500/10 border-yellow-500/30'}`}>
            <div className={`text-[10px] sm:text-xs font-bold mb-1 ${isLight ? 'text-amber-700' : 'text-yellow-400'}`}>На рассмотрении</div>
            <div className={`text-xl sm:text-2xl font-black ${isLight ? 'text-gray-800' : 'text-white'}`}>{stats.pending.count}</div>
            <div className={`text-xs sm:text-sm ${isLight ? 'text-amber-600' : 'text-yellow-400/70'}`}>{stats.pending.total.toLocaleString('ru')} ₽</div>
          </div>
          <div className={`p-3 sm:p-4 rounded-xl border ${isLight ? 'bg-blue-50 border-blue-200' : 'bg-blue-500/10 border-blue-500/30'}`}>
            <div className={`text-[10px] sm:text-xs font-bold mb-1 ${isLight ? 'text-blue-700' : 'text-blue-400'}`}>Одобрено</div>
            <div className={`text-xl sm:text-2xl font-black ${isLight ? 'text-gray-800' : 'text-white'}`}>{stats.approved.count}</div>
            <div className={`text-xs sm:text-sm ${isLight ? 'text-blue-600' : 'text-blue-400/70'}`}>{stats.approved.total.toLocaleString('ru')} ₽</div>
          </div>
          <div className={`p-3 sm:p-4 rounded-xl border ${isLight ? 'bg-emerald-50 border-emerald-200' : 'bg-emerald-500/10 border-emerald-500/30'}`}>
            <div className={`text-[10px] sm:text-xs font-bold mb-1 ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>Выплачено</div>
            <div className={`text-xl sm:text-2xl font-black ${isLight ? 'text-gray-800' : 'text-white'}`}>{stats.completed.count}</div>
            <div className={`text-xs sm:text-sm ${isLight ? 'text-emerald-600' : 'text-emerald-400/70'}`}>{stats.completed.total.toLocaleString('ru')} ₽</div>
          </div>
          <div className={`p-3 sm:p-4 rounded-xl border ${isLight ? 'bg-red-50 border-red-200' : 'bg-red-500/10 border-red-500/30'}`}>
            <div className={`text-[10px] sm:text-xs font-bold mb-1 ${isLight ? 'text-red-700' : 'text-red-400'}`}>Отклонено</div>
            <div className={`text-xl sm:text-2xl font-black ${isLight ? 'text-gray-800' : 'text-white'}`}>{stats.rejected.count}</div>
            <div className={`text-xs sm:text-sm ${isLight ? 'text-red-600' : 'text-red-400/70'}`}>{stats.rejected.total.toLocaleString('ru')} ₽</div>
          </div>
        </div>
      )}

      {/* Фильтры и поиск */}
      <div className="space-y-4">
        {/* Поиск */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по номеру, никнейму, email или сумме..."
            className={`w-full px-4 py-3 pl-11 rounded-xl text-sm outline-none transition min-h-[44px] ${
              isLight 
                ? 'bg-white/80 border border-[#6050ba]/20 focus:border-[#6050ba]/50 focus:ring-2 focus:ring-[#6050ba]/20 placeholder:text-gray-400 text-gray-800' 
                : 'bg-gradient-to-r from-zinc-900/80 to-zinc-800/80 border border-white/10 focus:border-[#6050ba]/50 focus:ring-2 focus:ring-[#6050ba]/20 placeholder:text-zinc-500'
            }`}
          />
          <div className={`absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-lg flex items-center justify-center ${isLight ? 'bg-[#6050ba]/10' : 'bg-[#6050ba]/20'}`}>
            <svg className={`w-4 h-4 ${isLight ? 'text-[#6050ba]' : 'text-[#9d8df1]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className={`absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center transition ${
                isLight ? 'bg-gray-200 hover:bg-gray-300' : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              <svg className={`w-3 h-3 ${isLight ? 'text-gray-500' : 'text-zinc-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        
        {/* Фильтры по статусу */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:overflow-visible sm:flex-wrap" style={{ scrollbarWidth: 'none' }}>
          {[
            { id: 'all', label: 'Все', icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            ), count: stats ? stats.pending.count + stats.approved.count + stats.completed.count + stats.rejected.count : 0 },
            { id: 'pending', label: 'Ожидают', icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ), count: stats?.pending.count || 0, color: 'yellow' },
            { id: 'approved', label: 'Одобрено', icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ), count: stats?.approved.count || 0, color: 'blue' },
            { id: 'completed', label: 'Выплачено', icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ), count: stats?.completed.count || 0, color: 'emerald' },
            { id: 'rejected', label: 'Отклонено', icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ), count: stats?.rejected.count || 0, color: 'red' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap min-h-[44px] border ${
                filter === f.id
                  ? 'bg-gradient-to-r from-[#6050ba] to-purple-600 text-white border-[#6050ba] shadow-lg shadow-[#6050ba]/25'
                  : isLight
                    ? 'bg-white/80 text-gray-600 hover:bg-white border-[#6050ba]/10 hover:border-[#6050ba]/30'
                    : 'bg-zinc-900/50 text-zinc-400 hover:bg-zinc-800/50 border-white/5 hover:border-white/10'
              }`}
            >
              <span className={filter === f.id ? 'text-white' : f.color === 'yellow' ? (isLight ? 'text-amber-600' : 'text-yellow-400') : f.color === 'blue' ? (isLight ? 'text-blue-600' : 'text-blue-400') : f.color === 'emerald' ? (isLight ? 'text-emerald-600' : 'text-emerald-400') : f.color === 'red' ? (isLight ? 'text-red-600' : 'text-red-400') : (isLight ? 'text-gray-500' : 'text-zinc-400')}>{f.icon}</span>
              <span>{f.label}</span>
              {f.count > 0 && (
                <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  filter === f.id 
                    ? 'bg-white/20 text-white' 
                    : f.color === 'yellow' ? (isLight ? 'bg-amber-100 text-amber-700' : 'bg-yellow-500/20 text-yellow-400')
                    : f.color === 'blue' ? (isLight ? 'bg-blue-100 text-blue-700' : 'bg-blue-500/20 text-blue-400')
                    : f.color === 'emerald' ? (isLight ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-500/20 text-emerald-400')
                    : f.color === 'red' ? (isLight ? 'bg-red-100 text-red-700' : 'bg-red-500/20 text-red-400')
                    : (isLight ? 'bg-gray-100' : 'bg-white/10')
                }`}>
                  {f.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Список заявок */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-12 h-12 rounded-full border-4 border-[#6050ba]/30 border-t-[#6050ba] animate-spin mb-4" />
          <p className={isLight ? 'text-gray-500' : 'text-zinc-500'}>Загрузка заявок...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className={`text-center py-16 border border-dashed rounded-2xl ${
          isLight 
            ? 'border-[#6050ba]/20 bg-gradient-to-b from-white/50 to-transparent' 
            : 'border-white/10 bg-gradient-to-b from-zinc-900/50 to-transparent'
        }`}>
          <div className={`w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center ${isLight ? 'bg-[#6050ba]/10' : 'bg-[#6050ba]/10'}`}>
            <svg className={`w-10 h-10 ${isLight ? 'text-[#6050ba]' : 'text-[#9d8df1]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className={`font-medium mb-1 ${isLight ? 'text-gray-600' : 'text-zinc-400'}`}>Нет заявок</p>
          <p className={`text-sm ${isLight ? 'text-gray-400' : 'text-zinc-600'}`}>Здесь будут отображаться заявки на вывод средств</p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Результаты поиска */}
          {searchQuery && (
            <div className={`text-xs px-1 mb-2 ${isLight ? 'text-gray-500' : 'text-zinc-500'}`}>
              Найдено: {requests.filter(req => {
                const search = searchQuery.toLowerCase().trim();
                return (
                  req.id.toLowerCase().includes(search) ||
                  req.user?.nickname?.toLowerCase().includes(search) ||
                  req.user?.email?.toLowerCase().includes(search) ||
                  req.user?.member_id?.toLowerCase().includes(search) ||
                  req.bank_name?.toLowerCase().includes(search) ||
                  req.card_number?.replace(/\s/g, '').includes(search) ||
                  req.recipient_name?.toLowerCase().includes(search) ||
                  String(req.amount).includes(search)
                );
              }).length} заявок
            </div>
          )}
          
          {requests
            .filter(req => {
              if (!searchQuery.trim()) return true;
              const search = searchQuery.toLowerCase().trim();
              return (
                req.id.toLowerCase().includes(search) ||
                req.user?.nickname?.toLowerCase().includes(search) ||
                req.user?.email?.toLowerCase().includes(search) ||
                req.user?.member_id?.toLowerCase().includes(search) ||
                req.bank_name?.toLowerCase().includes(search) ||
                req.card_number?.replace(/\s/g, '').includes(search) ||
                req.recipient_name?.toLowerCase().includes(search) ||
                String(req.amount).includes(search)
              );
            })
            .map((req) => {
              const statusColors: Record<string, string> = {
                pending: 'border-l-yellow-500',
                approved: 'border-l-blue-500',
                completed: 'border-l-emerald-500',
                rejected: 'border-l-red-500'
              };
              
              return (
                <div
                  key={req.id}
                  onClick={() => setSelectedRequest(req)}
                  className={`relative p-4 rounded-xl border-l-4 cursor-pointer transition-all group ${statusColors[req.status] || 'border-l-zinc-500'} ${
                    selectedRequest?.id === req.id
                      ? isLight
                        ? 'bg-[#6050ba]/10 border border-[#6050ba]/30 shadow-lg shadow-[#6050ba]/10'
                        : 'bg-[#6050ba]/15 border border-[#6050ba]/40 shadow-lg shadow-[#6050ba]/10'
                      : isLight
                        ? 'bg-white/80 border border-[#6050ba]/10 hover:border-[#6050ba]/30 hover:shadow-lg'
                        : 'bg-gradient-to-r from-zinc-900/80 to-zinc-800/50 border border-white/5 hover:border-[#6050ba]/30 hover:shadow-lg hover:shadow-black/20'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Аватар */}
                    <div 
                      className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold flex-shrink-0 shadow-lg ${
                        req.user?.avatar 
                          ? 'bg-cover bg-center' 
                          : 'bg-gradient-to-br from-[#6050ba] to-purple-600 text-white'
                      }`}
                      style={req.user?.avatar ? { backgroundImage: `url(${req.user.avatar})` } : {}}
                    >
                      {!req.user?.avatar && (req.user?.nickname?.charAt(0)?.toUpperCase() || '?')}
                    </div>
                    
                    {/* Инфо */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`font-bold truncate ${isLight ? 'text-gray-800' : 'text-white'}`}>{req.user?.nickname || 'Без никнейма'}</span>
                        {getStatusBadge(req.status)}
                      </div>
                      <div className={`text-xs truncate mb-1 ${isLight ? 'text-gray-500' : 'text-zinc-500'}`}>{req.user?.email}</div>
                      <div className={`flex items-center gap-3 text-[10px] ${isLight ? 'text-gray-400' : 'text-zinc-600'}`}>
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {new Date(req.created_at).toLocaleDateString('ru-RU')}
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                          {req.bank_name}
                        </span>
                      </div>
                    </div>
                    
                    {/* Сумма */}
                    <div className="text-right flex-shrink-0">
                      <div className={`text-xl font-black tracking-tight ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`}>
                        {Number(req.amount).toLocaleString('ru-RU')} <span className={`text-sm ${isLight ? 'text-emerald-700' : 'text-emerald-500'}`}>₽</span>
                      </div>
                      <div className={`text-[10px] font-mono ${isLight ? 'text-gray-400' : 'text-zinc-600'}`}>
                        №{req.id.slice(0, 8)}
                      </div>
                    </div>
                    
                    {/* Стрелка */}
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all flex-shrink-0 ${
                      isLight 
                        ? 'bg-gray-100 group-hover:bg-[#6050ba]/20' 
                        : 'bg-white/5 group-hover:bg-[#6050ba]/20'
                    }`}>
                      <svg className={`w-4 h-4 transition ${isLight ? 'text-gray-400 group-hover:text-[#6050ba]' : 'text-zinc-500 group-hover:text-[#9d8df1]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* Детали заявки - центрированный модал */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8 overflow-y-auto">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
            onClick={() => { setSelectedRequest(null); setAdminComment(''); }}
          />
          
          {/* Modal - увеличенный */}
          <div className="relative w-full max-w-2xl bg-gradient-to-b from-zinc-900 to-black rounded-2xl border border-white/10 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-4">
            {/* Header */}
            <div className="relative px-6 py-5 bg-gradient-to-r from-[#6050ba]/30 via-purple-500/20 to-[#6050ba]/30 border-b border-white/10">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.05)_1px,transparent_0)] bg-[length:16px_16px]" />
              
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#6050ba] to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                      <line x1="1" x2="23" y1="10" y2="10"/>
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Заявка на вывод</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-purple-300/70 font-mono">#{selectedRequest.id.slice(0, 8)}</span>
                      <CopyButton value={selectedRequest.id} field="request_id" label="ID заявки" />
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => { setSelectedRequest(null); setAdminComment(''); }}
                  className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all hover:rotate-90 duration-300"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5">
              {/* Статус и Сумма в одной строке */}
              <div className="grid grid-cols-2 gap-4">
                {/* Статус */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                  <div className="text-xs text-zinc-500 mb-2">Статус заявки</div>
                  {getStatusBadge(selectedRequest.status)}
                </div>

                {/* Сумма */}
                <div className="relative p-4 rounded-xl bg-gradient-to-br from-emerald-500/15 to-green-600/10 border border-emerald-500/30 overflow-hidden">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full blur-2xl" />
                  <div className="relative">
                    <div className="text-xs text-emerald-300 mb-1">Сумма к выводу</div>
                    <div className="text-2xl font-black text-white tracking-tight">
                      {Number(selectedRequest.amount).toLocaleString('ru-RU')} <span className="text-sm text-emerald-400">₽</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Пользователь */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 border border-white/5">
                <div className="text-xs text-zinc-500 mb-3 font-semibold uppercase tracking-wider">Пользователь</div>
                <div className="flex items-center gap-4">
                  <div 
                    className={`w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold flex-shrink-0 ${selectedRequest.user.avatar ? 'bg-cover bg-center' : 'bg-gradient-to-br from-[#6050ba] to-purple-600'}`}
                    style={selectedRequest.user.avatar ? { backgroundImage: `url(${selectedRequest.user.avatar})` } : {}}
                  >
                    {!selectedRequest.user.avatar && (selectedRequest.user.nickname?.charAt(0)?.toUpperCase() || '?')}
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-lg">{selectedRequest.user.nickname || 'Без никнейма'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-zinc-400">{selectedRequest.user.email}</span>
                    </div>
                    {selectedRequest.user.member_id && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-500 font-mono">Member ID: {selectedRequest.user.member_id}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Реквизиты - с кнопками копирования */}
              <div className="p-4 rounded-xl bg-zinc-800/30 border border-white/5">
                <div className="text-xs text-zinc-500 font-semibold uppercase tracking-wider flex items-center gap-2 mb-4">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  Реквизиты для перевода
                </div>
                
                <div className="space-y-3">
                  {/* Банк */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-black/30">
                    <div>
                      <span className="text-xs text-zinc-500 block">Банк</span>
                      <span className="text-white font-medium">{selectedRequest.bank_name}</span>
                    </div>
                    <CopyButton value={selectedRequest.bank_name} field="bank" label="банк" />
                  </div>
                  
                  {/* Карта */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-black/30">
                    <div>
                      <span className="text-xs text-zinc-500 block">Номер карты</span>
                      <span className="text-white font-mono text-lg tracking-wider">{selectedRequest.card_number}</span>
                    </div>
                    <CopyButton value={selectedRequest.card_number.replace(/\s/g, '')} field="card" label="номер карты" />
                  </div>
                  
                  {/* Получатель */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-black/30">
                    <div>
                      <span className="text-xs text-zinc-500 block">Получатель (ФИО)</span>
                      <span className="text-white font-medium">{selectedRequest.recipient_name}</span>
                    </div>
                    <CopyButton value={selectedRequest.recipient_name} field="recipient" label="ФИО" />
                  </div>

                  {/* Копировать всё одной кнопкой */}
                  <button
                    onClick={() => copyToClipboard(
                      `${selectedRequest.bank_name}\n${selectedRequest.card_number.replace(/\s/g, '')}\n${selectedRequest.recipient_name}\n${Number(selectedRequest.amount).toLocaleString('ru-RU')} ₽`,
                      'all_requisites'
                    )}
                    className={`w-full py-3 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                      copiedField === 'all_requisites'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/20'
                    }`}
                  >
                    {copiedField === 'all_requisites' ? (
                      <>
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                        </svg>
                        Все реквизиты скопированы!
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M8 2a1 1 0 000 2h2a1 1 0 100-2H8z"/>
                          <path d="M3 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v6h-4.586l1.293-1.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L10.414 13H15v3a2 2 0 01-2 2H5a2 2 0 01-2-2V5zM15 11h2a1 1 0 110 2h-2v-2z"/>
                        </svg>
                        Копировать все реквизиты
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Даты */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-zinc-800/30 border border-white/5">
                  <div className="text-xs text-zinc-500 mb-1">Дата создания</div>
                  <div className="text-base text-white font-medium">
                    {new Date(selectedRequest.created_at).toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </div>
                  <div className="text-sm text-zinc-400">
                    {new Date(selectedRequest.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                {selectedRequest.processed_at && (
                  <div className="p-4 rounded-xl bg-zinc-800/30 border border-white/5">
                    <div className="text-xs text-zinc-500 mb-1">Дата обработки</div>
                    <div className="text-base text-white font-medium">
                      {new Date(selectedRequest.processed_at).toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </div>
                    <div className="text-sm text-zinc-400">
                      {new Date(selectedRequest.processed_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                )}
              </div>

              {/* Transaction IDs с копированием */}
              {(selectedRequest.transaction_id || selectedRequest.freeze_transaction_id) && (
                <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                  <div className="text-xs text-purple-300 font-semibold mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                      <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
                    </svg>
                    Идентификаторы транзакций
                  </div>
                  <div className="space-y-2">
                    {selectedRequest.freeze_transaction_id && (
                      <div className="flex items-center justify-between p-2 rounded-lg bg-black/20">
                        <div className="flex items-center gap-2">
                          <span className="text-purple-400 text-xs">TX Freeze:</span>
                          <span className="text-zinc-300 font-mono text-xs">{selectedRequest.freeze_transaction_id}</span>
                        </div>
                        <CopyButton value={selectedRequest.freeze_transaction_id} field="freeze_tx" label="TX Freeze" />
                      </div>
                    )}
                    {selectedRequest.transaction_id && (
                      <div className="flex items-center justify-between p-2 rounded-lg bg-black/20">
                        <div className="flex items-center gap-2">
                          <span className="text-purple-400 text-xs">TX ID:</span>
                          <span className="text-zinc-300 font-mono text-xs">{selectedRequest.transaction_id}</span>
                        </div>
                        <CopyButton value={selectedRequest.transaction_id} field="tx_id" label="TX ID" />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Комментарий админа (если есть) */}
              {selectedRequest.admin_comment && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <div className="text-xs text-amber-300 font-semibold mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd"/>
                    </svg>
                    Комментарий администратора
                  </div>
                  <div className="text-sm text-zinc-300">{selectedRequest.admin_comment}</div>
                </div>
              )}

              {/* Действия для owner - pending */}
              {currentUserRole === 'owner' && selectedRequest.status === 'pending' && (
                <div className="space-y-4 pt-5 border-t border-white/10">
                  <textarea
                    value={adminComment}
                    onChange={(e) => setAdminComment(e.target.value)}
                    placeholder="Комментарий к решению (необязательно)..."
                    className="w-full p-4 bg-black/40 border border-white/10 rounded-xl text-sm resize-none h-24 focus:border-[#6050ba]/50 transition placeholder:text-zinc-600"
                  />
                  <div className="flex gap-4">
                    <button
                      onClick={() => handleStatusUpdate(selectedRequest.id, 'rejected')}
                      disabled={processing}
                      className="flex-1 py-4 bg-gradient-to-r from-red-500/20 to-red-600/20 hover:from-red-500/30 hover:to-red-600/30 text-red-300 rounded-xl font-bold transition-all disabled:opacity-50 border border-red-500/30 flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Отклонить
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(selectedRequest.id, 'approved')}
                      disabled={processing}
                      className="flex-1 py-4 bg-gradient-to-r from-blue-500/20 to-blue-600/20 hover:from-blue-500/30 hover:to-blue-600/30 text-blue-300 rounded-xl font-bold transition-all disabled:opacity-50 border border-blue-500/30 flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Одобрить
                    </button>
                  </div>
                </div>
              )}

              {/* Действия для owner - approved */}
              {currentUserRole === 'owner' && selectedRequest.status === 'approved' && (
                <div className="pt-5 border-t border-white/10 space-y-3">
                  <button
                    onClick={() => handleStatusUpdate(selectedRequest.id, 'completed')}
                    disabled={processing}
                    className="w-full py-4 bg-gradient-to-r from-emerald-500/20 to-green-600/20 hover:from-emerald-500/30 hover:to-green-600/30 text-emerald-300 rounded-xl font-bold transition-all disabled:opacity-50 border border-emerald-500/30 flex items-center justify-center gap-2 text-lg"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Отметить как выплачено
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(selectedRequest.id, 'rejected')}
                    disabled={processing}
                    className="w-full py-3 bg-gradient-to-r from-orange-500/10 to-red-500/10 hover:from-orange-500/20 hover:to-red-500/20 text-orange-300 rounded-xl font-medium transition-all disabled:opacity-50 border border-orange-500/20 flex items-center justify-center gap-2 text-sm"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                    Всё же вернуть деньги
                  </button>
                </div>
              )}

              {/* Информация о завершении */}
              {selectedRequest.status === 'completed' && selectedRequest.actual_payout_date && (
                <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-emerald-300 font-bold text-lg">Выплата успешно завершена</div>
                      <div className="text-sm text-zinc-400">
                        {new Date(selectedRequest.actual_payout_date).toLocaleString('ru-RU', { 
                          day: '2-digit', 
                          month: 'long', 
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
