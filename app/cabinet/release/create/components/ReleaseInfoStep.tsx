import React, { useState } from 'react';
import Link from 'next/link';
import CoverUploader from './CoverUploader';

interface ReleaseInfoStepProps {
  releaseTitle: string;
  setReleaseTitle: (value: string) => void;
  artistName: string;
  setArtistName: (value: string) => void;
  collaborators: string[];
  setCollaborators: (value: string[]) => void;
  collaboratorInput: string;
  setCollaboratorInput: (value: string) => void;
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
  onNext,
}: ReleaseInfoStepProps) {
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
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center ring-1 ring-white/10">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-300">
              <circle cx="12" cy="12" r="10"/>
              <polygon points="10 8 16 12 10 16 10 8"/>
            </svg>
          </div>
          <div>
            <h2 className="text-3xl font-black bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">Информация о релизе</h2>
            <p className="text-sm text-zinc-500 mt-1">Заполните основную информацию о вашем релизе</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8">
        {/* Левая колонка - форма */}
        <div className="space-y-5">
          <div>
            <label className="text-sm text-zinc-400 mb-2 block">Название релиза *</label>
            <input 
              value={releaseTitle} 
              onChange={(e) => setReleaseTitle(e.target.value)} 
              placeholder="Введите название" 
              className="w-full px-4 py-3 bg-gradient-to-br from-white/[0.07] to-white/[0.03] placeholder:text-zinc-600 rounded-xl border border-white/10 outline-none transition-all hover:border-[#6050ba]/50 focus:border-[#6050ba] focus:shadow-lg focus:shadow-[#6050ba]/20" 
            />
          </div>

          <div>
            <label className="text-sm text-zinc-400 mb-2 block">Имя артиста *</label>
            <input 
              value={artistName} 
              onChange={(e) => setArtistName(e.target.value)}
              placeholder="Введите имя артиста"
              className="w-full px-4 py-3 bg-gradient-to-br from-white/[0.07] to-white/[0.03] placeholder:text-zinc-600 rounded-xl border border-white/10 outline-none transition-all hover:border-[#6050ba]/50 focus:border-[#6050ba] focus:shadow-lg focus:shadow-[#6050ba]/20"
            />
          </div>

          <div>
            <label className="text-sm text-zinc-400 mb-2 block">
              Соавторы {collaborators.length > 0 && <span className="text-zinc-600 text-xs">({collaborators.length}/10)</span>}
            </label>
            <div className="flex gap-2 mb-2">
              <input 
                value={collaboratorInput} 
                onChange={(e) => setCollaboratorInput(e.target.value)} 
                placeholder="Введите ник исполнителя"
                disabled={collaborators.length >= 10}
                onKeyDown={(e) => {
                  if(e.key === 'Enter' && collaboratorInput.trim() && collaborators.length < 10) {
                    setCollaborators([...collaborators, collaboratorInput.trim()]);
                    setCollaboratorInput('');
                  }
                }}
                className="flex-1 px-4 py-3 bg-gradient-to-br from-white/[0.07] to-white/[0.03] placeholder:text-zinc-600 rounded-xl border border-white/10 outline-none transition-all hover:border-[#6050ba]/50 focus:border-[#6050ba] disabled:opacity-50" 
              />
              <button 
                type="button" 
                onClick={() => {
                  if(collaboratorInput.trim() && collaborators.length < 10) {
                    setCollaborators([...collaborators, collaboratorInput.trim()]);
                    setCollaboratorInput('');
                  }
                }}
                disabled={collaborators.length >= 10}
                className="px-4 py-3 bg-[#6050ba] hover:bg-[#7060ca] rounded-xl text-sm font-medium transition disabled:opacity-50"
              >
                Добавить
              </button>
            </div>
            {collaborators.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {collaborators.map((collab, idx) => (
                  <div key={idx} className="px-3 py-1.5 bg-white/5 rounded-lg text-sm flex items-center gap-2">
                    <span>{collab}</span>
                    <button onClick={() => setCollaborators(collaborators.filter((_, i) => i !== idx))} className="text-zinc-400 hover:text-white">×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-zinc-400 mb-2 block">Жанр *</label>
              {genre ? (
                <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-br from-[#6050ba]/20 to-[#9d8df1]/10 rounded-xl border border-[#6050ba]/30">
                  <span className="text-white font-medium flex-1">{genre}</span>
                  <button onClick={() => setGenre('')} className="text-zinc-400 hover:text-white text-xl">×</button>
                </div>
              ) : (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowGenreDropdown(!showGenreDropdown)}
                    className="w-full px-4 py-3 bg-gradient-to-br from-white/[0.07] to-white/[0.03] rounded-xl border border-white/10 outline-none transition-all hover:border-[#6050ba]/50 focus:border-[#6050ba] focus:shadow-lg focus:shadow-[#6050ba]/20 text-left text-zinc-500 flex items-center justify-between"
                  >
                    <span>Выберите жанр</span>
                    <svg 
                      width="16" 
                      height="16" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      className={`text-zinc-400 transition-transform ${showGenreDropdown ? 'rotate-180' : ''}`}
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
                        className="absolute top-full left-0 right-0 mt-2 bg-[#0d0d0f] border border-white/10 rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-20 origin-top"
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
                              className="w-full px-4 py-3 text-left text-white hover:bg-[#6050ba]/20 transition-colors border-b border-white/5 last:border-0"
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
              <label className="text-sm text-zinc-400 mb-2 block">
                Поджанры {subgenres.length > 0 && <span className="text-zinc-600 text-xs">({subgenres.length}/5)</span>}
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
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
                  placeholder="Dark Pop" 
                  disabled={subgenres.length >= 5}
                  className="flex-1 px-3 sm:px-4 py-3 bg-gradient-to-br from-white/[0.07] to-white/[0.03] placeholder:text-zinc-600 rounded-xl border border-white/10 outline-none disabled:opacity-50 text-sm"
                />
                <button 
                  onClick={() => {
                    if(subgenreInput.trim() && subgenres.length < 5) {
                      setSubgenres([...subgenres, subgenreInput.trim()]);
                      setSubgenreInput('');
                    }
                  }}
                  disabled={subgenres.length >= 5}
                  className="w-full sm:w-auto px-4 py-3 bg-[#6050ba] hover:bg-[#7060ca] rounded-xl text-sm font-medium transition disabled:opacity-50"
                >
                  Добавить
                </button>
              </div>
              {subgenres.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2 max-w-full overflow-x-hidden">
                  {subgenres.map((sub, idx) => (
                    <div key={idx} className="px-3 py-1.5 bg-white/5 rounded-lg text-xs sm:text-sm flex items-center gap-2 max-w-full break-all">
                      <span className="truncate">{sub}</span>
                      <button onClick={() => setSubgenres(subgenres.filter((_, i) => i !== idx))} className="text-zinc-400 hover:text-white flex-shrink-0">×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="text-sm text-zinc-400 mb-2 block">Дата релиза *</label>
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
                className="inline-flex px-4 py-2.5 bg-gradient-to-br from-white/[0.07] to-white/[0.03] rounded-xl border border-white/10 cursor-pointer items-center gap-2 text-sm hover:border-[#6050ba]/50 transition"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-[#9d8df1]">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth="2"/>
                  <line x1="16" y1="2" x2="16" y2="6" strokeWidth="2"/>
                  <line x1="8" y1="2" x2="8" y2="6" strokeWidth="2"/>
                  <line x1="3" y1="10" x2="21" y2="10" strokeWidth="2"/>
                </svg>
                <span className={releaseDate ? 'text-white' : 'text-zinc-500'}>
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
                  <div className="absolute left-0 top-full z-[9999] mt-2 p-3 bg-[#0d0d0f] border border-[#6050ba]/30 rounded-xl shadow-2xl w-72">
                  <div className="flex items-center justify-between mb-3">
                    <button type="button" onClick={() => {
                      if (safeMonth === 0) {
                        setCalendarMonth(11);
                        setCalendarYear(safeYear - 1);
                      } else {
                        setCalendarMonth(safeMonth - 1);
                      }
                    }} className="p-1 hover:bg-white/5 rounded-md">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="15 18 9 12 15 6" strokeWidth="2"/></svg>
                    </button>
                    <div className="font-bold text-sm">{new Date(safeYear, safeMonth).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}</div>
                    <button type="button" onClick={() => {
                      if (safeMonth === 11) {
                        setCalendarMonth(0);
                        setCalendarYear(safeYear + 1);
                      } else {
                        setCalendarMonth(safeMonth + 1);
                      }
                    }} className="p-1 hover:bg-white/5 rounded-md">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="9 18 15 12 9 6" strokeWidth="2"/></svg>
                    </button>
                  </div>
                  <div className="grid grid-cols-7 gap-0.5 mb-1">
                    {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => (
                      <div key={day} className="text-center text-[10px] text-zinc-500 font-bold py-1">{day}</div>
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
          <label className="text-sm text-zinc-400 mb-3 block font-medium">Обложка *</label>
          <CoverUploader
            coverFile={coverFile}
            setCoverFile={setCoverFile}
            previewUrl={existingCoverUrl}
          />
        </div>
      </div>

      {/* Кнопки навигации */}
      <div className="mt-8 pt-6 border-t border-white/10 flex justify-between items-center">
        <Link href="/cabinet" className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold transition">
          Отмена
        </Link>
        
        <button 
          onClick={onNext}
          className="px-8 py-3 bg-[#6050ba] hover:bg-[#7060ca] rounded-xl font-bold transition flex items-center gap-2"
        >
          Далее
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="9 18 15 12 9 6" strokeWidth="2"/></svg>
        </button>
      </div>
    </div>
  );
}
