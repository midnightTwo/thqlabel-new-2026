"use client";
import React, { useState, useEffect, useRef } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';

interface ArchiveTabProps {
  supabase: SupabaseClient;
}

// Простой встроенный плеер для трека
function SimpleTrackPlayer({ 
  releaseId, 
  releaseType, 
  trackIndex, 
  trackTitle,
  coverUrl,
  supabase 
}: { 
  releaseId: string; 
  releaseType: string; 
  trackIndex: number;
  trackTitle: string;
  coverUrl?: string;
  supabase: SupabaseClient;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handlePlay = async () => {
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    if (audioUrl && audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      const url = `/api/stream-audio?releaseId=${releaseId}&releaseType=${releaseType}&trackIndex=${trackIndex}`;
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(url, { headers });
      if (!response.ok) throw new Error('Ошибка загрузки');

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      setAudioUrl(blobUrl);

      const audio = new Audio(blobUrl);
      audioRef.current = audio;
      audio.onended = () => setIsPlaying(false);
      audio.onerror = () => setError('Ошибка воспроизведения');
      
      await audio.play();
      setIsPlaying(true);
    } catch (err: any) {
      setError(err.message || 'Ошибка');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) audioRef.current.pause();
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  return (
    <div className="flex items-center gap-3 p-3 bg-black/30 rounded-lg">
      {/* Миниатюра */}
      <div className="relative flex-shrink-0">
        {coverUrl ? (
          <div className="relative w-10 h-10 rounded-lg overflow-hidden">
            <img src={coverUrl} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-sm font-bold text-white">{trackIndex + 1}</span>
            </div>
          </div>
        ) : (
          <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center text-sm font-bold text-violet-400">
            {trackIndex + 1}
          </div>
        )}
      </div>

      {/* Кнопка воспроизведения */}
      <button
        onClick={handlePlay}
        disabled={loading}
        className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
          error ? 'bg-red-500/20 text-red-400' : 'bg-violet-500 text-white hover:bg-violet-600'
        } ${loading ? 'opacity-50' : ''}`}
      >
        {loading ? (
          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
        ) : isPlaying ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5.14v14l11-7-11-7z"/>
          </svg>
        )}
      </button>

      {/* Название */}
      <div className="flex-1 min-w-0">
        <div className="text-sm text-white truncate">{trackTitle}</div>
        <div className="text-xs text-zinc-500">
          {loading ? 'Загрузка...' : error ? error : isPlaying ? 'Воспроизведение' : 'Нажмите ▶'}
        </div>
      </div>
    </div>
  );
}

export default function ArchiveTab({ supabase }: ArchiveTabProps) {
  const [archivedReleases, setArchivedReleases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRelease, setExpandedRelease] = useState<string | null>(null);

  useEffect(() => {
    loadArchivedReleases();
  }, [supabase]);

  const loadArchivedReleases = async () => {
    try {
      setLoading(true);
      
      // Load rejected/archived releases from both tables
      const [basicReleases, exclusiveReleases] = await Promise.all([
        supabase
          .from('releases_basic')
          .select('*')
          .eq('status', 'rejected')
          .order('updated_at', { ascending: false }),
        supabase
          .from('releases_exclusive')
          .select('*')
          .eq('status', 'rejected')
          .order('updated_at', { ascending: false })
      ]);

      const allReleases = [
        ...(basicReleases.data || []).map(r => ({ ...r, release_type: 'basic' })),
        ...(exclusiveReleases.data || []).map(r => ({ ...r, release_type: 'exclusive' }))
      ].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

      setArchivedReleases(allReleases);
    } catch (error) {
      console.error('Error loading archived releases:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-black uppercase text-white">Архив релизов</h2>
          <p className="text-zinc-400 text-sm mt-1">Отклонённые и архивные материалы</p>
        </div>
      </div>
      
      {loading ? (
        <div className="text-center py-20">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#6050ba] border-t-transparent"></div>
          <p className="text-zinc-400 mt-4">Загрузка...</p>
        </div>
      ) : archivedReleases.length === 0 ? (
        <div className="text-center py-20 text-zinc-400">
          <div className="text-6xl mb-4">🗄️</div>
          <p className="text-lg font-semibold text-white">Архив пуст</p>
          <p className="text-sm mt-2">Отклонённые релизы будут отображаться здесь</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {archivedReleases.map((release) => (
            <div
              key={release.id}
              className="group bg-gradient-to-br from-[#0d0d0f] to-[#1a1a1f] border border-white/10 rounded-xl p-4 hover:border-red-500/30 transition-all"
            >
              {release.cover_url && (
                <img
                  src={release.cover_url}
                  alt={release.title}
                  className="w-full aspect-square object-cover rounded-lg mb-3"
                />
              )}
              <h3 className="font-bold text-white truncate">{release.title}</h3>
              <p className="text-sm text-zinc-400 truncate">{release.artist_name}</p>
              
              <div className="mt-3 flex items-center gap-2">
                <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                  release.release_type === 'basic'
                    ? 'bg-blue-500/20 text-blue-300'
                    : 'bg-purple-500/20 text-purple-300'
                }`}>
                  {release.release_type === 'basic' ? 'BASIC' : 'EXCLUSIVE'}
                </span>
                <span className="px-3 py-1 rounded-lg text-xs font-bold bg-red-500/20 text-red-300">
                  ОТКЛОНЁН
                </span>
              </div>

              {release.rejection_reason && (
                <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-xs text-zinc-400 mb-1">Причина отклонения:</p>
                  <p className="text-sm text-white">{release.rejection_reason}</p>
                </div>
              )}

              {/* Треклист с плеером */}
              {release.tracks && release.tracks.length > 0 && (
                <div className="mt-3">
                  <button
                    onClick={() => setExpandedRelease(expandedRelease === release.id ? null : release.id)}
                    className="w-full flex items-center justify-between p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <span className="text-sm text-zinc-300 flex items-center gap-2">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 18V5l12-2v13"/>
                        <circle cx="6" cy="18" r="3"/>
                        <circle cx="18" cy="16" r="3"/>
                      </svg>
                      Треклист ({release.tracks.length})
                    </span>
                    <svg 
                      width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                      className={`text-zinc-500 transition-transform ${expandedRelease === release.id ? 'rotate-180' : ''}`}
                    >
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </button>
                  
                  {expandedRelease === release.id && (
                    <div className="mt-2 space-y-2">
                      {release.tracks.map((track: any, idx: number) => (
                        <SimpleTrackPlayer
                          key={idx}
                          releaseId={release.id}
                          releaseType={release.release_type}
                          trackIndex={idx}
                          trackTitle={track.title}
                          coverUrl={release.cover_url}
                          supabase={supabase}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              <div className="mt-3 text-xs text-zinc-500">
                {new Date(release.updated_at).toLocaleString('ru-RU')}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

