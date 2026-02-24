'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '@/contexts/ThemeContext';

interface Transaction {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  currency: string;
  balance_before: number;
  balance_after: number;
  status: string;
  description: string;
  payment_method?: string;
  reference_id?: string;
  reference_table?: string;
  admin_id?: string;
  admin_comment?: string;
  metadata?: any;
  created_at: string;
  user?: {
    id: string;
    display_name: string;
    nickname: string;
    email: string;
    avatar: string;
    member_id: string;
    role: string;
  };
  admin?: {
    id: string;
    display_name: string;
    email: string;
  };
}

interface Stats {
  totalTransactions: number;
  totalSystemBalance: number;
  pendingWithdrawals: { count: number; sum: number };
  byType: Record<string, { count: number; total: number }>;
  recentTransactions: Transaction[];
  topUsers: Array<{ user: any; total: number; count: number }>;
  dailyChart: Array<{ date: string; deposits: number; withdrawals: number; purchases: number; payouts: number }>;
}

interface TransactionsTabProps {
  supabase: any;
  currentUserRole: 'admin' | 'owner';
}

const TRANSACTION_TYPES = [
  { id: 'all', label: 'Все' },
  { id: 'deposit', label: 'Пополнения' },
  { id: 'purchase', label: 'Покупки' },
  { id: 'adjustment', label: 'Корректировки' },
  { id: 'payout', label: 'Роялти' },
  { id: 'withdrawal', label: 'Выводы' },
  { id: 'freeze', label: 'Заморозки' },
  { id: 'unfreeze', label: 'Разморозки' },
  { id: 'refund', label: 'Возвраты' },
  { id: 'bonus', label: 'Бонусы' },
];

