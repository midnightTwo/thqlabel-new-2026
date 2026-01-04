"use client";
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';

interface AudioPlayerProps {
  releaseId: string;
  releaseType: 'basic' | 'exclusive';
  trackIndex: number;
  supabase: SupabaseClient;
  className?: string;
  variant?: 'full' | 'compact'; // full - с полосой прогресса, compact - только кнопка
}

// Плавная анимация кнопки воспроизведения
const PlayIcon = ({ className = '' }: { className?: string }) => (
  <svg 
    className={`transition-transform duration-200 ${className}`} 
    width="18" 
    height="18" 
    viewBox="0 0 24 24" 
    fill="currentColor"
  >
    <path d="M8 5.14v14l11-7-11-7z" />
  </svg>
);

const PauseIcon = ({ className = '' }: { className?: string }) => (
  <svg 
    className={`transition-transform duration-200 ${className}`} 
    width="18" 
    height="18" 
    viewBox="0 0 24 24" 
    fill="currentColor"
  >
    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
  </svg>
);

const LoadingSpinner = () => (
  <svg 
    className="animate-spin h-5 w-5" 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24"
  >
    <circle 
      className="opacity-25" 
      cx="12" 
      cy="12" 
      r="10" 
      stroke="currentColor" 
      strokeWidth="3"
    />
    <path 
      className="opacity-90" 
      fill="currentColor" 
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

const ErrorIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
  </svg>
);

// Global audio manager to ensure only one track plays at a time
const globalAudioManager = {
  currentPlayer: null as { pause: () => void; id: string } | null,
  register(id: string, pauseFn: () => void) {
    // Pause any currently playing audio before registering new one
    if (this.currentPlayer && this.currentPlayer.id !== id) {
      this.currentPlayer.pause();
    }
    this.currentPlayer = { pause: pauseFn, id };
  },
  unregister(id: string) {
    if (this.currentPlayer?.id === id) {
      this.currentPlayer = null;
    }
  }
};

