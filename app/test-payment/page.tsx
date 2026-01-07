'use client';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

function TestPaymentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { themeName } = useTheme();
  const isLight = themeName === 'light';
  
  const orderId = searchParams.get('order_id');
  const amount = searchParams.get('amount');
  const method = searchParams.get('method');
  
  const [status, setStatus] = useState<'pending' | 'processing' | 'success' | 'error'>('pending');
  const [countdown, setCountdown] = useState(3);
  const [errorMessage, setErrorMessage] = useState('');

  // Получаем название метода оплаты
  const getMethodName = (m: string | null) => {
    const methods: Record<string, string> = {
      sbp: 'СБП',
      card_ru: 'Карта РФ',
      card_int: 'International Card',
      liqpay: 'LiqPay',
      crypto: 'Криптовалюта',
    };
    return methods[m || ''] || 'Карта';
  };

  const handlePay = async () => {
    setStatus('processing');
    setErrorMessage('');
    
    // Имитируем процесс оплаты
    await new Promise(r => setTimeout(r, 1500));
    
    try {
      // Вызываем тестовый webhook для зачисления
      const response = await fetch('/api/payments/test-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setStatus('success');
        // Редирект через 3 секунды
        let count = 3;
        const timer = setInterval(() => {
          count--;
          setCountdown(count);
          if (count <= 0) {
            clearInterval(timer);
            router.push('/cabinet?tab=finance');
          }
        }, 1000);
      } else {
        setErrorMessage(data.error || 'Ошибка обработки платежа');
        setStatus('error');
      }
    } catch (err) {
      setErrorMessage('Ошибка соединения с сервером');
      setStatus('error');
    }
  };

  const handleCancel = () => {
    router.push('/cabinet?tab=finance&payment=cancelled');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: isLight 
          ? 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%)'
          : 'linear-gradient(135deg, #0c0a1d 0%, #1a1535 50%, #0f0c23 100%)'
      }}
    >
      <div 
        className="w-full max-w-md rounded-3xl overflow-hidden"
        style={{
          background: isLight 
            ? 'rgba(255, 255, 255, 0.95)'
            : 'rgba(26, 21, 53, 0.98)',
          border: isLight 
            ? '1px solid rgba(0, 0, 0, 0.06)'
            : '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: isLight
            ? '0 25px 80px -20px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.02)'
            : '0 25px 80px -20px rgba(0, 0, 0, 0.6)'
        }}
      >
        {/* Header */}
        <div className="relative p-6 pb-5">
          {/* Gradient accent line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500" />
          
          {/* Test mode badge */}
          <div className="flex justify-center mb-4">
            <div 
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
              style={{
                background: isLight ? 'rgba(245, 158, 11, 0.1)' : 'rgba(245, 158, 11, 0.15)',
                color: '#f59e0b',
                border: isLight ? '1px solid rgba(245, 158, 11, 0.2)' : '1px solid rgba(245, 158, 11, 0.3)',
              }}
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Тестовый режим
            </div>
          </div>
          
          {/* Logo / Brand */}
          <div className="text-center">
            <div className={`text-2xl font-black tracking-tight ${isLight ? 'text-[#1a1535]' : 'text-white'}`}>
              thq<span className="text-[#9d8df1]">label</span>
            </div>
            <div className={`text-sm mt-1 ${isLight ? 'text-[#5c5580]' : 'text-zinc-400'}`}>
              Платежи
            </div>
          </div>
        </div>

        <div className="p-6 pt-0">
          {status === 'pending' && (
            <>
              {/* Payment Method Badge */}
              <div className="flex justify-center mb-4">
                <div 
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
                  style={{
                    background: isLight ? 'rgba(138, 99, 210, 0.08)' : 'rgba(157, 141, 241, 0.1)',
                    border: isLight ? '1px solid rgba(138, 99, 210, 0.15)' : '1px solid rgba(157, 141, 241, 0.2)',
                  }}
                >
                  <svg className={`w-4 h-4 ${isLight ? 'text-[#8a63d2]' : 'text-[#9d8df1]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  <span className={isLight ? 'text-[#1a1535]' : 'text-white'}>{getMethodName(method)}</span>
                </div>
              </div>
              
              {/* Amount Display */}
              <div 
                className="text-center py-6 rounded-2xl mb-5"
                style={{
                  background: isLight 
                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.06) 0%, rgba(52, 211, 153, 0.04) 100%)'
                    : 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(52, 211, 153, 0.08) 100%)',
                  border: isLight 
                    ? '1px solid rgba(16, 185, 129, 0.15)'
                    : '1px solid rgba(16, 185, 129, 0.25)',
                }}
              >
                <div className={`text-sm mb-1 ${isLight ? 'text-[#5c5580]' : 'text-zinc-400'}`}>
                  Сумма к оплате
                </div>
                <div className="text-4xl font-black text-emerald-500">
                  {Number(amount).toLocaleString()} <span className="text-3xl">₽</span>
                </div>
                <div className={`text-xs mt-2 font-mono ${isLight ? 'text-[#5c5580]/60' : 'text-zinc-500'}`}>
                  ID: {orderId?.slice(0, 8)}...{orderId?.slice(-4)}
                </div>
              </div>

              {/* Test Card Info */}
              <div 
                className="p-4 rounded-2xl mb-5"
                style={{
                  background: isLight 
                    ? 'rgba(59, 130, 246, 0.06)'
                    : 'rgba(59, 130, 246, 0.1)',
                  border: isLight 
                    ? '1px solid rgba(59, 130, 246, 0.15)'
                    : '1px solid rgba(59, 130, 246, 0.2)'
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span className={`text-sm font-semibold ${isLight ? 'text-blue-700' : 'text-blue-400'}`}>
                    Тестовые данные карты
                  </span>
                </div>
                <div className={`space-y-2 text-sm ${isLight ? 'text-[#1a1535]' : 'text-white'}`}>
                  <div className="flex items-center justify-between">
                    <span className={isLight ? 'text-[#5c5580]' : 'text-zinc-400'}>Номер:</span>
                    <code className={`px-2 py-0.5 rounded font-mono text-xs ${isLight ? 'bg-black/5' : 'bg-white/10'}`}>
                      4242 4242 4242 4242
                    </code>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={isLight ? 'text-[#5c5580]' : 'text-zinc-400'}>Срок действия:</span>
                    <code className={`px-2 py-0.5 rounded font-mono text-xs ${isLight ? 'bg-black/5' : 'bg-white/10'}`}>
                      12/30
                    </code>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={isLight ? 'text-[#5c5580]' : 'text-zinc-400'}>CVV код:</span>
                    <code className={`px-2 py-0.5 rounded font-mono text-xs ${isLight ? 'bg-black/5' : 'bg-white/10'}`}>
                      123
                    </code>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handlePay}
                  className="w-full py-4 rounded-2xl font-bold text-base bg-gradient-to-r from-emerald-500 to-teal-400 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Оплатить {Number(amount).toLocaleString()} ₽
                </button>
                <button
                  onClick={handleCancel}
                  className={`w-full py-3 rounded-xl font-medium text-sm transition-all ${
                    isLight 
                      ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      : 'bg-white/5 text-zinc-400 hover:bg-white/10'
                  }`}
                >
                  Отменить платёж
                </button>
              </div>
            </>
          )}

          {status === 'processing' && (
            <div className="text-center py-10">
              <div className="relative w-20 h-20 mx-auto mb-5">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-500 to-purple-500 animate-pulse opacity-20" />
                <div className="absolute inset-2 rounded-full bg-gradient-to-r from-violet-500 to-purple-500 flex items-center justify-center">
                  <svg className="w-8 h-8 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                </div>
              </div>
              <div className={`text-xl font-bold ${isLight ? 'text-[#1a1535]' : 'text-white'}`}>
                Обработка платежа
              </div>
              <div className={`text-sm mt-2 ${isLight ? 'text-[#5c5580]' : 'text-zinc-400'}`}>
                Пожалуйста, не закрывайте страницу
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center py-10">
              <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className={`text-xl font-bold ${isLight ? 'text-[#1a1535]' : 'text-white'}`}>
                Оплата прошла успешно
              </div>
              <div className="text-emerald-500 text-3xl font-black mt-3">
                +{Number(amount).toLocaleString()} ₽
              </div>
              <div className={`text-sm mt-4 ${isLight ? 'text-[#5c5580]' : 'text-zinc-400'}`}>
                Переход в кабинет через <span className="font-bold text-[#9d8df1]">{countdown}</span> сек.
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center py-10">
              <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/30">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div className={`text-xl font-bold ${isLight ? 'text-[#1a1535]' : 'text-white'}`}>
                Ошибка оплаты
              </div>
              <div className={`text-sm mt-2 ${isLight ? 'text-[#5c5580]' : 'text-zinc-400'}`}>
                {errorMessage || 'Попробуйте ещё раз или выберите другой способ оплаты'}
              </div>
              <button
                onClick={() => {
                  setStatus('pending');
                  setErrorMessage('');
                }}
                className="mt-5 px-8 py-3 rounded-xl font-bold bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-105 transition-all"
              >
                Попробовать снова
              </button>
              <button
                onClick={handleCancel}
                className={`block mx-auto mt-3 text-sm font-medium transition-colors ${
                  isLight ? 'text-[#5c5580] hover:text-[#1a1535]' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Вернуться в кабинет
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div 
          className="px-6 py-4"
          style={{
            borderTop: isLight 
              ? '1px solid rgba(0, 0, 0, 0.05)'
              : '1px solid rgba(255, 255, 255, 0.05)',
            background: isLight 
              ? 'rgba(0, 0, 0, 0.02)'
              : 'rgba(0, 0, 0, 0.2)'
          }}
        >
          <div className="flex items-center justify-center gap-4">
            <div className={`flex items-center gap-1.5 text-xs ${isLight ? 'text-[#5c5580]' : 'text-zinc-500'}`}>
              <svg className="w-3.5 h-3.5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              <span>Безопасно</span>
            </div>
            <div className={`w-1 h-1 rounded-full ${isLight ? 'bg-gray-300' : 'bg-zinc-600'}`} />
            <div className={`text-xs ${isLight ? 'text-[#5c5580]/60' : 'text-zinc-600'}`}>
              Тестовая транзакция
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TestPaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full" />
      </div>
    }>
      <TestPaymentContent />
    </Suspense>
  );
}
