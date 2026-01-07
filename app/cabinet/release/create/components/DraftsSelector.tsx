'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useTheme } from '@/contexts/ThemeContext';

interface Draft {
  id: string;
  title: string;
  release_type: 'single' | 'ep' | 'album';
  genre: string;
  updated_at: string;
  draft_order: number;
  tracks_count?: number;
  cover_url?: string;
}

interface DraftsSelectorProps {
  onSelectDraft: (draftId: string | null) => void;
  onNewRelease: () => void;
  userId: string;
}

export default function DraftsSelector({ onSelectDraft, onNewRelease, userId }: DraftsSelectorProps) {
  const { themeName } = useTheme();
  const isLight = themeName === 'light';
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDrafts();
  }, [userId]);

  const loadDrafts = async () => {
    if (!supabase) return;

    try {
      const { data, error } = await supabase
        .from('releases_basic')
        .select('id, title, release_type, genre, updated_at, draft_order, cover_url')
        .eq('user_id', userId)
        .eq('status', 'draft')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setDrafts(data || []);
    } catch (error) {
      console.error('Ошибка загрузки черновиков:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteDraft = async (draftId: string) => {
    if (!confirm('Удалить черновик?')) return;
    
    if (!supabase) return;

    try {
      const { error } = await supabase
        .from('releases_basic')
        .delete()
        .eq('id', draftId);

      if (error) throw error;
      loadDrafts();
    } catch (error) {
      console.error('Ошибка удаления:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'только что';
    if (diffMins < 60) return `${diffMins} мин назад`;
    if (diffHours < 24) return `${diffHours} ч назад`;
    if (diffDays < 7) return `${diffDays} дн назад`;
    
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };

  const getReleaseTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      single: 'Сингл',
      ep: 'EP',
      album: 'Альбом'
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isLight ? 'bg-gradient-to-br from-gray-50 via-purple-50/30 to-gray-50' : 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-zinc-900 to-black'}`}>
        <div className={isLight ? 'text-gray-500' : 'text-white'}>Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 relative overflow-hidden">
      {/* Animated Background */}
      <div className={`absolute inset-0 ${isLight ? 'bg-gradient-to-br from-gray-50 via-purple-50/30 to-gray-50' : 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-zinc-900 to-black'}`} />
      
      <div className={`max-w-6xl mx-auto relative z-10 ${isLight ? 'text-gray-900' : 'text-white'}`}>
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className={`text-5xl font-black bg-gradient-to-r ${isLight ? 'from-gray-900 via-purple-800 to-gray-900' : 'from-white via-purple-200 to-white'} bg-clip-text text-transparent mb-4`}>
            Создание релиза
          </h1>
          <p className={`text-lg ${isLight ? 'text-gray-500' : 'text-zinc-400'}`}>
            Продолжите работу над черновиком или создайте новый релиз
          </p>
        </div>

        {/* New Release Button */}
        <button
          onClick={onNewRelease}
          className={`w-full mb-8 p-8 rounded-2xl border-2 transition-all group relative overflow-hidden ${isLight ? 'bg-gradient-to-br from-purple-100/50 to-blue-100/50 border-purple-300 hover:border-purple-400' : 'bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/30 hover:border-purple-500/50'}`}
        >
          <div className={`absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/10 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity`} />
          <div className="relative flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </div>
            <div className="flex-1 text-left">
              <h3 className={`text-2xl font-bold mb-1 ${isLight ? 'text-gray-900' : 'text-white'}`}>Создать новый релиз</h3>
              <p className={isLight ? 'text-gray-500' : 'text-zinc-400'}>Начните работу с нуля</p>
            </div>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" className={isLight ? 'text-purple-600' : 'text-purple-400'} strokeWidth="2">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </div>
        </button>

        {/* Drafts List */}
        {drafts.length > 0 && (
          <div>
            <h2 className={`text-2xl font-bold mb-6 flex items-center gap-3 ${isLight ? 'text-gray-900' : 'text-white'}`}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              Черновики ({drafts.length}/10)
            </h2>
            
            <div className={`grid gap-2 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin ${isLight ? 'scrollbar-thumb-purple-300 scrollbar-track-gray-100' : 'scrollbar-thumb-purple-500/50 scrollbar-track-white/5'}`}>
              {drafts.map((draft) => (
                <div
                  key={draft.id}
                  className={`p-3 rounded-lg border transition-all group ${isLight ? 'bg-white border-gray-200 hover:border-gray-300 shadow-sm' : 'bg-white/5 border-white/10 hover:border-white/20'}`}
                >
                  <div className="flex items-center gap-3">
                    {/* Cover Image */}
                    {draft.cover_url ? (
                      <img 
                        src={draft.cover_url} 
                        alt={draft.title}
                        className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${isLight ? 'bg-gradient-to-br from-purple-100 to-blue-100' : 'bg-gradient-to-br from-purple-500/20 to-blue-500/20'}`}>
                        <span className={`text-xs font-bold ${isLight ? 'text-purple-600' : 'text-purple-300'}`}>
                          {draft.release_type === 'single' ? '🎵' : draft.release_type === 'ep' ? '💿' : '📀'}
                        </span>
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-sm font-bold truncate ${isLight ? 'text-gray-900' : 'text-white'}`}>
                        {draft.title || 'Без названия'}
                      </h3>
                      <div className={`flex items-center gap-2 text-xs ${isLight ? 'text-gray-500' : 'text-zinc-400'}`}>
                        <span className={`px-1.5 py-0.5 rounded font-medium ${isLight ? 'bg-purple-100 text-purple-700' : 'bg-purple-500/20 text-purple-300'}`}>
                          {getReleaseTypeLabel(draft.release_type)}
                        </span>
                        {draft.genre && (
                          <span className="truncate max-w-[100px]">{draft.genre}</span>
                        )}
                        <span>•</span>
                        <span className="whitespace-nowrap">{formatDate(draft.updated_at)}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => onSelectDraft(draft.id)}
                        className="px-3 py-1.5 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-xs font-medium transition flex items-center gap-1.5"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                        Продолжить
                      </button>
                      <button
                        onClick={() => deleteDraft(draft.id)}
                        className={`px-2 py-1.5 rounded-lg transition ${isLight ? 'bg-red-50 hover:bg-red-100 text-red-500' : 'bg-red-500/10 hover:bg-red-500/20 text-red-400'}`}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {drafts.length === 0 && (
          <div className={`text-center py-12 ${isLight ? 'text-gray-400' : 'text-zinc-500'}`}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="mx-auto mb-4 opacity-50" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            <p className="text-lg">У вас пока нет черновиков</p>
          </div>
        )}
      </div>
    </div>
  );
}
