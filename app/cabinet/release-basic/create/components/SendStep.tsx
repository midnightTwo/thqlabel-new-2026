import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { showSuccessToast, showErrorToast } from '@/lib/utils/showToast';

type ReleaseType = 'single' | 'ep' | 'album';

interface SendStepProps {
  releaseTitle: string;
  artistName: string;
  genre: string;
  releaseType: ReleaseType | null;
  tracksCount: number;
  coverFile: File | null;
  existingCoverUrl?: string;
  collaborators: string[];
  subgenres: string[];
  releaseDate: string | null;
  selectedPlatforms: number;
  agreedToContract: boolean;
  focusTrack: string;
  focusTrackPromo: string;
  albumDescription: string;
  promoPhotos: string[];
  promoStatus?: 'not-started' | 'skipped' | 'filled';
  tracks: Array<{
    title: string;
    link: string;
    audioFile?: File | null;
    audioMetadata?: {
      format: string;
      duration?: number;
      bitrate?: string;
      sampleRate?: string;
      size: number;
    } | null;
    hasDrugs: boolean;
    lyrics: string;
    language: string;
    version?: string;
    producers?: string[];
    featuring?: string[];
  }>;
  platforms: string[];
  countries: string[];
  onBack: () => void;
  paymentReceiptUrl?: string;
  paymentComment?: string;
  draftId?: string | null;
}

