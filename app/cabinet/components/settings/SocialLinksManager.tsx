'use client';
import React, { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '../../lib/supabase';

interface SocialLink {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  placeholder: string;
  prefix?: string;
  validate: (value: string) => boolean;
  formatDisplay: (value: string) => string;
}

const SOCIAL_LINKS: SocialLink[] = [
  {
    id: 'telegram',
    name: 'Telegram',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
      </svg>
    ),
    color: 'from-[#0088cc] to-[#00aadd]',
    placeholder: '@username или ссылка',
    prefix: '@',
    validate: (value: string) => {
      if (!value) return true;
      // Принимаем @username, username, t.me/username, https://t.me/username
      return /^(@?[\w\d_]{5,32}|https?:\/\/(t\.me|telegram\.me)\/[\w\d_]+)$/i.test(value);
    },
    formatDisplay: (value: string) => {
      if (!value) return '';
      // Извлекаем username из разных форматов
      const match = value.match(/@?([\w\d_]+)$/);
      return match ? `@${match[1]}` : value;
    }
  },
];

interface SocialLinksManagerProps {
  userId: string;
  onShowNotification?: (message: string, type: 'success' | 'error') => void;
}

export default function SocialLinksManager({ userId, onShowNotification }: SocialLinksManagerProps) {
  const { themeName } = useTheme();
  const isLight = themeName === 'light';
  
  const [links, setLinks] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Загрузка данных
  useEffect(() => {
    loadSocialLinks();
  }, [userId]);

  const loadSocialLinks = async () => {
    if (!supabase || !userId) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('telegram, vk, instagram, youtube')
        .eq('id', userId)
        .single();

      if (error) throw error;

      setLinks({
        telegram: data?.telegram || '',
      });
    } catch (err) {
      console.error('Error loading social links:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (socialId: string) => {
    setEditing(socialId);
    setEditValue(links[socialId] || '');
    setError('');
  };

  const handleCancel = () => {
    setEditing(null);
    setEditValue('');
    setError('');
  };

  const handleSave = async (social: SocialLink) => {
    // Валидация
    if (editValue && !social.validate(editValue)) {
      setError('Некорректный формат');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const { error: updateError } = await supabase!
        .from('profiles')
        .update({ [social.id]: editValue || null })
        .eq('id', userId);

      if (updateError) throw updateError;

      setLinks(prev => ({ ...prev, [social.id]: editValue }));
      setEditing(null);
      setEditValue('');
      onShowNotification?.(`${social.name} ${editValue ? 'привязан' : 'отвязан'}`, 'success');
    } catch (err: any) {
      console.error('Error saving social link:', err);
      setError(err.message || 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const handleUnlink = async (social: SocialLink) => {
    setSaving(true);
    try {
      const { error: updateError } = await supabase!
        .from('profiles')
        .update({ [social.id]: null })
        .eq('id', userId);

      if (updateError) throw updateError;

      setLinks(prev => ({ ...prev, [social.id]: '' }));
      onShowNotification?.(`${social.name} отвязан`, 'success');
    } catch (err: any) {
      console.error('Error unlinking social:', err);
      onShowNotification?.(err.message || 'Ошибка отвязки', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-[#6050ba] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {SOCIAL_LINKS.map((social) => {
        const isEditing = editing === social.id;
        const isLinked = !!links[social.id];

        return (
          <div
            key={social.id}
            className="group rounded-xl overflow-hidden transition-all duration-300 will-change-transform"
            style={{
              background: isLight 
                ? 'linear-gradient(135deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.4) 100%)'
                : 'linear-gradient(135deg, rgba(34,211,238,0.08) 0%, rgba(20,18,35,0.4) 100%)',
              backdropFilter: 'blur(20px) saturate(150%)',
              WebkitBackdropFilter: 'blur(20px) saturate(150%)',
              border: `1px solid ${isLight ? 'rgba(255,255,255,0.8)' : 'rgba(34,211,238,0.15)'}`,
              boxShadow: isLight 
                ? '0 4px 16px rgba(139,92,246,0.06)'
                : '0 4px 16px rgba(0,0,0,0.2), 0 0 20px rgba(34,211,238,0.05)',
            }}
          >
            {isEditing ? (
              // Режим редактирования
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${social.color} flex items-center justify-center text-white`}>
                    {social.icon}
                  </div>
                  <div className="flex-1">
                    <div className={`text-sm font-bold ${isLight ? 'text-gray-800' : 'text-white'}`}>
                      {social.name}
                    </div>
                    <div className={`text-[10px] ${isLight ? 'text-gray-500' : 'text-zinc-500'}`}>
                      Введите ваш {social.name}
                    </div>
                  </div>
                </div>

                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !saving) {
                      e.preventDefault();
                      handleSave(social);
                    }
                  }}
                  placeholder={social.placeholder}
                  className={`w-full px-4 py-3 rounded-xl text-sm transition-all outline-none ${error ? 'border-red-500!' : ''}`}
                  style={{
                    background: isLight ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${isLight ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.08)'}`,
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    color: isLight ? '#1a1535' : '#e4e4e7',
                  }}
                  autoFocus
                />

                {error && (
                  <div className="text-xs text-red-400 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {error}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={handleCancel}
                    disabled={saving}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all will-change-transform active:scale-[0.98]"
                    style={{
                      background: isLight ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.06)',
                      border: `1px solid ${isLight ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.1)'}`,
                      color: isLight ? '#3d3660' : 'white',
                    }}
                  >
                    Отмена
                  </button>
                  <button
                    onClick={() => handleSave(social)}
                    disabled={saving}
                    className="flex-1 py-2.5 rounded-xl text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 will-change-transform active:scale-[0.98]"
                    style={{
                      background: 'linear-gradient(135deg, #8070da 0%, #9d8df1 100%)',
                      boxShadow: '0 4px 20px rgba(157,141,241,0.3)',
                    }}
                  >
                    {saving ? (
                      <>
                        <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                        </svg>
                        Сохранение...
                      </>
                    ) : 'Сохранить'}
                  </button>
                </div>
              </div>
            ) : (
              // Обычный режим
              <div className="p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  isLinked 
                    ? `bg-gradient-to-br ${social.color} text-white` 
                    : isLight 
                      ? 'bg-gray-100 text-gray-400' 
                      : 'bg-white/5 text-zinc-500'
                }`}>
                  {social.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-bold ${isLight ? 'text-gray-800' : 'text-white'}`}>
                    {social.name}
                  </div>
                  {isLinked ? (
                    <div className={`text-xs truncate ${isLight ? 'text-gray-500' : 'text-zinc-400'}`}>
                      {social.formatDisplay(links[social.id])}
                    </div>
                  ) : (
                    <div className={`text-[10px] ${isLight ? 'text-gray-400' : 'text-zinc-600'}`}>
                      Не привязан
                    </div>
                  )}
                </div>

                {isLinked ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(social.id)}
                      className={`p-2 rounded-lg transition-all ${
                        isLight 
                          ? 'hover:bg-gray-100 text-gray-400 hover:text-gray-600' 
                          : 'hover:bg-white/10 text-zinc-500 hover:text-white'
                      }`}
                      title="Изменить"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleUnlink(social)}
                      disabled={saving}
                      className={`p-2 rounded-lg transition-all ${
                        isLight 
                          ? 'hover:bg-red-50 text-gray-400 hover:text-red-500' 
                          : 'hover:bg-red-500/10 text-zinc-500 hover:text-red-400'
                      }`}
                      title="Отвязать"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleEdit(social.id)}
                    className="px-4 py-2 rounded-xl text-xs font-bold transition-all will-change-transform active:scale-[0.98]"
                    style={{
                      background: isLight 
                        ? 'linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.5) 100%)'
                        : 'linear-gradient(135deg, rgba(34,211,238,0.15) 0%, rgba(34,211,238,0.08) 100%)',
                      border: `1px solid ${isLight ? 'rgba(255,255,255,0.9)' : 'rgba(34,211,238,0.25)'}`,
                      color: isLight ? '#0891b2' : '#22d3ee',
                      boxShadow: isLight ? '0 2px 8px rgba(34,211,238,0.1)' : '0 0 15px rgba(34,211,238,0.15)',
                    }}
                  >
                    Привязать
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Инфо блок - Liquid Glass стиль */}
      <div 
        className="p-4 rounded-xl"
        style={{
          background: isLight 
            ? 'linear-gradient(135deg, rgba(96,80,186,0.08) 0%, rgba(139,92,246,0.05) 100%)'
            : 'linear-gradient(135deg, rgba(96,80,186,0.15) 0%, rgba(157,141,241,0.08) 100%)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: `1px solid ${isLight ? 'rgba(96,80,186,0.15)' : 'rgba(157,141,241,0.2)'}`,
          boxShadow: '0 0 20px rgba(157,141,241,0.08)',
        }}
      >
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#6050ba]/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-[#9d8df1]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <div className={`text-xs font-bold mb-1 ${isLight ? 'text-[#6050ba]' : 'text-[#9d8df1]'}`}>
              Зачем привязывать Telegram?
            </div>
            <p className={`text-[10px] leading-relaxed ${isLight ? 'text-gray-600' : 'text-zinc-400'}`}>
              Привязка Telegram помогает нам связаться с вами и подтвердить вашу личность.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
