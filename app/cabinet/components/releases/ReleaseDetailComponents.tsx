import React, { ReactNode, useState, useRef, useEffect } from 'react';
import { Release, Track } from './types';
import { STATUS_BADGE_STYLES, formatDate, formatDateFull, getTracksWord } from './constants';
import { SupabaseClient } from '@supabase/supabase-js';

// Глобальный event для остановки всех треков
const STOP_ALL_AUDIO_EVENT = 'thq-stop-all-audio';

// Функция для остановки всех треков
const stopAllAudio = () => {
  window.dispatchEvent(new CustomEvent(STOP_ALL_AUDIO_EVENT));
};

// Компонент метаданных
export function MetadataItem({ icon, color, text }: { icon: string; color: string; text: string }) {
  const colorClasses: Record<string, string> = {
    purple: 'text-purple-400',
    blue: 'text-blue-400',
    green: 'text-green-400',
    orange: 'text-orange-400'
  };

  const icons: Record<string, ReactNode> = {
    music: <path d="M9 18V5l12-2v13M9 18l-7 2V7l7-2M9 18l12-2M9 9l12-2"/>,
    calendar: <><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
    play: <><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></>,
    tag: <><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></>
  };

  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      <svg className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${colorClasses[color]} flex-shrink-0`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        {icons[icon]}
      </svg>
      <span className="text-zinc-400 text-xs sm:text-sm truncate">{text}</span>
    </div>
  );
}

// Бейдж информации
export function InfoBadge({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="px-2.5 sm:px-4 py-2 sm:py-3 bg-white/5 rounded-lg sm:rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
      <div className="text-[9px] sm:text-[10px] text-zinc-500 uppercase tracking-wide mb-0.5 sm:mb-1">{label}</div>
      <div className={`font-${mono ? 'mono' : 'semibold'} font-bold text-[10px] sm:text-xs text-white truncate`}>{value}</div>
    </div>
  );
}

// Секция Copyright
export function CopyrightSection({ copyright }: { copyright: string }) {
  return (
    <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-white/5 rounded-xl sm:rounded-2xl border border-white/10">
      <div className="flex items-start gap-2 sm:gap-3">
        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-400 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/><path d="M15 9a3 3 0 1 0 0 6"/>
        </svg>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] sm:text-xs text-zinc-500 uppercase tracking-wide mb-1">Copyright</div>
          <div className="text-xs sm:text-sm text-zinc-300 break-words">{copyright}</div>
        </div>
      </div>
    </div>
  );
}

// Секция стран
export function CountriesSection({ countries }: { countries: string[] }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const displayCountries = isExpanded ? countries : countries.slice(0, 10);
  const hasMore = countries.length > 10;

  return (
    <div className="mb-4 sm:mb-6 p-3 sm:p-5 bg-gradient-to-br from-white/5 to-white/[0.02] rounded-xl sm:rounded-2xl border border-white/10">
      <div className="flex items-center gap-2 mb-3 sm:mb-4">
        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>
        <h3 className="font-bold text-base sm:text-lg">Страны распространения</h3>
        <span className="ml-auto text-[10px] sm:text-xs text-zinc-500 bg-white/5 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full">{countries.length} стран</span>
      </div>
      <div className="flex flex-wrap gap-1.5 sm:gap-2">
        {displayCountries.map((country, idx) => (
          <span key={idx} className="px-3 py-1.5 bg-white/10 hover:bg-white/15 rounded-lg text-xs font-medium transition-colors border border-white/10">
            {country}
          </span>
        ))}
      </div>
      {hasMore && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-3 w-full px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-zinc-400 hover:text-white transition-all flex items-center justify-center gap-2"
        >
          <span>{isExpanded ? 'Скрыть' : `Показать все (${countries.length})`}</span>
          <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      )}
    </div>
  );
}

// Бейдж метаданных трека
export function MetadataBadge({ color, icon, label, value }: { color: string; icon: string; label: string; value?: string }) {
  const colorClasses: Record<string, { bg: string; border: string; text: string }> = {
    blue: { bg: 'from-blue-500/10 to-blue-600/5', border: 'border-blue-500/20 hover:border-blue-500/40', text: 'text-blue-300' },
    green: { bg: 'from-green-500/10 to-green-600/5', border: 'border-green-500/20 hover:border-green-500/40', text: 'text-green-300' },
    orange: { bg: 'from-orange-500/10 to-orange-600/5', border: 'border-orange-500/20 hover:border-orange-500/40', text: 'text-orange-300' },
    pink: { bg: 'from-pink-500/10 to-pink-600/5', border: 'border-pink-500/20 hover:border-pink-500/40', text: 'text-pink-300' }
  };

  const iconColors: Record<string, string> = { blue: 'text-blue-400', green: 'text-green-400', orange: 'text-orange-400', pink: 'text-pink-400' };

  const icons: Record<string, ReactNode> = {
    globe: <><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></>,
    grid: <><path d="M3 3h18v18H3z"/><path d="M3 9h18M9 21V9"/></>,
    tag: <><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></>,
    users: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>
  };

  const colors = colorClasses[color];

  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-br ${colors.bg} rounded-lg border ${colors.border} transition-colors h-8`}>
      <svg className={`w-3.5 h-3.5 ${iconColors[color]} flex-shrink-0`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        {icons[icon]}
      </svg>
      {value ? (
        <span className={`text-xs font-medium ${colors.text}`}>
          <span className="opacity-60">{label}:</span> {value}
        </span>
      ) : (
        <span className={`text-xs font-medium ${colors.text}`}>{label}</span>
      )}
    </div>
  );
}