export default function SendStep({ 
  releaseTitle,
  artistName, 
  genre, 
  releaseType,
  tracksCount,
  coverFile,
  existingCoverUrl,
  selectedPlatforms,
  agreedToContract,
  tracks,
  platforms,
  countries,
  collaborators,
  subgenres,
  releaseDate,
  focusTrack,
  focusTrackPromo,
  albumDescription,
  promoPhotos,
  promoStatus = 'not-started',
  onBack,
  paymentReceiptUrl,
  paymentComment,
  draftId
}: SendStepProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Проверка всех 6 основных шагов + оплата
  const requiredChecks = [
    {
      name: 'Релиз',
      isValid: !!(releaseTitle.trim() && genre && (coverFile || existingCoverUrl)),
      issues: [
        !releaseTitle.trim() && 'Не указано название релиза',
        !genre && 'Не выбран жанр',
        !(coverFile || existingCoverUrl) && 'Не загружена обложка'
      ].filter(Boolean)
    },
    {
      name: 'Треклист',
      isValid: (() => {
        const minTracks = releaseType === 'album' ? 7 : releaseType === 'ep' ? 2 : 1;
        return tracksCount >= minTracks;
      })(),
      issues: (() => {
        const minTracks = releaseType === 'album' ? 7 : releaseType === 'ep' ? 2 : 1;
        if (tracksCount < minTracks) {
          const typeLabel = releaseType === 'album' ? 'альбома' : releaseType === 'ep' ? 'EP' : 'сингла';
          return [`Для ${typeLabel} требуется минимум ${minTracks} ${minTracks === 1 ? 'трек' : minTracks < 5 ? 'трека' : 'треков'} (добавлено: ${tracksCount})`];
        }
        return [];
      })()
    },
    {
      name: 'Страны',
      isValid: countries.length > 0,
      issues: countries.length === 0 ? ['Не выбрано ни одной страны'] : []
    },
    {
      name: 'Договор',
      isValid: agreedToContract,
      issues: !agreedToContract ? ['Не принят договор'] : []
    },
    {
      name: 'Площадки',
      isValid: selectedPlatforms > 0,
      issues: selectedPlatforms === 0 ? ['Не выбрано ни одной площадки'] : []
    },
    {
      name: 'Промо',
      isValid: promoStatus !== 'not-started',
      issues: promoStatus === 'not-started' ? ['Заполните или пропустите шаг промо'] : []
    },
    {
      name: 'Оплата',
      isValid: !!paymentReceiptUrl,
      issues: !paymentReceiptUrl ? ['Не загружен чек оплаты'] : []
    }
  ];

  const allValid = requiredChecks.every(c => c.isValid);
  const invalidSteps = requiredChecks.filter(c => !c.isValid);

  // Для отладки: покажем в консоли, какие шаги считаются невалидными
  if (typeof window !== 'undefined') {
    // eslint-disable-next-line no-console
    console.debug('[SendStep basic] invalidSteps:', invalidSteps.map(s => s.name));
  }

  // Loading overlay component для portal - мягкая анимация
  const LoadingOverlay = () => (
    <div className="fixed inset-0 z-[99999] bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 flex items-center justify-center" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }}>
      {/* Мягкие фоновые круги */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }}></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/3 rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative text-center max-w-md px-8">
        {/* Центральная анимация - виниловая пластинка */}
        <div className="relative mb-10">
          <div className="w-36 h-36 mx-auto relative">
            {/* Внешнее свечение */}
            <div className="absolute -inset-4 bg-gradient-to-r from-violet-500/20 via-purple-500/20 to-indigo-500/20 rounded-full blur-xl animate-pulse" style={{ animationDuration: '3s' }}></div>
            
            {/* Пластинка */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 shadow-2xl animate-spin" style={{ animationDuration: '3s' }}>
              {/* Текстура винила */}
              <div className="absolute inset-2 rounded-full border border-zinc-700/50"></div>
              <div className="absolute inset-4 rounded-full border border-zinc-700/30"></div>
              <div className="absolute inset-6 rounded-full border border-zinc-700/20"></div>
              <div className="absolute inset-8 rounded-full border border-zinc-700/20"></div>
              <div className="absolute inset-10 rounded-full border border-zinc-700/30"></div>
              
              {/* Блик на пластинке */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/5 to-transparent"></div>
              
              {/* Центральный лейбл */}
              <div className="absolute inset-[40%] rounded-full bg-gradient-to-br from-violet-400/90 to-purple-600/90 flex items-center justify-center shadow-inner">
                <div className="w-2 h-2 bg-zinc-900 rounded-full"></div>
              </div>
            </div>
            
            {/* Плавающие ноты */}
            <div className="absolute -top-2 -right-2 text-violet-400/60 animate-bounce" style={{ animationDuration: '2s' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
              </svg>
            </div>
            <div className="absolute -bottom-1 -left-3 text-indigo-400/50 animate-bounce" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
              </svg>
            </div>
          </div>
        </div>
        
        {/* Текст */}
        <h3 className="text-2xl font-bold text-white mb-3">
          Отправляем релиз
        </h3>
        <p className="text-zinc-500 mb-8 text-sm leading-relaxed">
          Загружаем файлы и отправляем на модерацию<br/>
          <span className="text-zinc-600">Пожалуйста, не закрывайте страницу</span>
        </p>
        
        {/* Прогресс бар - минималистичный */}
        <div className="relative h-1 bg-zinc-800 rounded-full overflow-hidden mb-6 mx-8">
          <div 
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-violet-500 to-purple-500 rounded-full"
            style={{ 
              animation: 'loading-progress 2s ease-in-out infinite',
              width: '40%'
            }}
          ></div>
        </div>
        
        {/* Мягкие точки загрузки */}
        <div className="flex justify-center gap-2">
          <span className="w-1.5 h-1.5 bg-violet-400/70 rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></span>
          <span className="w-1.5 h-1.5 bg-purple-400/70 rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></span>
          <span className="w-1.5 h-1.5 bg-indigo-400/70 rounded-full animate-pulse" style={{ animationDelay: '600ms' }}></span>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes loading-progress {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(150%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  );

  return (
    <>
      {/* Full-screen loading overlay через portal */}
      {mounted && submitting && createPortal(<LoadingOverlay />, document.body)}

      <div className="animate-fade-up">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center ring-1 ring-white/10">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-300">
                <path d="M22 2L11 13"/>
                <path d="M22 2L15 22L11 13L2 9L22 2z"/>
              </svg>
            </div>
            <div>
              <h2 className="text-3xl font-black bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">Отправка на модерацию</h2>
              <p className="text-sm text-zinc-500 mt-1">Проверьте заполнение всех шагов</p>
            </div>
          </div>
        </div>
      
        {/* Статус проверки шагов */}
        <div className="mb-6 p-5 bg-white/[0.02] border border-white/5 rounded-xl">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-[#9d8df1]">
              <path d="M9 11l3 3L22 4" strokeWidth="2"/>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" strokeWidth="2"/>
            </svg>
            Проверка заполнения
          </h3>
          
          <div className="space-y-3">
            {requiredChecks.map((step, idx) => (
              <div 
                key={idx}
                className={`p-3 rounded-lg border transition ${
                  step.isValid 
                    ? 'bg-emerald-500/10 border-emerald-500/20' 
                    : 'bg-red-500/10 border-red-500/20'
                }`}
              >
                <div className="flex items-center gap-2">
                  {step.isValid ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-emerald-400 flex-shrink-0">
                      <polyline points="20 6 9 17 4 12" strokeWidth="2"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-red-400 flex-shrink-0">
                      <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                      <line x1="15" y1="9" x2="9" y2="15" strokeWidth="2"/>
                      <line x1="9" y1="9" x2="15" y2="15" strokeWidth="2"/>
                    </svg>
                  )}
                  <div className="flex-1">
                    <span className={`font-bold ${
                      step.isValid ? 'text-emerald-300' : 'text-red-300'
                    }`}>
                      {step.name}
                    </span>
                    {step.issues.length > 0 && (
                      <div className="mt-1 text-xs text-red-400">
                        {step.issues.map((issue, i) => (
                          <div key={i}>• {issue}</div>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className={`text-xs font-medium ${
                    step.isValid ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {step.isValid ? 'Готово' : 'Требуется'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Предупреждение если не все заполнено */}
        {!allValid && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
            <div className="flex items-start gap-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-red-400 flex-shrink-0 mt-0.5">
                <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                <line x1="12" y1="8" x2="12" y2="12" strokeWidth="2"/>
                <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2"/>
              </svg>
              <div>
                <div className="text-red-300 font-bold mb-1">Невозможно отправить релиз</div>
                <div className="text-sm text-red-400">
                  Заполните все обязательные поля в следующих разделах: {invalidSteps.map(s => s.name).join(', ')}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 pt-6 border-white/10 flex justify-between">
          <button onClick={onBack} className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold transition flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="15 18 9 12 15 6" strokeWidth="2"/></svg>
            Назад
          </button>
          <button 
            onClick={async () => {
              if (!allValid || submitting) return;
              
              // Диагностика: проверяем состояние треков перед отправкой
              console.log('=== ДИАГНОСТИКА ТРЕКОВ ===');
              console.log('Количество треков:', tracks.length);
              tracks.forEach((track, i) => {
                console.log(`Трек ${i}:`, {
                  title: track.title,
                  hasAudioFile: !!track.audioFile,
                  audioFileType: track.audioFile ? track.audioFile.constructor.name : 'null',
                  isFileInstance: track.audioFile instanceof File,
                  fileSize: track.audioFile instanceof File ? track.audioFile.size : 'N/A',
                  link: track.link || 'пусто'
                });
              });
              console.log('==========================');
              
              setSubmitting(true);
              
              try {
                if (!supabase) throw new Error('Supabase не инициализирован');
                
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error('Пользователь не авторизован');
                
                // Загрузка обложки
                let coverUrl = existingCoverUrl || '';
                if (coverFile) {
                  const fileExt = coverFile.name.split('.').pop();
                  const fileName = `${user.id}/${Date.now()}.${fileExt}`;
                  
                  const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('release-covers')
                    .upload(fileName, coverFile, { contentType: coverFile.type, upsert: true });
                  
                  if (uploadError) throw uploadError;
                  
                  const { data: { publicUrl } } = supabase.storage
                    .from('release-covers')
                    .getPublicUrl(fileName);
                    
                  coverUrl = publicUrl;
                }
                
                // Загрузка аудиофайлов треков
                console.log('📤 Загружаем аудиофайлы треков...');
                console.log('📋 Треки для загрузки:', tracks.map((t, i) => ({
                  index: i,
                  title: t.title,
                  hasAudioFile: !!t.audioFile,
                  isFileInstance: t.audioFile instanceof File,
                  fileSize: t.audioFile instanceof File ? t.audioFile.size : 'N/A',
                  fileName: t.audioFile instanceof File ? t.audioFile.name : 'N/A',
                  link: t.link || 'нет'
                })));
                
                const tracksWithUrls = await Promise.all(tracks.map(async (track, index) => {
                  // Проверяем, что audioFile - это реальный File объект
                  const isValidFile = track.audioFile && 
                    track.audioFile instanceof File && 
                    track.audioFile.size > 0;
                  
                  console.log(`🎵 Трек ${index}: isValidFile=${isValidFile}, audioFile type=${typeof track.audioFile}, instanceof File=${track.audioFile instanceof File}`);
                  
                  if (isValidFile) {
                    try {
                      console.log(`📤 Загружаем аудио для трека ${index}: ${track.audioFile.name} (${track.audioFile.size} bytes)`);
                      const audioFileExt = track.audioFile.name.split('.').pop();
                      const audioFileName = `${user.id}/${Date.now()}-track-${index}.${audioFileExt}`;
                      
                      const { data: audioUploadData, error: audioUploadError } = await supabase.storage
                        .from('release-audio')
                        .upload(audioFileName, track.audioFile, {
                          contentType: track.audioFile.type,
                          upsert: true
                        });
                      
                      if (audioUploadError) {
                        console.error(`Ошибка загрузки аудио для трека ${index}:`, audioUploadError);
                        // Продолжаем без URL, если ошибка
                        return {
                          title: track.title,
                          link: track.link || '',
                          hasDrugs: track.hasDrugs,
                          lyrics: track.lyrics,
                          language: track.language,
                          version: track.version,
                          producers: track.producers,
                          featuring: track.featuring,
                          audioMetadata: track.audioMetadata,
                        };
                      }
                      
                      const { data: { publicUrl: audioUrl } } = supabase.storage
                        .from('release-audio')
                        .getPublicUrl(audioFileName);
                      
                      console.log(`✅ Аудио для трека ${index} загружено: ${audioUrl}`);
                      
                      return {
                        title: track.title,
                        link: audioUrl, // Записываем URL загруженного файла
                        audio_url: audioUrl, // Дублируем для совместимости
                        hasDrugs: track.hasDrugs,
                        lyrics: track.lyrics,
                        language: track.language,
                        version: track.version,
                        producers: track.producers,
                        featuring: track.featuring,
                        audioMetadata: track.audioMetadata,
                      };
                    } catch (err) {
                      console.error(`Ошибка при загрузке аудио для трека ${index}:`, err);
                      return {
                        title: track.title,
                        link: track.link || '',
                        hasDrugs: track.hasDrugs,
                        lyrics: track.lyrics,
                        language: track.language,
                        version: track.version,
                        producers: track.producers,
                        featuring: track.featuring,
                        audioMetadata: track.audioMetadata,
                      };
                    }
                  }
                  
                  // Если audioFile нет, возвращаем трек как есть (без File объекта)
                  return {
                    title: track.title,
                    link: track.link || '',
                    hasDrugs: track.hasDrugs,
                    lyrics: track.lyrics,
                    language: track.language,
                    version: track.version,
                    producers: track.producers,
                    featuring: track.featuring,
                    audioMetadata: track.audioMetadata,
                  };
                }));
                
                console.log('✅ Все аудиофайлы загружены');
                
                // Создание релиза в базе (Basic - платные релизы)
                const releaseData: any = {
                  user_id: user.id,
                  title: releaseTitle,
                  artist_name: artistName || user.user_metadata?.display_name || user.email?.split('@')[0] || 'Artist',
                  cover_url: coverUrl,
                  genre: genre,
                  subgenres: subgenres,
                  release_date: releaseDate,
                  collaborators: collaborators,
                  tracks: tracksWithUrls,
                  countries: countries,
                  contract_agreed: agreedToContract,
                  contract_agreed_at: agreedToContract ? new Date().toISOString() : null,
                  platforms: platforms,
                  focus_track: focusTrack,
                  focus_track_promo: focusTrackPromo,
                  album_description: albumDescription,
                  promo_photos: promoPhotos,
                  status: 'pending',
                  payment_status: 'pending',
                  payment_receipt_url: paymentReceiptUrl,
                  payment_comment: paymentComment || null,
                  payment_amount: 500,
                };
                
                // Отладка: проверяем данные треков
                console.log('Треки для сохранения:', JSON.stringify(tracksWithUrls, null, 2));
                
                // Если есть draftId — обновляем существующий черновик (убираем статус draft)
                if (draftId) {
                  const { error: updateError } = await supabase
                    .from('releases_basic')
                    .update({ ...releaseData, status: 'pending', status_updated_at: new Date().toISOString(), updated_at: new Date().toISOString() })
                    .eq('id', draftId)
                    .eq('user_id', user.id);

                  if (updateError) {
                    console.error('Ошибка обновления черновика:', updateError);
                    throw updateError;
                  }
                } else {
                  const { data: newRelease, error: insertError } = await supabase
                    .from('releases_basic')
                    .insert(releaseData)
                    .select()
                    .single();

                  if (insertError) {
                    console.error('Ошибка вставки в БД:', insertError);
                    console.error('Данные релиза:', releaseData);
                    throw insertError;
                  }
                  
                  // Отладка: выводим сгенерированный код релиза
                  if (newRelease?.custom_id) {
                    console.log('✅ Релиз создан с кодом:', newRelease.custom_id);
                  } else {
                    console.warn('⚠️ Релиз создан, но custom_id не сгенерирован');
                  }
                }
                
                // Удаляем возможные оставшиеся черновики с тем же названием (без риска удалить только что обновлённый релиз)
                try {
                  await supabase
                    .from('releases_basic')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('status', 'draft')
                    .eq('title', releaseTitle);
                } catch (cleanupErr) {
                  console.warn('Не удалось удалить оставшиеся черновики:', cleanupErr);
                }

                showSuccessToast('Релиз успешно отправлен на модерацию!', 5000);
                setTimeout(() => router.push('/cabinet'), 1500);
              } catch (error: any) {
                console.error('Ошибка при отправке релиза:', error);
                
                // Формируем детальное сообщение об ошибке
                let errorMessage = 'Произошла ошибка при отправке релиза.';
                
                if (error?.message) {
                  errorMessage += '\n\nДетали: ' + error.message;
                }
                
                if (error?.code) {
                  errorMessage += '\nКод ошибки: ' + error.code;
                }
                
                if (error?.details) {
                  errorMessage += '\nПодробности: ' + error.details;
                }
                
                errorMessage += '\n\nПроверьте консоль браузера (F12) для получения дополнительной информации.';
                
                showErrorToast('Ошибка при отправке релиза', 6000);
                console.error(errorMessage);
              } finally {
                setSubmitting(false);
              }
            }}
            disabled={!allValid || submitting}
            className={`px-8 py-4 rounded-xl font-black transition flex items-center gap-2 relative overflow-hidden ${
              allValid && !submitting
                ? 'bg-emerald-500 hover:bg-emerald-400 text-black cursor-pointer' 
                : submitting
                  ? 'bg-gradient-to-r from-purple-600 via-blue-500 to-purple-600 text-white cursor-wait animate-gradient-x'
                  : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
            }`}
          >
            {submitting ? (
              <>
                {/* Animated shimmer background */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                {/* Spinning rocket icon */}
                <svg 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor"
                  className="animate-bounce"
                  strokeWidth="2"
                >
                  <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
                  <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
                  <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/>
                  <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
                </svg>
                <span className="relative z-10">Отправляем релиз...</span>
                {/* Pulsing dots */}
                <span className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></span>
                </span>
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <line x1="22" y1="2" x2="11" y2="13" strokeWidth="2"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2" strokeWidth="2"/>
                </svg>
                Отправить на модерацию
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
