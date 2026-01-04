"use client";
import React, { useState, useEffect, useRef } from 'react';
import AnimatedBackground from '@/components/ui/AnimatedBackground';
import { useTheme } from '@/contexts/ThemeContext';
import { calculatePaymentAmount, formatPrice } from '@/lib/utils/calculatePayment';

// Компонент плавной анимации числа
const AnimatedPrice = ({ value, className = "" }: { value: number; className?: string }) => {
  const [displayValue, setDisplayValue] = useState(value);
  const animationRef = useRef<number | null>(null);
  const startValueRef = useRef(value);
  const startTimeRef = useRef<number | null>(null);
  
  useEffect(() => {
    if (value === displayValue) return;
    
    startValueRef.current = displayValue;
    startTimeRef.current = null;
    
    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const duration = 300; // 300ms для анимации
      const progress = Math.min(elapsed / duration, 1);
      
      // Плавный easeOutQuad
      const easeOut = 1 - Math.pow(1 - progress, 2);
      const current = Math.round(startValueRef.current + (value - startValueRef.current) * easeOut);
      
      setDisplayValue(current);
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
      }
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, displayValue]);
  
  // Форматирование с пробелами между тысячами
  const formatted = displayValue.toLocaleString('ru-RU');
  
  return <span className={`tabular-nums ${className}`}>{formatted} ₽</span>;
};

interface ReleaseTypeSelectorProps {
  onSelectType: (type: 'single' | 'ep' | 'album', tracksCount?: number) => void;
  onBack: () => void;
}

