'use client';

import React, { useState, useEffect, useCallback, memo, useRef } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import {
  ReleaseInfoStep,
  TracklistStep,
  CountriesStep,
  PlatformsStep,
  getAllPlatforms,
} from '@/app/cabinet/release/create/components';
import { getAllCountries } from '@/components/icons/CountryFlagsSVG';

// ============================================================================
// TYPES
// ============================================================================
export type ReleaseType = 'single' | 'ep' | 'album';

interface User {
  id: string;
  email: string;
  nickname?: string;
  avatar_url?: string;
  role?: string;
  member_id?: string;
}

interface AudioMetadata {
  format: string;
  duration?: number;
  bitrate?: string;
  sampleRate?: string;
  size: number;
}

interface Track {
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
}

interface AdminCreateReleaseProps {
  supabase: SupabaseClient;
  onSuccess?: () => void;
  onCancel?: () => void;
}

// ============================================================================
// HELPERS
// ============================================================================
const getAvatarUrl = (avatarUrl: string | undefined, supabase: SupabaseClient): string => {
  if (!avatarUrl) return '';
  if (avatarUrl.startsWith('http')) return avatarUrl;
  const { data } = supabase.storage.from('avatars').getPublicUrl(avatarUrl);
  return data?.publicUrl || '';
};

// ============================================================================
// USER SELECT STEP
// ============================================================================
interface UserSearchProps {
  supabase: SupabaseClient;
  selectedUser: User | null;
  onSelectUser: (user: User | null) => void;
  onNext: () => void;
}

