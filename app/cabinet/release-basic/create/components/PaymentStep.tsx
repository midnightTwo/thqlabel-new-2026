import React, { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { 
  calculatePaymentAmount, 
  formatPrice, 
  getReleaseTypeName,
  getTracksDescription,
  type ReleaseType 
} from '@/lib/utils/calculatePayment';

interface PaymentStepProps {
  onNext: () => void;
  onBack: () => void;
  onPaymentSubmit: (receiptUrl: string, comment?: string) => void;
  onPayLater?: () => void;
  canPayLater?: boolean;
  userId?: string | null;
  releaseType?: ReleaseType | null;
  tracksCount: number; // Добавляем количество треков для расчёта
}

export default function PaymentStep({ onNext, onBack, onPaymentSubmit, onPayLater, canPayLater = false, userId, releaseType, tracksCount }: PaymentStepProps) {
  // Используем единую утилиту для расчёта стоимости по количеству треков
  const { total: paymentAmount, breakdown } = calculatePaymentAmount(releaseType, tracksCount);
  const releaseTypeName = getReleaseTypeName(releaseType);
  const [paymentReceipt, setPaymentReceipt] = useState<File | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paymentComment, setPaymentComment] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Пожалуйста, загрузите изображение (JPG, PNG или GIF)');
        return;
      }
      // Проверка размера файла (макс 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB в байтах
      if (file.size > maxSize) {
        setError(`Файл слишком большой (${(file.size / 1024 / 1024).toFixed(1)}MB). Максимальный размер: 5MB`);
        return;
      }
      setPaymentReceipt(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleSubmit = async () => {
    if (!paymentReceipt) {
      setError('Прикрепите чек оплаты');
      return;
    }
    
    if (!userId) {
      setError('Ошибка: пользователь не авторизован');
      return;
    }
    
    setPaymentLoading(true);
    setError(null);
    
    try {
      if (!supabase) throw new Error('Supabase не инициализирован');
      
      // Загружаем чек в storage
      const fileExt = paymentReceipt.name.split('.').pop();
      const fileName = `${userId}/payment_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('payment-receipts')
        .upload(fileName, paymentReceipt, {
          contentType: paymentReceipt.type,
          upsert: false
        });
      
      if (uploadError) {
        throw new Error(`Ошибка загрузки файла: ${uploadError.message}`);
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from('payment-receipts')
        .getPublicUrl(fileName);
      
      onPaymentSubmit(publicUrl, paymentComment);
      onNext();
    } catch (err: any) {
      console.error('Ошибка при загрузке чека:', err);
      setError(err.message || 'Произошла ошибка при загрузке. Попробуйте еще раз.');
    } finally {
      setPaymentLoading(false);
    }
  };

  return (
    <div className="animate-fade-up">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center ring-1 ring-white/10">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-300">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
              <line x1="1" y1="10" x2="23" y2="10"/>
            </svg>
          </div>
          <div>
            <h2 className="text-3xl font-black bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">Оплата релиза</h2>
            <p className="text-sm text-zinc-500 mt-1">Оплатите размещение релиза на площадках</p>
          </div>
        </div>
      </div>

      {/* Информация о стоимости */}
      <div className="p-6 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-2xl mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm text-zinc-400 mb-1">Стоимость {releaseTypeName.toLowerCase()}</div>
            <div className="text-3xl font-black text-amber-400">{formatPrice(paymentAmount)}</div>
          </div>
          <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-400">
              <line x1="12" y1="1" x2="12" y2="23"/>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          </div>
        </div>
        
        {/* Детализация расчёта по трекам */}
        <div className="mb-4 p-3 bg-amber-500/10 rounded-lg space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-400 flex items-center gap-2">
              <svg className="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18V5l12-2v13" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="6" cy="18" r="3"/>
                <circle cx="18" cy="16" r="3"/>
              </svg>
              Тип релиза:
            </span>
            <span className="font-bold text-amber-300">{releaseTypeName}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-400 flex items-center gap-2">
              <svg className="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              Количество треков:
            </span>
            <span className="font-bold text-white">{tracksCount}</span>
          </div>
          
          {/* Детализация по диапазонам (только для EP/Альбома) */}
          {breakdown.length > 1 && (
            <div className="pt-2 mt-2 border-t border-amber-500/20 space-y-1">
              {breakdown.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500">
                    Треки {item.range}: {item.count} × {formatPrice(item.pricePerTrack)}
                  </span>
                  <span className="text-amber-400/80">{formatPrice(item.subtotal)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="text-xs text-zinc-400 space-y-1">
          <p>• Единоразовый платёж за дистрибуцию релиза</p>
          <p>• Размещение на всех выбранных площадках</p>
          <p>• Без роялти и скрытых платежей</p>
        </div>
      </div>

      {/* Реквизиты для оплаты */}
      <div className="p-5 bg-white/[0.02] border border-white/5 rounded-xl mb-6">
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-[#9d8df1]">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2" strokeWidth="2"/>
            <line x1="1" y1="10" x2="23" y2="10" strokeWidth="2"/>
          </svg>
          Реквизиты для перевода
        </h3>
        
        <div className="space-y-3">
          <div className="p-3 bg-white/5 rounded-lg">
            <div className="text-xs text-zinc-500 mb-1">Сбербанк</div>
            <div className="text-lg font-mono font-bold text-white">5469 XXXX XXXX XXXX</div>
          </div>
          
          <div className="p-3 bg-white/5 rounded-lg">
            <div className="text-xs text-zinc-500 mb-1">Тинькофф</div>
            <div className="text-lg font-mono font-bold text-white">2200 XXXX XXXX XXXX</div>
          </div>
          
          <div className="p-3 bg-white/5 rounded-lg">
            <div className="text-xs text-zinc-500 mb-1">СБП (по номеру телефона)</div>
            <div className="text-lg font-mono font-bold text-white">+7 (XXX) XXX-XX-XX</div>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <div className="flex items-start gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-yellow-400 flex-shrink-0 mt-0.5">
              <circle cx="12" cy="12" r="10" strokeWidth="2"/>
              <line x1="12" y1="8" x2="12" y2="12" strokeWidth="2"/>
              <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2"/>
            </svg>
            <div className="text-xs text-yellow-300">
              Укажите в комментарии к переводу ваш email или никнейм для идентификации платежа
            </div>
          </div>
        </div>
      </div>

      {/* Загрузка чека */}
      <div className="p-5 bg-white/[0.02] border border-white/5 rounded-xl mb-6">
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-[#9d8df1]">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeWidth="2"/>
            <polyline points="17 8 12 3 7 8" strokeWidth="2"/>
            <line x1="12" y1="3" x2="12" y2="15" strokeWidth="2"/>
          </svg>
          Загрузите чек оплаты
        </h3>
        
        <div className="relative">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={paymentLoading}
          />
          <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
            paymentReceipt 
              ? 'border-emerald-500/50 bg-emerald-500/10' 
              : 'border-white/20 hover:border-white/40 bg-white/5'
          }`}>
            {previewUrl ? (
              <div className="space-y-3">
                <img 
                  src={previewUrl} 
                  alt="Preview" 
                  className="max-h-40 mx-auto rounded-lg shadow-lg"
                />
                <div className="text-sm text-emerald-400 font-medium">
                  ✓ Чек загружен: {paymentReceipt?.name}
                </div>
                <div className="text-xs text-zinc-500">
                  Нажмите, чтобы заменить
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="mx-auto text-zinc-500">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeWidth="2"/>
                  <polyline points="17 8 12 3 7 8" strokeWidth="2"/>
                  <line x1="12" y1="3" x2="12" y2="15" strokeWidth="2"/>
                </svg>
                <div className="text-sm text-zinc-400">
                  Нажмите или перетащите файл
                </div>
                <div className="text-xs text-zinc-600">
                  Скриншот или фото чека (JPG, PNG, GIF)
                </div>
              </div>
            )}
          </div>
        </div>
        
        {error && (
          <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <div className="text-sm text-red-400 flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                <line x1="15" y1="9" x2="9" y2="15" strokeWidth="2"/>
                <line x1="9" y1="9" x2="15" y2="15" strokeWidth="2"/>
              </svg>
              {error}
            </div>
          </div>
        )}
      </div>

      {/* Комментарий к оплате */}
      <div className="p-5 bg-white/[0.02] border border-white/5 rounded-xl mb-6">
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-[#9d8df1]">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeWidth="2"/>
          </svg>
          Комментарий к оплате
        </h3>
        
        <textarea
          value={paymentComment}
          onChange={(e) => setPaymentComment(e.target.value)}
          placeholder="Укажите дополнительную информацию о переводе (необязательно). Например: имя отправителя, время перевода, последние 4 цифры карты..."
          className="w-full h-24 px-4 py-3 bg-gradient-to-br from-white/[0.07] to-white/[0.03] placeholder:text-zinc-600 rounded-xl border border-white/10 outline-none resize-none transition-all hover:border-[#6050ba]/50 focus:border-[#6050ba] focus:shadow-lg focus:shadow-[#6050ba]/20"
          disabled={paymentLoading}
        />
        
        <div className="mt-2 text-xs text-zinc-500">
          Это поможет нам быстрее идентифицировать ваш платёж
        </div>
      </div>

      {/* Навигация */}
      <div className="mt-8 pt-6 border-t border-white/10 flex justify-between">
        <button 
          onClick={onBack} 
          className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold transition flex items-center gap-2"
          disabled={paymentLoading}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <polyline points="15 18 9 12 15 6" strokeWidth="2"/>
          </svg>
          Назад
        </button>
        
        <div className="flex items-center gap-3">
          {/* Кнопка "Оплатить позже" */}
          {onPayLater && (
            <div className="relative group">
              <button 
                onClick={onPayLater}
                disabled={paymentLoading || !canPayLater}
                className={`px-6 py-3 border rounded-xl font-bold transition flex items-center gap-2 ${
                  canPayLater && !paymentLoading
                    ? 'bg-white/5 hover:bg-white/10 border-white/10 text-zinc-300 hover:text-white cursor-pointer'
                    : 'bg-zinc-900/50 border-zinc-800 text-zinc-600 cursor-not-allowed'
                }`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                Оплатить позже
              </button>
              {/* Tooltip если не все шаги заполнены */}
              {!canPayLater && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl">
                  Заполните все обязательные шаги
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-800"></div>
                </div>
              )}
            </div>
          )}
          
          {/* Кнопка подтверждения оплаты */}
          <button 
            onClick={handleSubmit}
            disabled={!paymentReceipt || paymentLoading}
            className={`px-8 py-3 rounded-xl font-bold transition flex items-center gap-2 ${
              paymentReceipt && !paymentLoading
                ? 'bg-amber-500 hover:bg-amber-400 text-black cursor-pointer' 
                : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
            }`}
        >
          {paymentLoading ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
              Загрузка...
            </>
          ) : (
            <>
              Подтвердить оплату
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline points="9 18 15 12 9 6" strokeWidth="2"/>
              </svg>
            </>
          )}
        </button>
        </div>
      </div>
    </div>
  );
}