export default function ReleaseTypeSelector({ onSelectType, onBack }: ReleaseTypeSelectorProps) {
  const { themeName } = useTheme();
  const isLight = themeName === 'light';
  
  // Состояние слайдеров для EP и Альбома - начинаем с минимума
  const [epTracks, setEpTracks] = useState(2); // минимум 2 трека
  const [albumTracks, setAlbumTracks] = useState(8); // минимум 8 треков
  
  // Расчёт цен в реальном времени
  const singlePrice = calculatePaymentAmount('single', 1);
  const epPrice = calculatePaymentAmount('ep', epTracks);
  const albumPrice = calculatePaymentAmount('album', albumTracks);
  
  return (
    <div className="min-h-screen relative flex items-center justify-center p-6 pt-24 bg-black">
      <AnimatedBackground />
      {/* Тёмный overlay для светлой темы */}
      {isLight && <div className="fixed inset-0 bg-black/5 z-10" />}

      <div className="max-w-6xl w-full relative z-20">
        {/* Заголовок */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black mb-3 text-white">
            Выберите тип релиза
          </h1>
          <p className="text-sm text-white/70">
            Basic Plan · Доступная публикация музыки
          </p>
        </div>

        {/* Карточки выбора */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Сингл */}
          <div
            className={`group relative rounded-3xl p-6 text-left overflow-hidden transition-all duration-500 hover:scale-[1.02] backdrop-blur-xl border shadow-2xl ${
              isLight 
                ? 'bg-[rgba(25,25,30,0.75)] border-purple-500/30 hover:border-purple-500/70 hover:shadow-purple-500/30' 
                : 'bg-gradient-to-br from-zinc-900/90 via-zinc-900/80 to-black/90 border-zinc-800/50 hover:border-purple-500/70 hover:shadow-purple-500/20'
            }`}
          >
            {/* Фон карточки с анимированными градиентами */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-transparent to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-all duration-700" />
            
            <div className="relative z-10">
              {/* Icon с музыкальной ноткой */}
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-800 rounded-lg flex items-center justify-center mb-3 shadow-lg shadow-purple-500/30">
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18V5l12-2v13" />
                  <circle cx="6" cy="18" r="3" />
                  <circle cx="18" cy="16" r="3" />
                </svg>
              </div>

              {/* Заголовок */}
              <h3 className="text-xl font-black mb-1.5 text-white">Сингл</h3>
              <p className="text-zinc-400 text-xs mb-4 font-medium">
                Один мощный трек
              </p>

              {/* Фиксированная цена */}
              <div className="mb-4 p-4 bg-purple-500/15 rounded-xl border border-purple-500/30">
                <div className="text-center">
                  <div className="text-3xl font-black text-purple-400">{formatPrice(singlePrice.total)}</div>
                  <div className="text-xs text-purple-400/70 mt-1">1 трек</div>
                </div>
              </div>

              {/* Особенности */}
              <div className="space-y-2.5 mb-4">
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-4 h-4 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
                    <svg className="w-2.5 h-2.5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="font-bold text-white">Строго 1 трек</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-4 h-4 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
                    <svg className="w-2.5 h-2.5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="font-bold text-purple-400">Быстрая публикация</span>
                </div>
              </div>

              {/* Кнопка выбора */}
              <button
                onClick={() => onSelectType('single', 1)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 rounded-xl font-bold transition-all duration-300 text-white shadow-lg shadow-purple-500/30"
              >
                <span className="text-sm">Выбрать формат</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          </div>

          {/* EP */}
          <div
            className={`group relative rounded-3xl p-6 text-left overflow-hidden transition-all duration-500 hover:scale-[1.02] backdrop-blur-xl border shadow-2xl ${
              isLight 
                ? 'bg-[rgba(25,25,30,0.75)] border-blue-500/30 hover:border-blue-500/70 hover:shadow-blue-500/30' 
                : 'bg-gradient-to-br from-zinc-900/90 via-zinc-900/80 to-black/90 border-zinc-800/50 hover:border-blue-500/70 hover:shadow-blue-500/20'
            }`}
          >
            {/* Фон карточки с анимированными градиентами */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 via-transparent to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all duration-700" />
            
            <div className="relative z-10">
              {/* Icon с пластинками */}
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center mb-3 shadow-lg shadow-blue-500/30">
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
                </svg>
              </div>

              {/* Заголовок */}
              <h3 className="text-xl font-black mb-1.5 text-white">EP</h3>
              <p className="text-zinc-400 text-xs mb-4 font-medium">
                Мини-альбом 2-7 треков
              </p>

              {/* Калькулятор с ползунком */}
              <div className="mb-4 p-4 bg-blue-500/15 rounded-xl border border-blue-500/30">
                {/* Слайдер */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-blue-300 font-medium">Количество треков:</span>
                    <span className="text-lg font-black text-blue-400">{epTracks}</span>
                  </div>
                  <input
                    type="range"
                    min={2}
                    max={7}
                    value={epTracks}
                    onChange={(e) => setEpTracks(Number(e.target.value))}
                    className="slider-ep w-full h-2 rounded-full appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, rgb(59, 130, 246) 0%, rgb(59, 130, 246) ${((epTracks - 2) / 5) * 100}%, rgba(59, 130, 246, 0.2) ${((epTracks - 2) / 5) * 100}%, rgba(59, 130, 246, 0.2) 100%)`
                    }}
                  />
                  <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
                    <span>2</span>
                    <span>7</span>
                  </div>
                </div>
                
                {/* Цена */}
                <div className="text-center pt-2 border-t border-blue-500/20">
                  <div className="text-2xl font-black text-blue-400"><AnimatedPrice value={epPrice.total} /></div>
                  <div className="text-[10px] text-blue-400/70 mt-0.5">300 ₽ × {epTracks} треков</div>
                </div>
              </div>

              {/* Особенности */}
              <div className="space-y-2.5 mb-4">
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-4 h-4 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                    <svg className="w-2.5 h-2.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="font-bold text-white">От 2 до 7 треков</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-4 h-4 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                    <svg className="w-2.5 h-2.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="font-bold text-blue-400">Свободные названия</span>
                </div>
              </div>

              {/* Кнопка выбора */}
              <button
                onClick={() => onSelectType('ep', epTracks)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 rounded-xl font-bold transition-all duration-300 text-white shadow-lg shadow-blue-500/30"
              >
                <span className="text-sm">Выбрать формат</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          </div>

          {/* Альбом */}
          <div
            className={`group relative rounded-3xl p-6 text-left overflow-hidden transition-all duration-500 hover:scale-[1.02] backdrop-blur-xl border shadow-2xl ${
              isLight 
                ? 'bg-[rgba(25,25,30,0.75)] border-emerald-500/30 hover:border-emerald-500/70 hover:shadow-emerald-500/30' 
                : 'bg-gradient-to-br from-zinc-900/90 via-zinc-900/80 to-black/90 border-zinc-800/50 hover:border-emerald-500/70 hover:shadow-emerald-500/20'
            }`}
          >
            {/* Фон карточки с анимированными градиентами */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/30 via-transparent to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all duration-700" />
            
            {/* Бейдж ПОПУЛЯРНО */}
            <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-emerald-500/30 to-teal-500/30 backdrop-blur-sm rounded-full text-[10px] font-bold text-emerald-300 border border-emerald-400/40 shadow-lg shadow-emerald-500/20 z-20">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              ПОПУЛЯРНО
            </div>
            
            <div className="relative z-10">
              {/* Icon с альбомом */}
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-lg flex items-center justify-center mb-3 shadow-lg shadow-emerald-500/30">
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 6h4M2 10h4M2 14h4M2 18h4" />
                  <rect x="8" y="4" width="14" height="16" rx="2" />
                  <line x1="12" y1="9" x2="18" y2="9" />
                  <line x1="12" y1="13" x2="18" y2="13" />
                  <line x1="12" y1="17" x2="18" y2="17" />
                </svg>
              </div>

              {/* Заголовок */}
              <h3 className="text-xl font-black mb-1.5 text-white">Альбом</h3>
              <p className="text-zinc-400 text-xs mb-4 font-medium">
                Полноценный релиз 8-50 треков
              </p>

              {/* Калькулятор с ползунком */}
              <div className="mb-4 p-4 bg-emerald-500/15 rounded-xl border border-emerald-500/30">
                {/* Слайдер */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-emerald-300 font-medium">Количество треков:</span>
                    <span className="text-lg font-black text-emerald-400">{albumTracks}</span>
                  </div>
                  <input
                    type="range"
                    min={8}
                    max={50}
                    value={albumTracks}
                    onChange={(e) => setAlbumTracks(Number(e.target.value))}
                    className="slider-album w-full h-2 rounded-full appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, rgb(16, 185, 129) 0%, rgb(16, 185, 129) ${((albumTracks - 8) / 42) * 100}%, rgba(16, 185, 129, 0.2) ${((albumTracks - 8) / 42) * 100}%, rgba(16, 185, 129, 0.2) 100%)`
                    }}
                  />
                  <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
                    <span>8</span>
                    <span>50</span>
                  </div>
                </div>
                
                {/* Цена с детализацией */}
                <div className="text-center pt-2 border-t border-emerald-500/20">
                  <div className="text-2xl font-black text-emerald-400"><AnimatedPrice value={albumPrice.total} /></div>
                  {albumPrice.breakdown.length > 1 ? (
                    <div className="text-[10px] text-emerald-400/70 mt-1 space-y-0.5">
                      {albumPrice.breakdown.map((item, idx) => (
                        <div key={idx}>Треки {item.range}: {item.count} × {formatPrice(item.pricePerTrack)}</div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[10px] text-emerald-400/70 mt-0.5">
                      {albumTracks} треков × 300 ₽
                    </div>
                  )}
                </div>
              </div>

              {/* Особенности */}
              <div className="space-y-2.5 mb-4">
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <svg className="w-2.5 h-2.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="font-bold text-white">От 8 до 50 треков</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <svg className="w-2.5 h-2.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="font-bold text-emerald-400">Скидки от 21 трека</span>
                </div>
              </div>

              {/* Кнопка выбора */}
              <button
                onClick={() => onSelectType('album', albumTracks)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 rounded-xl font-bold transition-all duration-300 text-white shadow-lg shadow-emerald-500/30"
              >
                <span className="text-sm">Выбрать формат</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Подсказка снизу */}
        <div className={`mt-8 flex items-start gap-3 p-4 border rounded-xl max-w-3xl mx-auto ${
          isLight 
            ? 'bg-[rgba(25,25,30,0.75)] border-purple-500/30' 
            : 'bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/20'
        }`}>
          <svg className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 16v-4M12 8h.01"/>
          </svg>
          <div className="text-sm">
            <div className="font-semibold text-purple-400 mb-1">Basic Plan включает</div>
            <div className="text-white text-xs">Публикация на всех площадках · Простой процесс · Поддержка 24/7</div>
          </div>
        </div>

        {/* Кнопка назад */}
        <div className="mt-8 text-center">
          <button
            onClick={onBack}
            className={`inline-flex items-center gap-2 px-6 py-3 border rounded-xl font-semibold transition-all group ${
              isLight 
                ? 'bg-[rgba(25,25,30,0.75)] hover:bg-[rgba(25,25,30,0.85)] border-purple-500/30 hover:border-purple-500/50 text-white' 
                : 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20 text-white'
            }`}
          >
            <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Назад
          </button>
        </div>
      </div>
      
      {/* Стили для красивых слайдеров */}
      <style jsx>{`
        .slider-ep::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 10px rgba(59, 130, 246, 0.5), 0 0 0 3px rgba(59, 130, 246, 0.2);
          transition: all 0.2s ease;
          border: 2px solid white;
        }
        .slider-ep::-webkit-slider-thumb:hover {
          transform: scale(1.15);
          box-shadow: 0 4px 15px rgba(59, 130, 246, 0.6), 0 0 0 5px rgba(59, 130, 246, 0.3);
        }
        .slider-ep::-webkit-slider-thumb:active {
          transform: scale(1.1);
        }
        .slider-ep::-moz-range-thumb {
          width: 20px;
          height: 20px;
          background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 10px rgba(59, 130, 246, 0.5), 0 0 0 3px rgba(59, 130, 246, 0.2);
          border: 2px solid white;
        }
        
        .slider-album::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          background: linear-gradient(135deg, #34d399 0%, #10b981 100%);
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 10px rgba(16, 185, 129, 0.5), 0 0 0 3px rgba(16, 185, 129, 0.2);
          transition: all 0.2s ease;
          border: 2px solid white;
        }
        .slider-album::-webkit-slider-thumb:hover {
          transform: scale(1.15);
          box-shadow: 0 4px 15px rgba(16, 185, 129, 0.6), 0 0 0 5px rgba(16, 185, 129, 0.3);
        }
        .slider-album::-webkit-slider-thumb:active {
          transform: scale(1.1);
        }
        .slider-album::-moz-range-thumb {
          width: 20px;
          height: 20px;
          background: linear-gradient(135deg, #34d399 0%, #10b981 100%);
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 10px rgba(16, 185, 129, 0.5), 0 0 0 3px rgba(16, 185, 129, 0.2);
          border: 2px solid white;
        }
        
        .slider-ep:focus,
        .slider-album:focus {
          outline: none;
        }
      `}</style>
    </div>
  );
}