'use client';
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../../lib/supabase';
import { useTheme } from '@/contexts/ThemeContext';

interface WithdrawalFormProps {
  userId: string;
  balance: number;
  frozenBalance?: number;
  onClose: () => void;
  onSuccess: (newBalance: number) => void;
  showNotification: (message: string, type: 'success' | 'error') => void;
  reloadRequests: () => void;
}

// Популярные банки (красивые мягкие градиенты)
const BANKS = [
  { name: 'Сбербанк', color: 'from-green-400/40 to-emerald-500/30', border: 'border-green-400/40' },
  { name: 'Тинькофф', color: 'from-yellow-400/35 to-amber-500/25', border: 'border-yellow-400/40' },
  { name: 'Альфа-Банк', color: 'from-red-400/35 to-rose-500/25', border: 'border-red-400/40' },
  { name: 'ВТБ', color: 'from-blue-400/35 to-indigo-500/25', border: 'border-blue-400/40' },
  { name: 'Райффайзен', color: 'from-amber-400/30 to-yellow-500/20', border: 'border-amber-400/35' },
  { name: 'Другой', color: 'from-zinc-400/30 to-slate-500/20', border: 'border-zinc-400/30' },
];

// Быстрые суммы
const QUICK_AMOUNTS = [1000, 5000, 10000, 25000, 50000];

