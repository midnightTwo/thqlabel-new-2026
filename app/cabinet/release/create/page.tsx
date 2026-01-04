"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AnimatedBackground from '@/components/ui/AnimatedBackground';
import { supabase } from '../../lib/supabase';
import { useTheme } from '@/contexts/ThemeContext';
import { getAllCountries } from '@/components/icons/CountryFlagsSVG';
import {
  ReleaseInfoStep,
  TracklistStep,
  CountriesStep,
  ContractStep,
  PlatformsStep,
  PromoStep,
  SendStep,
  ReleaseTypeSelector,
  getAllPlatforms,
} from './components';

export type ReleaseType = 'single' | 'ep' | 'album';
export type PromoStatus = 'not-started' | 'skipped' | 'filled';

// Компонент боковой панели шагов (адаптивный)
function StepsSidebar({ 
  currentStep, 
  setCurrentStep,
  onBackToCabinet,
  releaseTitle,
  releaseType,
  genre,
  coverFile,
  releaseDate,
  tracksCount,
  agreedToContract,
  selectedPlatforms,
  excludedCountries,
  promoStatus,
  isLight
}: { 
  currentStep: string; 
  setCurrentStep: (step: string) => void;
  onBackToCabinet: () => void;
  releaseTitle: string;
  releaseType: ReleaseType | null;
  genre: string;
  coverFile: File | null;
  releaseDate: string | null;
  tracksCount: number;
  agreedToContract: boolean;
  selectedPlatforms: number;
  excludedCountries: string[];
  promoStatus: PromoStatus;
  isLight: boolean;
}) {
  const allCountries = getAllCountries();
  const [mobileStepsOpen, setMobileStepsOpen] = useState(false);
  // Минимальное количество треков в зависимости от типа релиза
  const getMinTracks = (type: ReleaseType | null): number => {
    if (type === 'ep') return 2;
    if (type === 'album') return 7;
    return 1; // single
  };

  // Проверка заполненности каждого шага
  const isStepComplete = (stepId: string): boolean => {
    switch(stepId) {
      case 'release':
        return !!(releaseTitle.trim() && genre && coverFile && releaseDate);
      case 'tracklist':
        return tracksCount >= getMinTracks(releaseType);
      case 'countries':
        return allCountries.length - excludedCountries.length > 0; // хотя бы одна страна выбрана
      case 'contract':
        return agreedToContract;
      case 'platforms':
        return selectedPlatforms > 0;
      case 'promo':
        return promoStatus !== 'not-started'; // Завершён если skipped или filled
      case 'send':
        return false; // Финальный шаг
      default:
        return false;
    }
  };
  
  // Получение статуса для promo (для разных цветов галочки)
  const getPromoStepStatus = (): 'complete' | 'skipped' | 'incomplete' => {
    if (promoStatus === 'filled') return 'complete';
    if (promoStatus === 'skipped') return 'skipped';
    return 'incomplete';
  };

  const steps = [
    { id: 'release', label: 'Релиз', shortLabel: 'Релиз', icon: '1' },
    { id: 'tracklist', label: 'Треклист', shortLabel: 'Треки', icon: '2' },
    { id: 'countries', label: 'Страны', shortLabel: 'Страны', icon: '3' },
    { id: 'contract', label: 'Договор', shortLabel: 'Договор', icon: '4' },
    { id: 'platforms', label: 'Площадки', shortLabel: 'Площадки', icon: '5' },
    { id: 'promo', label: 'Промо', shortLabel: 'Промо', icon: '6' },
    { id: 'send', label: 'Отправка', shortLabel: 'Отправка', icon: 'send' },
  ];

  // 6 основных шагов для прогресса (промо считается если заполнен ИЛИ пропущен)
  const mainStepIds = ['release', 'tracklist', 'countries', 'contract', 'platforms', 'promo'];
  const completedSteps = mainStepIds.filter(id => isStepComplete(id)).length;
  const totalRequiredSteps = 6;
  const progress = (completedSteps / totalRequiredSteps) * 100;

  // Плавный градиент от красного через оранжевый/желтый к зелёному
  const getProgressColor = () => {
    if (completedSteps === 0) return { from: '#ef4444', to: '#dc2626' }; // red
    if (completedSteps === 1) return { from: '#f97316', to: '#ea580c' }; // orange
    if (completedSteps === 2) return { from: '#fb923c', to: '#f97316' }; // orange-light
    if (completedSteps === 3) return { from: '#fbbf24', to: '#f59e0b' }; // amber
    if (completedSteps === 4) return { from: '#a3e635', to: '#84cc16' }; // lime
    if (completedSteps === 5) return { from: '#4ade80', to: '#22c55e' }; // green-light
    return { from: '#10b981', to: '#059669' }; // emerald (6/6)
  };

  const progressColor = getProgressColor();

  return (
    <>
      {/* Десктоп версия - вертикальная боковая панель */}
      <aside className={`hidden lg:flex lg:w-64 w-full backdrop-blur-xl border rounded-3xl p-6 pb-8 flex-col lg:self-start lg:sticky lg:top-24 shadow-2xl relative overflow-hidden ${
        isLight
          ? 'bg-[rgba(255,255,255,0.45)] border-white/60 shadow-purple-500/10'
          : 'bg-gradient-to-br from-white/[0.07] to-white/[0.02] border-white/10 shadow-black/20'
      }`}>
        {/* Декоративный градиент */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 pointer-events-none" />
        
        {/* Заголовок с кнопкой назад */}
        <div className="mb-4 relative z-10">
          <div className="flex items-center justify-between mb-2">
            <h3 className={`font-bold text-lg bg-gradient-to-r bg-clip-text text-transparent ${
              isLight ? 'from-[#2a2550] to-[#4a4570]' : 'from-white to-zinc-300'
            }`}>Создание релиза</h3>
            <button
              onClick={onBackToCabinet}
              className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 flex items-center justify-center transition-all group/back"
              title="В кабинет"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-400 group-hover/back:text-white transition-colors">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </div>
          <p className={`text-xs ${isLight ? 'text-[#5a5580]' : 'text-zinc-400'}`}>Exclusive Plan</p>
        </div>
        
        {/* Индикатор типа релиза */}
        {releaseType && (
          <div className="mb-3 p-3 backdrop-blur-lg bg-gradient-to-br from-purple-500/20 via-purple-500/10 to-blue-500/20 border border-white/20 rounded-xl relative overflow-hidden group hover:border-white/30 transition-all">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide">Формат</span>
                <button
                  onClick={() => setCurrentStep('type')}
                  className="flex items-center gap-1 px-2 py-0.5 backdrop-blur-md bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/40 hover:border-purple-400/60 rounded-lg text-[10px] font-semibold text-purple-300 hover:text-purple-200 transition-all"
                  title="Изменить тип релиза"
                >
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Иконка типа */}
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                  releaseType === 'single' ? 'bg-purple-500/20' :
                  releaseType === 'ep' ? 'bg-blue-500/20' :
                  'bg-emerald-500/20'
                }`}>
                  {releaseType === 'single' && (
                    <svg className="w-3 h-3 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M9 18V5l12-2v13" />
                      <circle cx="6" cy="18" r="3" />
                      <circle cx="18" cy="16" r="3" />
                    </svg>
                  )}
                  {releaseType === 'ep' && (
                    <svg className="w-3 h-3 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="10" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                  {releaseType === 'album' && (
                    <svg className="w-3 h-3 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                  )}
                </div>
                
                {/* Текст */}
                <div className="flex-1">
                  <div className="font-bold text-sm text-white">
                    {releaseType === 'single' && 'Сингл'}
                    {releaseType === 'ep' && 'EP'}
                    {releaseType === 'album' && 'Альбом'}
                  </div>
                  <div className={`text-[10px] font-medium ${
                    releaseType === 'single' ? 'text-purple-400' :
                    releaseType === 'ep' ? 'text-blue-400' :
                    'text-emerald-400'
                  }`}>
                    {releaseType === 'single' && '1 трек'}
                    {releaseType === 'ep' && '2-7 треков'}
                    {releaseType === 'album' && '8-50 треков'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="space-y-2 relative z-10">
          {steps.map((step, idx) => {
            const isComplete = isStepComplete(step.id);
            const isCurrent = currentStep === step.id;
            const isPromoSkipped = step.id === 'promo' && promoStatus === 'skipped';
            const isPromoFilled = step.id === 'promo' && promoStatus === 'filled';
            
            return (
              <button 
                key={step.id} 
                onClick={() => setCurrentStep(step.id)}
                className={`w-full text-left py-3 px-4 rounded-xl flex items-center gap-3 transition-all relative overflow-hidden group/step ${
                  isCurrent 
                    ? 'backdrop-blur-md bg-gradient-to-r from-purple-500/40 to-purple-600/40 text-white shadow-lg shadow-purple-500/30 border border-white/20' 
                    : 'backdrop-blur-sm bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white border border-transparent hover:border-white/10'
                }`}
              >
                {/* Hover эффект */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/10 to-purple-500/0 opacity-0 group-hover/step:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10 flex items-center gap-3 w-full">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  isPromoFilled ? 'bg-emerald-500/20 text-emerald-400' :
                  isPromoSkipped ? 'bg-yellow-500/20 text-yellow-400' :
                  isComplete ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10'
                }`}>
                  {(isComplete || isPromoSkipped || isPromoFilled) && step.id !== 'send' ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <polyline points="20 6 9 17 4 12" strokeWidth="3"/>
                    </svg>
                  ) : step.id === 'send' ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="22" y1="2" x2="11" y2="13"/>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                    </svg>
                  ) : (
                    step.icon
                  )}
                </span>
                <span className="text-sm font-medium">{step.label}</span>
                {isCurrent && (
                  <span className="ml-auto w-2 h-2 rounded-full bg-white animate-pulse shadow-lg shadow-white/50" />
                )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Прогресс */}
        <div className="mt-auto pt-4 border-t border-white/10 relative z-10 px-1">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-zinc-400 font-medium">Прогресс</span>
            <div className="flex items-center font-mono text-sm leading-none">
              <span 
                className="font-bold transition-colors duration-500 drop-shadow-sm" 
                style={{ color: progressColor.from, textShadow: `0 0 8px ${progressColor.from}60` }}
              >
                {completedSteps}
              </span>
              <span className="text-zinc-500 mx-0.5">/</span>
              <span className="text-zinc-400 font-bold">6</span>
            </div>
          </div>
          
          {/* Сегментированный прогресс-бар с красивым свечением */}
          <div className="relative">
            {/* Свечение под прогресс-баром */}
            {completedSteps > 0 && (
              <div 
                className="absolute -inset-1 rounded-xl blur-md opacity-40 transition-all duration-700"
                style={{ 
                  background: `linear-gradient(90deg, ${progressColor.from}, ${progressColor.to})`,
                  width: `${(completedSteps / 6) * 100}%`
                }}
              />
            )}
            
            {/* Фоновые сегменты */}
            <div className="flex gap-1.5 relative">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div 
                  key={i} 
                  className="flex-1 h-3 rounded-full bg-white/5 border border-white/10 overflow-hidden relative"
                >
                  {/* Заполненный сегмент */}
                  <div 
                    className={`absolute inset-0 transition-all duration-500 ease-out ${
                      i < completedSteps ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                    }`}
                    style={{ 
                      background: `linear-gradient(135deg, ${progressColor.from}, ${progressColor.to})`,
                      boxShadow: i < completedSteps ? `0 0 12px ${progressColor.from}80, 0 0 4px ${progressColor.from}, inset 0 1px 0 rgba(255,255,255,0.4)` : 'none',
                      transitionDelay: `${i * 60}ms`
                    }}
                  >
                    {/* Верхний блик */}
                    <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/40 to-transparent rounded-t-full" />
                    {/* Анимированный блик на последнем заполненном */}
                    {i === completedSteps - 1 && completedSteps > 0 && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Статус */}
          <div className="flex items-center justify-center mt-3 gap-2">
            {completedSteps === 6 ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 shadow-lg shadow-emerald-500/20">
                <svg className="w-3.5 h-3.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span className="text-[11px] font-semibold text-emerald-400">Готово к отправке</span>
              </div>
            ) : (
              <span className="text-[11px] text-zinc-500">
                Осталось <span className="font-semibold" style={{ color: progressColor.from }}>{6 - completedSteps}</span> {6 - completedSteps === 1 ? 'шаг' : 'шагов'}
              </span>
            )}
          </div>
        </div>
      </aside>

      {/* Мобильная версия - компактная полоса прогресса с раскрывающимся списком */}
      <div className="lg:hidden w-full mb-3">
        <div className={`backdrop-blur-xl border rounded-2xl shadow-lg relative overflow-hidden ${
          isLight
            ? 'bg-[rgba(255,255,255,0.45)] border-white/60 shadow-purple-500/10'
            : 'bg-gradient-to-br from-white/[0.07] to-white/[0.02] border-white/10 shadow-black/10'
        }`}>
          {/* Декоративный градиент */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 pointer-events-none" />
          
          {/* Основная строка - кликабельная */}
          <div 
            className="relative z-10 p-3 cursor-pointer"
            onClick={() => setMobileStepsOpen(!mobileStepsOpen)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* Кнопка назад */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onBackToCabinet();
                  }}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                    isLight 
                      ? 'bg-purple-500/10 hover:bg-purple-500/20 border border-purple-300/30' 
                      : 'bg-white/5 hover:bg-white/10 border border-white/10'
                  }`}
                  title="В кабинет"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={isLight ? 'text-purple-600' : 'text-zinc-400'}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                {/* Текущий шаг */}
                <div className="flex items-center gap-2">
                  <div>
                    <div className={`text-xs font-medium ${isLight ? 'text-purple-600' : 'text-purple-400'}`}>
                      {steps.find(s => s.id === currentStep)?.label || 'Выбор типа'}
                    </div>
                    <div className={`text-[10px] ${isLight ? 'text-[#5a5580]' : 'text-zinc-500'}`}>
                      {releaseType ? (releaseType === 'single' ? 'Сингл' : releaseType === 'ep' ? 'EP' : 'Альбом') : 'Шаг 0 из 6'}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Стрелка раскрытия по центру */}
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isLight ? 'bg-purple-500/10 hover:bg-purple-500/20' : 'bg-white/5 hover:bg-white/10'} ${!mobileStepsOpen ? 'animate-bounce-subtle' : ''}`}>
                <svg 
                  width="20" height="20" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2.5" 
                  className={`transition-transform duration-200 ${isLight ? 'text-purple-500' : 'text-zinc-300'} ${mobileStepsOpen ? 'rotate-180' : ''}`}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              
              {/* Прогресс справа */}
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5">
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <div 
                      key={i} 
                      className={`w-4 h-1.5 rounded-full transition-all duration-300 ${
                        i < completedSteps 
                          ? '' 
                          : isLight ? 'bg-purple-200/50' : 'bg-white/10'
                      }`}
                      style={i < completedSteps ? { 
                        background: `linear-gradient(135deg, ${progressColor.from}, ${progressColor.to})`,
                        boxShadow: `0 0 4px ${progressColor.from}60`
                      } : undefined}
                    />
                  ))}
                </div>
                <span className="text-xs font-bold" style={{ color: progressColor.from }}>
                  {completedSteps}/6
                </span>
              </div>
            </div>
          </div>
          
          {/* Раскрывающийся список шагов */}
          {mobileStepsOpen && (
            <div className={`relative z-10 px-3 pb-3 pt-1 border-t ${isLight ? 'border-purple-200/50' : 'border-white/10'}`}>
              <div className="space-y-1.5">
                {steps.map((step) => {
                  const isComplete = isStepComplete(step.id);
                  const isCurrent = currentStep === step.id;
                  const isPromoSkipped = step.id === 'promo' && promoStatus === 'skipped';
                  const isPromoFilled = step.id === 'promo' && promoStatus === 'filled';
                  
                  return (
                    <button 
                      key={step.id} 
                      onClick={() => {
                        setCurrentStep(step.id);
                        setMobileStepsOpen(false);
                      }}
                      className={`w-full text-left py-2.5 px-3 rounded-xl flex items-center gap-2.5 transition-all ${
                        isCurrent 
                          ? isLight
                            ? 'bg-purple-500/20 text-purple-700 border border-purple-300/50'
                            : 'bg-gradient-to-r from-purple-500/30 to-purple-600/30 text-white border border-white/20'
                          : isLight
                            ? 'bg-purple-50/50 text-[#5a5580] hover:bg-purple-100/50 border border-transparent'
                            : 'bg-white/5 text-zinc-400 hover:bg-white/10 border border-transparent hover:border-white/10'
                      }`}
                    >
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        isPromoFilled ? 'bg-emerald-500/20 text-emerald-500' :
                        isPromoSkipped ? 'bg-yellow-500/20 text-yellow-500' :
                        isComplete ? 'bg-emerald-500/20 text-emerald-500' : 
                        isLight ? 'bg-purple-200/50 text-purple-600' : 'bg-white/10 text-zinc-400'
                      }`}>
                        {(isComplete || isPromoSkipped || isPromoFilled) && step.id !== 'send' ? (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <polyline points="20 6 9 17 4 12" strokeWidth="3"/>
                          </svg>
                        ) : step.id === 'send' ? (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="22" y1="2" x2="11" y2="13"/>
                            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                          </svg>
                        ) : (
                          step.icon
                        )}
                      </span>
                      <span className="text-sm font-medium flex-1">{step.label}</span>
                      {isCurrent && (
                        <span className={`w-2 h-2 rounded-full animate-pulse ${isLight ? 'bg-purple-500' : 'bg-white'}`} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function CreateReleasePage() {
  const router = useRouter();
  const { themeName } = useTheme();
  const isLight = themeName === 'light';
  const [user, setUser] = useState<any>(null);
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState('type'); // Начинаем с выбора типа
  const [releaseType, setReleaseType] = useState<ReleaseType | null>(null); // Тип релиза
  
  // Release info state
  const [releaseTitle, setReleaseTitle] = useState('');
  const [artistName, setArtistName] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [genre, setGenre] = useState('');
  const [subgenres, setSubgenres] = useState<string[]>([]);
  const [subgenreInput, setSubgenreInput] = useState('');
  const [releaseDate, setReleaseDate] = useState<string | null>(null);
  const [collaborators, setCollaborators] = useState<string[]>([]);
  const [collaboratorInput, setCollaboratorInput] = useState('');
  
  // Calendar state
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  
  // Tracklist state
  interface AudioMetadata {
    format: string;
    duration?: number;
    bitrate?: string;
    sampleRate?: string;
    size: number;
  }
  
  const [tracks, setTracks] = useState<Array<{
    title: string;
    link: string;
    audioFile?: File | null;
    audioMetadata?: AudioMetadata | null;
    hasDrugs: boolean;
    lyrics: string;
    language: string;
    version?: string;
    producers?: string[];
    featuring?: string[];
  }>>([]);
  const [currentTrack, setCurrentTrack] = useState<number | null>(null);
  const [trackTitle, setTrackTitle] = useState('');
  const [trackLink, setTrackLink] = useState('');
  const [trackAudioFile, setTrackAudioFile] = useState<File | null>(null);
  const [trackAudioMetadata, setTrackAudioMetadata] = useState<AudioMetadata | null>(null);
  const [trackHasDrugs, setTrackHasDrugs] = useState(false);
  const [trackLyrics, setTrackLyrics] = useState('');
  const [trackLanguage, setTrackLanguage] = useState('');
  const [trackVersion, setTrackVersion] = useState('');
  const [trackProducers, setTrackProducers] = useState<string[]>([]);
  const [trackFeaturing, setTrackFeaturing] = useState<string[]>([]);
  const [trackIsrc, setTrackIsrc] = useState('');
  const [trackIsInstrumental, setTrackIsInstrumental] = useState(false);
  
  // Countries state - excludedCountries: пустой массив = все страны выбраны
  const [excludedCountries, setExcludedCountries] = useState<string[]>([]);
  
  // Platforms state - сразу выбраны все площадки
  const [selectedPlatformsList, setSelectedPlatformsList] = useState<string[]>(() => getAllPlatforms());
  const [selectedPlatforms, setSelectedPlatforms] = useState(() => getAllPlatforms().length);
  
  // Contract state
  const [agreedToContract, setAgreedToContract] = useState(false);
  
  // Promo state
  const [focusTrack, setFocusTrack] = useState('');
  const [focusTrackPromo, setFocusTrackPromo] = useState('');
  const [albumDescription, setAlbumDescription] = useState('');
  const [promoPhotos, setPromoPhotos] = useState<string[]>([]);
  const [promoStatus, setPromoStatus] = useState<PromoStatus>('not-started');
  
  // Draft state
  const [draftId, setDraftId] = useState<string | null>(null);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [prevStepsCompleted, setPrevStepsCompleted] = useState<string[]>([]);

  // Функция проверки заполненности шага (дублируется из StepsSidebar для использования в эффекте)
  const isStepComplete = (stepId: string): boolean => {
    const allCountries = getAllCountries();
    const getMinTracks = (type: ReleaseType | null): number => {
      if (type === 'ep') return 2;
      if (type === 'album') return 7;
      return 1;
    };
    switch(stepId) {
      case 'release':
        return !!(releaseTitle.trim() && genre && coverFile && releaseDate);
      case 'tracklist':
        return tracks.length >= getMinTracks(releaseType);
      case 'countries':
        return allCountries.length - excludedCountries.length > 0;
      case 'contract':
        return agreedToContract;
      case 'platforms':
        return selectedPlatforms > 0;
      case 'promo':
        return promoStatus !== 'not-started';
      default:
        return false;
    }
  };

  useEffect(() => {
    const getUser = async () => {
      if (!supabase) { setLoading(false); return; }
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/auth');
        return;
      }
      
      setUser(user);
      const displayName = user.user_metadata?.display_name || user.email?.split('@')[0] || 'Artist';
      setNickname(displayName);
      // Автозаполнение имени артиста из никнейма
      setArtistName(displayName);
      setLoading(false);
    };
    
    getUser();
  }, [router]);
  
  // Функция сохранения/обновления черновика
  const saveDraft = async (showNotification = false) => {
    if (!user || !supabase || isSavingDraft) return null;
    
    // Сохраняем только если заполнен хотя бы первый шаг (релиз)
    if (!releaseTitle.trim() || !genre || !coverFile || !releaseDate) return null;
    
    console.log('🔄 Начинаем сохранение черновика...');
    
    setIsSavingDraft(true);
    try {
      // Загружаем обложку если есть и нет существующего draftId с coverUrl
      let coverUrl = null;
      if (coverFile) {
        console.log('📤 Загружаем обложку...');
        const fileExt = coverFile.name.split('.').pop();
        // Путь: user_id/draft-timestamp.ext — соответствует политике RLS
        const fileName = `${user.id}/draft-${Date.now()}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('release-covers')
          .upload(fileName, coverFile, { contentType: coverFile.type, upsert: true });
        
        if (uploadError) {
          console.error('❌ Ошибка загрузки обложки:', uploadError);
        } else if (uploadData) {
          const { data: { publicUrl } } = supabase.storage
            .from('release-covers')
            .getPublicUrl(fileName);
          coverUrl = publicUrl;
          console.log('✅ Обложка загружена:', coverUrl);
        }
      }
      
      // Подготавливаем треки без аудио файлов (только метаданные)
      const tracksData = tracks.map(track => ({
        title: track.title,
        link: track.link || '',
        hasDrugs: track.hasDrugs,
        lyrics: track.lyrics,
        language: track.language,
        version: track.version,
        producers: track.producers,
        featuring: track.featuring,
        audioMetadata: track.audioMetadata,
      }));
      
      const draftData: any = {
        user_id: user.id,
        title: releaseTitle || 'Без названия',
        artist_name: artistName || nickname,
        cover_url: coverUrl,
        genre: genre || null,
        subgenres: subgenres.length > 0 ? subgenres : [],
        release_date: releaseDate,
        collaborators: collaborators.length > 0 ? collaborators : [],
        release_type: releaseType,
        tracks: tracksData,
        countries: getAllCountries().filter(c => !excludedCountries.includes(c)),
        contract_agreed: agreedToContract,
        contract_agreed_at: agreedToContract ? new Date().toISOString() : null,
        platforms: selectedPlatformsList,
        focus_track: focusTrack || null,
        focus_track_promo: focusTrackPromo || null,
        album_description: albumDescription || null,
        promo_photos: promoPhotos || [],
        wizard_step: currentStep,
        status: 'draft',
        updated_at: new Date().toISOString()
      };
      
      console.log('💾 Данные для сохранения:', draftData);
      
      if (draftId) {
        console.log('🔄 Обновляем существующий черновик:', draftId);
        const { error } = await supabase
          .from('releases_exclusive')
          .update(draftData)
          .eq('id', draftId);
        
        if (error) {
          console.error('❌ Ошибка обновления:', error);
          throw error;
        }
        console.log('✅ Черновик обновлен!');
        if (showNotification) showSaveNotification();
        return draftId;
      } else {
        console.log('➕ Создаем новый черновик...');
        draftData.created_at = new Date().toISOString();
        const { data, error } = await supabase
          .from('releases_exclusive')
          .insert([draftData])
          .select()
          .single();
        
        if (error) {
          console.error('❌ Ошибка создания:', error);
          throw error;
        }
        if (data) {
          console.log('✅ Черновик создан! ID:', data.id);
          setDraftId(data.id);
          if (showNotification) showSaveNotification();
          return data.id;
        }
      }
    } catch (error) {
      console.error('❌ ОШИБКА сохранения черновика:', error);
    } finally {
      setIsSavingDraft(false);
    }
    return null;
  };
  
  // Функция удаления черновика (вызывается при успешной отправке на модерацию)
  const deleteDraft = async () => {
    if (!draftId || !supabase) return;
    
    try {
      console.log('🗑️ Удаляем черновик:', draftId);
      const { error } = await supabase
        .from('releases_exclusive')
        .delete()
        .eq('id', draftId);
      
      if (error) {
        console.error('❌ Ошибка удаления черновика:', error);
      } else {
        console.log('✅ Черновик удален');
        setDraftId(null);
      }
    } catch (error) {
      console.error('❌ Ошибка удаления черновика:', error);
    }
  };
  
  // Показать уведомление о сохранении (используем toast)
  const showSaveNotification = () => {
    // Создаём toast-уведомление
    const existingToasts = document.querySelectorAll('.draft-save-toast');
    existingToasts.forEach(t => t.remove());
    
    const toast = document.createElement('div');
    toast.className = 'draft-save-toast fixed top-6 left-1/2 -translate-x-1/2 z-[99999] flex items-center gap-3 px-5 py-3 rounded-xl border backdrop-blur-2xl bg-gradient-to-r from-emerald-500/20 to-emerald-600/10 border-emerald-500/40 shadow-2xl shadow-emerald-500/20';
    toast.style.animation = 'toastSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
    toast.innerHTML = `
      <div class="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center text-white shrink-0">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
      </div>
      <span class="text-sm font-semibold text-emerald-100">Черновик сохранён</span>
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.animation = 'toastSlideOut 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards';
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  };
  
  // Эффект для автосохранения при изменении состояния шагов
  useEffect(() => {
    const stepIds = ['release', 'tracklist', 'countries', 'contract', 'platforms', 'promo'];
    const currentCompleted = stepIds.filter(id => isStepComplete(id));
    
    // Проверяем, появился ли новый завершённый шаг
    const newlyCompleted = currentCompleted.filter(step => !prevStepsCompleted.includes(step));
    
    if (newlyCompleted.length > 0 && currentStep !== 'type') {
      console.log('📌 Новые завершённые шаги:', newlyCompleted);
      
      // Сохраняем черновик если первый шаг завершён
      if (isStepComplete('release')) {
        saveDraft(true);
      }
    }
    
    setPrevStepsCompleted(currentCompleted);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [releaseTitle, genre, coverFile, releaseDate, tracks.length, excludedCountries.length, agreedToContract, selectedPlatforms, promoStatus]);
  
  // Обработчик перехода на следующий шаг с автосохранением черновика
  const handleNextStep = async (nextStep: string) => {
    // Сохраняем черновик после прохождения любого шага (кроме выбора типа)
    if (currentStep !== 'type' && isStepComplete('release')) {
      await saveDraft(true);
    }
    setCurrentStep(nextStep);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        <AnimatedBackground />
        <div className="text-zinc-600 animate-pulse relative z-10">Загрузка...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Шаг 0: Выбор типа релиза
  if (currentStep === 'type') {
    return (
      <ReleaseTypeSelector 
        onSelectType={(type: 'single' | 'ep' | 'album') => {
          setReleaseType(type);
          setCurrentStep('release');
        }}
        onBack={() => router.push('/cabinet')}
      />
    );
  }

  return (
    <div className="min-h-screen pt-16 sm:pt-20 text-white relative z-10">
      <AnimatedBackground />
      <div className="max-w-[1600px] mx-auto p-3 sm:p-6 lg:p-8 flex flex-col lg:flex-row gap-4 lg:gap-8 items-stretch relative z-20">
        
        {/* Боковая панель с шагами (адаптивная) */}
        <StepsSidebar 
          currentStep={currentStep} 
          setCurrentStep={setCurrentStep}
          onBackToCabinet={() => router.push('/cabinet')}
          releaseTitle={releaseTitle}
          releaseType={releaseType}
          genre={genre}
          coverFile={coverFile}
          releaseDate={releaseDate}
          tracksCount={tracks.length}
          agreedToContract={agreedToContract}
          selectedPlatforms={selectedPlatforms}
          excludedCountries={excludedCountries}
          promoStatus={promoStatus}
          isLight={isLight}
        />

        {/* Основной контент */}
        <section className={`flex-1 backdrop-blur-xl border rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-10 min-h-[500px] shadow-2xl relative ${
          isLight
            ? 'bg-[rgba(255,255,255,0.45)] border-white/60 shadow-purple-500/10'
            : 'bg-gradient-to-br from-white/[0.07] to-white/[0.02] border-white/10 shadow-black/20'
        }`}>
          {/* Декоративный градиент */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 pointer-events-none" />
          
          <div className="relative z-10">
          {/* Шаг 1: Информация о релизе */}
          {currentStep === 'release' && (
            <ReleaseInfoStep
              releaseTitle={releaseTitle}
              setReleaseTitle={setReleaseTitle}
              artistName={artistName}
              setArtistName={setArtistName}
              collaborators={collaborators}
              setCollaborators={setCollaborators}
              collaboratorInput={collaboratorInput}
              setCollaboratorInput={setCollaboratorInput}
              genre={genre}
              setGenre={setGenre}
              subgenres={subgenres}
              setSubgenres={setSubgenres}
              subgenreInput={subgenreInput}
              setSubgenreInput={setSubgenreInput}
              releaseDate={releaseDate}
              setReleaseDate={setReleaseDate}
              showCalendar={showCalendar}
              setShowCalendar={setShowCalendar}
              calendarMonth={calendarMonth}
              setCalendarMonth={setCalendarMonth}
              calendarYear={calendarYear}
              setCalendarYear={setCalendarYear}
              coverFile={coverFile}
              setCoverFile={setCoverFile}
              onNext={() => handleNextStep('tracklist')}
            />
          )}

          {/* Шаг 2: Треклист */}
          {currentStep === 'tracklist' && (
            <TracklistStep
              releaseTitle={releaseTitle}
              releaseType={releaseType}
              coverFile={coverFile}
              tracks={tracks}
              setTracks={setTracks}
              currentTrack={currentTrack}
              setCurrentTrack={setCurrentTrack}
              trackTitle={trackTitle}
              setTrackTitle={setTrackTitle}
              trackLink={trackLink}
              setTrackLink={setTrackLink}
              trackAudioFile={trackAudioFile}
              setTrackAudioFile={setTrackAudioFile}
              trackAudioMetadata={trackAudioMetadata}
              setTrackAudioMetadata={setTrackAudioMetadata}
              trackHasDrugs={trackHasDrugs}
              setTrackHasDrugs={setTrackHasDrugs}
              trackLyrics={trackLyrics}
              setTrackLyrics={setTrackLyrics}
              trackLanguage={trackLanguage}
              setTrackLanguage={setTrackLanguage}
              trackVersion={trackVersion}
              setTrackVersion={setTrackVersion}
              trackProducers={trackProducers}
              setTrackProducers={setTrackProducers}
              trackFeaturing={trackFeaturing}
              setTrackFeaturing={setTrackFeaturing}
              trackIsrc={trackIsrc}
              setTrackIsrc={setTrackIsrc}
              trackIsInstrumental={trackIsInstrumental}
              setTrackIsInstrumental={setTrackIsInstrumental}
              onNext={() => handleNextStep('countries')}
              onBack={() => setCurrentStep('release')}
            />
          )}

          {/* Шаг 3: Страны */}
          {currentStep === 'countries' && (
            <CountriesStep
              excludedCountries={excludedCountries}
              setExcludedCountries={setExcludedCountries}
              onNext={() => handleNextStep('contract')}
              onBack={() => setCurrentStep('tracklist')}
            />
          )}

          {/* Шаг 4: Договор */}
          {currentStep === 'contract' && (
            <ContractStep
              agreedToContract={agreedToContract}
              setAgreedToContract={setAgreedToContract}
              onNext={() => handleNextStep('platforms')}
              onBack={() => setCurrentStep('countries')}
            />
          )}

          {/* Шаг 5: Площадки */}
          {currentStep === 'platforms' && (
            <PlatformsStep
              selectedPlatforms={selectedPlatforms}
              setSelectedPlatforms={setSelectedPlatforms}
              selectedPlatformsList={selectedPlatformsList}
              setSelectedPlatformsList={setSelectedPlatformsList}
              onNext={() => handleNextStep('promo')}
              onBack={() => setCurrentStep('contract')}
            />
          )}

          {/* Шаг 6: Промо */}
          {currentStep === 'promo' && (
            <PromoStep
              tracks={tracks}
              focusTrack={focusTrack}
              setFocusTrack={setFocusTrack}
              focusTrackPromo={focusTrackPromo}
              setFocusTrackPromo={setFocusTrackPromo}
              albumDescription={albumDescription}
              setAlbumDescription={setAlbumDescription}
              promoPhotos={promoPhotos}
              setPromoPhotos={setPromoPhotos}
              onNext={() => handleNextStep('send')}
              onBack={() => setCurrentStep('platforms')}
              onSkip={() => { setPromoStatus('skipped'); handleNextStep('send'); }}
              onFilled={() => setPromoStatus('filled')}
              onResetSkip={() => setPromoStatus('not-started')}
              promoStatus={promoStatus}
            />
          )}

          {/* Шаг 7: Отправка */}
          {currentStep === 'send' && (
            <SendStep
              releaseTitle={releaseTitle}
              artistName={artistName}
              genre={genre}
              releaseType={releaseType}
              tracksCount={tracks.length}
              coverFile={coverFile}
              collaborators={collaborators}
              subgenres={subgenres}
              releaseDate={releaseDate}
              selectedPlatforms={selectedPlatforms}
              agreedToContract={agreedToContract}
              focusTrack={focusTrack}
              focusTrackPromo={focusTrackPromo}
              albumDescription={albumDescription}
              promoPhotos={promoPhotos}
              promoStatus={promoStatus}
              tracks={tracks}
              platforms={selectedPlatformsList}
              countries={getAllCountries().filter(c => !excludedCountries.includes(c))}
              draftId={draftId}
              onDeleteDraft={deleteDraft}
              onBack={() => setCurrentStep('promo')}
            />
          )}
          </div>
        </section>
      </div>
    </div>
  );
}
