import React, { useState } from 'react';

interface Track {
  title: string;
  link: string;
}

interface PromoStepProps {
  tracks: Track[];
  focusTrack: string;
  setFocusTrack: (value: string) => void;
  focusTrackPromo: string;
  setFocusTrackPromo: (value: string) => void;
  albumDescription: string;
  setAlbumDescription: (value: string) => void;
  promoPhotos?: string[];
  setPromoPhotos?: (value: string[]) => void;
  onNext: () => void;
  onBack: () => void;
  onSkip?: () => void;  // Пропустить промо
  onFilled?: () => void; // Промо заполнено
  onResetSkip?: () => void; // Сбросить статус "пропущено"
  promoStatus?: 'not-started' | 'skipped' | 'filled'; // Текущий статус промо
}

export default function PromoStep({ 
  tracks, 
  focusTrack,
  setFocusTrack,
  focusTrackPromo,
  setFocusTrackPromo,
  albumDescription,
  setAlbumDescription,
  promoPhotos: externalPromoPhotos,
  setPromoPhotos: setExternalPromoPhotos,
  onNext, 
  onBack,
  onSkip,
  onFilled,
  onResetSkip,
  promoStatus
}: PromoStepProps) {
  const [localPromoPhotos, setLocalPromoPhotos] = useState<string[]>(externalPromoPhotos || []);
  const [photoInput, setPhotoInput] = useState('');
  const [showSkipModal, setShowSkipModal] = useState(false);
  const [showFocusTrackDropdown, setShowFocusTrackDropdown] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Используем внешние props если есть, иначе локальное состояние
  const promoPhotos = externalPromoPhotos ?? localPromoPhotos;
  const setPromoPhotos = setExternalPromoPhotos ?? setLocalPromoPhotos;
  
  const isSingleTrack = tracks.length === 1;
  const isAlbum = tracks.length > 1;
  
  // Проверка валидности для перехода далее
  const isFormValid = focusTrack !== '' && promoPhotos.length > 0;
  
  // Сбрасываем статус "пропущено" при любом изменении данных
  const handleDataChange = () => {
    if (promoStatus === 'skipped') {
      onResetSkip?.();
    }
  };
  
  // Обработчики с автосбросом статуса
  const handleFocusTrackChange = (value: string) => {
    handleDataChange();
    setValidationError('');
    setFocusTrack(value);
    setShowFocusTrackDropdown(false);
  };
  
  const handleFocusTrackPromoChange = (value: string) => {
    handleDataChange();
    setFocusTrackPromo(value);
  };
  
  const handleAlbumDescriptionChange = (value: string) => {
    handleDataChange();
    setAlbumDescription(value);
  };
  
  // Промо - проверяем обязательные поля
  const handleNext = () => {
    // Проверяем наличие фокус-трека
    if (!focusTrack) {
      setValidationError('Выберите фокус-трек для продвижения');
      return;
    }
    // Проверяем наличие хотя бы одной ссылки на промо-фото
    if (promoPhotos.length === 0) {
      setValidationError('Добавьте хотя бы одну ссылку на промо-материалы');
      return;
    }
    setValidationError('');
    onFilled?.(); // Устанавливаем статус "заполнено"
    onNext();
  };
  
  const handleSkip = () => {
    setShowSkipModal(true);
  };

  const confirmSkip = () => {
    setShowSkipModal(false);
    onSkip?.(); // Устанавливаем статус "пропущено"
    onNext();
  };

  const handleCancelSkip = () => {
    setShowSkipModal(false);
    onResetSkip?.(); // Сбрасываем статус "пропущено"
  };

  const addPromoPhoto = () => {
    if (photoInput.trim() && promoPhotos.length < 5) {
      handleDataChange();
      setValidationError('');
      setPromoPhotos([...promoPhotos, photoInput.trim()]);
      setPhotoInput('');
    }
  };

  const removePromoPhoto = (index: number) => {
    handleDataChange();
    setPromoPhotos(promoPhotos.filter((_, i) => i !== index));
  };

  return (
    <div className="animate-fade-up">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500/20 to-yellow-500/20 flex items-center justify-center ring-1 ring-white/10">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-orange-300">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
          </div>
          <div>
            <h2 className="text-3xl font-black bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">Промо-материалы</h2>
            <p className="text-sm text-zinc-500 mt-1">Настройте промо-материалы для вашего релиза</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Выбор фокус-трека - красивая версия */}
        <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#6050ba]/20 to-purple-500/20 flex items-center justify-center flex-shrink-0 ring-1 ring-purple-500/20">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-purple-400">
                <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                <polygon points="10 8 16 12 10 16 10 8" fill="currentColor"/>
              </svg>
            </div>
            <div>
              <h3 className="text-white font-bold mb-1">Фокус-трек</h3>
              <p className="text-sm text-zinc-400">Выберите основной трек для продвижения</p>
            </div>
          </div>
          
          {tracks.length > 0 ? (
            <div className="relative">
              {/* Кнопка открытия выпадающего списка */}
              <button
                type="button"
                onClick={() => setShowFocusTrackDropdown(!showFocusTrackDropdown)}
                className={`w-full px-4 py-3.5 rounded-xl border text-left transition-all duration-200 flex items-center justify-between group ${
                  focusTrack 
                    ? 'bg-gradient-to-br from-purple-500/10 to-violet-500/10 border-purple-500/30 hover:border-purple-500/50' 
                    : 'bg-gradient-to-br from-white/[0.05] to-white/[0.02] border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-3">
                  {focusTrack ? (
                    <>
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/30 to-violet-500/30 flex items-center justify-center">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-purple-300" strokeWidth="2">
                          <polygon points="5 3 19 12 5 21 5 3" fill="currentColor"/>
                        </svg>
                      </div>
                      <span className="text-white font-medium">{focusTrack}</span>
                    </>
                  ) : (
                    <>
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-zinc-500" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"/>
                          <line x1="12" y1="8" x2="12" y2="16"/>
                          <line x1="8" y1="12" x2="16" y2="12"/>
                        </svg>
                      </div>
                      <span className="text-zinc-400">Выберите фокус-трек</span>
                    </>
                  )}
                </div>
                <svg 
                  width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" 
                  className={`text-zinc-400 transition-transform duration-200 ${showFocusTrackDropdown ? 'rotate-180' : ''}`}
                  strokeWidth="2"
                >
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
              
              {/* Выпадающий список треков */}
              {showFocusTrackDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 z-20 bg-[#1a1a1c]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl shadow-black/50 overflow-hidden animate-fade-in">
                  <div className="p-2 max-h-[300px] overflow-y-auto [&::-webkit-scrollbar]:hidden">
                    {tracks.map((track, idx) => {
                      const isSelected = focusTrack === track.title;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleFocusTrackChange(track.title)}
                          className={`w-full px-3 py-3 rounded-lg text-left transition-all duration-150 flex items-center gap-3 group ${
                            isSelected 
                              ? 'bg-gradient-to-r from-purple-500/20 to-violet-500/20 border border-purple-500/30' 
                              : 'hover:bg-white/5 border border-transparent'
                          }`}
                        >
                          {/* Номер трека */}
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-all ${
                            isSelected 
                              ? 'bg-gradient-to-br from-purple-500 to-violet-500 text-white shadow-lg shadow-purple-500/30' 
                              : 'bg-white/5 text-zinc-400 group-hover:bg-white/10'
                          }`}>
                            {idx + 1}
                          </div>
                          
                          {/* Название трека */}
                          <div className="flex-1 min-w-0">
                            <span className={`block truncate font-medium ${isSelected ? 'text-white' : 'text-zinc-300'}`}>
                              {track.title || `Трек ${idx + 1}`}
                            </span>
                          </div>
                          
                          {/* Индикатор выбора */}
                          {isSelected && (
                            <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                                <polyline points="20 6 9 17 4 12"/>
                              </svg>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {/* Оверлей для закрытия */}
              {showFocusTrackDropdown && (
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowFocusTrackDropdown(false)}
                />
              )}
            </div>
          ) : (
            <div className="text-sm text-zinc-500 italic p-4 bg-white/[0.02] rounded-xl border border-dashed border-white/10">
              <div className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-zinc-600" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="16" x2="12" y2="12"/>
                  <line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
                Сначала добавьте треки во вкладке "Треклист"
              </div>
            </div>
          )}
        </div>

        {/* Промо-текст для фокус-трека (только для синглов) */}
        {isSingleTrack && (
          <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-[#6050ba]/10 flex items-center justify-center flex-shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-[#9d8df1]">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeWidth="2"/>
                  <polyline points="14 2 14 8 20 8" strokeWidth="2"/>
                  <line x1="16" y1="13" x2="8" y2="13" strokeWidth="2"/>
                  <line x1="16" y1="17" x2="8" y2="17" strokeWidth="2"/>
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-white font-bold mb-1">
                  Промо-текст трека <span className="text-zinc-500 text-xs font-normal">(необязательно)</span>
                </h3>
                <p className="text-sm text-zinc-400">
                  Описание для сингла (рекомендуется 1500-2000 символов)
                </p>
              </div>
              <div className="text-sm">
                <span className={focusTrackPromo.length > 2000 ? 'text-red-400' : 'text-zinc-500'}>
                  {focusTrackPromo.length}/2000
                </span>
              </div>
            </div>
            <textarea
              value={focusTrackPromo}
              onChange={(e) => handleFocusTrackPromoChange(e.target.value)}
              placeholder="Расскажите об этом треке: история создания, настроение, особенности..."
              rows={6}
              maxLength={2000}
              className="w-full px-4 py-3 bg-gradient-to-br from-white/[0.07] to-white/[0.03] placeholder:text-zinc-600 rounded-xl border outline-none resize-none border-white/10 hover:border-purple-500/40 focus:border-purple-500"
            />
          </div>
        )}

        {/* Описание альбома (только для альбомов/EP) */}
        {isAlbum && (
          <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-[#6050ba]/10 flex items-center justify-center flex-shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-[#9d8df1]">
                  <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                  <line x1="12" y1="16" x2="12" y2="12" strokeWidth="2"/>
                  <line x1="12" y1="8" x2="12.01" y2="8" strokeWidth="2"/>
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-white font-bold mb-1">
                  Общее описание релиза <span className="text-zinc-500 text-xs font-normal">(необязательно)</span>
                </h3>
                <p className="text-sm text-zinc-400">
                  Описание релиза целиком (рекомендуется до 2500 символов)
                </p>
              </div>
              <div className="text-sm">
                <span className={albumDescription.length > 2500 ? 'text-red-400' : 'text-zinc-500'}>
                  {albumDescription.length}/2500
                </span>
              </div>
            </div>
          <textarea
            value={albumDescription}
            onChange={(e) => handleAlbumDescriptionChange(e.target.value)}
            placeholder="Расскажите о релизе: концепция, вдохновение, процесс создания..."
            rows={6}
            maxLength={2500}
            className="w-full px-4 py-3 bg-gradient-to-br from-white/[0.07] to-white/[0.03] placeholder:text-zinc-600 rounded-xl border outline-none resize-none border-white/10 hover:border-purple-500/40 focus:border-purple-500"
          />
        </div>
        )}

        {/* Промо-фотографии */}
        <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-[#6050ba]/10 flex items-center justify-center flex-shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-[#9d8df1]">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" strokeWidth="2"/>
                <circle cx="8.5" cy="8.5" r="1.5" strokeWidth="2"/>
                <polyline points="21 15 16 10 5 21" strokeWidth="2"/>
              </svg>
            </div>
            <div>
              <h3 className="text-white font-bold mb-1">Промо-фотографии</h3>
              <p className="text-sm text-zinc-400">Добавьте ссылки на промо-фото (до 5 штук, JPG/PNG, Яндекс Диск)</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                value={photoInput}
                onChange={(e) => setPhotoInput(e.target.value)}
                placeholder="https://disk.yandex.ru/..."
                disabled={promoPhotos.length >= 5}
                className="flex-1 px-3 sm:px-4 py-3 bg-gradient-to-br from-white/[0.07] to-white/[0.03] placeholder:text-zinc-600 rounded-xl border border-white/10 outline-none disabled:opacity-50 text-xs sm:text-sm break-all"
              />
              <button
                onClick={addPromoPhoto}
                disabled={promoPhotos.length >= 5 || !photoInput.trim()}
                className="w-full sm:w-auto px-4 sm:px-6 py-3 bg-[#6050ba] hover:bg-[#7060ca] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-medium transition text-sm"
              >
                Добавить
              </button>
            </div>

            {promoPhotos.length > 0 && (
              <div className="space-y-2">
                {promoPhotos.map((photo, idx) => (
                  <div key={idx} className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-white/5 rounded-lg overflow-x-hidden">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-md bg-[#6050ba]/20 flex items-center justify-center text-xs sm:text-sm font-bold text-[#9d8df1] flex-shrink-0">
                      {idx + 1}
                    </div>
                    <div className="flex-1 text-xs sm:text-sm text-zinc-300 truncate min-w-0">{photo}</div>
                    <button
                      onClick={() => removePromoPhoto(idx)}
                      className="px-2 sm:px-3 py-1 sm:py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-md text-xs sm:text-sm transition flex-shrink-0"
                    >
                      Удалить
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="text-xs text-zinc-500">
              Добавлено фотографий: {promoPhotos.length}/5
            </div>
          </div>
        </div>
      </div>

      {/* Ошибка валидации */}
      {validationError && (
        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-red-400 flex-shrink-0">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 8v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="12" cy="16" r="1" fill="currentColor"/>
          </svg>
          <span className="text-red-400 text-sm">{validationError}</span>
        </div>
      )}

      <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row gap-3 sm:justify-between">
        <button onClick={onBack} className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold transition flex items-center justify-center gap-2 order-2 sm:order-1">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="15 18 9 12 15 6" strokeWidth="2"/></svg>
          Назад
        </button>
        <div className="flex flex-col sm:flex-row gap-3 order-1 sm:order-2">
          <button onClick={handleSkip} className="px-6 py-3 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded-xl font-bold transition flex items-center justify-center gap-2 border border-yellow-500/30">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="13 17 18 12 13 7"/>
              <polyline points="6 17 11 12 6 7"/>
            </svg>
            Пропустить
          </button>
          <button 
            onClick={handleNext} 
            className={`px-8 py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 ${
              isFormValid 
                ? 'bg-[#6050ba] hover:bg-[#7060ca]' 
                : 'bg-[#6050ba]/50 cursor-not-allowed'
            }`}
          >
            Далее
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="9 18 15 12 9 6" strokeWidth="2"/></svg>
          </button>
        </div>
      </div>

      {/* Уведомление о пропуске промо */}
      {showSkipModal && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4 animate-slide-up">
          <div className="relative overflow-hidden rounded-2xl bg-[#1a1625]/95 backdrop-blur-xl border border-white/10 shadow-xl shadow-black/30">
            {/* Gradient accent line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400" />
            
            <div className="p-5">
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-amber-400">
                    <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-base font-semibold text-white mb-1">
                    Пропустить промо?
                  </h4>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    Промо-материалы помогут вашему релизу получить больше внимания на платформах
                  </p>
                </div>
                
                {/* Close */}
                <button 
                  onClick={() => setShowSkipModal(false)}
                  className="flex-shrink-0 w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition text-zinc-400 hover:text-white"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>
              
              {/* Actions */}
              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-white/5">
                <button 
                  onClick={handleCancelSkip}
                  className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-medium text-white transition-colors"
                >
                  Заполнить
                </button>
                <button 
                  onClick={confirmSkip}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-amber-500/10 to-orange-500/10 hover:from-amber-500/20 hover:to-orange-500/20 border border-amber-500/20 hover:border-amber-500/30 rounded-xl text-sm font-medium text-amber-400 transition-all"
                >
                  Да, пропустить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