export default function TransactionsTab({ supabase, currentUserRole }: TransactionsTabProps) {
  const { themeName } = useTheme();
  const isLight = themeName === 'light';
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  
  // Фильтры
  const [filter, setFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  
  // Модальные окна
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showStatsPanel, setShowStatsPanel] = useState(false);
  
  // Кастомный календарь
  const [showDateFromPicker, setShowDateFromPicker] = useState(false);
  const [showDateToPicker, setShowDateToPicker] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  
  // Форма создания транзакции
  const [createForm, setCreateForm] = useState({
    userId: '',
    type: 'bonus',
    amount: '',
    description: '',
    adminComment: ''
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userSearchResults, setUserSearchResults] = useState<any[]>([]);
  
  const [notification, setNotification] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false, message: '', type: 'success'
  });

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  };

  // Удаление транзакции (только для owner)
  const handleDeleteTransaction = async () => {
    if (!selectedTransaction || currentUserRole !== 'owner') return;
    
    setDeleteLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/admin/transactions/delete?id=${selectedTransaction.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });

      const data = await response.json();
      
      if (data.success) {
        showNotification(`Транзакция удалена. Баланс ${data.details.userEmail}: ${data.details.oldBalance}₽ → ${data.details.newBalance}₽`, 'success');
        setSelectedTransaction(null);
        setShowDeleteConfirm(false);
        loadTransactions();
        loadStats();
      } else {
        showNotification(data.error || 'Ошибка удаления', 'error');
      }
    } catch (error) {
      console.error('Delete transaction error:', error);
      showNotification('Ошибка удаления транзакции', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Скрыть транзакцию (без изменения баланса) — только для owner
  const handleHideTransaction = async () => {
    if (!selectedTransaction || currentUserRole !== 'owner') return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/admin/transactions/hide?id=${selectedTransaction.id}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });

      const data = await response.json();
      if (data.success) {
        showNotification('Транзакция скрыта (баланс не изменён)', 'success');
        setSelectedTransaction(null);
        setShowDeleteConfirm(false);
        loadTransactions();
        loadStats();
      } else {
        showNotification(data.error || 'Ошибка скрытия', 'error');
      }
    } catch (error) {
      console.error('Hide transaction error:', error);
      showNotification('Ошибка скрытия транзакции', 'error');
    }
  };

  // Загрузка транзакций
  const loadTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '30',
        sortBy: 'created_at',
        sortOrder: 'desc'
      });

      if (filter !== 'all') params.append('type', filter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (searchQuery) params.append('search', searchQuery);
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);

      const response = await fetch(`/api/admin/transactions?${params}`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });

      const data = await response.json();
      if (data.success) {
        setTransactions(data.transactions);
        setTotalPages(data.pagination.totalPages);
        setTotalCount(data.pagination.total);
      }
    } catch (error) {
      console.error('Load transactions error:', error);
      showNotification('Ошибка загрузки транзакций', 'error');
    } finally {
      setLoading(false);
    }
  }, [supabase, currentPage, filter, statusFilter, searchQuery, dateFrom, dateTo]);

  // Загрузка статистики
  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/admin/transactions/stats', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });

      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Load stats error:', error);
    } finally {
      setStatsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadTransactions();
    loadStats();
  }, [loadTransactions, loadStats]);

  // Поиск пользователей для создания транзакции
  const searchUsers = async (query: string) => {
    if (query.length < 2) {
      setUserSearchResults([]);
      return;
    }

    const { data } = await supabase
      .from('profiles')
      .select('id, display_name, nickname, email, avatar, balance')
      .or(`email.ilike.%${query}%,nickname.ilike.%${query}%,display_name.ilike.%${query}%`)
      .limit(10);

    setUserSearchResults(data || []);
  };

  // Создание транзакции
  const handleCreateTransaction = async () => {
    const amountValue = parseFloat(createForm.amount);
    
    // Для adjustment разрешаем отрицательные суммы
    const isAdjustment = createForm.type === 'adjustment' || createForm.type === 'correction';
    const isValidAmount = isAdjustment ? (amountValue !== 0 && !isNaN(amountValue)) : (amountValue > 0);
    
    if (!createForm.userId || !createForm.amount || !isValidAmount) {
      showNotification('Заполните все обязательные поля', 'error');
      return;
    }

    setCreateLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/admin/transactions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: createForm.userId,
          type: createForm.type,
          amount: parseFloat(createForm.amount),
          description: createForm.description,
          adminComment: createForm.adminComment
        })
      });

      const data = await response.json();
      if (data.success) {
        showNotification(`Транзакция создана! Новый баланс: ${data.user.balanceAfter.toLocaleString('ru')}₽`, 'success');
        setShowCreateModal(false);
        setCreateForm({ userId: '', type: 'bonus', amount: '', description: '', adminComment: '' });
        setUserSearch('');
        setUserSearchResults([]);
        loadTransactions();
        loadStats();
      } else {
        showNotification(data.error || 'Ошибка создания', 'error');
      }
    } catch (error: any) {
      showNotification('Ошибка: ' + error.message, 'error');
    } finally {
      setCreateLoading(false);
    }
  };

  // SVG иконки для типов транзакций
  const TypeIcons = {
    deposit: (
      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
      </svg>
    ),
    withdrawal: (
      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
      </svg>
    ),
    payout: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 18a2 2 0 0 1 2 2a2 2 0 0 1 2 -2a2 2 0 0 1 -2 -2a2 2 0 0 1 -2 2zm0 -12a2 2 0 0 1 2 2a2 2 0 0 1 2 -2a2 2 0 0 1 -2 -2a2 2 0 0 1 -2 2zm-7 12a6 6 0 0 1 6 -6a6 6 0 0 1 -6 -6a6 6 0 0 1 -6 6a6 6 0 0 1 6 6z" />
      </svg>
    ),
    purchase: (
      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
      </svg>
    ),
    refund: (
      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
    ),
    bonus: (
      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M5 5a3 3 0 015-2.236A3 3 0 0114.83 6H16a2 2 0 110 4h-5V9a1 1 0 10-2 0v1H4a2 2 0 110-4h1.17C5.06 5.687 5 5.35 5 5zm4 1V5a1 1 0 10-1 1h1zm3 0a1 1 0 10-1-1v1h1z" clipRule="evenodd" />
        <path d="M9 11H3v5a2 2 0 002 2h4v-7zM11 18h4a2 2 0 002-2v-5h-6v7z" />
      </svg>
    ),
    correction: (
      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
        <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
      </svg>
    ),
    fee: (
      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
      </svg>
    ),
    freeze: (
      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
      </svg>
    ),
    unfreeze: (
      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
      </svg>
    ),
    adjustment: (
      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
        <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
      </svg>
    ),
  };

  // Форматирование типа транзакции
  const getTypeInfo = (type: string): { label: string; color: string; icon: React.ReactNode } => {
    const types: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
      deposit: { label: 'Пополнение', color: 'text-emerald-400 bg-emerald-500/20', icon: TypeIcons.deposit },
      withdrawal: { label: 'Вывод', color: 'text-red-400 bg-red-500/20', icon: TypeIcons.withdrawal },
      payout: { label: 'Роялти', color: 'text-fuchsia-400 bg-fuchsia-500/20', icon: TypeIcons.payout },
      purchase: { label: 'Покупка', color: 'text-orange-400 bg-orange-500/20', icon: TypeIcons.purchase },
      refund: { label: 'Возврат', color: 'text-yellow-400 bg-yellow-500/20', icon: TypeIcons.refund },
      bonus: { label: 'Бонус', color: 'text-pink-400 bg-pink-500/20', icon: TypeIcons.bonus },
      correction: { label: 'Корректировка', color: 'text-cyan-400 bg-cyan-500/20', icon: TypeIcons.correction },
      adjustment: { label: 'Корректировка', color: 'text-cyan-400 bg-cyan-500/20', icon: TypeIcons.adjustment },
      fee: { label: 'Комиссия', color: 'text-zinc-400 bg-zinc-500/20', icon: TypeIcons.fee },
      freeze: { label: 'Заморозка', color: 'text-blue-400 bg-blue-500/20', icon: TypeIcons.freeze },
      unfreeze: { label: 'Разморозка', color: 'text-sky-400 bg-sky-500/20', icon: TypeIcons.unfreeze },
    };
    return types[type] || { label: type, color: 'text-zinc-400 bg-zinc-500/20', icon: TypeIcons.correction };
  };

  const getStatusBadge = (status: string): { label: string; color: string; icon: React.ReactNode } => {
    const statuses: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
      completed: { 
        label: 'Выполнено', 
        color: 'text-emerald-400 bg-emerald-500/20',
        icon: <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
      },
      pending: { 
        label: 'В обработке', 
        color: 'text-yellow-400 bg-yellow-500/20',
        icon: <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/></svg>
      },
      failed: { 
        label: 'Ошибка', 
        color: 'text-red-400 bg-red-500/20',
        icon: <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
      },
      cancelled: { 
        label: 'Отменено', 
        color: 'text-zinc-400 bg-zinc-500/20',
        icon: <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd"/></svg>
      },
    };
    return statuses[status] || statuses.pending;
  };

  // Кастомный календарь
  const MONTHS_RU = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
  const DAYS_RU = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  
  const getCalendarDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // День недели первого дня (0 = воскресенье, преобразуем в понедельник = 0)
    let startDay = firstDay.getDay() - 1;
    if (startDay < 0) startDay = 6;
    
    const days: (number | null)[] = [];
    
    // Дни предыдущего месяца
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
    
    // Дни текущего месяца
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    
    return days;
  };

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return 'Выбрать';
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const selectDate = (day: number, isFrom: boolean) => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    if (isFrom) {
      setDateFrom(dateStr);
      setShowDateFromPicker(false);
    } else {
      setDateTo(dateStr);
      setShowDateToPicker(false);
    }
    setCurrentPage(1);
  };

  const CustomDatePicker = ({ isFrom, value, show, onToggle }: { isFrom: boolean; value: string; show: boolean; onToggle: () => void }) => {
    const today = new Date();
    const selectedDate = value ? new Date(value) : null;
    
    return (
      <div className="relative">
        <button
          onClick={onToggle}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
            isLight 
              ? 'bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200' 
              : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
          } ${value ? (isLight ? 'text-[#6050ba] border-[#6050ba]/30' : 'text-[#9d8df1] border-[#9d8df1]/30') : ''}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>{formatDateDisplay(value)}</span>
          <svg className={`w-3 h-3 transition-transform ${show ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/>
          </svg>
        </button>
        
        {show && (
          <>
            {/* Backdrop для закрытия */}
            <div className="fixed inset-0 z-[100]" onClick={onToggle} />
            
            {/* Календарь */}
            <div className={`absolute top-full mt-2 left-0 z-[101] rounded-xl shadow-2xl p-4 min-w-[280px] ${
              isLight ? 'bg-white border border-gray-200' : 'bg-zinc-900 border border-white/10'
            }`}>
              {/* Заголовок с навигацией */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={(e) => { e.stopPropagation(); setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1)); }}
                  className={`p-2 rounded-lg transition ${isLight ? 'hover:bg-gray-100' : 'hover:bg-white/10'}`}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                </button>
                <div className={`font-bold ${isLight ? 'text-gray-800' : 'text-white'}`}>
                  {MONTHS_RU[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1)); }}
                  className={`p-2 rounded-lg transition ${isLight ? 'hover:bg-gray-100' : 'hover:bg-white/10'}`}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"/>
                  </svg>
                </button>
              </div>
              
              {/* Дни недели */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {DAYS_RU.map(day => (
                  <div key={day} className={`text-center text-xs font-medium py-1 ${isLight ? 'text-gray-400' : 'text-zinc-500'}`}>
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Дни месяца */}
              <div className="grid grid-cols-7 gap-1">
                {getCalendarDays(calendarMonth).map((day, idx) => {
                  if (day === null) {
                    return <div key={`empty-${idx}`} className="w-8 h-8" />;
                  }
                  
                  const isToday = today.getDate() === day && 
                    today.getMonth() === calendarMonth.getMonth() && 
                    today.getFullYear() === calendarMonth.getFullYear();
                  
                  const isSelected = selectedDate && 
                    selectedDate.getDate() === day && 
                    selectedDate.getMonth() === calendarMonth.getMonth() && 
                    selectedDate.getFullYear() === calendarMonth.getFullYear();
                  
                  return (
                    <button
                      key={day}
                      onClick={(e) => { e.stopPropagation(); selectDate(day, isFrom); }}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                        isSelected
                          ? 'bg-[#6050ba] text-white'
                          : isToday
                            ? isLight ? 'bg-[#6050ba]/10 text-[#6050ba]' : 'bg-[#6050ba]/20 text-[#9d8df1]'
                            : isLight
                              ? 'hover:bg-gray-100 text-gray-700'
                              : 'hover:bg-white/10 text-zinc-300'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
              
              {/* Кнопки */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/10">
                <button
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    if (isFrom) { setDateFrom(''); } else { setDateTo(''); }
                    onToggle();
                  }}
                  className={`text-xs font-medium ${isLight ? 'text-gray-500 hover:text-gray-700' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  Очистить
                </button>
                <button
                  onClick={(e) => { 
                    e.stopPropagation();
                    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                    if (isFrom) { setDateFrom(todayStr); } else { setDateTo(todayStr); }
                    onToggle();
                    setCurrentPage(1);
                  }}
                  className="text-xs font-medium text-[#6050ba] hover:text-[#7060ca]"
                >
                  Сегодня
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  // Копирование ID транзакции
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const copyTransactionId = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Уведомление */}
      {notification.show && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-4">
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

      {/* Заголовок с кнопками */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h2 className={`text-xl sm:text-2xl font-black flex items-center gap-2 ${isLight ? 'text-gray-800' : 'text-white'}`}>
            <svg className="w-6 h-6 sm:w-7 sm:h-7 text-[#6050ba]" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"/>
            </svg>
            <span className="hidden sm:inline">Все транзакции</span>
            <span className="sm:hidden">Транзакции</span>
          </h2>
          <p className={`text-xs sm:text-sm mt-1 ${isLight ? 'text-gray-500' : 'text-zinc-500'}`}>
            Лог финансовых операций
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => setShowStatsPanel(!showStatsPanel)}
            className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 min-h-[44px] ${
              showStatsPanel 
                ? 'bg-[#6050ba] text-white' 
                : 'bg-white/5 text-zinc-400 hover:bg-white/10 border border-white/10'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="hidden sm:inline">Статистика</span>
            <span className="sm:hidden">Стат.</span>
          </button>
          {currentUserRole === 'owner' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:from-emerald-400 hover:to-green-500 transition flex items-center justify-center gap-2 min-h-[44px]"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">Создать транзакцию</span>
              <span className="sm:hidden">Создать</span>
            </button>
          )}
        </div>
      </div>

      {/* Статистика */}
      {showStatsPanel && stats && (
        <div className={`rounded-2xl border p-5 ${
          isLight ? 'bg-white/50 border-white/60' : 'bg-white/[0.02] border-white/5'
        }`}>
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-[#6050ba]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Финансовая статистика
          </h3>
          
          {/* Основные метрики */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className={`p-4 rounded-xl ${isLight ? 'bg-emerald-50' : 'bg-emerald-500/10'}`}>
              <div className="text-xs text-emerald-400 mb-1">Общий баланс системы</div>
              <div className="text-xl font-black text-emerald-400">
                {stats.totalSystemBalance.toLocaleString('ru')} ₽
              </div>
            </div>
            <div className={`p-4 rounded-xl ${isLight ? 'bg-blue-50' : 'bg-blue-500/10'}`}>
              <div className="text-xs text-blue-400 mb-1">Всего транзакций</div>
              <div className="text-xl font-black text-blue-400">
                {stats.totalTransactions.toLocaleString('ru')}
              </div>
            </div>
            <div className={`p-4 rounded-xl ${isLight ? 'bg-yellow-50' : 'bg-yellow-500/10'}`}>
              <div className="text-xs text-yellow-400 mb-1">Ожидают вывода</div>
              <div className="text-xl font-black text-yellow-400">
                {stats.pendingWithdrawals.count} шт
              </div>
              <div className="text-xs text-yellow-400/60">
                {stats.pendingWithdrawals.sum.toLocaleString('ru')} ₽
              </div>
            </div>
            <div className={`p-4 rounded-xl ${isLight ? 'bg-purple-50' : 'bg-purple-500/10'}`}>
              <div className="text-xs text-purple-400 mb-1">Покупки</div>
              <div className="text-xl font-black text-purple-400">
                {(stats.byType?.purchase?.total || 0).toLocaleString('ru')} ₽
              </div>
            </div>
          </div>

          {/* По типам - красиво оформленные карточки */}
          <h4 className={`text-sm font-bold mb-3 ${isLight ? 'text-gray-600' : 'text-zinc-400'}`}>По типам операций</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {Object.entries(stats.byType || {}).map(([type, data]) => {
              const info = getTypeInfo(type);
              const isNegative = ['withdrawal', 'purchase', 'fee', 'freeze'].includes(type);
              return (
                <div 
                  key={type} 
                  className={`p-4 rounded-xl border transition-all hover:scale-[1.02] ${
                    isLight 
                      ? 'bg-white/70 border-white/80 shadow-sm' 
                      : 'bg-white/[0.03] border-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${info.color}`}>
                      {info.icon}
                    </div>
                    <span className={`text-sm font-bold ${isLight ? 'text-gray-700' : 'text-white'}`}>
                      {info.label}
                    </span>
                  </div>
                  <div className={`text-2xl font-black ${isLight ? 'text-gray-800' : 'text-white'}`}>
                    {data.count}
                  </div>
                  <div className={`text-sm font-medium ${isNegative ? 'text-red-400' : 'text-emerald-400'}`}>
                    {isNegative ? '−' : '+'}{data.total.toLocaleString('ru')} ₽
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Фильтры */}
      <div className="space-y-3">
        {/* Поиск */}
        <div className="relative">
          <input
            type="text"
            name="transaction-search-unique-12345"
            id="transaction-search-unique-12345"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            placeholder="Поиск по email, никнейму..."
            autoComplete="new-password"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            data-form-type="other"
            data-lpignore="true"
            data-1p-ignore="true"
            className={`w-full px-4 py-3 pl-10 rounded-xl text-sm outline-none transition min-h-[44px] ${
              isLight 
                ? 'bg-white border border-gray-200 focus:border-[#6050ba]' 
                : 'bg-black/30 border border-white/10 focus:border-[#6050ba]/50'
            }`}
          />
          <svg className="w-5 h-5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Фильтр по типу с иконками */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:overflow-visible sm:flex-wrap">
          {TRANSACTION_TYPES.map((t) => {
            const typeInfo = getTypeInfo(t.id);
            return (
              <button
                key={t.id}
                onClick={() => { setFilter(t.id); setCurrentPage(1); }}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap min-h-[40px] ${
                  filter === t.id
                    ? 'bg-[#6050ba] text-white'
                    : isLight 
                      ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      : 'bg-white/5 text-zinc-400 hover:bg-white/10'
                }`}
              >
                <span className={filter === t.id ? 'text-white' : typeInfo.color.split(' ')[0]}>
                  {t.id === 'all' ? (
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
                    </svg>
                  ) : typeInfo.icon}
                </span>
                <span className="hidden sm:inline">{t.label}</span>
                <span className="sm:hidden">{t.id === 'all' ? 'Все' : t.label.slice(0, 3)}</span>
              </button>
            );
          })}
        </div>

        {/* Даты и статус */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          {/* Кастомный выбор дат */}
          <div className={`flex items-center gap-2 p-1.5 rounded-xl flex-wrap sm:flex-nowrap ${
            isLight ? 'bg-white border border-gray-200' : 'bg-black/40 border border-white/10'
          }`}>
            <div className="flex items-center gap-1 flex-1 sm:flex-none min-w-0">
              <span className={`text-xs font-medium px-2 ${isLight ? 'text-gray-500' : 'text-zinc-400'}`}>От</span>
              <CustomDatePicker 
                isFrom={true} 
                value={dateFrom} 
                show={showDateFromPicker} 
                onToggle={() => { setShowDateFromPicker(!showDateFromPicker); setShowDateToPicker(false); setCalendarMonth(dateFrom ? new Date(dateFrom) : new Date()); }}
              />
            </div>
            <div className={`w-px h-6 hidden sm:block ${isLight ? 'bg-gray-200' : 'bg-white/10'}`} />
            <div className="flex items-center gap-1 flex-1 sm:flex-none min-w-0">
              <span className={`text-xs font-medium px-2 ${isLight ? 'text-gray-500' : 'text-zinc-400'}`}>До</span>
              <CustomDatePicker 
                isFrom={false} 
                value={dateTo} 
                show={showDateToPicker} 
                onToggle={() => { setShowDateToPicker(!showDateToPicker); setShowDateFromPicker(false); setCalendarMonth(dateTo ? new Date(dateTo) : new Date()); }}
              />
            </div>
            {(dateFrom || dateTo) && (
              <button
                onClick={() => { setDateFrom(''); setDateTo(''); setCurrentPage(1); }}
                className={`p-1.5 rounded-lg transition ${
                  isLight ? 'hover:bg-gray-100 text-gray-400' : 'hover:bg-white/10 text-zinc-500'
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                </svg>
              </button>
            )}
          </div>
          
          {/* Кастомные кнопки статусов */}
          <div className="flex items-center gap-1 overflow-x-auto flex-nowrap pb-1 sm:pb-0 sm:flex-wrap">
            {[
              { id: 'all', label: 'Все', icon: null },
              { id: 'completed', label: 'Выполнено', icon: getStatusBadge('completed').icon, color: 'text-emerald-400' },
              { id: 'pending', label: 'Ожидание', icon: getStatusBadge('pending').icon, color: 'text-yellow-400' },
              { id: 'failed', label: 'Ошибка', icon: getStatusBadge('failed').icon, color: 'text-red-400' },
              { id: 'cancelled', label: 'Отмена', icon: getStatusBadge('cancelled').icon, color: 'text-zinc-400' },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => { setStatusFilter(s.id); setCurrentPage(1); }}
                className={`px-2.5 py-2 sm:py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1 whitespace-nowrap min-h-[40px] sm:min-h-0 ${
                  statusFilter === s.id
                    ? 'bg-[#6050ba] text-white'
                    : isLight 
                      ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      : 'bg-white/5 text-zinc-400 hover:bg-white/10'
                }`}
              >
                {s.icon && <span className={statusFilter === s.id ? 'text-white' : s.color}>{s.icon}</span>}
                {s.label}
              </button>
            ))}
          </div>
          
          {(filter !== 'all' || statusFilter !== 'all' || dateFrom || dateTo || searchQuery) && (
            <button
              onClick={() => {
                setFilter('all');
                setStatusFilter('all');
                setDateFrom('');
                setDateTo('');
                setSearchQuery('');
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 transition flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
              </svg>
              Сбросить
            </button>
          )}
        </div>
      </div>

      {/* Список транзакций */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6050ba] mx-auto"></div>
          <div className={`mt-3 text-sm ${isLight ? 'text-gray-500' : 'text-zinc-500'}`}>Загрузка...</div>
        </div>
      ) : transactions.length === 0 ? (
        <div className={`text-center py-12 border border-dashed rounded-2xl ${
          isLight ? 'border-gray-200' : 'border-white/10'
        }`}>
          <svg className={`w-16 h-16 mx-auto mb-4 ${isLight ? 'text-gray-300' : 'text-zinc-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className={isLight ? 'text-gray-500' : 'text-zinc-500'}>Транзакции не найдены</p>
        </div>
      ) : (
        <>
          <div className={`text-xs mb-2 ${isLight ? 'text-gray-500' : 'text-zinc-500'}`}>
            Найдено: {totalCount.toLocaleString('ru')} транзакций
          </div>
          
          <div className="space-y-2">
            {transactions.map((tx) => {
              const typeInfo = getTypeInfo(tx.type);
              const statusInfo = getStatusBadge(tx.status);
              const isPositive = ['deposit', 'payout', 'bonus', 'refund', 'unfreeze'].includes(tx.type);
              
              return (
                <div
                  key={tx.id}
                  onClick={() => setSelectedTransaction(tx)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    selectedTransaction?.id === tx.id
                      ? 'bg-[#6050ba]/20 border-[#6050ba]/50'
                      : isLight
                        ? 'bg-white border-gray-100 hover:border-[#6050ba]/30'
                        : 'bg-white/[0.02] border-white/5 hover:border-[#6050ba]/30'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Аватар пользователя */}
                      <div 
                        className={`w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center text-sm font-bold ${
                          tx.user?.avatar ? 'bg-cover bg-center' : 'bg-[#6050ba]/20'
                        }`}
                        style={tx.user?.avatar ? { backgroundImage: `url(${tx.user.avatar})` } : {}}
                      >
                        {!tx.user?.avatar && (tx.user?.nickname?.[0]?.toUpperCase() || '?')}
                      </div>
                      
                      <div className="min-w-0 flex-1">
                        {/* Никнейм первым */}
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-sm font-bold truncate ${isLight ? 'text-gray-800' : 'text-white'}`}>
                            {tx.user?.nickname || tx.user?.display_name || 'Неизвестный'}
                          </span>
                          <span className={`text-xs truncate ${isLight ? 'text-gray-400' : 'text-zinc-500'}`}>
                            {tx.user?.email}
                          </span>
                        </div>
                        {/* Категории после никнейма */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold inline-flex items-center gap-1 ${typeInfo.color}`}>
                            {typeInfo.icon}
                            <span>{typeInfo.label}</span>
                          </span>
                          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-medium inline-flex items-center gap-1 ${statusInfo.color}`}>
                            {statusInfo.icon}
                            <span>{statusInfo.label}</span>
                          </span>
                        </div>
                        {tx.description && (
                          <div className={`text-xs truncate mt-1 ${isLight ? 'text-gray-400' : 'text-zinc-600'}`}>
                            {tx.description}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <div className={`text-lg font-black ${
                        isPositive ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {isPositive ? '+' : '−'}{tx.amount.toLocaleString('ru')} ₽
                      </div>
                      <div className={`text-[10px] ${isLight ? 'text-gray-500' : 'text-zinc-500'}`}>
                        {tx.balance_before.toLocaleString('ru')} → {tx.balance_after.toLocaleString('ru')} ₽
                      </div>
                      <div className={`text-[10px] mt-1 ${isLight ? 'text-[#6050ba]' : 'text-[#9d8df1]'}`}>
                        {new Date(tx.created_at).toLocaleString('ru-RU', {
                          day: '2-digit',
                          month: '2-digit', 
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Пагинация */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={`px-3 py-2 rounded-lg text-sm transition ${
                  currentPage === 1 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'hover:bg-white/10'
                } ${isLight ? 'bg-gray-100' : 'bg-white/5'}`}
              >
                ←
              </button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-2 rounded-lg text-sm transition ${
                      currentPage === pageNum
                        ? 'bg-[#6050ba] text-white'
                        : isLight 
                          ? 'bg-gray-100 hover:bg-gray-200'
                          : 'bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className={`px-3 py-2 rounded-lg text-sm transition ${
                  currentPage === totalPages 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'hover:bg-white/10'
                } ${isLight ? 'bg-gray-100' : 'bg-white/5'}`}
              >
                →
              </button>
            </div>
          )}
        </>
      )}

      {/* Модальное окно деталей транзакции - ПОРТАЛ В BODY */}
      {selectedTransaction && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-[99999] overflow-hidden"
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0,
            width: '100vw',
            height: '100vh'
          }}
        >
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-md" 
            onClick={() => { setSelectedTransaction(null); setShowDeleteConfirm(false); }}
          />
          {/* Контейнер по центру */}
          <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
            <div 
              className={`relative w-full max-w-lg rounded-2xl p-6 overflow-y-auto shadow-2xl pointer-events-auto ${
                isLight ? 'bg-white' : 'bg-zinc-900 border border-white/10'
              }`}
              onClick={e => e.stopPropagation()}
              style={{ maxHeight: '85vh' }}
            >
            <div className="flex justify-between items-start mb-5">
              <h3 className={`text-xl font-black flex items-center gap-2 ${isLight ? 'text-gray-800' : 'text-white'}`}>
                <svg className="w-6 h-6 text-[#6050ba]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm3 1h6v4H7V5zm6 6H7v2h6v-2z" clipRule="evenodd"/>
                </svg>
                Детали транзакции
              </h3>
              <button 
                onClick={() => { setSelectedTransaction(null); setShowDeleteConfirm(false); }} 
                className={`p-2 rounded-lg transition ${isLight ? 'hover:bg-gray-100 text-gray-500' : 'hover:bg-white/10 text-zinc-400'}`}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Пользователь */}
              <div className={`p-4 rounded-xl ${isLight ? 'bg-gray-50 border border-gray-100' : 'bg-white/5 border border-white/5'}`}>
                <div className="flex items-center gap-3">
                  <div 
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold ${
                      selectedTransaction.user?.avatar ? 'bg-cover bg-center' : 'bg-[#6050ba]/20 text-[#9d8df1]'
                    }`}
                    style={selectedTransaction.user?.avatar ? { backgroundImage: `url(${selectedTransaction.user.avatar})` } : {}}
                  >
                    {!selectedTransaction.user?.avatar && (selectedTransaction.user?.nickname?.[0]?.toUpperCase() || '?')}
                  </div>
                  <div className="flex-1">
                    <div className={`font-bold ${isLight ? 'text-gray-800' : 'text-white'}`}>{selectedTransaction.user?.nickname || selectedTransaction.user?.display_name}</div>
                    <div className={`text-xs ${isLight ? 'text-gray-500' : 'text-zinc-500'}`}>{selectedTransaction.user?.email}</div>
                  </div>
                </div>
              </div>

              {/* Основная информация */}
              <div className="grid grid-cols-2 gap-4">
                <div className={`p-3 rounded-xl ${isLight ? 'bg-gray-50' : 'bg-white/5'}`}>
                  <div className={`text-xs mb-2 ${isLight ? 'text-gray-400' : 'text-zinc-500'}`}>Тип операции</div>
                  <div className={`px-3 py-1.5 rounded-lg text-sm font-bold inline-flex items-center gap-1.5 ${getTypeInfo(selectedTransaction.type).color}`}>
                    {getTypeInfo(selectedTransaction.type).icon}
                    <span>{getTypeInfo(selectedTransaction.type).label}</span>
                  </div>
                </div>
                <div className={`p-3 rounded-xl ${isLight ? 'bg-gray-50' : 'bg-white/5'}`}>
                  <div className={`text-xs mb-2 ${isLight ? 'text-gray-400' : 'text-zinc-500'}`}>Статус</div>
                  <div className={`px-3 py-1.5 rounded-lg text-sm font-bold inline-flex items-center gap-1.5 ${getStatusBadge(selectedTransaction.status).color}`}>
                    {getStatusBadge(selectedTransaction.status).icon}
                    <span>{getStatusBadge(selectedTransaction.status).label}</span>
                  </div>
                </div>
              </div>

              {/* Сумма и баланс */}
              <div className={`p-4 rounded-xl ${isLight ? 'bg-gray-50' : 'bg-white/5'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className={`text-sm ${isLight ? 'text-gray-500' : 'text-zinc-400'}`}>Сумма операции</div>
                  <div className={`text-2xl font-black ${['deposit', 'payout', 'bonus', 'refund', 'unfreeze'].includes(selectedTransaction.type) ? 'text-emerald-400' : 'text-red-400'}`}>
                    {['deposit', 'payout', 'bonus', 'refund', 'unfreeze'].includes(selectedTransaction.type) ? '+' : '−'}{selectedTransaction.amount.toLocaleString('ru')} {selectedTransaction.currency}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className={`text-sm ${isLight ? 'text-gray-500' : 'text-zinc-400'}`}>Изменение баланса</div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className={isLight ? 'text-gray-600' : 'text-zinc-400'}>{selectedTransaction.balance_before.toLocaleString('ru')} ₽</span>
                    <svg className="w-4 h-4 text-[#6050ba]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"/>
                    </svg>
                    <span className={`font-bold ${isLight ? 'text-gray-800' : 'text-white'}`}>{selectedTransaction.balance_after.toLocaleString('ru')} ₽</span>
                  </div>
                </div>
              </div>

              {/* Дата и время */}
              <div className={`p-4 rounded-xl ${isLight ? 'bg-[#6050ba]/5' : 'bg-[#6050ba]/10'}`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#6050ba]/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-[#9d8df1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <div className={`text-xs ${isLight ? 'text-gray-500' : 'text-zinc-500'}`}>Дата и время</div>
                    <div className={`font-bold ${isLight ? 'text-[#6050ba]' : 'text-[#9d8df1]'}`}>
                      {new Date(selectedTransaction.created_at).toLocaleString('ru-RU', {
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

              {/* Описание */}
              {selectedTransaction.description && (
                <div className={`p-3 rounded-xl ${isLight ? 'bg-gray-50' : 'bg-white/5'}`}>
                  <div className={`text-xs mb-1 ${isLight ? 'text-gray-400' : 'text-zinc-500'}`}>Описание</div>
                  <div className={`text-sm ${isLight ? 'text-gray-700' : 'text-zinc-300'}`}>{selectedTransaction.description}</div>
                </div>
              )}

              {/* Админ */}
              {selectedTransaction.admin && (
                <div className={`p-3 rounded-xl ${isLight ? 'bg-gray-50' : 'bg-white/5'}`}>
                  <div className={`text-xs mb-1 ${isLight ? 'text-gray-400' : 'text-zinc-500'}`}>Обработал</div>
                  <div className={`text-sm ${isLight ? 'text-gray-700' : 'text-zinc-300'}`}>{selectedTransaction.admin.display_name || selectedTransaction.admin.email}</div>
                </div>
              )}

              {selectedTransaction.admin_comment && (
                <div className={`p-3 rounded-xl ${isLight ? 'bg-yellow-50 border border-yellow-200' : 'bg-yellow-500/10 border border-yellow-500/20'}`}>
                  <div className={`text-xs mb-1 ${isLight ? 'text-yellow-600' : 'text-yellow-500'}`}>Комментарий админа</div>
                  <div className={`text-sm italic ${isLight ? 'text-yellow-700' : 'text-yellow-400'}`}>{selectedTransaction.admin_comment}</div>
                </div>
              )}

              {/* Метаданные */}
              {selectedTransaction.metadata && Object.keys(selectedTransaction.metadata).length > 0 && (
                <div className={`p-3 rounded-xl ${isLight ? 'bg-gray-50' : 'bg-white/5'}`}>
                  <div className={`text-xs mb-2 ${isLight ? 'text-gray-400' : 'text-zinc-500'}`}>Метаданные</div>
                  <pre className={`text-xs p-2 rounded-lg overflow-auto max-h-24 ${
                    isLight ? 'bg-gray-100 text-gray-600' : 'bg-black/30 text-zinc-400'
                  }`}>
                    {JSON.stringify(selectedTransaction.metadata, null, 2)}
                  </pre>
                </div>
              )}

              {/* ID транзакции с копированием */}
              <div className={`p-4 rounded-xl ${isLight ? 'bg-gray-50' : 'bg-white/5'}`}>
                <div className={`text-xs mb-2 ${isLight ? 'text-gray-400' : 'text-zinc-500'}`}>ID транзакции</div>
                <button 
                  onClick={() => copyTransactionId(selectedTransaction.id)}
                  className={`w-full text-xs font-mono px-3 py-2 rounded-lg transition-all flex items-center justify-between ${
                    copiedId === selectedTransaction.id
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : isLight 
                        ? 'bg-white border border-gray-200 text-gray-600 hover:border-[#6050ba] hover:text-[#6050ba]'
                        : 'bg-black/30 border border-white/10 text-zinc-400 hover:border-[#6050ba]/50 hover:text-[#9d8df1]'
                  }`}
                >
                  <span className="truncate">{selectedTransaction.id}</span>
                  {copiedId === selectedTransaction.id ? (
                    <svg className="w-4 h-4 flex-shrink-0 ml-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 flex-shrink-0 ml-2" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"/>
                      <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z"/>
                    </svg>
                  )}
                </button>
              </div>

              {/* Кнопка удаления - только для Owner */}
              {currentUserRole === 'owner' && (
                <div className="pt-3 border-t border-red-500/20">
                  {!showDeleteConfirm && (
                    <button
                      onClick={handleHideTransaction}
                      className="w-full mb-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-zinc-300 hover:bg-white/10 transition-all flex items-center justify-center gap-2 font-bold"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M4 4h12v2H4V4zm0 5h8v2H4V9zm0 5h12v2H4v-2z" />
                      </svg>
                      Скрыть (без изменения баланса)
                    </button>
                  )}
                  {!showDeleteConfirm ? (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="w-full px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 transition-all flex items-center justify-center gap-2 font-bold"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"/>
                      </svg>
                      Отменить транзакцию (реверс)
                    </button>
                  ) : (
                    <div className={`p-4 rounded-xl ${isLight ? 'bg-red-50 border border-red-200' : 'bg-red-500/10 border border-red-500/30'}`}>
                      <div className="flex items-start gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                          </svg>
                        </div>
                        <div>
                          <div className={`font-bold mb-1 ${isLight ? 'text-red-700' : 'text-red-400'}`}>
                            Подтвердите отмену
                          </div>
                          <div className={`text-sm ${isLight ? 'text-red-600' : 'text-red-400/80'}`}>
                            Транзакция будет отменена (удалена) и баланс пользователя будет скорректирован на{' '}
                            <span className="font-bold">
                              {['deposit', 'payout', 'bonus', 'refund', 'unfreeze'].includes(selectedTransaction.type) 
                                ? `−${selectedTransaction.amount}` 
                                : `+${selectedTransaction.amount}`} ₽
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowDeleteConfirm(false)}
                          disabled={deleteLoading}
                          className={`flex-1 px-4 py-2.5 rounded-lg font-bold transition-all ${
                            isLight 
                              ? 'bg-gray-100 hover:bg-gray-200 text-gray-700' 
                              : 'bg-white/10 hover:bg-white/20 text-white'
                          }`}
                        >
                          Отмена
                        </button>
                        <button
                          onClick={handleDeleteTransaction}
                          disabled={deleteLoading}
                          className="flex-1 px-4 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {deleteLoading ? (
                            <>
                              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                              </svg>
                              Удаление...
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"/>
                              </svg>
                              Удалить
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Модальное окно создания транзакции - ПОРТАЛ В BODY */}
      {showCreateModal && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-[99999] overflow-hidden"
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }}
        >
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-md" 
            onClick={() => setShowCreateModal(false)}
          />
          {/* Центрирование */}
          <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
            <div 
              className={`w-full max-w-md rounded-2xl p-6 shadow-2xl overflow-y-auto pointer-events-auto ${
                isLight ? 'bg-white' : 'bg-zinc-900 border border-white/10'
              }`}
              onClick={e => e.stopPropagation()}
              style={{ maxHeight: '85vh' }}
            >
            <div className="flex justify-between items-start mb-4">
              <h3 className={`text-lg font-bold flex items-center gap-2 ${isLight ? 'text-gray-800' : 'text-white'}`}>
                <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Создать транзакцию
              </h3>
              <button onClick={() => setShowCreateModal(false)} className={`${isLight ? 'text-gray-400 hover:text-gray-600' : 'text-zinc-500 hover:text-white'}`}>✕</button>
            </div>
            
            <div className="space-y-4">
              {/* Поиск пользователя */}
              <div>
                <label className={`text-xs block mb-1 ${isLight ? 'text-gray-500' : 'text-zinc-500'}`}>
                  Пользователь *
                </label>
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => {
                    setUserSearch(e.target.value);
                    searchUsers(e.target.value);
                  }}
                  placeholder="Поиск по email, никнейму..."
                  className={`w-full px-4 py-2 rounded-xl text-sm outline-none ${
                    isLight 
                      ? 'bg-gray-50 border border-gray-200 focus:border-[#6050ba] text-gray-800 placeholder:text-gray-400' 
                      : 'bg-black/30 border border-white/10 focus:border-[#6050ba]/50 text-white placeholder:text-zinc-500'
                  }`}
                />
                {userSearchResults.length > 0 && (
                  <div className={`mt-2 rounded-xl overflow-hidden border ${
                    isLight ? 'border-gray-200' : 'border-white/10'
                  }`}>
                    {userSearchResults.map(u => (
                      <button
                        key={u.id}
                        onClick={() => {
                          setCreateForm(f => ({ ...f, userId: u.id }));
                          setUserSearch(`${u.nickname || u.display_name} (${u.email})`);
                          setUserSearchResults([]);
                        }}
                        className={`w-full p-3 text-left text-sm flex items-center gap-3 transition ${
                          isLight 
                            ? 'hover:bg-gray-50' 
                            : 'hover:bg-white/5'
                        }`}
                      >
                        <div 
                          className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                            u.avatar ? 'bg-cover bg-center' : 'bg-[#6050ba]/20'
                          }`}
                          style={u.avatar ? { backgroundImage: `url(${u.avatar})` } : {}}
                        >
                          {!u.avatar && (u.nickname?.[0]?.toUpperCase() || '?')}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`font-bold truncate ${isLight ? 'text-gray-800' : 'text-white'}`}>{u.nickname || u.display_name}</div>
                          <div className={`text-xs truncate ${isLight ? 'text-gray-500' : 'text-zinc-500'}`}>{u.email}</div>
                        </div>
                        <div className="text-xs font-bold text-emerald-400">
                          {parseFloat(u.balance || 0).toLocaleString('ru')} ₽
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Тип транзакции - красивые кнопки */}
              <div>
                <label className={`text-xs block mb-2 ${isLight ? 'text-gray-500' : 'text-zinc-500'}`}>
                  Тип операции *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'bonus', label: 'Бонус', icon: TypeIcons.bonus, color: 'text-pink-400 bg-pink-500/20', desc: 'Начисление бонуса' },
                    { id: 'payout', label: 'Роялти', icon: TypeIcons.payout, color: 'text-fuchsia-400 bg-fuchsia-500/20', desc: 'Выплата роялти' },
                    { id: 'refund', label: 'Возврат', icon: TypeIcons.refund, color: 'text-yellow-400 bg-yellow-500/20', desc: 'Возврат средств' },
                    { id: 'adjustment', label: 'Корректировка', icon: TypeIcons.adjustment, color: 'text-cyan-400 bg-cyan-500/20', desc: '± баланс' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setCreateForm(f => ({ ...f, type: t.id }))}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        createForm.type === t.id
                          ? 'border-[#6050ba] bg-[#6050ba]/10'
                          : isLight 
                            ? 'border-gray-200 hover:border-gray-300 bg-gray-50'
                            : 'border-white/10 hover:border-white/20 bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${t.color}`}>
                          {t.icon}
                        </div>
                        <span className={`font-bold text-sm ${
                          createForm.type === t.id 
                            ? (isLight ? 'text-[#6050ba]' : 'text-[#9d8df1]')
                            : (isLight ? 'text-gray-700' : 'text-white')
                        }`}>
                          {t.label}
                        </span>
                      </div>
                      <div className={`text-[10px] ${isLight ? 'text-gray-400' : 'text-zinc-500'}`}>
                        {t.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Сумма */}
              <div>
                <label className={`text-xs block mb-1 ${isLight ? 'text-gray-500' : 'text-zinc-500'}`}>
                  Сумма (₽) * {createForm.type === 'adjustment' && '(может быть отрицательной)'}
                </label>
                <input
                  type="number"
                  value={createForm.amount}
                  onChange={(e) => setCreateForm(f => ({ ...f, amount: e.target.value }))}
                  placeholder={createForm.type === 'adjustment' ? '-500 или 500' : '1000'}
                  className={`w-full px-4 py-2 rounded-xl text-sm outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                    isLight 
                      ? 'bg-gray-50 border border-gray-200 focus:border-[#6050ba] text-gray-800 placeholder:text-gray-400' 
                      : 'bg-black/30 border border-white/10 focus:border-[#6050ba]/50 text-white placeholder:text-zinc-500'
                  }`}
                />
              </div>

              {/* Описание */}
              <div>
                <label className={`text-xs block mb-1 ${isLight ? 'text-gray-500' : 'text-zinc-500'}`}>
                  Описание
                </label>
                <input
                  type="text"
                  value={createForm.description}
                  onChange={(e) => setCreateForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Причина начисления..."
                  className={`w-full px-4 py-2 rounded-xl text-sm outline-none ${
                    isLight 
                      ? 'bg-gray-50 border border-gray-200 focus:border-[#6050ba] text-gray-800 placeholder:text-gray-400' 
                      : 'bg-black/30 border border-white/10 focus:border-[#6050ba]/50 text-white placeholder:text-zinc-500'
                  }`}
                />
              </div>

              {/* Комментарий админа */}
              <div>
                <label className={`text-xs block mb-1 ${isLight ? 'text-gray-500' : 'text-zinc-500'}`}>
                  Внутренний комментарий
                </label>
                <textarea
                  value={createForm.adminComment}
                  onChange={(e) => setCreateForm(f => ({ ...f, adminComment: e.target.value }))}
                  placeholder="Виден только админам..."
                  rows={2}
                  className={`w-full px-4 py-2 rounded-xl text-sm outline-none resize-none ${
                    isLight 
                      ? 'bg-gray-50 border border-gray-200 focus:border-[#6050ba] text-gray-800 placeholder:text-gray-400' 
                      : 'bg-black/30 border border-white/10 focus:border-[#6050ba]/50 text-white placeholder:text-zinc-500'
                  }`}
                />
              </div>

              {/* Кнопки */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className={`flex-1 py-2.5 rounded-xl font-bold transition ${
                    isLight 
                      ? 'bg-gray-100 hover:bg-gray-200 text-gray-600' 
                      : 'bg-white/5 hover:bg-white/10 text-zinc-400'
                  }`}
                >
                  Отмена
                </button>
                <button
                  onClick={handleCreateTransaction}
                  disabled={createLoading || !createForm.userId || !createForm.amount}
                  className={`flex-1 py-2.5 rounded-xl font-bold transition ${
                    createLoading || !createForm.userId || !createForm.amount
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:from-emerald-400 hover:to-green-500'
                  }`}
                >
                  {createLoading ? 'Создание...' : 'Создать'}
                </button>
              </div>
            </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