// Метаданные трека - всегда показываем основные поля
export function TrackMetadata({ track }: { track: Track }) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-3">
      {/* ISRC всегда первый */}
      {track.isrc ? (
        <MetadataBadge color="green" icon="grid" label="ISRC" value={track.isrc} />
      ) : (
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-yellow-500/10 rounded-lg border border-yellow-500/30 h-8">
          <svg className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="text-xs text-yellow-300">ISRC не добавлен</span>
        </div>
      )}
      {/* Язык */}
      {track.language ? (
        <MetadataBadge color="blue" icon="globe" label={track.language} />
      ) : (
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-500/10 rounded-lg border border-zinc-500/30 h-8">
          <svg className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
          </svg>
          <span className="text-xs text-zinc-500">Язык не указан</span>
        </div>
      )}
      {/* Версия */}
      {track.version ? (
        <MetadataBadge color="orange" icon="tag" label={track.version} />
      ) : (
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-500/10 rounded-lg border border-zinc-500/30 h-8">
          <svg className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>
          </svg>
          <span className="text-xs text-zinc-500">Без версии</span>
        </div>
      )}
      {/* Featuring */}
      {track.featuring ? (
        <MetadataBadge color="pink" icon="users" label="feat." value={Array.isArray(track.featuring) ? track.featuring.join(', ') : track.featuring} />
      ) : (
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-500/10 rounded-lg border border-zinc-500/30 h-8">
          <svg className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          <span className="text-xs text-zinc-500">Без feat.</span>
        </div>
      )}
    </div>
  );
}

