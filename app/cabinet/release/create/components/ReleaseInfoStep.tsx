import React, { useState } from 'react';
import Link from 'next/link';
import CoverUploader from './CoverUploader';
import ReleaseArtists from '@/components/ui/ReleaseArtists';
import ReleaseContributors, { Contributor, CONTRIBUTOR_ROLES } from '@/components/ui/ReleaseContributors';
import { useTheme } from '@/contexts/ThemeContext';

// Реэкспорт типов для обратной совместимости
export type { Contributor };
export { CONTRIBUTOR_ROLES };

interface ReleaseInfoStepProps {
  releaseTitle: string;
  setReleaseTitle: (value: string) => void;
  // Новый объединённый массив артистов
  releaseArtists?: string[];
  setReleaseArtists?: (value: string[]) => void;
  // Старые props для обратной совместимости (админка)
  artistName?: string;
  setArtistName?: (value: string) => void;
  collaborators?: string[];
  setCollaborators?: (value: string[]) => void;
  collaboratorInput?: string;
  setCollaboratorInput?: (value: string) => void;
  genre: string;
  setGenre: (value: string) => void;
  subgenres: string[];
  setSubgenres: (value: string[]) => void;
  subgenreInput: string;
  setSubgenreInput: (value: string) => void;
  releaseDate: string | null;
  setReleaseDate: (value: string | null) => void;
  showCalendar: boolean;
  setShowCalendar: (value: boolean) => void;
  calendarMonth: number;
  setCalendarMonth: (value: number) => void;
  calendarYear: number;
  setCalendarYear: (value: number) => void;
  coverFile: File | null;
  setCoverFile: (value: File | null) => void;
  existingCoverUrl?: string;
  upc?: string;
  setUpc?: (value: string) => void;
  // Контрибьюторы (авторы)
  contributors?: Contributor[];
  setContributors?: (value: Contributor[]) => void;
  onNext: () => void;
}

