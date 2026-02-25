import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
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
  artistName: string;
  setArtistName: (value: string) => void;
  collaborators: string[];
  setCollaborators: (value: string[]) => void;
  collaboratorInput: string;
  setCollaboratorInput: (value: string) => void;
  // Новый массив артистов (объединяет artistName + collaborators)
  releaseArtists?: string[];
  setReleaseArtists?: (value: string[]) => void;
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
  // Контрибьюторы (авторы)
  contributors?: Contributor[];
  setContributors?: (value: Contributor[]) => void;
  onNext: () => void;
}

export default function ReleaseInfoStep({
  releaseTitle,
  setReleaseTitle,
  artistName,
  setArtistName,
  collaborators,
  setCollaborators,
  collaboratorInput,
  setCollaboratorInput,
  releaseArtists = [],
  setReleaseArtists,
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
  contributors = [],
  setContributors,
  onNext,
}: ReleaseInfoStepProps) {
  const router = useRouter();
  const [showGenreDropdown, setShowGenreDropdown] = useState(false);
  const { themeName } = useTheme();
  const isLight = themeName === 'light';
  
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
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center ring-1 ${
            isLight 
              ? 'from-purple-100 to-blue-100 ring-purple-200' 
              : 'from-purple-500/20 to-blue-500/20 ring-white/10'
          }`}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={isLight ? 'text-purple-600' : 'text-purple-300'}>
              <circle cx="12" cy="12" r="10"/>
              <polygon points="10 8 16 12 10 16 10 8"/>
            </svg>
          </div>
          <div>
            <h2 className={`text-3xl font-black bg-gradient-to-r bg-clip-text text-transparent ${
              isLight ? 'from-gray-900 to-gray-600' : 'from-white to-zinc-400'
            }`}>Информация о релизе</h2>
            <p className={`text-sm mt-1 ${isLight ? 'text-gray-500' : 'text-zinc-500'}`}>Заполните основную информацию о вашем релизе</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8">
        {/* Левая колонка - форма */}
        <div className="space-y-5">
          <div>
            <label className={`text-sm mb-2 flex items-center gap-2 ${isLight ? 'text-gray-600' : 'text-zinc-400'}`}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-sky-400/70">
                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
              </svg>
              Название релиза *
            </label>
            <input 
              value={releaseTitle} 
              onChange={(e) => setReleaseTitle(e.target.value)} 
              placeholder="Введите название" 
              className={`w-full px-4 py-3 rounded-xl border outline-none transition-all hover:border-blue-400/30 focus:border-blue-400/50 focus:shadow-lg focus:shadow-blue-500/5 ${
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
          ) : (
            /* Fallback на старую версию для обратной совместимости */
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
                  Дополнительные артисты {collaborators.length > 0 && <span className={`text-xs ${isLight ? 'text-gray-400' : 'text-zinc-600'}`}>({collaborators.length}/10)</span>}
                  <span className={`text-xs ml-1 ${isLight ? 'text-gray-400' : 'text-zinc-600'}`}>(отобразятся через запятую на площадках)</span>
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
                        <button onClick={() => setCollaborators(collaborators.filter((_, i) => i !== idx))} className="text-zinc-500 hover:text-red-400 transition">
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
          )}

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
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-400/70 w-3.5 h-3.5 sm:w-3.5 sm:h-3.5">
                  <path d="M9 18V5l12-2v13"/>
                  <circle cx="6" cy="18" r="3"/>
                  <circle cx="18" cy="16" r="3"/>
                </svg>
                Жанр *
              </label>
              {genre ? (
                <div className={`flex items-center gap-2 px-4 py-3 bg-gradient-to-br rounded-xl border ${
                  isLight 
                    ? 'from-amber-100 to-orange-50 border-amber-300' 
                    : 'from-amber-500/10 to-orange-500/5 border-amber-500/20'
                }`}>
                  <span className={`font-medium flex-1 ${isLight ? 'text-gray-900' : 'text-white'}`}>{genre}</span>
                  <button onClick={() => setGenre('')} className={`text-xl ${isLight ? 'text-gray-400 hover:text-gray-600' : 'text-zinc-400 hover:text-white'}`}>×</button>
                </div>
              ) : (
                <div className="relative" style={{ zIndex: 9999 }}>
                  <button
                    type="button"
                    onClick={() => setShowGenreDropdown(!showGenreDropdown)}
                    className={`w-full px-4 py-3 rounded-xl border outline-none transition-all hover:border-amber-400/30 focus:border-amber-400/50 focus:shadow-lg focus:shadow-amber-500/5 text-left flex items-center justify-between ${
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
                        className="fixed inset-0 z-[9998]" 
                        onClick={() => setShowGenreDropdown(false)}
                      />
                      <div 
                        data-dropdown="genre"
                        className={`genre-dropdown-menu absolute bottom-full left-0 right-0 mb-2 border rounded-xl overflow-hidden z-[9999] origin-bottom ${
                          isLight 
                            ? 'bg-white border-gray-200 shadow-xl' 
                            : 'bg-[#0d0d0f] border-white/10 shadow-2xl shadow-black/50'
                        }`}
                        style={{
                          animation: 'dropdownExpandUp 0.2s ease-out'
                        }}
                      >
                        <div className="max-h-80 overflow-y-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                          {genres.map((genreOption) => (
                            <button
                              key={genreOption}
                              type="button"
                              onClick={() => {
                                setGenre(genreOption);
                                setShowGenreDropdown(false);
                              }}
                              className={`genre-option-btn w-full px-4 py-3 text-left transition-colors border-b last:border-0 ${
                                isLight 
                                  ? 'hover:bg-purple-50 border-gray-100 !text-gray-900' 
                                  : 'hover:bg-[#6050ba]/20 border-white/5 !text-white'
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
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-400/70 w-3.5 h-3.5 sm:w-3.5 sm:h-3.5">
                  <circle cx="5.5" cy="17.5" r="2.5"/>
                  <circle cx="17.5" cy="15.5" r="2.5"/>
                  <path d="M8 17V5l12-2v12"/>
                </svg>
                Поджанры {subgenres.length > 0 && <span className={`text-xs ${isLight ? 'text-gray-400' : 'text-zinc-600'}`}>({subgenres.length}/5)</span>}
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
                      <button onClick={() => setSubgenres(subgenres.filter((_, i) => i !== idx))} className="text-zinc-500 hover:text-red-400 transition flex-shrink-0">
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

          <div>
            <label className={`text-xs sm:text-sm mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2 ${isLight ? 'text-gray-600' : 'text-zinc-400'}`}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-violet-400/70 w-3.5 h-3.5 sm:w-3.5 sm:h-3.5">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              Дата релиза *
            </label>
            <div className="relative inline-block">
              <div 
                onClick={() => setShowCalendar(!showCalendar)}
                className={`inline-flex px-4 py-2.5 rounded-xl border cursor-pointer items-center gap-2 text-sm hover:border-violet-400/30 transition ${
                  isLight 
                    ? 'bg-white border-gray-300' 
                    : 'bg-gradient-to-br from-white/[0.07] to-white/[0.03] border-white/10'
                }`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-violet-400/70">
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
                  {/* Backdrop для закрытия календаря при клике вне */}
                  <div 
                    className="fixed inset-0 z-[9998]" 
                    onClick={() => setShowCalendar(false)}
                  />
                  <div className={`absolute z-[9999] bottom-full mb-2 p-3 border rounded-xl shadow-2xl w-72 ${
                    isLight 
                      ? 'bg-white border-gray-200' 
                      : 'bg-[#0d0d0f] border-[#6050ba]/30'
                  }`}>
                  <div className="flex items-center justify-between mb-3">
                    <button onClick={() => {
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
                    <button onClick={() => {
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
          <label className={`text-sm mb-3 block font-medium ${isLight ? 'text-gray-600' : 'text-zinc-400'}`}>Обложка *</label>
          <CoverUploader
            coverFile={coverFile}
            setCoverFile={setCoverFile}
            previewUrl={existingCoverUrl}
          />
        </div>
      </div>

      {/* Кнопки навигации */}
      <div className={`mt-8 pt-6 border-t flex justify-between ${isLight ? 'border-gray-200' : 'border-white/10'}`}>
        <button 
          onClick={() => router.push('/cabinet')} 
          className={`px-6 py-3 rounded-xl font-bold transition ${
            isLight 
              ? 'bg-gray-100 hover:bg-gray-200 text-gray-700' 
              : 'bg-white/5 hover:bg-white/10'
          }`}
        >
          Отмена
        </button>
        <button 
          onClick={onNext}
          className="px-8 py-3 bg-[#6050ba] hover:bg-[#7060ca] rounded-xl font-bold transition flex items-center gap-2"
          style={{ color: 'white' }}
        >
          Далее
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white"><polyline points="9 18 15 12 9 6" strokeWidth="2"/></svg>
        </button>
      </div>
    </div>
  );
}
