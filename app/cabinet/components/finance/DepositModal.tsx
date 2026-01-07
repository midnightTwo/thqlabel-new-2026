'use client';
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '@/contexts/ThemeContext';

interface DepositModalProps {
  userId: string;
  onClose: () => void;
  showNotification: (message: string, type: 'success' | 'error') => void;
}

type PaymentMethod = 'sbp' | 'card_ru' | 'card_int' | 'liqpay' | 'crypto';

interface PaymentOption {
  id: PaymentMethod;
  title: string;
  subtitle: string;
  provider: string;
  minAmount: number;
  currency: string;
  currencySymbol: string;
  gradient: string;
  icon: string;
  flag: string;
}

const PAYMENT_METHODS: PaymentOption[] = [
  {
    id: 'sbp',
    title: 'СБП',
    subtitle: 'Мгновенно, 0% комиссии',
    provider: 'yookassa',
    minAmount: 100,
    currency: 'RUB',
    currencySymbol: '₽',
    gradient: 'from-blue-500 to-cyan-400',
    icon: 'sbp',
    flag: 'ru'
  },
  {
    id: 'card_ru',
    title: 'Карта РФ',
    subtitle: 'МИР, Visa, Mastercard',
    provider: 'yookassa',
    minAmount: 100,
    currency: 'RUB',
    currencySymbol: '₽',
    gradient: 'from-emerald-500 to-teal-400',
    icon: 'card',
    flag: 'ru'
  },
  {
    id: 'card_int',
    title: 'International',
    subtitle: 'Visa, Mastercard, AMEX',
    provider: 'stripe',
    minAmount: 5,
    currency: 'USD',
    currencySymbol: '$',
    gradient: 'from-violet-500 to-purple-400',
    icon: 'globe',
    flag: 'int'
  },
  {
    id: 'liqpay',
    title: 'LiqPay',
    subtitle: 'Картки України',
    provider: 'liqpay',
    minAmount: 50,
    currency: 'UAH',
    currencySymbol: '₴',
    gradient: 'from-green-500 to-lime-400',
    icon: 'bank',
    flag: 'ua'
  },
  {
    id: 'crypto',
    title: 'Криптовалюта',
    subtitle: 'BTC, ETH, USDT, TON',
    provider: 'cryptocloud',
    minAmount: 10,
    currency: 'USD',
    currencySymbol: '$',
    gradient: 'from-orange-500 to-amber-400',
    icon: 'crypto',
    flag: 'crypto'
  }
];

// SVG иконки для методов оплаты
const PaymentIcon = ({ type, className }: { type: string; className?: string }) => {
  const icons: Record<string, React.ReactNode> = {
    sbp: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    card: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M2 10h20" />
      </svg>
    ),
    globe: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
      </svg>
    ),
    bank: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3" />
      </svg>
    ),
    crypto: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9.5 2v2M14.5 2v2M9.5 20v2M14.5 20v2M5 12H3M21 12h-2" />
        <circle cx="12" cy="12" r="7" />
        <path d="M12 8v8M9 10.5l6 3M9 13.5l6-3" />
      </svg>
    ),
  };
  return icons[type] || null;
};