export default function ReleaseInfoStep({
  releaseTitle,
  setReleaseTitle,
  releaseArtists = [],
  setReleaseArtists,
  // Старые props для обратной совместимости
  artistName = '',
  setArtistName,
  collaborators = [],
  setCollaborators,
  collaboratorInput = '',
  setCollaboratorInput,
  genre,
  setGenre,
  subgenres,
  setSubgenres,
  subgenreInput,
  setSubgenreInput,
  releaseDate,
  setReleaseDate,
  showCalendar,
  setShowCalendar,
  calendarMonth,
  setCalendarMonth,
  calendarYear,
  setCalendarYear,
  coverFile,
  setCoverFile,
  existingCoverUrl,
  upc,
  setUpc,
  contributors = [],
  setContributors,
  onNext,
}: ReleaseInfoStepProps) {
  const { themeName } = useTheme();
  const isLight = themeName === 'light';
  const [showGenreDropdown, setShowGenreDropdown] = useState(false);
  
  const genres = [
    'Поп',
    'Рок',
    'Хип-хоп',
    'Рэп',
    'Электронная музыка',
    'R&B',
    'Инди',
    'Метал',
    'Джаз',
    'Классика'
  ];

  return (
    <div className="animate-fade-up">
      <div className="mb-5 sm:mb-8">
        <div className="flex items-center gap-2.5 sm:gap-3 mb-3">
          <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br flex items-center justify-center ring-1 ${
            isLight 
              ? 'from-purple-100 to-blue-100 ring-purple-200' 
              : 'from-purple-500/20 to-blue-500/20 ring-white/10'
          }`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-300 sm:w-7 sm:h-7">
              <circle cx="12" cy="12" r="10"/>
              <polygon points="10 8 16 12 10 16 10 8"/>
            </svg>
          </div>
          <div>
            <h2 className={`text-xl sm:text-3xl font-black bg-gradient-to-r bg-clip-text text-transparent ${
              isLight ? 'from-gray-900 to-gray-600' : 'from-white to-zinc-400'
            }`}>Информация о релизе</h2>
            <p className={`text-xs sm:text-sm mt-0.5 sm:mt-1 ${isLight ? 'text-gray-500' : 'text-zinc-500'}`}>Заполните основную информацию о вашем релизе</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-5 sm:gap-8">
        {/* Левая колонка - форма */}
        <div className="space-y-4 sm:space-y-5">
          <div>
            <label className={`text-xs sm:text-sm mb-1.5 sm:mb-2 block ${isLight ? 'text-gray-600' : 'text-zinc-400'}`}>Название релиза *</label>
            <input 
              value={releaseTitle} 
              onChange={(e) => setReleaseTitle(e.target.value)} 
              placeholder="Введите название" 
              className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border outline-none transition-all hover:border-[#6050ba]/50 focus:border-[#6050ba] focus:shadow-lg focus:shadow-[#6050ba]/20 text-sm sm:text-base ${
                isLight 
                  ? 'bg-white placeholder:text-gray-400 border-gray-300' 
                  : 'bg-gradient-to-br from-white/[0.07] to-white/[0.03] placeholder:text-zinc-600 border-white/10'
              }`} 
            />
          </div>

          {/* Артисты релиза с drag & drop */}
          {setReleaseArtists ? (
            <ReleaseArtists
              artists={releaseArtists}
              setArtists={setReleaseArtists}
              maxArtists={10}
            />
          ) : setArtistName && setCollaborators && setCollaboratorInput ? (
            /* Fallback на старую версию для обратной совместимости (админка) */
            <>
              <div>
                <label className={`text-sm mb-2 block ${isLight ? 'text-gray-600' : 'text-zinc-400'}`}>Имя артиста *</label>
                <input 
                  value={artistName} 
                  onChange={(e) => setArtistName(e.target.value)}
                  placeholder="Введите имя артиста"
                  className={`w-full px-4 py-3 rounded-xl border outline-none transition-all hover:border-[#6050ba]/50 focus:border-[#6050ba] focus:shadow-lg focus:shadow-[#6050ba]/20 ${
                    isLight 
                      ? 'bg-white placeholder:text-gray-400 border-gray-300' 
                      : 'bg-gradient-to-br from-white/[0.07] to-white/[0.03] placeholder:text-zinc-600 border-white/10'
                  }`}
                />
              </div>

              <div>
                <label className={`text-sm mb-2 block ${isLight ? 'text-gray-600' : 'text-zinc-400'}`}>
                  Дополнительные артисты {collaborators.length > 0 && <span className={`text-xs ${isLight ? 'text-gray-500' : 'text-zinc-600'}`}>({collaborators.length}/10)</span>}
                  <span className={`text-xs ml-1 ${isLight ? 'text-gray-500' : 'text-zinc-600'}`}>(отобразятся через запятую на площадках)</span>
                </label>
                <div className="flex gap-2">
                  <input 
                    value={collaboratorInput} 
                    onChange={(e) => setCollaboratorInput(e.target.value)} 
                    placeholder="Введите никнейм артиста"
                    disabled={collaborators.length >= 10}
                    onKeyDown={(e) => {
                      if(e.key === 'Enter' && collaboratorInput.trim() && collaborators.length < 10) {
                        e.preventDefault();
                        setCollaborators([...collaborators, collaboratorInput.trim()]);
                        setCollaboratorInput('');
                      }
                    }}
                    onBlur={() => {
                      if(collaboratorInput.trim() && collaborators.length < 10) {
                        setCollaborators([...collaborators, collaboratorInput.trim()]);
                        setCollaboratorInput('');
                      }
                    }}
                    className={`flex-1 px-4 py-3 rounded-xl border outline-none transition-all hover:border-[#6050ba]/50 focus:border-[#6050ba] disabled:opacity-50 ${
                      isLight 
                        ? 'bg-white placeholder:text-gray-400 border-gray-300' 
                        : 'bg-gradient-to-br from-white/[0.07] to-white/[0.03] placeholder:text-zinc-600 border-white/10'
                    }`} 
                  />
                  <button 
                    type="button" 
                    onClick={() => {
                      if(collaboratorInput.trim() && collaborators.length < 10) {
                        setCollaborators([...collaborators, collaboratorInput.trim()]);
                        setCollaboratorInput('');
                      }
                    }}
                    disabled={collaborators.length >= 10 || !collaboratorInput.trim()}
                    className="px-4 py-3 bg-[#6050ba] hover:bg-[#7060ca] rounded-xl text-sm font-medium transition disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center min-w-[48px]"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="12" y1="5" x2="12" y2="19"/>
                      <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                  </button>
                </div>
                {collaborators.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {collaborators.map((collab, idx) => (
                      <div key={idx} className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 group ${
                        isLight ? 'bg-gray-100' : 'bg-white/5'
                      }`}>
                        <span>{collab}</span>
                        <button onClick={() => setCollaborators(collaborators.filter((_, i) => i !== idx))} className={`hover:text-red-400 transition ${isLight ? 'text-gray-400' : 'text-zinc-500'}`}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : null}

          {/* Секция Авторы (Контрибьюторы) - красивые карточки как артисты */}
          {setContributors && (
            <ReleaseContributors
              contributors={contributors}
              setContributors={setContributors}
              maxContributors={20}
            />
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className={`text-xs sm:text-sm mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2 ${isLight ? 'text-gray-600' : 'text-zinc-400'}`}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#9d8df1] w-3.5 h-3.5 sm:w-3.5 sm:h-3.5">
                  <path d="M9 18V5l12-2v13"/>
                  <circle cx="6" cy="18" r="3"/>
                  <circle cx="18" cy="16" r="3"/>
                </svg>
                Жанр *
              </label>
              {genre ? (
                <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-br from-[#6050ba]/20 to-[#9d8df1]/10 rounded-xl border border-[#6050ba]/30">
                  <span className={`font-medium flex-1 ${isLight ? 'text-gray-900' : 'text-white'}`}>{genre}</span>
                  <button onClick={() => setGenre('')} className={`text-xl ${isLight ? 'text-gray-400 hover:text-gray-600' : 'text-zinc-400 hover:text-white'}`}>×</button>
                </div>
              ) : (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowGenreDropdown(!showGenreDropdown)}
                    className={`w-full px-4 py-3 rounded-xl border outline-none transition-all hover:border-[#6050ba]/50 focus:border-[#6050ba] focus:shadow-lg focus:shadow-[#6050ba]/20 text-left flex items-center justify-between ${
                      isLight 
                        ? 'bg-white border-gray-300 text-gray-500' 
                        : 'bg-gradient-to-br from-white/[0.07] to-white/[0.03] border-white/10 text-zinc-500'
                    }`}
                  >
                    <span>Выберите жанр</span>
                    <svg 
                      width="16" 
                      height="16" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      className={`transition-transform ${showGenreDropdown ? 'rotate-180' : ''} ${isLight ? 'text-gray-400' : 'text-zinc-400'}`}
                    >
                      <polyline points="6 9 12 15 18 9" strokeWidth="2"/>
                    </svg>
                  </button>
                  
                  {showGenreDropdown && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setShowGenreDropdown(false)}
                      />
                      <div 
                        className={`absolute top-full left-0 right-0 mt-2 border rounded-xl shadow-2xl overflow-hidden z-20 origin-top ${
                          isLight 
                            ? 'bg-white border-gray-200 shadow-gray-200/50' 
                            : 'bg-[#0d0d0f] border-white/10 shadow-black/50'
                        }`}
                        style={{
                          animation: 'dropdownExpand 0.2s ease-out'
                        }}
                      >
                        <div className="max-h-64 overflow-y-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                          {genres.map((genreOption) => (
                            <button
                              key={genreOption}
                              type="button"
                              onClick={() => {
                                setGenre(genreOption);
                                setShowGenreDropdown(false);
                              }}
                              className={`w-full px-4 py-3 text-left transition-colors border-b last:border-0 ${
                                isLight 
                                  ? 'text-gray-900 hover:bg-[#6050ba]/10 border-gray-100' 
                                  : 'text-white hover:bg-[#6050ba]/20 border-white/5'
                              }`}
                            >
                              {genreOption}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
            <div>
              <label className={`text-xs sm:text-sm mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2 ${isLight ? 'text-gray-600' : 'text-zinc-400'}`}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#9d8df1] w-3.5 h-3.5 sm:w-3.5 sm:h-3.5">
                  <circle cx="5.5" cy="17.5" r="2.5"/>
                  <circle cx="17.5" cy="15.5" r="2.5"/>
                  <path d="M8 17V5l12-2v12"/>
                </svg>
                Поджанры {subgenres.length > 0 && <span className={`text-[10px] sm:text-xs ${isLight ? 'text-gray-500' : 'text-zinc-600'}`}>({subgenres.length}/5)</span>}
              </label>
              <div className="flex gap-2">
                <input 
                  value={subgenreInput} 
                  onChange={(e) => setSubgenreInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && subgenreInput.trim() && subgenres.length < 5) {
                      e.preventDefault();
                      setSubgenres([...subgenres, subgenreInput.trim()]);
                      setSubgenreInput('');
                    }
                  }}
                  onBlur={() => {
                    if(subgenreInput.trim() && subgenres.length < 5) {
                      setSubgenres([...subgenres, subgenreInput.trim()]);
                      setSubgenreInput('');
                    }
                  }}
                  placeholder="Например: Dark Pop" 
                  disabled={subgenres.length >= 5}
                  className={`flex-1 px-3 sm:px-4 py-3 rounded-xl border outline-none disabled:opacity-50 text-sm ${
                    isLight 
                      ? 'bg-white placeholder:text-gray-400 border-gray-300' 
                      : 'bg-gradient-to-br from-white/[0.07] to-white/[0.03] placeholder:text-zinc-600 border-white/10'
                  }`}
                />
                <button 
                  type="button"
                  onClick={() => {
                    if(subgenreInput.trim() && subgenres.length < 5) {
                      setSubgenres([...subgenres, subgenreInput.trim()]);
                      setSubgenreInput('');
                    }
                  }}
                  disabled={subgenres.length >= 5 || !subgenreInput.trim()}
                  className="px-4 py-3 bg-[#6050ba] hover:bg-[#7060ca] rounded-xl text-sm font-medium transition disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center min-w-[48px]"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                </button>
              </div>
              {subgenres.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2 max-w-full overflow-x-hidden">
                  {subgenres.map((sub, idx) => (
                    <div key={idx} className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm flex items-center gap-2 max-w-full break-all group ${
                      isLight ? 'bg-gray-100' : 'bg-white/5'
                    }`}>
                      <span className="truncate">{sub}</span>
                      <button onClick={() => setSubgenres(subgenres.filter((_, i) => i !== idx))} className={`hover:text-red-400 transition flex-shrink-0 ${isLight ? 'text-gray-400' : 'text-zinc-500'}`}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {setUpc && (
            <div>
              <label className={`text-sm mb-2 block flex items-center gap-2 ${isLight ? 'text-gray-600' : 'text-zinc-400'}`}>
                UPC (Universal Product Code)
                <span className={`text-xs ${isLight ? 'text-gray-500' : 'text-zinc-600'}`}>опционально</span>
              </label>
              <input 
                value={upc || ''} 
                onChange={(e) => setUpc(e.target.value)}
                placeholder="Введите UPC код (12-13 цифр)"
                maxLength={13}
                className={`w-full px-4 py-3 rounded-xl border outline-none transition-all hover:border-[#6050ba]/50 focus:border-[#6050ba] focus:shadow-lg focus:shadow-[#6050ba]/20 ${
                  isLight 
                    ? 'bg-white placeholder:text-gray-400 border-gray-300' 
                    : 'bg-gradient-to-br from-white/[0.07] to-white/[0.03] placeholder:text-zinc-600 border-white/10'
                }`}
              />
              <p className={`text-xs mt-1.5 ${isLight ? 'text-gray-500' : 'text-zinc-600'}`}>UPC — универсальный код товара для распространения релиза</p>
            </div>
          )}

          <div>
            <label className={`text-sm mb-2 block ${isLight ? 'text-gray-600' : 'text-zinc-400'}`}>Дата релиза *</label>
            <div className="relative inline-block">
              <div 
                onClick={() => {
                  if (!showCalendar) {
                    // При открытии календаря устанавливаем месяц/год на выбранную дату или текущую
                    if (releaseDate) {
                      const selectedDate = new Date(releaseDate + 'T00:00:00');
                      setCalendarMonth(selectedDate.getMonth());
                      setCalendarYear(selectedDate.getFullYear());
                    } else {
                      const now = new Date();
                      setCalendarMonth(now.getMonth());
                      setCalendarYear(now.getFullYear());
                    }
                  }
                  setShowCalendar(!showCalendar);
                }}
                className={`inline-flex px-4 py-2.5 rounded-xl border cursor-pointer items-center gap-2 text-sm hover:border-[#6050ba]/50 transition ${
                  isLight 
                    ? 'bg-white border-gray-300' 
                    : 'bg-gradient-to-br from-white/[0.07] to-white/[0.03] border-white/10'
                }`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-[#9d8df1]">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth="2"/>
                  <line x1="16" y1="2" x2="16" y2="6" strokeWidth="2"/>
                  <line x1="8" y1="2" x2="8" y2="6" strokeWidth="2"/>
                  <line x1="3" y1="10" x2="21" y2="10" strokeWidth="2"/>
                </svg>
                <span className={releaseDate ? (isLight ? 'text-gray-900' : 'text-white') : (isLight ? 'text-gray-500' : 'text-zinc-500')}>
                  {releaseDate ? new Date(releaseDate + 'T00:00:00').toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Выберите дату'}
                </span>
              </div>
              
              {showCalendar && (() => {
                const safeMonth = Math.max(0, Math.min(11, calendarMonth));
                const safeYear = Math.max(2020, Math.min(2100, calendarYear));
                return (
                <>
                  {/* Затемнённый фон для закрытия календаря */}
                  <div 
                    className="fixed inset-0 z-[9998]" 
                    onClick={() => setShowCalendar(false)}
                  />
                  <div className={`absolute left-0 top-full z-[9999] mt-2 p-3 border rounded-xl shadow-2xl w-72 ${
                    isLight 
                      ? 'bg-white border-gray-200' 
                      : 'bg-[#0d0d0f] border-[#6050ba]/30'
                  }`}>
                  <div className="flex items-center justify-between mb-3">
                    <button type="button" onClick={() => {
                      if (safeMonth === 0) {
                        setCalendarMonth(11);
                        setCalendarYear(safeYear - 1);
                      } else {
                        setCalendarMonth(safeMonth - 1);
                      }
                    }} className={`p-1 rounded-md ${isLight ? 'hover:bg-gray-100' : 'hover:bg-white/5'}`}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="15 18 9 12 15 6" strokeWidth="2"/></svg>
                    </button>
                    <div className={`font-bold text-sm ${isLight ? 'text-gray-900' : 'text-white'}`}>{new Date(safeYear, safeMonth).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}</div>
                    <button type="button" onClick={() => {
                      if (safeMonth === 11) {
                        setCalendarMonth(0);
                        setCalendarYear(safeYear + 1);
                      } else {
                        setCalendarMonth(safeMonth + 1);
                      }
                    }} className={`p-1 rounded-md ${isLight ? 'hover:bg-gray-100' : 'hover:bg-white/5'}`}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="9 18 15 12 9 6" strokeWidth="2"/></svg>
                    </button>
                  </div>
                  <div className="grid grid-cols-7 gap-0.5 mb-1">
                    {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => (
                      <div key={day} className={`text-center text-[10px] font-bold py-1 ${isLight ? 'text-gray-500' : 'text-zinc-500'}`}>{day}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-0.5">
                    {(() => {
                      const firstDay = new Date(safeYear, safeMonth, 1).getDay();
                      const daysInMonth = new Date(safeYear, safeMonth + 1, 0).getDate();
                      const startDay = firstDay === 0 ? 6 : firstDay - 1;
                      const days = [];
                      
                      // Пустые ячейки до начала месяца
                      for (let i = 0; i < startDay; i++) {
                        days.push(<div key={`empty-${i}`} className="w-8 h-8" />);
                      }
                      
                      // Дни месяца
                      for (let day = 1; day <= daysInMonth; day++) {
                        const month = safeMonth + 1;
                        const monthStr = month < 10 ? `0${month}` : `${month}`;
                        const dayStr = day < 10 ? `0${day}` : `${day}`;
                        const dateStr = `${safeYear}-${monthStr}-${dayStr}`;
                        const isSelected = releaseDate === dateStr;
                        
                        days.push(
                          <button 
                            key={`day-${day}`}
                            type="button"
                            onClick={() => { setReleaseDate(dateStr); setShowCalendar(false); }}
                            className={`w-8 h-8 rounded-md text-xs font-medium transition-all ${
                              isSelected 
                                ? 'bg-gradient-to-br from-[#6050ba] to-[#9d8df1] text-white' 
                                : isLight 
                                  ? 'text-gray-900 hover:bg-gray-100' 
                                  : 'text-white hover:bg-white/10'
                            }`}
                          >
                            {day}
                          </button>
                        );
                      }
                      
                      return days;
                    })()}
                  </div>
                </div>
                </>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Правая колонка - обложка */}
        <div className="lg:w-80">
          <label className={`text-xs sm:text-sm mb-2 sm:mb-3 block font-medium ${isLight ? 'text-gray-600' : 'text-zinc-400'}`}>Обложка *</label>
          <CoverUploader
            coverFile={coverFile}
            setCoverFile={setCoverFile}
            previewUrl={existingCoverUrl}
          />
        </div>
      </div>

      {/* Кнопки навигации */}
      <div className={`mt-6 sm:mt-8 pt-4 sm:pt-6 border-t flex justify-between items-center gap-3 ${isLight ? 'border-gray-200' : 'border-white/10'}`}>
        <Link href="/cabinet" className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold transition text-sm sm:text-base ${
          isLight ? 'bg-gray-100 hover:bg-gray-200' : 'bg-white/5 hover:bg-white/10'
        }`}>
          Отмена
        </Link>
        
        <button 
          onClick={onNext}
          className="px-6 sm:px-8 py-2.5 sm:py-3 bg-[#6050ba] hover:bg-[#7060ca] rounded-xl font-bold transition flex items-center gap-2 text-sm sm:text-base touch-manipulation"
          style={{ color: 'white' }}
        >
          Далее
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" className="w-4 h-4"><polyline points="9 18 15 12 9 6" strokeWidth="2"/></svg>
        </button>
      </div>
    </div>
  );
}