const UserSelectStep = memo(function UserSelectStep({ supabase, selectedUser, onSelectUser, onNext }: UserSearchProps) {
  const [userSearch, setUserSearch] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [searchError, setSearchError] = useState('');
  const searchRef = useRef<HTMLDivElement>(null);

  const searchUsers = useCallback(async (query: string) => {
    if (!query || query.length < 2) { setSearchResults([]); setSearchError(''); return; }
    setIsSearching(true); setSearchError('');
    try {
      const { data, error } = await supabase.from('profiles')
        .select('id, email, nickname, avatar_url, role, member_id')
        .or(`email.ilike.%${query}%,nickname.ilike.%${query}%`).limit(15);
      if (error) { setSearchError('Ошибка поиска'); setSearchResults([]); return; }
      if (!data || data.length === 0) { setSearchError(`Пользователь "${query}" не найден`); setSearchResults([]); return; }
      setSearchResults(data);
    } catch { setSearchError('Ошибка соединения'); setSearchResults([]); }
    finally { setIsSearching(false); }
  }, [supabase]);

  useEffect(() => {
    const timer = setTimeout(() => searchUsers(userSearch), 300);
    return () => clearTimeout(timer);
  }, [userSearch, searchUsers]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowResults(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="animate-fade-up">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center ring-1 ring-white/10">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-300">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <div>
            <h2 className="text-3xl font-black bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">Выбор пользователя</h2>
            <p className="text-sm text-zinc-500 mt-1">Выберите пользователя, для которого создаётся релиз</p>
          </div>
        </div>
      </div>

      <div ref={searchRef} className="relative mb-6">
        <input type="text" value={userSearch}
          onChange={(e) => { setUserSearch(e.target.value); setShowResults(true); }}
          onFocus={() => setShowResults(true)}
          placeholder="Поиск по email или нику..."
          className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-zinc-500 focus:border-purple-500/50 focus:outline-none transition text-lg"
        />
        {isSearching && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        
        {showResults && searchResults.length > 0 && (
          <div className="absolute z-50 w-full mt-2 bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl max-h-80 overflow-y-auto">
            {searchResults.map((user) => (
              <button key={user.id} type="button"
                onClick={() => { onSelectUser(user); setUserSearch(''); setShowResults(false); setSearchError(''); }}
                className="w-full px-4 py-4 flex items-center gap-4 hover:bg-white/5 transition text-left border-b border-white/5 last:border-b-0">
                {getAvatarUrl(user.avatar_url, supabase) ? (
                  <img src={getAvatarUrl(user.avatar_url, supabase)} alt="" className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-lg">
                    {(user.nickname || user.email)?.[0]?.toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate text-lg">{user.nickname || 'Без имени'}</p>
                  <p className="text-zinc-400 text-sm truncate">{user.email}</p>
                </div>
                <span className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                  user.role === 'exclusive' ? 'bg-purple-500/20 text-purple-400' : 
                  user.role === 'admin' ? 'bg-blue-500/20 text-blue-400' :
                  'bg-zinc-500/20 text-zinc-400'
                }`}>
                  {user.role || 'basic'}
                </span>
              </button>
            ))}
          </div>
        )}
        
        {showResults && searchError && userSearch.length >= 2 && (
          <div className="absolute z-50 w-full mt-2 bg-zinc-900 border border-white/10 rounded-2xl p-6 shadow-2xl">
            <p className="text-zinc-400 text-center">{searchError}</p>
          </div>
        )}
      </div>
      
      {selectedUser && (
        <div className="p-6 bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-2xl flex items-center gap-4 mb-8">
          {getAvatarUrl(selectedUser.avatar_url, supabase) ? (
            <img src={getAvatarUrl(selectedUser.avatar_url, supabase)} alt="" className="w-16 h-16 rounded-full object-cover ring-2 ring-purple-500/30" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-2xl ring-2 ring-purple-500/30">
              {(selectedUser.nickname || selectedUser.email)?.[0]?.toUpperCase()}
            </div>
          )}
          <div className="flex-1">
            <p className="text-white font-bold text-xl">{selectedUser.nickname || 'Без имени'}</p>
            <p className="text-zinc-400">{selectedUser.email}</p>
            {selectedUser.member_id && <p className="text-zinc-500 text-sm mt-1">ID: {selectedUser.member_id}</p>}
          </div>
          <button type="button" onClick={() => onSelectUser(null)}
            className="p-3 hover:bg-white/10 rounded-xl transition text-zinc-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <div className="flex justify-end pt-6 border-t border-white/10">
        <button
          type="button"
          onClick={onNext}
          disabled={!selectedUser}
          className="px-8 py-4 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 rounded-xl text-white font-bold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-lg"
        >
          Далее
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
});

// ============================================================================
// RELEASE TYPE STEP
// ============================================================================
interface ReleaseTypeSelectorProps {
  releaseType: ReleaseType | null;
  onSelectType: (type: ReleaseType) => void;
  onNext: () => void;
  onBack: () => void;
}

function ReleaseTypeStep({ releaseType, onSelectType, onNext, onBack }: ReleaseTypeSelectorProps) {
  const types = [
    { id: 'single' as ReleaseType, name: 'Сингл', desc: '1 трек', icon: '🎵', color: 'from-purple-500/20 to-purple-600/20 border-purple-500/30' },
    { id: 'ep' as ReleaseType, name: 'EP', desc: '2-7 треков', icon: '💿', color: 'from-blue-500/20 to-blue-600/20 border-blue-500/30' },
    { id: 'album' as ReleaseType, name: 'Альбом', desc: '8-50 треков', icon: '📀', color: 'from-emerald-500/20 to-emerald-600/20 border-emerald-500/30' },
  ];

  return (
    <div className="animate-fade-up">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center ring-1 ring-white/10">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-300">
              <circle cx="12" cy="12" r="10"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </div>
          <div>
            <h2 className="text-3xl font-black bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">Тип релиза</h2>
            <p className="text-sm text-zinc-500 mt-1">Выберите формат релиза</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {types.map((type) => (
          <button
            key={type.id}
            type="button"
            onClick={() => onSelectType(type.id)}
            className={`p-6 rounded-2xl border-2 transition-all text-left ${
              releaseType === type.id 
                ? `bg-gradient-to-br ${type.color} ring-2 ring-white/20 scale-[1.02]` 
                : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
            }`}
          >
            <div className="text-4xl mb-4">{type.icon}</div>
            <h3 className="text-xl font-bold text-white mb-1">{type.name}</h3>
            <p className="text-zinc-400">{type.desc}</p>
          </button>
        ))}
      </div>

      <div className="flex justify-between pt-6 border-t border-white/10">
        <button type="button" onClick={onBack}
          className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-zinc-400 hover:text-white transition font-medium flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Назад
        </button>
        <button type="button" onClick={onNext} disabled={!releaseType}
          className="px-8 py-4 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 rounded-xl text-white font-bold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
          Далее
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// ADMIN SEND STEP
// ============================================================================
interface AdminSendStepProps {
  supabase: SupabaseClient;
  selectedUser: User;
  releaseType: ReleaseType;
  releaseTitle: string;
  artistName: string;
  genre: string;
  coverFile: File | null;
  releaseDate: string | null;
  tracks: Track[];
  selectedPlatformsList: string[];
  excludedCountries: string[];
  onBack: () => void;
  onSuccess: () => void;
}

function AdminSendStep({ supabase, selectedUser, releaseType, releaseTitle, artistName, genre, coverFile, releaseDate, tracks, selectedPlatformsList, excludedCountries, onBack, onSuccess }: AdminSendStepProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const allCountries = getAllCountries();
  const selectedCountries = allCountries.filter(c => !excludedCountries.includes(c));

  const getMinTracks = (): number => {
    if (releaseType === 'ep') return 2;
    if (releaseType === 'album') return 7;
    return 1;
  };

  const checks = [
    { name: 'Пользователь', valid: !!selectedUser, issue: 'Не выбран пользователь' },
    { name: 'Название', valid: !!releaseTitle.trim(), issue: 'Не указано название' },
    { name: 'Артист', valid: !!artistName.trim(), issue: 'Не указан артист' },
    { name: 'Жанр', valid: !!genre, issue: 'Не выбран жанр' },
    { name: 'Обложка', valid: !!coverFile, issue: 'Не загружена обложка' },
    { name: 'Дата релиза', valid: !!releaseDate, issue: 'Не указана дата' },
    { name: 'Треки', valid: tracks.length >= getMinTracks(), issue: `Минимум ${getMinTracks()} ${getMinTracks() === 1 ? 'трек' : 'трека'}` },
    { name: 'Площадки', valid: selectedPlatformsList.length > 0, issue: 'Не выбраны площадки' },
    { name: 'Страны', valid: selectedCountries.length > 0, issue: 'Не выбраны страны' },
  ];

  const allValid = checks.every(c => c.valid);

  const handleSubmit = async () => {
    if (!allValid) return;
    setSubmitting(true);
    setError('');

    try {
      let coverUrl = '';
      if (coverFile) {
        const fileName = `${selectedUser.id}/${Date.now()}_cover.${coverFile.name.split('.').pop()}`;
        const { error: uploadError } = await supabase.storage.from('release-covers').upload(fileName, coverFile);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('release-covers').getPublicUrl(fileName);
        coverUrl = urlData.publicUrl;
      }

      const tracksData = tracks.map((track, index) => ({
        title: track.title, artists: artistName, hasDrugs: track.hasDrugs, lyrics: track.lyrics,
        language: track.language, version: track.version || '', producers: track.producers || [],
        featuring: track.featuring || [], order: index + 1,
      }));

      const { data: maxIdData } = await supabase.rpc('generate_release_custom_id');
      const customId = maxIdData || `thqrel-${String(Date.now()).slice(-6)}`;

      const { error: releaseError } = await supabase.from('releases_exclusive').insert({
        user_id: selectedUser.id, custom_id: customId, title: releaseTitle, artist_name: artistName,
        genre, cover_url: coverUrl, release_date: releaseDate, status: 'published', release_type: releaseType,
        platforms: selectedPlatformsList, countries: selectedCountries, tracks: tracksData,
        contract_agreed: true, contract_agreed_at: new Date().toISOString(),
        created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      }).select().single();

      if (releaseError) throw releaseError;
      onSuccess();
    } catch (err: any) {
      console.error('Error creating release:', err);
      setError(err?.message || 'Ошибка при создании релиза');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-up">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 flex items-center justify-center ring-1 ring-white/10">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-300">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </div>
          <div>
            <h2 className="text-3xl font-black bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">Публикация релиза</h2>
            <p className="text-sm text-zinc-500 mt-1">Проверьте данные и опубликуйте релиз</p>
          </div>
        </div>
      </div>

      {error && <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="p-4 bg-white/5 border border-white/10 rounded-xl"><p className="text-zinc-400 text-sm mb-1">Пользователь</p><p className="text-white font-medium">{selectedUser?.nickname || selectedUser?.email}</p></div>
        <div className="p-4 bg-white/5 border border-white/10 rounded-xl"><p className="text-zinc-400 text-sm mb-1">Тип релиза</p><p className="text-white font-medium">{releaseType === 'single' ? 'Сингл' : releaseType === 'ep' ? 'EP' : 'Альбом'}</p></div>
        <div className="p-4 bg-white/5 border border-white/10 rounded-xl"><p className="text-zinc-400 text-sm mb-1">Название</p><p className="text-white font-medium">{releaseTitle || '—'}</p></div>
        <div className="p-4 bg-white/5 border border-white/10 rounded-xl"><p className="text-zinc-400 text-sm mb-1">Артист</p><p className="text-white font-medium">{artistName || '—'}</p></div>
        <div className="p-4 bg-white/5 border border-white/10 rounded-xl"><p className="text-zinc-400 text-sm mb-1">Жанр</p><p className="text-white font-medium">{genre || '—'}</p></div>
        <div className="p-4 bg-white/5 border border-white/10 rounded-xl"><p className="text-zinc-400 text-sm mb-1">Дата релиза</p><p className="text-white font-medium">{releaseDate || '—'}</p></div>
        <div className="p-4 bg-white/5 border border-white/10 rounded-xl"><p className="text-zinc-400 text-sm mb-1">Треки</p><p className="text-white font-medium">{tracks.length}</p></div>
        <div className="p-4 bg-white/5 border border-white/10 rounded-xl"><p className="text-zinc-400 text-sm mb-1">Площадки</p><p className="text-white font-medium">{selectedPlatformsList.length}</p></div>
      </div>

      <div className="p-6 bg-white/5 border border-white/10 rounded-2xl mb-8">
        <h3 className="text-lg font-bold text-white mb-4">Проверка</h3>
        <div className="space-y-2">
          {checks.map((check, i) => (
            <div key={i} className="flex items-center gap-3">
              {check.valid ? (
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </div>
              )}
              <span className={check.valid ? 'text-zinc-300' : 'text-red-400'}>{check.name} {!check.valid && `— ${check.issue}`}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between pt-6 border-t border-white/10">
        <button type="button" onClick={onBack} className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-zinc-400 hover:text-white transition font-medium flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>Назад
        </button>
        <button type="button" onClick={handleSubmit} disabled={!allValid || submitting}
          className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 rounded-xl text-white font-bold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
          {submitting ? (<><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />Публикация...</>) : (<><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>Опубликовать релиз</>)}
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// STEPS SIDEBAR
// ============================================================================
interface StepsSidebarProps {
  currentStep: string;
  setCurrentStep: (step: string) => void;
  selectedUser: User | null;
  releaseType: ReleaseType | null;
  releaseTitle: string;
  genre: string;
  coverFile: File | null;
  releaseDate: string | null;
  tracksCount: number;
  selectedPlatforms: number;
  selectedCountries: number;
  onCancel?: () => void;
}

function StepsSidebar({ currentStep, setCurrentStep, selectedUser, releaseType, releaseTitle, genre, coverFile, releaseDate, tracksCount, selectedPlatforms, selectedCountries, onCancel }: StepsSidebarProps) {
  const getMinTracks = (): number => { if (releaseType === 'ep') return 2; if (releaseType === 'album') return 7; return 1; };

  const isStepComplete = (stepId: string): boolean => {
    switch(stepId) {
      case 'user': return !!selectedUser;
      case 'type': return !!releaseType;
      case 'release': return !!(releaseTitle.trim() && genre && coverFile && releaseDate);
      case 'tracklist': return tracksCount >= getMinTracks();
      case 'countries': return selectedCountries > 0;
      case 'platforms': return selectedPlatforms > 0;
      default: return false;
    }
  };

  const steps = [
    { id: 'user', label: 'Пользователь', icon: '1' },
    { id: 'type', label: 'Тип релиза', icon: '2' },
    { id: 'release', label: 'Информация', icon: '3' },
    { id: 'tracklist', label: 'Треклист', icon: '4' },
    { id: 'countries', label: 'Страны', icon: '5' },
    { id: 'platforms', label: 'Площадки', icon: '6' },
    { id: 'send', label: 'Публикация', icon: '→' },
  ];

  const mainStepIds = ['user', 'type', 'release', 'tracklist', 'countries', 'platforms'];
  const completedSteps = mainStepIds.filter(id => isStepComplete(id)).length;

  const getProgressColor = () => {
    if (completedSteps === 0) return { from: '#ef4444', to: '#dc2626' };
    if (completedSteps === 1) return { from: '#f97316', to: '#ea580c' };
    if (completedSteps === 2) return { from: '#fb923c', to: '#f97316' };
    if (completedSteps === 3) return { from: '#fbbf24', to: '#f59e0b' };
    if (completedSteps === 4) return { from: '#a3e635', to: '#84cc16' };
    if (completedSteps === 5) return { from: '#4ade80', to: '#22c55e' };
    return { from: '#10b981', to: '#059669' };
  };

  const progressColor = getProgressColor();

  return (
    <aside className="w-full lg:w-64 backdrop-blur-xl bg-gradient-to-br from-white/[0.07] to-white/[0.02] border border-white/10 rounded-3xl p-6 flex flex-col lg:self-start lg:sticky lg:top-24 shadow-2xl shadow-black/20">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-lg bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent">Создание релиза</h3>
          {onCancel && (
            <button onClick={onCancel} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 flex items-center justify-center transition-all" title="Отмена">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-400"><path d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          )}
        </div>
        <p className="text-xs text-zinc-400">Админ-панель</p>
      </div>

      {releaseType && (
        <div className="mb-3 p-3 backdrop-blur-lg bg-gradient-to-br from-purple-500/20 via-purple-500/10 to-blue-500/20 border border-white/20 rounded-xl">
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${releaseType === 'single' ? 'bg-purple-500/20' : releaseType === 'ep' ? 'bg-blue-500/20' : 'bg-emerald-500/20'}`}>
              <span className="text-sm">{releaseType === 'single' ? '🎵' : releaseType === 'ep' ? '💿' : '📀'}</span>
            </div>
            <div className="flex-1"><div className="font-bold text-sm text-white">{releaseType === 'single' ? 'Сингл' : releaseType === 'ep' ? 'EP' : 'Альбом'}</div></div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {steps.map((step) => {
          const isComplete = isStepComplete(step.id);
          const isCurrent = currentStep === step.id;
          return (
            <button key={step.id} onClick={() => setCurrentStep(step.id)}
              className={`w-full text-left py-3 px-4 rounded-xl flex items-center gap-3 transition-all ${isCurrent ? 'backdrop-blur-md bg-gradient-to-r from-purple-500/40 to-purple-600/40 text-white shadow-lg shadow-purple-500/30 border border-white/20' : 'backdrop-blur-sm bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white border border-transparent hover:border-white/10'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isComplete ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10'}`}>
                {isComplete && step.id !== 'send' ? (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="20 6 9 17 4 12" strokeWidth="3"/></svg>) : step.icon}
              </span>
              <span className="text-sm font-medium">{step.label}</span>
              {isCurrent && <span className="ml-auto w-2 h-2 rounded-full bg-white animate-pulse" />}
            </button>
          );
        })}
      </div>

      <div className="mt-auto pt-4 border-t border-white/10">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-zinc-400 font-medium">Прогресс</span>
          <div className="flex items-center font-mono text-sm"><span className="font-bold" style={{ color: progressColor.from }}>{completedSteps}</span><span className="text-zinc-500 mx-0.5">/</span><span className="text-zinc-400 font-bold">6</span></div>
        </div>
        <div className="flex gap-1.5">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex-1 h-3 rounded-full bg-white/5 border border-white/10 overflow-hidden">
              <div className={`h-full transition-all duration-500 ${i < completedSteps ? 'opacity-100' : 'opacity-0'}`} style={{ background: `linear-gradient(135deg, ${progressColor.from}, ${progressColor.to})`, transitionDelay: `${i * 60}ms` }} />
            </div>
          ))}
        </div>
        {completedSteps === 6 && (
          <div className="flex items-center justify-center mt-3 gap-2 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30">
            <svg className="w-3.5 h-3.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            <span className="text-[11px] font-semibold text-emerald-400">Готово к публикации</span>
          </div>
        )}
      </div>
    </aside>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function AdminCreateRelease({ supabase, onSuccess, onCancel }: AdminCreateReleaseProps) {
  const [currentStep, setCurrentStep] = useState('user');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [releaseType, setReleaseType] = useState<ReleaseType | null>(null);
  const [success, setSuccess] = useState(false);

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
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());

  // Tracklist state
  const [tracks, setTracks] = useState<Track[]>([]);
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

  // Countries & Platforms
  const [excludedCountries, setExcludedCountries] = useState<string[]>([]);
  const [selectedPlatformsList, setSelectedPlatformsList] = useState<string[]>(() => getAllPlatforms());
  const [selectedPlatforms, setSelectedPlatforms] = useState(() => getAllPlatforms().length);

  useEffect(() => { if (selectedUser && !artistName) setArtistName(selectedUser.nickname || ''); }, [selectedUser]);

  const allCountries = getAllCountries();
  const selectedCountriesCount = allCountries.length - excludedCountries.length;

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6 ring-4 ring-emerald-500/20">
          <svg className="w-12 h-12 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        </div>
        <h3 className="text-3xl font-black text-white mb-2">Релиз опубликован!</h3>
        <p className="text-zinc-400 mb-8">Релиз успешно создан и добавлен пользователю</p>
        <button onClick={() => onSuccess?.()} className="px-8 py-4 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 rounded-xl text-white font-bold transition">Вернуться к релизам</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <StepsSidebar currentStep={currentStep} setCurrentStep={setCurrentStep} selectedUser={selectedUser} releaseType={releaseType} releaseTitle={releaseTitle} genre={genre} coverFile={coverFile} releaseDate={releaseDate} tracksCount={tracks.length} selectedPlatforms={selectedPlatforms} selectedCountries={selectedCountriesCount} onCancel={onCancel} />
      <section className="flex-1 backdrop-blur-xl bg-gradient-to-br from-white/[0.07] to-white/[0.02] border border-white/10 rounded-3xl p-6 lg:p-10 min-h-[500px] shadow-2xl shadow-black/20">
        {currentStep === 'user' && <UserSelectStep supabase={supabase} selectedUser={selectedUser} onSelectUser={setSelectedUser} onNext={() => setCurrentStep('type')} />}
        {currentStep === 'type' && <ReleaseTypeStep releaseType={releaseType} onSelectType={setReleaseType} onNext={() => setCurrentStep('release')} onBack={() => setCurrentStep('user')} />}
        {currentStep === 'release' && <ReleaseInfoStep releaseTitle={releaseTitle} setReleaseTitle={setReleaseTitle} artistName={artistName} setArtistName={setArtistName} collaborators={collaborators} setCollaborators={setCollaborators} collaboratorInput={collaboratorInput} setCollaboratorInput={setCollaboratorInput} genre={genre} setGenre={setGenre} subgenres={subgenres} setSubgenres={setSubgenres} subgenreInput={subgenreInput} setSubgenreInput={setSubgenreInput} releaseDate={releaseDate} setReleaseDate={setReleaseDate} showCalendar={showCalendar} setShowCalendar={setShowCalendar} calendarMonth={calendarMonth} setCalendarMonth={setCalendarMonth} calendarYear={calendarYear} setCalendarYear={setCalendarYear} coverFile={coverFile} setCoverFile={setCoverFile} onNext={() => setCurrentStep('tracklist')} />}
        {currentStep === 'tracklist' && <TracklistStep releaseTitle={releaseTitle} releaseType={releaseType} coverFile={coverFile} tracks={tracks} setTracks={setTracks} currentTrack={currentTrack} setCurrentTrack={setCurrentTrack} trackTitle={trackTitle} setTrackTitle={setTrackTitle} trackLink={trackLink} setTrackLink={setTrackLink} trackAudioFile={trackAudioFile} setTrackAudioFile={setTrackAudioFile} trackAudioMetadata={trackAudioMetadata} setTrackAudioMetadata={setTrackAudioMetadata} trackHasDrugs={trackHasDrugs} setTrackHasDrugs={setTrackHasDrugs} trackLyrics={trackLyrics} setTrackLyrics={setTrackLyrics} trackLanguage={trackLanguage} setTrackLanguage={setTrackLanguage} trackVersion={trackVersion} setTrackVersion={setTrackVersion} trackProducers={trackProducers} setTrackProducers={setTrackProducers} trackFeaturing={trackFeaturing} setTrackFeaturing={setTrackFeaturing} onNext={() => setCurrentStep('countries')} onBack={() => setCurrentStep('release')} />}
        {currentStep === 'countries' && <CountriesStep excludedCountries={excludedCountries} setExcludedCountries={setExcludedCountries} onNext={() => setCurrentStep('platforms')} onBack={() => setCurrentStep('tracklist')} />}
        {currentStep === 'platforms' && <PlatformsStep selectedPlatforms={selectedPlatforms} setSelectedPlatforms={setSelectedPlatforms} selectedPlatformsList={selectedPlatformsList} setSelectedPlatformsList={setSelectedPlatformsList} onNext={() => setCurrentStep('send')} onBack={() => setCurrentStep('countries')} />}
        {currentStep === 'send' && selectedUser && releaseType && <AdminSendStep supabase={supabase} selectedUser={selectedUser} releaseType={releaseType} releaseTitle={releaseTitle} artistName={artistName} genre={genre} coverFile={coverFile} releaseDate={releaseDate} tracks={tracks} selectedPlatformsList={selectedPlatformsList} excludedCountries={excludedCountries} onBack={() => setCurrentStep('platforms')} onSuccess={() => setSuccess(true)} />}
      </section>
    </div>
  );
}