export default function WithdrawalForm({
  userId,
  balance,
  frozenBalance = 0,
  onClose,
  onSuccess,
  showNotification,
  reloadRequests,
}: WithdrawalFormProps) {
  const { themeName } = useTheme();
  const isLight = themeName === 'light';
  const [step, setStep] = useState(1); // 1 - сумма, 2 - реквизиты, 3 - подтверждение
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [bankName, setBankName] = useState('');
  const [customBank, setCustomBank] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const availableBalance = balance - frozenBalance;
  const amount = Number(withdrawalAmount) || 0;
  const selectedBank = bankName === 'Другой' ? customBank : bankName;

  // Безопасное закрытие с восстановлением скролла
  const handleClose = () => {
    document.body.style.overflow = '';
    onClose();
  };
  // Форматирование карты
  const formatCard = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const handleSubmit = async () => {
    if (!supabase || !userId) {
      showNotification('Необходима авторизация', 'error');
      return;
    }
    
    setLoading(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        showNotification('Необходима авторизация', 'error');
        setLoading(false);
        return;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 сек таймаут

      const response = await fetch('/api/withdrawals/v2', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount,
          bankName: selectedBank.trim(),
          cardNumber: cardNumber.replace(/\s/g, '').trim(),
          recipientName: recipientName.trim(),
          method: 'card'
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Ошибка создания заявки');
      }

      onSuccess(data.newBalance || (balance - amount));
      showNotification(`✓ Заявка на ${amount.toLocaleString('ru')} ₽ создана!`, 'success');
      handleClose();
      reloadRequests();
    } catch (e: any) {
      if (e.name === 'AbortError') {
        showNotification('Превышено время ожидания. Попробуйте ещё раз.', 'error');
      } else {
        showNotification(e.message || 'Ошибка', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  // Проверки для шагов
  const canGoStep2 = amount >= 1000 && amount <= availableBalance;
  const canGoStep3 = selectedBank.trim() && cardNumber.replace(/\s/g, '').length >= 16 && recipientName.trim();
  const canSubmit = agreed && canGoStep2 && canGoStep3;

  // Portal для рендера в body
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    // Блокируем скролл body
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className={`absolute inset-0 backdrop-blur-sm ${isLight ? 'bg-black/50' : 'bg-black/80'}`} onClick={handleClose} />
      
      {/* Modal */}
      <div className={`relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden ${
        isLight 
          ? 'bg-white border border-gray-200' 
          : 'bg-gradient-to-b from-zinc-900 to-black border border-white/10'
      }`}>
        {/* Header с градиентом */}
        <div className={`relative px-5 py-4 border-b ${
          isLight 
            ? 'bg-gradient-to-r from-emerald-50 via-green-50 to-teal-50 border-gray-200' 
            : 'bg-gradient-to-r from-emerald-500/20 via-green-500/10 to-teal-500/20 border-white/10'
        }`}>
          <div className={`absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.05)_1px,transparent_0)] bg-[length:20px_20px] ${isLight ? 'opacity-0' : 'opacity-50'}`} />
          
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" x2="21" y1="22" y2="22"/>
                  <line x1="6" x2="6" y1="18" y2="11"/>
                  <line x1="10" x2="10" y1="18" y2="11"/>
                  <line x1="14" x2="14" y1="18" y2="11"/>
                  <line x1="18" x2="18" y1="18" y2="11"/>
                  <polygon points="12 2 20 7 4 7"/>
                </svg>
              </div>
              <div>
                <h2 className={`text-lg font-bold ${isLight ? 'text-gray-800' : 'text-white'}`}>Вывод средств</h2>
                <p className={`text-xs ${isLight ? 'text-emerald-600' : 'text-emerald-300/70'}`}>Шаг {step} из 3</p>
              </div>
            </div>
            <button 
              onClick={handleClose}
              className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:rotate-90 duration-300 ${
                isLight ? 'bg-gray-100 hover:bg-gray-200 text-gray-600' : 'bg-white/5 hover:bg-white/10 text-white'
              }`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>

          {/* Progress bar */}
          <div className="flex gap-1.5 mt-3">
            {[1, 2, 3].map((s) => (
              <div 
                key={s} 
                className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                  s <= step ? 'bg-emerald-400' : (isLight ? 'bg-gray-200' : 'bg-white/10')
                }`}
              />
            ))}
          </div>
        </div>

        {/* Доступный баланс */}
        <div className={`px-5 py-3 border-b ${
          isLight 
            ? 'bg-gray-50 border-gray-100' 
            : 'bg-gradient-to-r from-white/[0.02] to-transparent border-white/5'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs ${isLight ? 'text-gray-500' : 'text-zinc-400'}`}>Доступно:</span>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">
                {availableBalance.toLocaleString('ru')}
              </span>
              <span className="text-emerald-400 font-bold text-sm">₽</span>
            </div>
          </div>
          {frozenBalance > 0 && (
            <div className="text-[10px] text-yellow-500/70 mt-0.5 flex items-center gap-1">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
              </svg>
              Заморожено: {frozenBalance.toLocaleString('ru')} ₽
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Шаг 1: Сумма */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isLight ? 'text-gray-700' : 'text-zinc-300'}`}>
                  Сумма вывода
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={withdrawalAmount ? Number(withdrawalAmount).toLocaleString('ru') : ''}
                    onChange={(e) => setWithdrawalAmount(e.target.value.replace(/\D/g, ''))}
                    placeholder="Введите сумму"
                    className={`w-full px-5 py-4 text-3xl font-black text-center border-2 rounded-2xl outline-none transition-all placeholder:text-xl placeholder:font-normal ${
                      isLight 
                        ? 'text-gray-800 bg-gray-50 border-gray-200 focus:border-emerald-400 placeholder:text-gray-400' 
                        : 'text-white bg-black/40 border-white/10 focus:border-emerald-500/50 placeholder:text-zinc-600'
                    }`}
                  />
                  <span className={`absolute right-5 top-1/2 -translate-y-1/2 text-2xl font-bold ${isLight ? 'text-gray-400' : 'text-zinc-500'}`}>₽</span>
                </div>
                
                {/* Быстрый выбор */}
                <div className="flex flex-wrap gap-2 mt-4">
                  {QUICK_AMOUNTS.filter(a => a <= availableBalance).map((a) => (
                    <button
                      key={a}
                      onClick={() => setWithdrawalAmount(a.toString())}
                      className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                        amount === a
                          ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                          : isLight 
                            ? 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800' 
                            : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {a.toLocaleString('ru')} ₽
                    </button>
                  ))}
                  {availableBalance >= 1000 && (
                    <button
                      onClick={() => setWithdrawalAmount(availableBalance.toString())}
                      className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                        amount === availableBalance
                          ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg'
                          : isLight
                            ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200'
                            : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30'
                      }`}
                    >
                      Всё
                    </button>
                  )}
                </div>

                {/* Ошибки */}
                {amount > 0 && amount < 1000 && (
                  <div className="mt-4 p-3 bg-orange-500/10 border border-orange-500/30 rounded-xl text-orange-400 text-sm flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                    </svg>
                    Минимальная сумма: 1 000 ₽
                  </div>
                )}
                {amount > availableBalance && (
                  <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                    </svg>
                    Недостаточно средств
                  </div>
                )}
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!canGoStep2}
                className="w-full py-4 rounded-2xl font-bold text-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg shadow-emerald-500/30 disabled:shadow-none"
              >
                Продолжить
              </button>
            </div>
          )}

          {/* Шаг 2: Реквизиты */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              {/* Выбор банка */}
              <div>
                <label className={`block text-sm font-medium mb-3 ${isLight ? 'text-gray-700' : 'text-zinc-300'}`}>
                  Выберите банк
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {BANKS.map((bank) => (
                    <button
                      key={bank.name}
                      onClick={() => setBankName(bank.name)}
                      className={`p-3 rounded-xl text-xs font-bold transition-all duration-200 ${
                        bankName === bank.name
                          ? `bg-gradient-to-br ${bank.color} text-white border ${bank.border} shadow-md`
                          : isLight
                            ? 'bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-800 border border-gray-200 hover:border-gray-300'
                            : 'bg-white/[0.03] text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-300 border border-white/[0.08] hover:border-white/15'
                      }`}
                    >
                      {bank.name}
                    </button>
                  ))}
                </div>
                {bankName === 'Другой' && (
                  <input
                    value={customBank}
                    onChange={(e) => setCustomBank(e.target.value)}
                    placeholder="Введите название банка"
                    className={`w-full mt-3 px-4 py-3 rounded-xl outline-none transition ${
                      isLight
                        ? 'bg-gray-50 border border-gray-200 focus:border-emerald-400 text-gray-800 placeholder:text-gray-400'
                        : 'bg-black/40 border border-white/10 focus:border-emerald-500/50 text-white placeholder:text-zinc-500'
                    }`}
                  />
                )}
              </div>

              {/* Номер карты */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isLight ? 'text-gray-700' : 'text-zinc-300'}`}>
                  Номер карты
                </label>
                <input
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCard(e.target.value))}
                  placeholder="0000 0000 0000 0000"
                  maxLength={19}
                  className={`w-full px-4 py-4 rounded-xl outline-none transition text-lg font-mono tracking-widest ${
                    isLight
                      ? 'bg-gray-50 border border-gray-200 focus:border-emerald-400 text-gray-800 placeholder:text-gray-400'
                      : 'bg-black/40 border border-white/10 focus:border-emerald-500/50 text-white placeholder:text-zinc-500'
                  }`}
                />
              </div>

              {/* ФИО */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isLight ? 'text-gray-700' : 'text-zinc-300'}`}>
                  ФИО получателя (как на карте)
                </label>
                <input
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value.replace(/[^a-zA-Zа-яА-ЯёЁ\s-]/g, ''))}
                  placeholder="IVAN IVANOV"
                  className={`w-full px-4 py-4 rounded-xl outline-none transition uppercase ${
                    isLight
                      ? 'bg-gray-50 border border-gray-200 focus:border-emerald-400 text-gray-800 placeholder:text-gray-400'
                      : 'bg-black/40 border border-white/10 focus:border-emerald-500/50 text-white placeholder:text-zinc-500'
                  }`}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setStep(1)}
                  className={`flex-1 py-4 rounded-xl font-bold transition border ${
                    isLight
                      ? 'bg-gray-100 hover:bg-gray-200 border-gray-200 text-gray-700'
                      : 'bg-white/5 hover:bg-white/10 border-white/10 text-white'
                  }`}
                >
                  Назад
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!canGoStep3}
                  className="flex-1 py-4 rounded-xl font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-lg shadow-emerald-500/30 disabled:shadow-none"
                  style={{ color: 'white' }}
                >
                  Далее
                </button>
              </div>
            </div>
          )}

          {/* Шаг 3: Подтверждение */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              {/* Превью */}
              <div className={`p-4 rounded-xl border ${
                isLight
                  ? 'bg-emerald-50 border-emerald-200'
                  : 'bg-gradient-to-br from-emerald-500/10 to-green-500/5 border-emerald-500/30'
              }`}>
                <div className={`text-xs mb-1 ${isLight ? 'text-emerald-600' : 'text-emerald-300'}`}>Сумма к выводу</div>
                <div className={`text-3xl font-bold ${isLight ? 'text-gray-800' : 'text-white'}`}>
                  {amount.toLocaleString('ru')} <span className="text-emerald-500">₽</span>
                </div>
              </div>

              {/* Детали - компактные */}
              <div className="space-y-2">
                <div className={`flex justify-between items-center py-2 px-3 rounded-lg text-sm ${
                  isLight ? 'bg-gray-50' : 'bg-white/[0.02]'
                }`}>
                  <span className={isLight ? 'text-gray-500' : 'text-zinc-500'}>Банк</span>
                  <span className={`font-medium ${isLight ? 'text-gray-800' : 'text-white'}`}>{selectedBank}</span>
                </div>
                <div className={`flex justify-between items-center py-2 px-3 rounded-lg text-sm ${
                  isLight ? 'bg-gray-50' : 'bg-white/[0.02]'
                }`}>
                  <span className={isLight ? 'text-gray-500' : 'text-zinc-500'}>Карта</span>
                  <span className={`font-mono ${isLight ? 'text-gray-800' : 'text-white'}`}>**** {cardNumber.slice(-4)}</span>
                </div>
                <div className={`flex justify-between items-center py-2 px-3 rounded-lg text-sm ${
                  isLight ? 'bg-gray-50' : 'bg-white/[0.02]'
                }`}>
                  <span className={isLight ? 'text-gray-500' : 'text-zinc-500'}>Получатель</span>
                  <span className={`font-medium uppercase text-xs ${isLight ? 'text-gray-800' : 'text-white'}`}>{recipientName}</span>
                </div>
                <div className={`flex justify-between items-center py-2 px-3 rounded-lg text-sm ${
                  isLight ? 'bg-gray-50' : 'bg-white/[0.02]'
                }`}>
                  <span className={isLight ? 'text-gray-500' : 'text-zinc-500'}>Комиссия</span>
                  <span className="font-medium text-emerald-500">0 ₽</span>
                </div>
              </div>

              {/* Согласие */}
              <label className={`flex items-start gap-2.5 cursor-pointer p-3 rounded-lg border transition ${
                isLight
                  ? 'bg-gray-50 border-gray-200 hover:border-gray-300'
                  : 'bg-white/[0.02] border-white/5 hover:border-white/10'
              }`}>
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className={`w-4 h-4 mt-0.5 rounded text-emerald-500 focus:ring-emerald-500 ${
                    isLight ? 'border-gray-300 bg-white' : 'border-zinc-600 bg-black/50'
                  }`}
                />
                <span className={`text-xs leading-relaxed ${isLight ? 'text-gray-600' : 'text-zinc-400'}`}>
                  Подтверждаю корректность реквизитов. Средства заморозятся на 1-3 рабочих дня.
                </span>
              </label>

              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setStep(2)}
                  className={`flex-1 py-4 rounded-xl font-bold transition border ${
                    isLight
                      ? 'bg-gray-100 hover:bg-gray-200 border-gray-200 text-gray-700'
                      : 'bg-white/5 hover:bg-white/10 border-white/10 text-white'
                  }`}
                >
                  Назад
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit || loading}
                  className="flex-1 py-4 rounded-xl font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg shadow-emerald-500/30 disabled:shadow-none flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Отправка...
                    </>
                  ) : (
                    <>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                        <polyline points="22 4 12 14.01 9 11.01"/>
                      </svg>
                      Подтвердить вывод
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Рендерим через Portal в body для центрирования по всему экрану
  if (!mounted) return null;
  
  return createPortal(modalContent, document.body);
}