// Красивое звёздное поле
const StarField = () => {
  const stars = [
    { top: '5%', left: '10%', size: 2, delay: 0, duration: 3 },
    { top: '12%', left: '85%', size: 1.5, delay: 0.5, duration: 4 },
    { top: '20%', left: '25%', size: 1, delay: 1, duration: 2.5 },
    { top: '15%', left: '60%', size: 2.5, delay: 1.5, duration: 3.5 },
    { top: '30%', left: '5%', size: 1, delay: 0.3, duration: 4 },
    { top: '35%', left: '92%', size: 1.5, delay: 2, duration: 3 },
    { top: '45%', left: '15%', size: 2, delay: 0.8, duration: 2.8 },
    { top: '50%', left: '78%', size: 1, delay: 1.2, duration: 3.2 },
    { top: '55%', left: '45%', size: 1.5, delay: 0.6, duration: 4.5 },
    { top: '65%', left: '8%', size: 2, delay: 1.8, duration: 3 },
    { top: '70%', left: '88%', size: 1.5, delay: 0.4, duration: 2.5 },
    { top: '75%', left: '35%', size: 1, delay: 2.2, duration: 3.8 },
    { top: '82%', left: '70%', size: 2, delay: 0.9, duration: 3.3 },
    { top: '88%', left: '20%', size: 1.5, delay: 1.6, duration: 4.2 },
    { top: '92%', left: '55%', size: 1, delay: 0.2, duration: 2.9 },
    { top: '8%', left: '40%', size: 1, delay: 2.5, duration: 3.6 },
    { top: '40%', left: '50%', size: 1.5, delay: 1.1, duration: 4.1 },
    { top: '60%', left: '30%', size: 2, delay: 0.7, duration: 3.4 },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {stars.map((star, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            top: star.top,
            left: star.left,
            width: star.size,
            height: star.size,
            background: `radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(200,180,255,0.6) 50%, transparent 100%)`,
            boxShadow: `0 0 ${star.size * 2}px rgba(200,180,255,0.5)`,
            animation: `twinkle ${star.duration}s ease-in-out infinite`,
            animationDelay: `${star.delay}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
};

const PRESET_AMOUNTS_RUB = [500, 1000, 2000, 5000, 10000];
const PRESET_AMOUNTS_USD = [5, 10, 25, 50, 100];
const PRESET_AMOUNTS_UAH = [200, 500, 1000, 2000, 5000];

export default function DepositModal({ userId, onClose, showNotification }: DepositModalProps) {
  const [amount, setAmount] = useState<number>(1000);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('sbp');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const { themeName } = useTheme();
  const isLight = themeName === 'light';

  const selectedPayment = PAYMENT_METHODS.find(m => m.id === selectedMethod)!;
  
  const presetAmounts = selectedPayment.currency === 'USD' || selectedPayment.currency === 'USDT'
    ? PRESET_AMOUNTS_USD
    : selectedPayment.currency === 'UAH'
      ? PRESET_AMOUNTS_UAH
      : PRESET_AMOUNTS_RUB;

  useEffect(() => {
    const newPresets = selectedPayment.currency === 'USD' || selectedPayment.currency === 'USDT'
      ? PRESET_AMOUNTS_USD
      : selectedPayment.currency === 'UAH'
        ? PRESET_AMOUNTS_UAH
        : PRESET_AMOUNTS_RUB;
    setAmount(newPresets[1]);
    setCustomAmount('');
  }, [selectedMethod]);

  const handlePresetClick = (preset: number) => {
    setAmount(preset);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (value: string) => {
    const numValue = value.replace(/\D/g, '');
    setCustomAmount(numValue);
    if (numValue) {
      setAmount(parseInt(numValue, 10));
    }
  };

  const handleSubmit = async () => {
    if (amount < selectedPayment.minAmount) {
      showNotification(`Минимум: ${selectedPayment.minAmount} ${selectedPayment.currencySymbol}`, 'error');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          currency: selectedPayment.currency,
          provider: selectedPayment.provider,
          paymentMethod: selectedMethod,
          userId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка создания платежа');
      }

      if (data.confirmationUrl) {
        window.location.href = data.confirmationUrl;
      } else {
        throw new Error('Не получена ссылка на оплату');
      }
    } catch (error: any) {
      showNotification(error.message || 'Ошибка при создании платежа', 'error');
      setIsLoading(false);
    }
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  if (!mounted) return null;

  const modalContent = (
    <div 
      className="fixed inset-0 flex items-center justify-center p-4 sm:p-6"
      style={{ zIndex: 99999 }}
    >
      {/* Backdrop - тёмный с blur */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-xl"
        onClick={onClose}
      />
      
      {/* Красивые звёзды */}
      <StarField />

      {/* Modal card - по центру */}
      <div 
        className={`relative w-full rounded-3xl overflow-hidden transition-all duration-300 ${
          step === 1 ? 'max-w-2xl' : 'max-w-lg'
        }`}
        style={{
          background: isLight 
            ? 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,247,255,0.98) 100%)'
            : 'linear-gradient(180deg, rgba(20,18,35,0.98) 0%, rgba(15,13,26,0.98) 100%)',
          boxShadow: isLight
            ? '0 0 0 1px rgba(138, 99, 210, 0.1), 0 25px 80px -20px rgba(138, 99, 210, 0.4), 0 0 120px -40px rgba(96, 80, 186, 0.3)'
            : '0 0 0 1px rgba(157, 141, 241, 0.15), 0 25px 80px -20px rgba(0, 0, 0, 0.8), 0 0 120px -40px rgba(96, 80, 186, 0.2)'
        }}
      >
        {/* Top gradient line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500" />
        
        {/* Glow effects */}
        <div className="absolute -top-32 -right-32 w-64 h-64 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-64 h-64 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

        {step === 1 ? (
          /* ═══════════════ STEP 1: Payment Methods ═══════════════ */
          <div className="relative p-6 sm:p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className={`text-2xl font-bold ${isLight ? 'text-[#1a1535]' : 'text-white'}`}>
                  Пополнить баланс
                </h2>
                <p className={`text-sm mt-1 ${isLight ? 'text-[#5c5580]' : 'text-white/50'}`}>
                  Выберите способ оплаты
                </p>
              </div>
              <button
                onClick={onClose}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-110 ${
                  isLight 
                    ? 'bg-gray-100 text-gray-500 hover:bg-gray-200' 
                    : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Payment methods grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method.id}
                  onClick={() => { setSelectedMethod(method.id); setStep(2); }}
                  className={`group relative flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 hover:scale-[1.02] ${
                    isLight 
                      ? 'bg-gray-50 hover:bg-gray-100 border border-gray-200/50 hover:border-[#8a63d2]/30' 
                      : 'bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-[#9d8df1]/30'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${method.gradient} shadow-lg`}>
                    <PaymentIcon type={method.icon} className="w-6 h-6 text-white" />
                  </div>
                  
                  <div className="flex-1 text-left">
                    <span className={`font-semibold block ${isLight ? 'text-[#1a1535]' : 'text-white'}`}>
                      {method.title}
                    </span>
                    <p className={`text-xs ${isLight ? 'text-[#5c5580]' : 'text-white/40'}`}>
                      {method.subtitle}
                    </p>
                  </div>

                  <div className="text-right">
                    <div className={`text-[10px] ${isLight ? 'text-[#5c5580]' : 'text-white/30'}`}>от</div>
                    <div className={`font-bold text-sm ${isLight ? 'text-[#1a1535]' : 'text-white'}`}>
                      {method.minAmount}{method.currencySymbol}
                    </div>
                  </div>

                  <svg className={`w-5 h-5 transition-all group-hover:translate-x-1 ${isLight ? 'text-[#8a63d2]/50 group-hover:text-[#8a63d2]' : 'text-white/20 group-hover:text-white/60'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>

            {/* Footer */}
            <div className={`flex items-center justify-center gap-6 pt-4 border-t ${isLight ? 'border-gray-100' : 'border-white/5'}`}>
              <div className={`flex items-center gap-1.5 text-xs ${isLight ? 'text-[#5c5580]' : 'text-white/30'}`}>
                <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                <span>Безопасно</span>
              </div>
              <div className={`flex items-center gap-1.5 text-xs ${isLight ? 'text-[#5c5580]' : 'text-white/30'}`}>
                <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                <span>Мгновенно</span>
              </div>
              <div className={`flex items-center gap-1.5 text-xs ${isLight ? 'text-[#5c5580]' : 'text-white/30'}`}>
                <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4z" /><path fillRule="evenodd" d="M6 10a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
                <span>0% комиссии</span>
              </div>
            </div>
          </div>
        ) : (
          /* ═══════════════ STEP 2: Amount Input ═══════════════ */
          <div className="relative p-6 sm:p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <button
                onClick={() => setStep(1)}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-110 ${
                  isLight 
                    ? 'bg-gray-100 text-gray-500 hover:bg-gray-200' 
                    : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              {/* Method badge */}
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r ${selectedPayment.gradient}`}>
                <PaymentIcon type={selectedPayment.icon} className="w-4 h-4 text-white" />
                <span className="text-white font-medium text-sm">{selectedPayment.title}</span>
              </div>
              
              <button
                onClick={onClose}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-110 ${
                  isLight 
                    ? 'bg-gray-100 text-gray-500 hover:bg-gray-200' 
                    : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Amount input */}
            <div 
              className={`relative rounded-2xl p-6 mb-6 ${
                isLight 
                  ? 'bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-100' 
                  : 'bg-gradient-to-br from-violet-500/5 to-purple-500/5 border border-white/5'
              }`}
            >
              <div className="text-center">
                <p className={`text-xs uppercase tracking-widest mb-3 ${isLight ? 'text-[#5c5580]' : 'text-white/40'}`}>
                  Сумма пополнения
                </p>
                <div className="flex items-baseline justify-center gap-1">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={customAmount || amount.toString()}
                    onChange={(e) => handleCustomAmountChange(e.target.value)}
                    className={`bg-transparent text-5xl sm:text-6xl font-black text-center outline-none w-40 ${
                      isLight ? 'text-[#1a1535]' : 'text-white'
                    }`}
                    style={{ caretColor: isLight ? '#8a63d2' : '#9d8df1' }}
                  />
                  <span className={`text-3xl font-bold ${isLight ? 'text-[#8a63d2]' : 'text-[#9d8df1]'}`}>
                    {selectedPayment.currencySymbol}
                  </span>
                </div>
                {amount < selectedPayment.minAmount && (
                  <p className="text-rose-400 text-xs mt-2">
                    Минимум: {selectedPayment.minAmount} {selectedPayment.currencySymbol}
                  </p>
                )}
              </div>
            </div>

            {/* Preset buttons */}
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {presetAmounts.map((preset) => (
                <button
                  key={preset}
                  onClick={() => handlePresetClick(preset)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    amount === preset && !customAmount
                      ? `bg-gradient-to-r ${selectedPayment.gradient} text-white shadow-lg`
                      : isLight
                        ? 'bg-gray-100 text-[#1a1535] hover:bg-gray-200'
                        : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {preset.toLocaleString()}
                </button>
              ))}
            </div>

            {/* Submit button */}
            <button
              onClick={handleSubmit}
              disabled={isLoading || amount < selectedPayment.minAmount}
              className={`w-full py-4 rounded-2xl font-bold text-base transition-all flex items-center justify-center gap-2 ${
                isLoading || amount < selectedPayment.minAmount
                  ? isLight 
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-white/10 text-white/30 cursor-not-allowed'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02]'
              }`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Создание платежа...
                </>
              ) : (
                <>
                  Оплатить {amount.toLocaleString()} {selectedPayment.currencySymbol}
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>

            {/* Security */}
            <div className={`flex items-center justify-center gap-2 mt-4 text-xs ${isLight ? 'text-[#5c5580]' : 'text-white/30'}`}>
              <svg className="w-3.5 h-3.5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
              <span>Защищённое соединение</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
