'use client';

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Profile, Transaction, Release, Payout, Ticket } from './types';
import { TransactionList } from './TransactionList';
import { SupabaseClient } from '@supabase/supabase-js';
import { copyToClipboard } from '@/lib/utils/clipboard';

// Event для остановки всех аудио
const ADMIN_STOP_ALL_AUDIO_EVENT = 'ADMIN_STOP_ALL_AUDIO_EVENT';
const stopAllAdminAudio = () => window.dispatchEvent(new CustomEvent(ADMIN_STOP_ALL_AUDIO_EVENT));

interface UserProfileModalProps {
  user: Profile;
  profileLoading: boolean;
  userReleases: Release[];
  userPayouts: Payout[];
  userTickets: Ticket[];
  userTransactions: Transaction[];
  currentUserRole: string;
  editingProfile: boolean;
  setEditingProfile: (value: boolean) => void;
  editNickname: string;
  setEditNickname: (value: string) => void;
  editAvatar: string;
  setEditAvatar: (value: string) => void;
  onSaveProfile: () => void;
  onClose: () => void;
  supabase: SupabaseClient;
}

// Функция получения статуса
const getStatusInfo = (status: string) => {
  const statusMap: Record<string, { label: string; bg: string; text: string }> = {
    'approved': { label: 'Одобрен', bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
    'pending': { label: 'На модерации', bg: 'bg-amber-500/20', text: 'text-amber-400' },
    'distributed': { label: 'Распространён', bg: 'bg-blue-500/20', text: 'text-blue-400' },
    'published': { label: 'Выложен', bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
    'rejected': { label: 'Отклонён', bg: 'bg-red-500/20', text: 'text-red-400' },
    'draft': { label: 'Черновик', bg: 'bg-zinc-500/20', text: 'text-zinc-400' },
    'awaiting_payment': { label: 'Ожидает оплаты', bg: 'bg-orange-500/20', text: 'text-orange-400' },
  };
  return statusMap[status] || { label: status || 'Неизвестно', bg: 'bg-zinc-500/20', text: 'text-zinc-400' };
};

// ============================================================================
// КОМПАКТНЫЙ ПЛЕЕР ТРЕКА (как в модерации)
// ============================================================================
function TrackItem({ 
  track, 
  index, 
  releaseId, 
  releaseType,
  coverUrl,
  supabase
}: { 
  track: any; 
  index: number; 
  releaseId: string; 
  releaseType: string;
  coverUrl?: string;
  supabase: SupabaseClient;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [volume, setVolume] = useState(0.15);
  const [isMuted, setIsMuted] = useState(false);
  const maxVolume = 0.5;
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressRef = useRef<HTMLDivElement | null>(null);
  const animationRef = useRef<number | null>(null);

  const formatTime = (sec: number) => {
    if (!sec || !isFinite(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const updateProgress = useCallback(() => {
    if (audioRef.current && isPlaying) {
      setCurrentTime(audioRef.current.currentTime);
      animationRef.current = requestAnimationFrame(updateProgress);
    }
  }, [isPlaying]);

  useEffect(() => {
    if (isPlaying) {
      animationRef.current = requestAnimationFrame(updateProgress);
    }
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, updateProgress]);

  const handleVolumeChange = (newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolume(clampedVolume);
    if (audioRef.current) audioRef.current.volume = clampedVolume * maxVolume;
    if (clampedVolume > 0 && isMuted) setIsMuted(false);
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
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`/api/stream-audio?releaseId=${releaseId}&releaseType=${releaseType}&trackIndex=${index}`, {
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}
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
      audio.onerror = () => setError('Ошибка воспроизведения');
      audio.addEventListener('pause', () => setIsPlaying(false));
      audio.addEventListener('play', () => setIsPlaying(true));
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

  useEffect(() => {
    const handleStopAll = () => {
      if (audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
        setIsPlaying(false);
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
      }
    };
    window.addEventListener(ADMIN_STOP_ALL_AUDIO_EVENT, handleStopAll);
    return () => window.removeEventListener(ADMIN_STOP_ALL_AUDIO_EVENT, handleStopAll);
  }, []);

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
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }
    
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
    }
    
    stopAllAdminAudio();
    await new Promise(r => setTimeout(r, 100));
    
    let audio = audioRef.current || await loadAudio();
    if (!audio) return;
    
    stopAllAdminAudio();
    await new Promise(r => setTimeout(r, 50));
    
    try {
      await audio.play();
      setIsPlaying(true);
    } catch (e: any) {
      if (e.name !== 'AbortError') setError('Ошибка воспроизведения');
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

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => seekToPosition(e.clientX);
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
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
    if (audioRef.current) audioRef.current.pause();
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
  }, [audioUrl]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Получаем featuring как строку
  const featuringStr = Array.isArray(track.featuring) ? track.featuring.join(', ') : (track.featuring || '');
  const producersStr = Array.isArray(track.producers) ? track.producers.join(', ') : (track.producers || '');

  return (
    <div className="group bg-white/[0.02] hover:bg-white/[0.04] rounded-xl p-3 transition-all ring-1 ring-white/5 hover:ring-white/10">
      <div className="flex items-center gap-3">
        {/* Обложка с кнопкой Play/Pause */}
        <button
          onClick={handlePlayPause}
          disabled={loading}
          className={`relative flex-shrink-0 w-11 h-11 rounded-lg overflow-hidden transition-all ${
            isPlaying ? 'ring-2 ring-violet-500 shadow-lg shadow-violet-500/30' : 'ring-1 ring-white/10 hover:ring-violet-500/50'
          }`}
        >
          {coverUrl ? (
            <img src={coverUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-violet-600 to-purple-700" />
          )}
          <div className={`absolute inset-0 flex items-center justify-center transition-all ${
            loading ? 'bg-black/70' : error ? 'bg-red-500/30' : isPlaying ? 'bg-black/50' : 'bg-black/40 hover:bg-black/60'
          }`}>
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : error ? (
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24" className="text-red-400">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
              </svg>
            ) : isPlaying ? (
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24" className="text-white">
                <path d="M6 4h4v16H6zm8 0h4v16h-4z"/>
              </svg>
            ) : (
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24" className="text-white ml-0.5">
                <path d="M8 5v14l11-7z"/>
              </svg>
            )}
          </div>
        </button>

        {/* Инфо и прогресс */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-1.5 mb-1">
            <span className="text-zinc-500 text-xs font-mono flex-shrink-0 w-5 text-right">{index + 1}.</span>
            <h4 className="text-white text-sm font-medium truncate">{track.title || 'Без названия'}</h4>
            {!track.isInstrumental && (track.hasDrugs || track.explicit) && (
              <span className="px-1 py-0.5 bg-red-500/20 text-red-400 rounded text-[9px] font-bold leading-none flex-shrink-0">E</span>
            )}
            {track.isInstrumental && (
              <span className="px-1 py-0.5 bg-amber-500/20 text-amber-400 rounded text-[9px] font-bold leading-none flex-shrink-0">Instrumental</span>
            )}
            {track.version && <span className="text-violet-400 text-[10px] leading-none flex-shrink-0 hidden sm:inline">({track.version})</span>}
          </div>
          
          {/* Прогресс бар */}
          <div className="flex items-center gap-2">
            <div 
              ref={progressRef}
              onClick={handleClick}
              onMouseDown={handleMouseDown}
              className={`flex-1 h-1.5 bg-white/10 rounded-full cursor-pointer relative group/bar select-none ${isDragging ? 'cursor-grabbing' : ''}`}
            >
              <div 
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-violet-500 to-purple-500 rounded-full"
                style={{ width: `${progress}%`, transition: isDragging || isPlaying ? 'none' : 'width 0.1s' }}
              />
              <div 
                className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md shadow-black/50 transition-opacity pointer-events-none ${isDragging ? 'opacity-100 scale-110' : 'opacity-0 group-hover/bar:opacity-100'}`}
                style={{ left: `calc(${progress}% - 6px)` }}
              />
            </div>
            <span className="text-[10px] text-zinc-500 font-mono w-[70px] text-right select-none flex-shrink-0">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Volume Control */}
        <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0 group/volume">
          <button
            onClick={toggleMute}
            className="w-7 h-7 rounded-lg bg-white/5 hover:bg-violet-500/20 text-zinc-400 hover:text-violet-400 flex items-center justify-center transition-all"
          >
            {isMuted || volume === 0 ? (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <line x1="23" y1="9" x2="17" y2="15"/>
                <line x1="17" y1="9" x2="23" y2="15"/>
              </svg>
            ) : volume < 0.5 ? (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
              </svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
              </svg>
            )}
          </button>
          <div className="relative w-14 h-1.5 bg-white/10 rounded-full cursor-pointer group-hover/volume:bg-white/15">
            <div 
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-violet-500 to-purple-500 rounded-full"
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
              className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full shadow-md opacity-0 group-hover/volume:opacity-100 pointer-events-none"
              style={{ left: `calc(${(isMuted ? 0 : volume) * 100}% - 5px)` }}
            />
          </div>
        </div>
      </div>

      {/* Развёрнутая информация о треке */}
      <div className="mt-3 pt-3 border-t border-white/5 grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="bg-white/[0.02] rounded-lg px-2 py-1.5">
          <div className="text-[9px] text-zinc-600 uppercase tracking-wider">ISRC</div>
          <div className={`text-xs font-mono truncate ${track.isrc ? 'text-emerald-400' : 'text-zinc-600'}`}>
            {track.isrc || 'Отсутствует'}
          </div>
        </div>
        <div className="bg-white/[0.02] rounded-lg px-2 py-1.5">
          <div className="text-[9px] text-zinc-600 uppercase tracking-wider">Версия</div>
          <div className={`text-xs truncate ${track.version ? 'text-white' : 'text-zinc-600'}`}>
            {track.version || 'Оригинал'}
          </div>
        </div>
        <div className="bg-white/[0.02] rounded-lg px-2 py-1.5">
          <div className="text-[9px] text-zinc-600 uppercase tracking-wider">Feat.</div>
          <div className={`text-xs truncate ${featuringStr ? 'text-white' : 'text-zinc-600'}`}>
            {featuringStr || 'Нет'}
          </div>
        </div>
        <div className="bg-white/[0.02] rounded-lg px-2 py-1.5">
          <div className="text-[9px] text-zinc-600 uppercase tracking-wider">Язык</div>
          <div className={`text-xs truncate ${!track.isInstrumental && track.language ? 'text-white' : 'text-zinc-600'}`}>
            {track.isInstrumental ? 'N/A' : (track.language || 'Не указан')}
          </div>
        </div>
      </div>
      
      {error && <p className="text-[10px] text-red-400 mt-2 text-center">{error}</p>}
    </div>
  );
}

// Компонент детального просмотра релиза - стиль админки
function ReleaseDetailView({ release, onClose, supabase }: { release: Release; onClose: () => void; supabase: SupabaseClient }) {
  const [copiedUPC, setCopiedUPC] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const statusInfo = getStatusInfo(release.status);

  const handleCopyUPC = () => {
    if (release.upc) {
      copyToClipboard(release.upc);
      setCopiedUPC(true);
      setTimeout(() => setCopiedUPC(false), 2000);
    }
  };

  const handleCopyId = () => {
    if (release.custom_id) {
      copyToClipboard(release.custom_id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const getTracksWord = (count: number) => {
    if (count === 1) return 'трек';
    if (count >= 2 && count <= 4) return 'трека';
    return 'треков';
  };

  // Рендер через портал для истинного fullscreen
  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-2xl p-2 sm:p-4 md:p-6"
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
    >
      {/* Контейнер для модалки и крестика */}
      <div className="relative w-full max-w-[95vw] sm:max-w-[90vw] md:max-w-[85vw] lg:max-w-[900px]">
        {/* Кнопка закрытия - сбоку на десктопе */}
        <button 
          onClick={onClose} 
          className="hidden sm:flex absolute -right-14 top-4 z-50 w-10 h-10 rounded-full bg-white/10 hover:bg-red-500/30 backdrop-blur-md border border-white/20 hover:border-red-500/50 items-center justify-center transition-all duration-300 group shadow-xl"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-white/80 group-hover:text-white group-hover:rotate-90 transition-all duration-300">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        {/* Единое окно */}
        <div 
          className="relative w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden rounded-2xl sm:rounded-3xl bg-[#0a0a0c] border border-white/5 shadow-[0_0_100px_rgba(139,92,246,0.15)]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Кнопка закрытия - внутри на мобилке */}
          <button 
            onClick={onClose} 
            className="sm:hidden absolute top-3 right-3 z-50 w-9 h-9 rounded-full bg-white/10 hover:bg-red-500/30 backdrop-blur-md border border-white/20 flex items-center justify-center transition-all"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-white/80">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>

          {/* Фоновые блюры */}
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />
          
          {/* Sticky полоска */}
          <div className="sticky top-0 left-0 right-0 z-30 h-1 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500" />

          {/* Контент со скроллом */}
          <div className="overflow-y-auto max-h-[95vh] sm:max-h-[90vh] custom-scrollbar">
            {/* Шапка с обложкой */}
            <div className="relative p-4 sm:p-6 pb-0">
              <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                {/* Обложка */}
                <div className="relative group flex-shrink-0 mx-auto sm:mx-0">
                  <div className="w-[160px] h-[160px] sm:w-[200px] sm:h-[200px] rounded-2xl overflow-hidden ring-2 ring-white/10 shadow-2xl shadow-purple-900/30">
                    {release.cover_url ? (
                      <img 
                        src={release.cover_url} 
                        alt={release.title} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
                        <svg className="w-12 h-12 text-zinc-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M9 18V5l12-2v13M9 18l-7 2V7l7-2M9 18l12-2M9 9l12-2"/>
                        </svg>
                      </div>
                    )}
                  </div>
                </div>

                {/* Информация */}
                <div className="flex-1 min-w-0 pt-1 text-center sm:text-left">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white truncate mb-1">{release.title || 'Без названия'}</h1>
                  <p className="text-base sm:text-lg text-zinc-400 mb-3 sm:mb-4">{release.artist_name || release.artist || 'Неизвестный артист'}</p>
                  
                  {/* Бейджи */}
                  <div className="flex flex-wrap gap-2 mb-3 sm:mb-4 justify-center sm:justify-start">
                    <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase ${
                      release.release_type === 'exclusive' 
                        ? 'bg-violet-500/20 text-violet-400 ring-1 ring-violet-500/30' 
                        : 'bg-sky-500/20 text-sky-400 ring-1 ring-sky-500/30'
                    }`}>
                      {release.release_type === 'exclusive' ? 'EXCLUSIVE' : 'BASIC'}
                    </span>
                    <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase ${statusInfo.bg} ${statusInfo.text} ring-1 ring-current/30`}>
                      {statusInfo.label.toUpperCase()}
                    </span>
                    {/* Бейдж оплаты для Basic релизов */}
                    {release.release_type === 'basic' && (
                      release.is_paid ? (
                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30 flex items-center gap-1" title={`Оплачено: ${release.payment_amount || 0} ₽`}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {release.payment_amount ? `${release.payment_amount} ₽` : ''}
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-red-500/20 text-red-400 ring-1 ring-red-500/30 flex items-center gap-1" title="Не оплачено">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </span>
                      )
                    )}
                  </div>

                  {/* Информация об оплате для Basic */}
                  {release.release_type === 'basic' && release.is_paid && (
                    <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                      <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                        <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Информация об оплате
                        </div>
                        <div className="flex items-center gap-4 text-xs">
                          {release.payment_amount && (
                            <div>
                              <span className="text-zinc-500">Сумма:</span>{' '}
                              <span className="text-emerald-400 font-bold">{release.payment_amount} ₽</span>
                            </div>
                          )}
                          {release.payment_date && (
                            <div>
                              <span className="text-zinc-500">Дата:</span>{' '}
                              <span className="text-white">{new Date(release.payment_date).toLocaleDateString('ru-RU')}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      {release.payment_receipt_url ? (
                        <a 
                          href={release.payment_receipt_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 inline-flex items-center gap-2 px-3 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-lg text-sm text-emerald-400 hover:text-emerald-300 transition font-medium"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Посмотреть чек
                        </a>
                      ) : (
                        <div className="mt-3 inline-flex items-center gap-2 px-3 py-2 bg-zinc-500/10 border border-zinc-500/20 rounded-lg text-sm text-zinc-500">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Чек недоступен
                        </div>
                      )}
                    </div>
                  )}

                  {/* Мета инфо */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="bg-white/5 rounded-xl px-3 py-2">
                      <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Код</div>
                      <button
                        onClick={handleCopyId}
                        className={`text-sm font-semibold truncate flex items-center gap-1 ${release.custom_id ? 'text-violet-400 font-mono hover:text-violet-300' : 'text-zinc-500'}`}
                      >
                        {release.custom_id || '—'}
                        {release.custom_id && (
                          copiedId ? (
                            <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-3 h-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          )
                        )}
                      </button>
                    </div>
                    <div className="bg-white/5 rounded-xl px-3 py-2">
                      <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Жанр</div>
                      <div className="text-sm font-semibold text-white truncate">{release.genre || '—'}</div>
                    </div>
                    <div className="bg-white/5 rounded-xl px-3 py-2">
                      <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Дата</div>
                      <div className="text-sm font-semibold text-white truncate">
                        {release.release_date ? new Date(release.release_date).toLocaleDateString('ru-RU') : '—'}
                      </div>
                    </div>
                    {release.upc ? (
                      <button
                        onClick={handleCopyUPC}
                        className="bg-white/5 rounded-xl px-3 py-2 text-left hover:bg-white/10 transition-colors"
                      >
                        <div className="text-[10px] text-zinc-500 uppercase tracking-wider">UPC</div>
                        <div className="text-sm font-mono font-semibold text-emerald-400 truncate flex items-center gap-1">
                          {release.upc}
                          {copiedUPC ? (
                            <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-3 h-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          )}
                        </div>
                      </button>
                    ) : (
                      <div className="bg-amber-500/10 rounded-xl px-3 py-2 border border-amber-500/20">
                        <div className="text-[10px] text-amber-400 uppercase tracking-wider">UPC</div>
                        <div className="text-sm font-semibold text-amber-400">Отсутствует</div>
                      </div>
                    )}
                  </div>

                  {/* Дополнительная информация */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                    <div className="bg-gradient-to-br from-violet-500/10 to-purple-600/5 rounded-xl px-3 py-2 border border-violet-500/20">
                      <div className="text-[10px] text-violet-400 uppercase tracking-wider font-medium">Лейбл</div>
                      <div className="text-sm font-bold text-white truncate">
                        {release.label || 'thqlabel'}
                      </div>
                    </div>
                    <div className="bg-white/[0.03] rounded-xl px-3 py-2">
                      <div className="text-[10px] text-zinc-600 uppercase tracking-wider">Язык</div>
                      <div className={`text-sm font-medium truncate ${release.language ? 'text-white' : 'text-zinc-600'}`}>
                        {release.language || 'Не указан'}
                      </div>
                    </div>
                    <div className="bg-white/[0.03] rounded-xl px-3 py-2">
                      <div className="text-[10px] text-zinc-600 uppercase tracking-wider">Поджанры</div>
                      <div className={`text-sm font-medium truncate ${release.subgenres?.length ? 'text-white' : 'text-zinc-600'}`}>
                        {release.subgenres?.length ? release.subgenres.join(', ') : 'Нет'}
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-500/10 to-green-600/5 rounded-xl px-3 py-2 border border-emerald-500/20">
                      <div className="text-[10px] text-emerald-400 uppercase tracking-wider font-medium">Треков</div>
                      <div className="text-sm font-bold text-white">
                        {release.tracks?.length || 0} {getTracksWord(release.tracks?.length || 0)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Треклист */}
            {release.tracks && release.tracks.length > 0 && (
              <div className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <svg className="w-5 h-5 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 18V5l12-2v13"/>
                      <circle cx="6" cy="18" r="3"/>
                      <circle cx="18" cy="16" r="3"/>
                    </svg>
                    Треклист
                  </h3>
                  <span className="text-xs text-zinc-500 bg-white/5 px-3 py-1 rounded-full">
                    {release.tracks.length} {getTracksWord(release.tracks.length)}
                  </span>
                </div>
                <div className="space-y-2">
                  {release.tracks.map((track: any, index: number) => (
                    <TrackItem
                      key={track.id || index}
                      track={track}
                      index={index}
                      releaseId={release.id}
                      releaseType={release.release_type || 'basic'}
                      coverUrl={release.cover_url}
                      supabase={supabase}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Copyright если есть */}
            {release.copyright && (
              <div className="px-4 sm:px-6 pb-4 sm:pb-6">
                <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                  <div className="flex items-center gap-2 text-zinc-400">
                    <svg className="w-4 h-4 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M15 9a3 3 0 1 0 0 6"/>
                    </svg>
                    <span className="text-xs">{release.copyright}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Рендерим в document.body через портал
  if (typeof window === 'undefined') return null;
  return createPortal(modalContent, document.body);
}

export function UserProfileModal({
  user,
  profileLoading,
  userReleases,
  userPayouts,
  userTickets,
  userTransactions,
  currentUserRole,
  editingProfile,
  setEditingProfile,
  editNickname,
  setEditNickname,
  editAvatar,
  setEditAvatar,
  onSaveProfile,
  onClose,
  supabase,
}: UserProfileModalProps) {
  const [viewingRelease, setViewingRelease] = useState<Release | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedTicketId, setCopiedTicketId] = useState<string | null>(null);
  const [deletingDraftId, setDeletingDraftId] = useState<string | null>(null);
  const [localDrafts, setLocalDrafts] = useState<Release[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; type: string; title: string } | null>(null);
  
  // Разделяем релизы и черновики
  const { releases, drafts: initialDrafts } = useMemo(() => {
    const drafts = userReleases.filter(r => r.status === 'draft');
    const releases = userReleases.filter(r => r.status !== 'draft');
    return { releases, drafts };
  }, [userReleases]);
  
  // Локальное состояние черновиков для мгновенного обновления UI
  useEffect(() => {
    setLocalDrafts(initialDrafts);
  }, [initialDrafts]);
  
  const drafts = localDrafts;
  
  // Удаление черновика
  const handleDeleteDraft = async (releaseId: string, releaseType: string) => {
    setDeleteConfirm(null);
    setDeletingDraftId(releaseId);
    try {
      const table = releaseType === 'exclusive' ? 'releases_exclusive' : 'releases_basic';
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', releaseId);
      
      if (error) throw error;
      
      // Обновляем локальное состояние
      setLocalDrafts(prev => prev.filter(d => d.id !== releaseId));
    } catch (err) {
      console.error('Error deleting draft:', err);
      alert('Ошибка при удалении черновика');
    } finally {
      setDeletingDraftId(null);
    }
  };
  
  // Запрос подтверждения удаления
  const confirmDeleteDraft = (releaseId: string, releaseType: string, title: string) => {
    setDeleteConfirm({ id: releaseId, type: releaseType, title: title || 'Без названия' });
  };
  
  // Копирование ID тикета с уведомлением
  const handleCopyTicketId = (ticketId: string) => {
    copyToClipboard(ticketId);
    setCopiedTicketId(ticketId);
    setTimeout(() => setCopiedTicketId(null), 2000);
  };
  
  // Открытие тикета в админке
  const handleOpenTicket = (ticketId: string) => {
    window.open(`/admin?tab=tickets&ticket=${ticketId}`, '_blank');
  };

  const handleCopyMemberId = () => {
    copyToClipboard(user.member_id || user.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };
  
  const roleColorClass = user.role === 'owner' ? 'bg-purple-500/20 text-purple-300' :
    user.role === 'admin' ? 'bg-red-500/20 text-red-300' :
    user.role === 'exclusive' ? 'bg-amber-500/20 text-amber-300' :
    'bg-zinc-500/20 text-zinc-300';

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-stretch justify-center p-2">
      <div className="admin-dark-modal bg-gradient-to-br from-[#1a1a1f] to-[#0d0d0f] border border-white/10 rounded-2xl sm:rounded-3xl max-w-5xl w-full overflow-hidden flex flex-col">
        {/* Шапка профиля */}
        <div className="sticky top-0 bg-[#1a1a1f]/95 backdrop-blur border-b border-white/10 p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 z-10">
          <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
            <div 
              className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center text-xl sm:text-2xl font-black border-2 overflow-hidden flex-shrink-0 ${user.avatar ? 'bg-cover bg-center' : 'bg-gradient-to-br from-[#6050ba] to-[#4a3d8f]'} border-[#6050ba]/50`}
              style={{ backgroundImage: user.avatar ? `url(${user.avatar})` : 'none' }}
            >
              {!user.avatar && (user.nickname?.charAt(0)?.toUpperCase() || '?')}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-xl font-black truncate">{user.nickname || 'Без никнейма'}</h2>
              <p className="text-xs sm:text-sm text-zinc-400 truncate">{user.email}</p>
              {/* Telegram */}
              {user.telegram && (
                <a 
                  href={`https://t.me/${user.telegram.replace('@', '').replace('https://t.me/', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs text-[#0088cc] hover:text-[#00aadd] transition mt-1"
                >
                  <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                  </svg>
                  <span className="truncate max-w-[100px] sm:max-w-none">{user.telegram.startsWith('@') ? user.telegram : `@${user.telegram}`}</span>
                </a>
              )}
              <div className="flex items-center gap-1.5 sm:gap-2 mt-1 flex-wrap">
                <span className={`text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full font-bold ${roleColorClass}`}>
                  {user.role?.toUpperCase() || 'BASIC'}
                </span>
                <span className="text-[9px] sm:text-[10px] text-zinc-500 truncate max-w-[80px] sm:max-w-none">{user.member_id}</span>
                <button
                  onClick={handleCopyMemberId}
                  className="hover:opacity-70 transition flex-shrink-0 min-w-[20px] min-h-[20px] flex items-center justify-center"
                  title="Копировать ID"
                >
                  {copiedId ? (
                    <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-3 h-3 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* Кнопка редактирования (только для Owner) */}
            {currentUserRole === 'owner' && (
              <button
                onClick={() => setEditingProfile(!editingProfile)}
                className={`p-2.5 sm:p-3 rounded-xl transition min-w-[40px] min-h-[40px] flex items-center justify-center ${editingProfile ? 'bg-[#8b5cf6]/30 text-[#a78bfa]' : 'hover:bg-white/10'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2.5 sm:p-3 hover:bg-white/10 rounded-xl transition min-w-[40px] min-h-[40px] flex items-center justify-center"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        {profileLoading ? (
          <div className="p-12 text-center text-zinc-500">Загрузка данных...</div>
        ) : (
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto custom-scrollbar flex-1">
            {/* Форма редактирования (только для Owner) */}
            {currentUserRole === 'owner' && editingProfile && (
              <div className="p-3 sm:p-4 bg-[#8b5cf6]/10 border border-[#8b5cf6]/30 rounded-xl space-y-3 sm:space-y-4">
                <h3 className="font-bold text-[#a78bfa] flex items-center gap-2 text-sm sm:text-base">
                  <span>♛</span> Редактирование профиля (Owner)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <div>
                    <label className="text-[10px] sm:text-xs text-zinc-500 block mb-1">Никнейм</label>
                    <input
                      value={editNickname}
                      onChange={(e) => setEditNickname(e.target.value)}
                      className="w-full bg-black/30 border border-white/10 rounded-xl px-3 sm:px-4 py-2.5 sm:py-2 text-sm min-h-[44px]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] sm:text-xs text-zinc-500 block mb-1">URL аватара</label>
                    <input
                      value={editAvatar}
                      onChange={(e) => setEditAvatar(e.target.value)}
                      placeholder="https://..."
                      className="w-full bg-black/30 border border-white/10 rounded-xl px-3 sm:px-4 py-2.5 sm:py-2 text-sm min-h-[44px]"
                    />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={onSaveProfile}
                    className="px-4 py-2.5 sm:py-2 bg-[#8b5cf6] hover:bg-[#7c4dff] rounded-xl text-sm font-bold transition min-h-[44px]"
                  >
                    Сохранить изменения
                  </button>
                  <button
                    onClick={() => setEditingProfile(false)}
                    className="px-4 py-2.5 sm:py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm transition min-h-[44px]"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            )}
            
            {/* Статистика */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 sm:p-4 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 rounded-xl text-center">
                <div className="text-xl sm:text-2xl font-black text-emerald-400">{Number(user.balance || 0).toLocaleString('ru-RU', {minimumFractionDigits: 2, maximumFractionDigits: 2}).replace(/\s/g, '.')} ₽</div>
                <div className="text-[9px] sm:text-[10px] text-zinc-500 uppercase tracking-widest mt-1">Баланс</div>
              </div>
              <div className="p-3 sm:p-4 bg-gradient-to-br from-violet-500/10 to-purple-600/5 border border-violet-500/20 rounded-xl text-center">
                <div className="text-xl sm:text-2xl font-black text-violet-400">{releases.length}</div>
                <div className="text-[9px] sm:text-[10px] text-zinc-500 uppercase tracking-widest mt-1">Релизов</div>
                {drafts.length > 0 && (
                  <div className="text-[9px] text-zinc-600 mt-0.5">+{drafts.length} черновиков</div>
                )}
              </div>
              <div className="p-3 sm:p-4 bg-gradient-to-br from-amber-500/10 to-orange-600/5 border border-amber-500/20 rounded-xl text-center">
                <div className="text-xl sm:text-2xl font-black text-amber-400">{userTransactions.length}</div>
                <div className="text-[9px] sm:text-[10px] text-zinc-500 uppercase tracking-widest mt-1">Транзакций</div>
              </div>
              <div className="p-3 sm:p-4 bg-gradient-to-br from-blue-500/10 to-sky-600/5 border border-blue-500/20 rounded-xl text-center">
                <div className="text-xl sm:text-2xl font-black text-blue-400">{userTickets.length}</div>
                <div className="text-[9px] sm:text-[10px] text-zinc-500 uppercase tracking-widest mt-1">Тикетов</div>
                {userTickets.filter((t: Ticket) => t.status === 'open').length > 0 && (
                  <div className="text-[9px] text-blue-400 mt-0.5">{userTickets.filter((t: Ticket) => t.status === 'open').length} открытых</div>
                )}
              </div>
            </div>

            {/* Релизы пользователя (без черновиков) - ВЫШЕ транзакций */}
            {releases.length > 0 && (
              <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#9d8df1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                  Релизы ({releases.length})
                </h3>
                <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                  {releases.map((release: Release) => (
                    <div 
                      key={release.id} 
                      className="flex items-center gap-3 p-3 bg-black/20 hover:bg-black/30 border border-white/5 hover:border-[#6050ba]/30 rounded-xl transition-all group"
                    >
                      {/* Обложка */}
                      {release.cover_url ? (
                        <img 
                          src={release.cover_url} 
                          alt={release.title}
                          className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#6050ba]/30 to-[#4a3d8f]/30 flex items-center justify-center flex-shrink-0">
                          <svg className="w-6 h-6 text-[#9d8df1]/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                          </svg>
                        </div>
                      )}
                      
                      {/* Информация */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-white truncate">{release.title || 'Без названия'}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                            release.release_type === 'exclusive' 
                              ? 'bg-amber-500/20 text-amber-400' 
                              : 'bg-zinc-500/20 text-zinc-400'
                          }`}>
                            {release.release_type === 'exclusive' ? 'EXCLUSIVE' : 'BASIC'}
                          </span>
                          {/* Бейдж оплаты для Basic релизов */}
                          {release.release_type === 'basic' && (
                            release.is_paid ? (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-400 flex items-center gap-1" title={`Оплачено: ${release.payment_amount || 0} ₽`}>
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {release.payment_amount ? `${release.payment_amount}₽` : ''}
                              </span>
                            ) : (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-red-500/20 text-red-400 flex items-center" title="Не оплачено">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </span>
                            )
                          )}
                        </div>
                        <p className="text-xs text-zinc-500 truncate">{release.artist_name || release.artist || 'Неизвестный артист'}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {release.custom_id && (
                            <span className="text-[10px] text-zinc-600 font-mono">{release.custom_id}</span>
                          )}
                          {(() => {
                            const si = getStatusInfo(release.status);
                            return (
                              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${si.bg} ${si.text}`}>
                                {si.label}
                              </span>
                            );
                          })()}
                          {/* Дата оплаты и чек */}
                          {release.is_paid && release.payment_date && (
                            <span className="text-[9px] text-emerald-500/70 flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {new Date(release.payment_date).toLocaleDateString('ru-RU')}
                              {release.payment_receipt_url && (
                                <a 
                                  href={release.payment_receipt_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="ml-1 text-emerald-400 hover:text-emerald-300"
                                  title="Посмотреть чек"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                </a>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Дата и иконка просмотра */}
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-zinc-600">
                          {release.created_at ? new Date(release.created_at).toLocaleDateString('ru-RU') : '—'}
                        </span>
                        <button 
                          onClick={() => setViewingRelease(release)}
                          className="p-1.5 bg-[#6050ba]/10 hover:bg-[#6050ba]/30 rounded-lg transition-colors cursor-pointer"
                          title="Просмотреть релиз"
                        >
                          <svg className="w-4 h-4 text-[#9d8df1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Черновики (отдельно) */}
            {drafts.length > 0 && (
              <div className="p-4 bg-white/[0.02] border border-zinc-800/50 rounded-xl">
                <h3 className="font-bold mb-4 flex items-center gap-2 text-zinc-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Черновики ({drafts.length})
                </h3>
                <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar">
                  {drafts.map((release: Release) => (
                    <div 
                      key={release.id} 
                      className="flex items-center gap-3 p-3 bg-black/10 hover:bg-black/20 border border-zinc-800/30 hover:border-zinc-700/50 rounded-xl transition-all group"
                    >
                      {/* Обложка */}
                      {release.cover_url ? (
                        <img 
                          src={release.cover_url} 
                          alt={release.title}
                          className="w-10 h-10 rounded-lg object-cover flex-shrink-0 opacity-60"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-zinc-800/50 flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                          </svg>
                        </div>
                      )}
                      
                      {/* Информация */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-zinc-400 truncate">{release.title || 'Без названия'}</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-zinc-700/30 text-zinc-500">
                            ЧЕРНОВИК
                          </span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                            release.release_type === 'exclusive' 
                              ? 'bg-amber-500/20 text-amber-400' 
                              : 'bg-zinc-600/30 text-zinc-500'
                          }`}>
                            {release.release_type === 'exclusive' ? 'EXCLUSIVE' : 'BASIC'}
                          </span>
                          {/* Бейдж оплаты для Basic черновиков */}
                          {release.release_type === 'basic' && (
                            release.is_paid ? (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-400 flex items-center gap-1" title={`Оплачено: ${release.payment_amount || 0} ₽`}>
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {release.payment_amount ? `${release.payment_amount}₽` : ''}
                              </span>
                            ) : (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-orange-500/20 text-orange-400 flex items-center" title="Не оплачено">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </span>
                            )
                          )}
                        </div>
                        <p className="text-xs text-zinc-600 truncate">{release.artist_name || release.artist || 'Неизвестный артист'}</p>
                      </div>
                      
                      {/* Дата, просмотр и удаление */}
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-zinc-700">
                          {release.created_at ? new Date(release.created_at).toLocaleDateString('ru-RU') : '—'}
                        </span>
                        <button 
                          onClick={() => setViewingRelease(release)}
                          className="p-1.5 bg-zinc-800/30 hover:bg-zinc-700/50 rounded-lg transition-colors cursor-pointer"
                          title="Просмотреть черновик"
                        >
                          <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        {/* Кнопка удаления черновика */}
                        <button 
                          onClick={() => confirmDeleteDraft(release.id, release.release_type || 'basic', release.title)}
                          disabled={deletingDraftId === release.id}
                          className="p-1.5 bg-red-500/10 hover:bg-red-500/30 rounded-lg transition-colors cursor-pointer border border-red-500/20 hover:border-red-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Удалить черновик"
                        >
                          {deletingDraftId === release.id ? (
                            <svg className="w-4 h-4 text-red-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Тикеты поддержки */}
            {userTickets.length > 0 && (
              <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  Тикеты поддержки ({userTickets.length})
                  {userTickets.filter((t: Ticket) => t.status === 'open' || t.status === 'pending').length > 0 && (
                    <span className="ml-auto text-[10px] px-2 py-1 rounded-full font-bold bg-blue-500/20 text-blue-400">
                      {userTickets.filter((t: Ticket) => t.status === 'open' || t.status === 'pending').length} активных
                    </span>
                  )}
                </h3>
                <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                  {userTickets.map((ticket: Ticket) => {
                    const statusColors = {
                      open: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', label: 'Открыт' },
                      pending: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400', label: 'Ожидает' },
                      in_progress: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', label: 'В работе' },
                      closed: { bg: 'bg-zinc-500/10', border: 'border-zinc-500/30', text: 'text-zinc-400', label: 'Закрыт' },
                    };
                    const status = statusColors[ticket.status as keyof typeof statusColors] || statusColors.closed;
                    const isCopied = copiedTicketId === ticket.id;
                    
                    return (
                      <div 
                        key={ticket.id} 
                        className={`flex items-center gap-3 p-3 ${status.bg} hover:bg-black/30 border ${status.border} hover:border-blue-500/30 rounded-xl transition-all group`}
                      >
                        {/* Иконка статуса */}
                        <div className={`w-10 h-10 rounded-xl ${status.bg} border ${status.border} flex items-center justify-center flex-shrink-0`}>
                          {ticket.status === 'open' || ticket.status === 'pending' ? (
                            <div className="relative">
                              <svg className={`w-5 h-5 ${status.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                              </svg>
                              <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
                            </div>
                          ) : ticket.status === 'in_progress' ? (
                            <svg className={`w-5 h-5 ${status.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          ) : (
                            <svg className={`w-5 h-5 ${status.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        
                        {/* Информация */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-white truncate">{ticket.subject || 'Без темы'}</span>
                            {ticket.has_unread_admin_reply && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-red-500 text-white animate-pulse flex-shrink-0">
                                NEW
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${status.bg} ${status.text} border ${status.border}`}>
                              {status.label.toUpperCase()}
                            </span>
                            {ticket.priority === 'urgent' && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                                🔥 СРОЧНО
                              </span>
                            )}
                            {ticket.priority === 'high' && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                                ⚡ ВАЖНО
                              </span>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyTicketId(ticket.id);
                              }}
                              className={`text-[9px] px-1.5 py-0.5 rounded font-mono flex items-center gap-1 transition-all ${
                                isCopied 
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                                  : 'bg-white/5 text-zinc-500 hover:bg-white/10 hover:text-white'
                              }`}
                              title="Копировать ID тикета"
                            >
                              {isCopied ? (
                                <>
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  Скопировано
                                </>
                              ) : (
                                <>
                                  #{String(ticket.id).slice(0, 8)}
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                  </svg>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                        
                        {/* Дата и кнопка просмотра */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-[10px] text-zinc-500">
                            {ticket.created_at ? new Date(ticket.created_at).toLocaleDateString('ru-RU') : '—'}
                          </span>
                          <button
                            onClick={() => handleOpenTicket(ticket.id)}
                            className={`p-2 ${status.bg} hover:bg-blue-500/30 border ${status.border} hover:border-blue-500/50 rounded-lg transition-all cursor-pointer`}
                            title="Открыть тикет"
                          >
                            <svg className={`w-4 h-4 ${status.text} group-hover:text-blue-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Все транзакции */}
            <TransactionList transactions={userTransactions} />
          </div>
        )}
      </div>
      
      {/* Модальное окно просмотра релиза */}
      {viewingRelease && (
        <ReleaseDetailView 
          release={viewingRelease} 
          onClose={() => setViewingRelease(null)}
          supabase={supabase}
        />
      )}

      {/* Модальное окно подтверждения удаления черновика */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
          {/* Затемнённый фон */}
          <div 
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setDeleteConfirm(null)}
          />
          
          {/* Модальное окно */}
          <div className="relative bg-zinc-900 border border-red-500/30 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl shadow-red-500/10 animate-in fade-in zoom-in-95 duration-200">
            {/* Иконка предупреждения */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
            
            {/* Заголовок */}
            <h3 className="text-xl font-bold text-white text-center mb-2">
              Удаление черновика
            </h3>
            
            {/* Название черновика */}
            <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-3 mb-4">
              <p className="text-center text-white font-medium truncate">
                «{deleteConfirm.title || 'Без названия'}»
              </p>
            </div>
            
            {/* Предупреждение */}
            <p className="text-zinc-400 text-center text-sm mb-6">
              Вы уверены, что хотите удалить этот черновик?
              <br />
              <span className="text-red-400 font-medium">Это действие необратимо.</span>
            </p>
            
            {/* Кнопки */}
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-600 text-white font-medium rounded-xl transition-all"
              >
                Отмена
              </button>
              <button
                onClick={() => handleDeleteDraft(deleteConfirm.id, deleteConfirm.type)}
                disabled={deletingDraftId === deleteConfirm.id}
                className="flex-1 px-4 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 hover:border-red-500/70 text-red-400 font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {deletingDraftId === deleteConfirm.id ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Удаление...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Удалить
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