export default function AudioPlayer({ 
  releaseId, 
  releaseType, 
  trackIndex, 
  supabase,
  className = '',
  variant = 'full'
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isAudioReady, setIsAudioReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const volumeRef = useRef<HTMLDivElement>(null);
  
  // Unique ID for this player instance
  const playerIdRef = useRef(`${releaseId}-${releaseType}-${trackIndex}`);

  useEffect(() => {
    // Очистка при размонтировании
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      // Освобождаем blob URL
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
      // Unregister from global manager
      globalAudioManager.unregister(playerIdRef.current);
      setIsAudioReady(false);
      setError(null);
    };
  }, [releaseId, trackIndex]);

  const getAudioUrl = async (): Promise<string | null> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      console.log('🔐 AudioPlayer auth:', {
        hasSession: !!session,
        hasToken: !!token,
        userId: session?.user?.id
      });

      const url = `/api/stream-audio?releaseId=${releaseId}&releaseType=${releaseType}&trackIndex=${trackIndex}`;
      
      // Добавляем токен в заголовки для авторизации
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Делаем fetch с заголовками авторизации
      const response = await fetch(url, { headers });
      
      // Проверяем тип ответа - если JSON, значит это ошибка
      const contentType = response.headers.get('content-type') || '';
      
      console.log('Audio response:', {
        status: response.status,
        contentType,
        contentLength: response.headers.get('content-length')
      });
      
      if (contentType.includes('application/json')) {
        const errorData = await response.json();
        console.error('API Error:', errorData.error || 'Неизвестная ошибка');
        return null;
      }
      
      if (!response.ok) {
        console.error('HTTP Error:', response.status, response.statusText);
        return null;
      }
      
      // Проверяем, что это аудио
      if (!contentType.includes('audio/')) {
        console.error('Invalid content type:', contentType);
        return null;
      }

      // Создаём blob URL для воспроизведения
      const blob = await response.blob();
      
      // Проверяем размер blob
      if (blob.size === 0) {
        console.error('Empty audio file received');
        return null;
      }
      
      console.log('Audio blob:', { size: blob.size, type: blob.type });
      
      // Создаём blob с правильным типом если он не установлен
      const audioBlob = blob.type ? blob : new Blob([blob], { type: contentType });
      const blobUrl = URL.createObjectURL(audioBlob);
      return blobUrl;
    } catch (error) {
      console.error('Error getting audio URL:', error);
      return null;
    }
  };

  const togglePlay = async () => {
    // Create pause function for global manager
    const pauseCurrentTrack = () => {
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    };

    if (!audioRef.current) {
      // Инициализация аудио элемента
      setLoading(true);
      setError(null);
      
      // Pause any other playing track before starting new one
      globalAudioManager.register(playerIdRef.current, pauseCurrentTrack);
      
      const blobUrl = await getAudioUrl();
      if (!blobUrl) {
        setLoading(false);
        setError('Не удалось загрузить аудио');
        globalAudioManager.unregister(playerIdRef.current);
        return;
      }

      // Сохраняем blob URL для последующей очистки
      blobUrlRef.current = blobUrl;
      
      const audio = new Audio(blobUrl);
      audioRef.current = audio;
      audio.volume = isMuted ? 0 : volume;
      setIsAudioReady(true);

      // Обработчики событий
      audio.addEventListener('loadedmetadata', () => {
        setDuration(audio.duration);
        setLoading(false);
      });

      audio.addEventListener('timeupdate', () => {
        setCurrentTime(audio.currentTime);
      });

      audio.addEventListener('ended', () => {
        setIsPlaying(false);
        setCurrentTime(0);
        globalAudioManager.unregister(playerIdRef.current);
      });

      audio.addEventListener('error', (e) => {
        const audioError = audio.error;
        let errorMsg = 'Ошибка воспроизведения';
        
        if (audioError && audioError.code) {
          const errorMessages: Record<number, string> = {
            1: 'Загрузка прервана',
            2: 'Ошибка сети',
            3: 'Ошибка декодирования аудио',
            4: 'Формат не поддерживается браузером'
          };
          errorMsg = errorMessages[audioError.code] || audioError.message || `Код ошибки: ${audioError.code}`;
        }
        
        // Логируем детали для отладки
        console.warn('🔊 Audio playback issue:', {
          errorCode: audioError?.code,
          errorMessage: audioError?.message,
          networkState: audio.networkState,
          readyState: audio.readyState
        });
        
        setError(errorMsg);
        setLoading(false);
        setIsPlaying(false);
        globalAudioManager.unregister(playerIdRef.current);
      });

      audio.play();
      setIsPlaying(true);
    } else {
      // Переключение воспроизведения
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
        globalAudioManager.unregister(playerIdRef.current);
      } else {
        // Pause any other playing track
        globalAudioManager.register(playerIdRef.current, pauseCurrentTrack);
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  // Volume control handlers
  const handleVolumeChange = useCallback((newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolume(clampedVolume);
    if (audioRef.current) {
      audioRef.current.volume = clampedVolume;
    }
    if (clampedVolume > 0 && isMuted) {
      setIsMuted(false);
    }
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    if (isMuted) {
      setIsMuted(false);
      if (audioRef.current) {
        audioRef.current.volume = volume;
      }
    } else {
      setIsMuted(true);
      if (audioRef.current) {
        audioRef.current.volume = 0;
      }
    }
  }, [isMuted, volume]);

  // Обработка перетаскивания и клика по прогресс-бару
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !isAudioReady || !duration) return;
    
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    
    // Сразу устанавливаем позицию при клике
    const rect = progressRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const newTime = Math.max(0, Math.min((clickX / width) * duration, duration));
    
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  }, [isAudioReady, duration]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !progressRef.current || !duration) return;
      
      const rect = progressRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const width = rect.width;
      const newTime = Math.max(0, Math.min((clickX / width) * duration, duration));
      
      setCurrentTime(newTime);
      if (audioRef.current) {
        audioRef.current.currentTime = newTime;
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, duration]);

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (variant === 'compact') {
    // Компактная версия - только кнопка Play/Pause
    return (
      <button
        onClick={togglePlay}
        disabled={loading}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        className={`
          group relative w-11 h-11 rounded-xl overflow-hidden
          ${error 
            ? 'bg-gradient-to-br from-red-500 to-red-600' 
            : 'bg-gradient-to-br from-[#6050ba] to-[#9d8df1]'
          }
          flex items-center justify-center
          transition-all duration-300 ease-out
          shadow-lg hover:shadow-xl hover:shadow-[#6050ba]/40
          hover:scale-105 active:scale-95
          disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
          ${className}
        `}
        title={error || (isPlaying ? 'Пауза' : 'Воспроизвести')}
      >
        {/* Glow effect */}
        <div className={`
          absolute inset-0 bg-gradient-to-t from-white/0 to-white/20 
          opacity-0 group-hover:opacity-100 transition-opacity duration-300
        `} />
        
        {/* Ripple effect on playing */}
        {isPlaying && !loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="absolute w-full h-full bg-white/20 rounded-xl animate-ping opacity-30" />
          </div>
        )}
        
        <span className="relative z-10 text-white flex items-center justify-center">
          {loading ? (
            <LoadingSpinner />
          ) : error ? (
            <ErrorIcon />
          ) : isPlaying ? (
            <PauseIcon className="group-hover:scale-110" />
          ) : (
            <PlayIcon className="group-hover:scale-110 translate-x-0.5" />
          )}
        </span>
      </button>
    );
  }

  // Полная версия с полосой прогресса
  return (
    <div 
      className={`
        flex items-center gap-4 p-1 rounded-xl
        transition-all duration-300 ease-out
        ${className}
      `}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Play/Pause Button */}
      <button
        onClick={togglePlay}
        disabled={loading}
        className={`
          group relative w-11 h-11 flex-shrink-0 rounded-xl overflow-hidden
          ${error 
            ? 'bg-gradient-to-br from-red-500 to-red-600' 
            : 'bg-gradient-to-br from-[#6050ba] to-[#9d8df1]'
          }
          flex items-center justify-center
          transition-all duration-300 ease-out
          shadow-lg hover:shadow-xl hover:shadow-[#6050ba]/40
          hover:scale-105 active:scale-95
          disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
        `}
        title={error || (isPlaying ? 'Пауза' : 'Воспроизвести')}
      >
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-t from-white/0 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Ripple effect on playing */}
        {isPlaying && !loading && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="absolute w-8 h-8 bg-white/30 rounded-full animate-ping opacity-40" 
              style={{ animationDuration: '1.5s' }} 
            />
          </div>
        )}
        
        <span className="relative z-10 text-white flex items-center justify-center">
          {loading ? (
            <LoadingSpinner />
          ) : error ? (
            <ErrorIcon />
          ) : isPlaying ? (
            <PauseIcon className="group-hover:scale-110 transition-transform duration-200" />
          ) : (
            <PlayIcon className="group-hover:scale-110 translate-x-0.5 transition-transform duration-200" />
          )}
        </span>
      </button>

      {error ? (
        <span className="flex-1 text-sm text-red-400 font-medium animate-pulse">{error}</span>
      ) : (
        <div className="flex-1 flex items-center gap-3">
          {/* Current Time */}
          <span className={`
            text-xs font-medium font-mono w-10 text-right tabular-nums
            transition-colors duration-300
            ${isPlaying ? 'text-[#9d8df1]' : 'text-zinc-400'}
          `}>
            {formatTime(currentTime)}
          </span>
          
          {/* Progress Bar Container */}
          <div 
            ref={progressRef}
            onMouseDown={handleMouseDown}
            onClick={(e) => e.stopPropagation()}
            className={`
              relative flex-1 h-2 rounded-full overflow-hidden cursor-pointer
              transition-all duration-300 ease-out
              ${isHovering || isDragging ? 'h-3' : 'h-2'}
              ${!isAudioReady ? 'cursor-not-allowed opacity-50' : ''}
            `}
            style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
          >
            {/* Background Track */}
            <div className="absolute inset-0 rounded-full bg-white/[0.06]" />
            
            {/* Buffered/Loading indicator */}
            {loading && (
              <div className="absolute inset-0 overflow-hidden rounded-full">
                <div 
                  className="h-full w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"
                  style={{ 
                    animation: 'shimmer 1.5s ease-in-out infinite',
                  }}
                />
              </div>
            )}
            
            {/* Progress Fill */}
            <div 
              className={`
                absolute inset-y-0 left-0 rounded-full
                bg-gradient-to-r from-[#6050ba] via-[#7a6bd4] to-[#9d8df1]
                transition-all ease-out
                ${isDragging ? 'duration-0' : 'duration-100'}
              `}
              style={{ 
                width: `${progress}%`,
                boxShadow: isPlaying ? '0 0 12px rgba(157, 141, 241, 0.5)' : 'none'
              }}
            />
            
            {/* Glow effect on progress */}
            {isPlaying && progress > 0 && (
              <div 
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#6050ba]/50 to-[#9d8df1]/50 blur-sm"
                style={{ width: `${progress}%` }}
              />
            )}
            
            {/* Thumb/Handle */}
            <div 
              className={`
                absolute top-1/2 -translate-y-1/2 -translate-x-1/2
                rounded-full bg-white shadow-lg
                transition-all duration-200 ease-out
                ${isHovering || isDragging ? 'w-4 h-4 opacity-100 scale-100' : 'w-3 h-3 opacity-0 scale-75'}
                ${isDragging ? 'scale-110 shadow-xl shadow-[#6050ba]/50' : ''}
              `}
              style={{ 
                left: `${progress}%`,
                boxShadow: isDragging 
                  ? '0 0 0 4px rgba(157, 141, 241, 0.3), 0 2px 8px rgba(0,0,0,0.3)'
                  : '0 2px 4px rgba(0,0,0,0.2)'
              }}
            />
          </div>
          
          {/* Duration */}
          <span className="text-xs text-zinc-500 font-medium font-mono w-10 tabular-nums">
            {formatTime(duration)}
          </span>

          {/* Volume Control */}
          <div 
            ref={volumeRef}
            className="relative flex items-center"
            onMouseEnter={() => setShowVolumeSlider(true)}
            onMouseLeave={() => setShowVolumeSlider(false)}
          >
            {/* Mute/Unmute Button */}
            <button
              onClick={toggleMute}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors group"
              title={isMuted ? 'Включить звук' : 'Выключить звук'}
            >
              {isMuted || volume === 0 ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-400 group-hover:text-white transition-colors">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                  <line x1="23" y1="9" x2="17" y2="15"/>
                  <line x1="17" y1="9" x2="23" y2="15"/>
                </svg>
              ) : volume < 0.5 ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-400 group-hover:text-white transition-colors">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-400 group-hover:text-white transition-colors">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
                </svg>
              )}
            </button>
            
            {/* Volume Slider (shows on hover) */}
            <div className={`
              absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-3 
              bg-zinc-900/95 backdrop-blur-lg border border-white/10 rounded-xl shadow-xl
              transition-all duration-200 origin-bottom
              ${showVolumeSlider ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}
            `}>
              {/* Vertical slider */}
              <div className="flex flex-col items-center gap-2">
                <span className="text-[10px] text-zinc-400 font-medium">
                  {Math.round((isMuted ? 0 : volume) * 100)}%
                </span>
                <div className="relative h-24 w-2 bg-white/10 rounded-full">
                  <div 
                    className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#6050ba] to-[#9d8df1] rounded-full transition-all"
                    style={{ height: `${(isMuted ? 0 : volume) * 100}%` }}
                  />
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
                  />
                  {/* Thumb indicator */}
                  <div 
                    className="absolute left-1/2 -translate-x-1/2 w-4 h-4 bg-white rounded-full shadow-lg transition-all"
                    style={{ bottom: `calc(${(isMuted ? 0 : volume) * 100}% - 8px)` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Add shimmer keyframes */}
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
    </div>
  );
}