// Компонент трека со встроенным плеером (как в админке)
export function TrackItem({ track, index, canPlay, releaseId, releaseType, supabase, coverUrl }: { 
  track: Track; index: number; canPlay: boolean; releaseId: string; releaseType: 'basic' | 'exclusive'; supabase?: SupabaseClient; coverUrl?: string;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [volume, setVolume] = useState(0.15);
  const [isMuted, setIsMuted] = useState(false);
  const maxVolume = 0.5; // Ограничение максимальной громкости
  const [isExpanded, setIsExpanded] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressRef = useRef<HTMLDivElement | null>(null);
  const animationRef = useRef<number | null>(null);

  const formatTime = (sec: number) => {
    if (!sec || !isFinite(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const updateProgress = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      animationRef.current = requestAnimationFrame(updateProgress);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    // Применяем масштабирование для плавного контроля громкости
    const scaledVolume = newVolume * maxVolume;
    if (audioRef.current) audioRef.current.volume = scaledVolume;
    if (newVolume > 0) setIsMuted(false);
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      if (audioRef.current) audioRef.current.volume = volume * maxVolume;
    } else {
      setIsMuted(true);
      if (audioRef.current) audioRef.current.volume = 0;
    }
  };

  const loadAudio = async () => {
    if (audioRef.current && audioUrl) return audioRef.current;
    setLoading(true);
    setError(null);
    try {
      const session = await supabase?.auth.getSession();
      const res = await fetch(`/api/stream-audio?releaseId=${releaseId}&releaseType=${releaseType}&trackIndex=${index}`, {
        headers: session?.data.session?.access_token ? { Authorization: `Bearer ${session.data.session.access_token}` } : {}
      });
      if (!res.ok) throw new Error('Ошибка загрузки');
      const blob = await res.blob();
      if (!blob.size) throw new Error('Пустой файл');
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      const audio = new Audio(url);
      audio.volume = isMuted ? 0 : volume * maxVolume;
      audioRef.current = audio;
      audio.onloadedmetadata = () => setDuration(audio.duration);
      audio.onended = () => { setIsPlaying(false); setCurrentTime(0); };
      audio.onerror = () => setError('Ошибка');
      audio.addEventListener('pause', () => setIsPlaying(false));
      audio.addEventListener('play', () => {
        setIsPlaying(true);
        animationRef.current = requestAnimationFrame(updateProgress);
      });
      await new Promise<void>((resolve) => {
        audio.oncanplaythrough = () => resolve();
        setTimeout(resolve, 2000);
      });
      return audio;
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Слушаем глобальный event для остановки (НЕ сбрасываем позицию)
  useEffect(() => {
    const handleStopAll = () => {
      if (audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
        setIsPlaying(false);
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
      }
    };
    window.addEventListener(STOP_ALL_AUDIO_EVENT, handleStopAll);
    return () => window.removeEventListener(STOP_ALL_AUDIO_EVENT, handleStopAll);
  }, []);

  // Остановка аудио при переключении вкладки браузера
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
        setIsPlaying(false);
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const handlePlayPause = async () => {
    if (!canPlay || !supabase) return;
    
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      return;
    }
    
    // Сначала останавливаем СВОЙ трек если есть
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    
    // Останавливаем ВСЕ треки через глобальный event
    stopAllAudio();
    
    // Ждем чтобы все успели остановиться
    await new Promise(r => setTimeout(r, 100));
    
    const audio = audioRef.current || await loadAudio();
    if (!audio) return;
    
    // Еще раз проверяем что никто не играет
    stopAllAudio();
    await new Promise(r => setTimeout(r, 50));
    
    try {
      await audio.play();
    } catch (e: any) {
      if (e.name !== 'AbortError') setError('Ошибка');
    }
  };

  const seekToPosition = (clientX: number) => {
    if (!progressRef.current || !duration) return;
    const rect = progressRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const newTime = pct * duration;
    setCurrentTime(newTime);
    if (audioRef.current) audioRef.current.currentTime = newTime;
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    seekToPosition(e.clientX);
  };

  const handleProgressMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    seekToPosition(e.clientX);
  };

  useEffect(() => {
    if (!isDragging) return;
    const handleMouseMove = (e: MouseEvent) => seekToPosition(e.clientX);
    const handleMouseUp = () => setIsDragging(false);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, duration]);

  useEffect(() => () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
  }, [audioUrl]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const tagName = target.tagName.toLowerCase();
    // Не раскрываем если клик по кнопкам, инпутам или элементам с data-player-control
    if (tagName === 'button' || tagName === 'input' || tagName === 'svg' || tagName === 'path' || tagName === 'polygon' || tagName === 'line') return;
    if (target.hasAttribute('data-player-control') || target.closest('[data-player-control]')) return;
    setIsExpanded(!isExpanded);
  };

  return (
    <div 
      className="group bg-gradient-to-br from-white/5 to-white/[0.02] rounded-2xl hover:from-white/8 hover:to-white/[0.04] border border-white/10 hover:border-purple-500/30 p-4 cursor-pointer select-none isolate will-change-auto"
      onClick={handleCardClick}
      style={{ contain: 'layout style' }}
    >
      {/* Main row: cover, info, progress, volume, actions */}
      <div className="flex items-center gap-3">
        {/* Play button with cover */}
        <button
          onClick={handlePlayPause}
          disabled={!canPlay || loading}
          className={`relative flex-shrink-0 w-12 h-12 rounded-xl overflow-hidden ${
            !canPlay ? 'opacity-50 cursor-not-allowed' :
            isPlaying ? 'ring-2 ring-purple-500 shadow-lg shadow-purple-500/30' : 'ring-1 ring-white/10 hover:ring-purple-500/50'
          }`}
        >
          {coverUrl ? (
            <img src={coverUrl} alt="" className="w-full h-full object-cover pointer-events-none" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-600 to-blue-700 pointer-events-none" />
          )}
          <div className={`absolute inset-0 flex items-center justify-center pointer-events-none ${
            loading ? 'bg-black/70' : error ? 'bg-red-500/30' : isPlaying ? 'bg-black/50' : 'bg-black/40'
          }`}>
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : error ? (
              <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24" className="text-red-400">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
              </svg>
            ) : !canPlay ? (
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24" className="text-zinc-500">
                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
              </svg>
            ) : isPlaying ? (
              <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24" className="text-white">
                <path d="M6 4h4v16H6zm8 0h4v16h-4z"/>
              </svg>
            ) : (
              <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24" className="text-white ml-0.5">
                <path d="M8 5v14l11-7z"/>
              </svg>
            )}
          </div>
        </button>

        {/* Track info & progress */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-zinc-500 text-xs font-mono flex-shrink-0 w-5 text-right">{index + 1}.</span>
            <h4 className="text-white text-sm font-semibold truncate max-w-[180px] sm:max-w-[250px] md:max-w-none">{track.title}</h4>
            {track.explicit && (
              <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded text-[9px] font-bold flex-shrink-0">E</span>
            )}
            {track.version && <span className="text-purple-400 text-[10px] flex-shrink-0 hidden sm:inline">{track.version}</span>}
            {track.isrc && (
              <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded text-[9px] font-mono flex-shrink-0 hidden md:inline">{track.isrc}</span>
            )}
          </div>
          
          {/* Progress bar */}
          {canPlay && (
            <div className="flex items-center gap-2" data-player-control>
              <div 
                ref={progressRef}
                onClick={handleProgressClick}
                onMouseDown={handleProgressMouseDown}
                className={`flex-1 h-1.5 bg-white/10 rounded-full cursor-pointer relative group/bar select-none ${isDragging ? 'cursor-grabbing' : ''}`}
              >
                <div 
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-violet-500 to-violet-400 rounded-full"
                  style={{ width: `${progress}%`, transition: isDragging || isPlaying ? 'none' : 'width 0.1s' }}
                />
                <div 
                  className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md pointer-events-none ${isDragging ? 'opacity-100' : 'opacity-0 group-hover/bar:opacity-100'}`}
                  style={{ left: `calc(${progress}% - 6px)` }}
                />
              </div>
              <span className="text-[10px] text-zinc-500 font-mono w-[70px] text-right flex-shrink-0">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
          )}
        </div>

        {/* Volume control */}
        {canPlay && (
          <div className="flex items-center gap-1.5 flex-shrink-0 group/volume">
            <button
              onClick={toggleMute}
              className="w-6 h-6 rounded-md bg-white/5 hover:bg-purple-500/20 text-zinc-500 hover:text-purple-400 flex items-center justify-center"
              title={isMuted ? 'Включить звук' : 'Выключить звук'}
            >
              {isMuted || volume === 0 ? (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                  <line x1="23" y1="9" x2="17" y2="15"/>
                  <line x1="17" y1="9" x2="23" y2="15"/>
                </svg>
              ) : volume < 0.5 ? (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                </svg>
              ) : (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
                </svg>
              )}
            </button>
            <div 
              className="relative w-14 h-1.5 bg-white/10 rounded-full cursor-pointer group-hover/volume:bg-white/15"
              data-player-control
            >
              <div 
                className="absolute inset-y-0 left-0 bg-violet-500/70 rounded-full"
                style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
              />
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div 
                className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full shadow-sm opacity-0 group-hover/volume:opacity-100 pointer-events-none"
                style={{ left: `calc(${(isMuted ? 0 : volume) * 100}% - 5px)` }}
              />
            </div>
          </div>
        )}

        {/* Expand button with hint */}
        <button 
          onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
          className="flex-shrink-0 px-2.5 h-8 rounded-lg bg-white/5 hover:bg-purple-500/20 flex items-center gap-1.5 text-zinc-400 hover:text-purple-300 group/expand"
          title={isExpanded ? 'Скрыть информацию' : 'Показать информацию о треке'}
        >
          <span className="text-[10px] font-medium hidden sm:inline opacity-60 group-hover/expand:opacity-100">Инфо</span>
          <svg className={`w-3.5 h-3.5 ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <polyline points="6 9 12 15 18 9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Expandable details */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
          <TrackMetadata track={track} />
          {track.explicit && (
            <div className="flex justify-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-xs font-bold ring-1 ring-red-500/30">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                EXPLICIT CONTENT
              </span>
            </div>
          )}
          {track.lyrics && (
            <details className="group/lyrics">
              <summary className="cursor-pointer text-sm text-purple-400 hover:text-purple-300 font-medium flex items-center justify-center gap-2 transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
                </svg>
                <span>Текст песни</span>
                <svg className="w-4 h-4 group-open/lyrics:rotate-180 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
              </summary>
              <div className="mt-3 p-4 bg-black/30 rounded-xl text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed border border-white/10">{track.lyrics}</div>
            </details>
          )}
        </div>
      )}
    </div>
  );
}

// Секция треклиста
export function TracklistSection({ tracks, releaseId, releaseType, status, supabase, coverUrl }: { 
  tracks: Track[]; releaseId: string; releaseType: 'basic' | 'exclusive'; status: string; supabase?: SupabaseClient; coverUrl?: string;
}) {
  // Allow playing tracks for approved, published, or distributed statuses
  const canPlay = status === 'approved' || status === 'published' || status === 'distributed';
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-5">
        <svg className="w-6 h-6 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/>
        </svg>
        <h3 className="font-bold text-2xl">Треклист</h3>
        <span className="ml-auto text-xs text-zinc-500 bg-white/5 px-3 py-1 rounded-full">{tracks.length} {getTracksWord(tracks.length)}</span>
      </div>
      <div className="space-y-3">
        {tracks.map((track, idx) => (
          <TrackItem key={idx} track={track} index={idx} canPlay={canPlay} releaseId={releaseId} releaseType={releaseType} supabase={supabase} coverUrl={coverUrl}/>
        ))}
      </div>
    </div>
  );
}
