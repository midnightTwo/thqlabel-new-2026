'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import ThemeSelector from './ThemeSelector';
import AccountManager from './AccountManager';
import SocialLinksManager from './SocialLinksManager';
import { UserRole, ROLE_CONFIG } from '../../lib/types';
import { supabase } from '../../lib/supabase';
import { useTheme } from '@/contexts/ThemeContext';

interface SettingsTabProps {
  user: any;
  nickname: string;
  memberId: string;
  role: UserRole;
  originalRole?: string | null;
  avatar: string;
  onSignOut: () => void;
  onShowAvatarModal: () => void;
  showToast: () => void;
  onShowNotification?: (message: string, type: 'success' | 'error') => void;
}

export default function SettingsTab({
  user,
  nickname,
  memberId,
  role,
  originalRole,
  avatar,
  onSignOut,
  onShowAvatarModal,
  showToast,
  onShowNotification,
}: SettingsTabProps) {
  const config = ROLE_CONFIG[role];
  const { themeName } = useTheme();
  const isLight = themeName === 'light';
  
  // Fallback для onShowNotification
  const handleShowNotification = onShowNotification || ((message: string, type: 'success' | 'error') => {
    if (type === 'success') showToast();
  });
  
  // Смена пароля
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  
  // Смена email
  const [showEmailChange, setShowEmailChange] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [emailSuccess, setEmailSuccess] = useState('');

  const handleChangePassword = async () => {
    setPasswordError('');
    setPasswordSuccess('');

    if (!supabase || !user?.email) {
      setPasswordError('Ошибка инициализации');
      return;
    }

    setPasswordLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setPasswordSuccess('Письмо со ссылкой для смены пароля отправлено на вашу почту!');
      setTimeout(() => {
        setShowPasswordChange(false);
        setPasswordSuccess('');
      }, 3000);
    } catch (err: any) {
      console.error('Ошибка отправки письма:', err);
      setPasswordError(err.message || 'Не удалось отправить письмо');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleChangeEmail = async () => {
    setEmailError('');
    setEmailSuccess('');

    if (!newEmail || !newEmail.includes('@')) {
      setEmailError('Введите корректный email');
      return;
    }

    if (newEmail === user?.email) {
      setEmailError('Это ваш текущий email');
      return;
    }

    if (!supabase) {
      setEmailError('Ошибка инициализации');
      return;
    }

    setEmailLoading(true);
    try {
      const { error } = await supabase.auth.updateUser(
        { email: newEmail },
        { emailRedirectTo: `${window.location.origin}/change-email` }
      );

      if (error) throw error;

      setEmailSuccess('Письмо с подтверждением отправлено на новый email! Проверьте почту.');
      setNewEmail('');
      setTimeout(() => {
        setShowEmailChange(false);
        setEmailSuccess('');
      }, 5000);
    } catch (err: any) {
      console.error('Ошибка смены email:', err);
      setEmailError(err.message || 'Не удалось отправить письмо');
    } finally {
      setEmailLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
    } else {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    showToast();
  };

  return (
    <>
      <div className="animate-fade-up">
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <h2 className={`text-2xl sm:text-3xl font-black uppercase tracking-tight mb-1 sm:mb-2 bg-gradient-to-r bg-clip-text text-transparent ${isLight ? 'from-[#1a1535] to-[#5c5580]' : 'from-white to-zinc-400'}`}>
            Настройки
          </h2>
          <p className={`text-xs sm:text-sm ${isLight ? 'text-[#5c5580]' : 'text-zinc-500'}`}>Управление профилем и настройками</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Левая колонка - основные настройки */}
          <div className="space-y-4 sm:space-y-6">
        {/* Аватарка */}
        <div className="group">
          <label className={`text-[10px] uppercase tracking-[0.2em] mb-2 sm:mb-3 block font-bold ${isLight ? 'text-[#5c5580]' : 'text-zinc-400'}`}>
            Аватар профиля
          </label>
          <div className="flex items-center gap-3 sm:gap-4">
            <button 
              onClick={onShowAvatarModal}
              className={`relative w-20 h-20 sm:w-28 sm:h-28 rounded-xl sm:rounded-2xl ${avatar ? 'bg-cover bg-center' : `bg-gradient-to-br ${config.color}`} flex items-center justify-center text-3xl sm:text-4xl font-black border-2 ${config.borderColor} overflow-hidden cursor-pointer hover:scale-105 transition-all duration-300 group/avatar`}
              style={{ 
                boxShadow: `0 0 30px ${config.glowColor}, 0 8px 16px rgba(0,0,0,0.4)`,
                backgroundImage: avatar ? `url(${avatar})` : 'none'
              }}
            >
              {!avatar && nickname.charAt(0).toUpperCase()}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-end pb-2 sm:pb-3">
                <svg className="w-4 h-4 sm:w-6 sm:h-6 text-white mb-0.5 sm:mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-white text-[10px] sm:text-xs font-bold">Изменить</span>
              </div>
              {/* Анимированная рамка */}
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-300" 
                   style={{ 
                     background: `linear-gradient(45deg, ${config.glowColor} 0%, transparent 50%, ${config.glowColor} 100%)`,
                     filter: 'blur(8px)',
                     transform: 'scale(1.1)'
                   }}></div>
            </button>
            <div className="flex-1">
              <p className={`text-xs sm:text-sm mb-1 sm:mb-2 font-medium ${isLight ? 'text-[#3d3660]' : 'text-zinc-300'}`}>Нажмите на аватар для изменения</p>
              <p className={`text-[9px] sm:text-[10px] ${isLight ? 'text-[#7a7596]' : 'text-zinc-600'}`}>PNG, JPG до 2MB<br className="sm:hidden" /><span className="hidden sm:inline"> • </span>400x400px</p>
            </div>
          </div>
        </div>

        {/* Никнейм */}
        <div>
          <label className={`text-[10px] uppercase tracking-[0.2em] mb-2 block font-bold ${isLight ? 'text-[#5c5580]' : 'text-zinc-400'}`}>
            Никнейм артиста
          </label>
          <input 
            value={nickname}
            disabled
            className={`w-full px-3 sm:px-4 py-2.5 sm:py-3.5 rounded-lg sm:rounded-xl text-xs sm:text-sm cursor-not-allowed font-medium transition-all ${
              isLight 
                ? 'bg-white/60 border border-white/80 text-[#5c5580] hover:bg-white/70' 
                : 'bg-white/[0.03] border border-white/10 text-zinc-400 hover:bg-white/[0.05]'
            }`}
          />
          <p className="text-[10px] text-zinc-600 mt-2 flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            Никнейм нельзя изменить
          </p>
        </div>
        
        {/* ID участника */}
        <div>
          <label className={`text-[10px] uppercase tracking-[0.2em] mb-2 block font-bold ${isLight ? 'text-[#5c5580]' : 'text-zinc-400'}`}>
            ID участника (тег)
          </label>
          <div className="flex items-center gap-2">
            <input 
              value={memberId}
              disabled
              className={`flex-1 px-3 sm:px-4 py-2.5 sm:py-3.5 border rounded-lg sm:rounded-xl text-xs sm:text-sm font-mono cursor-not-allowed transition-all ${isLight ? 'bg-white/60 border-white/80 text-[#5c5580] hover:bg-white/70' : 'bg-white/[0.03] border-white/10 text-zinc-300 hover:bg-white/[0.05]'}`}
            />
            <button 
              onClick={() => copyToClipboard(memberId)}
              className={`group/copy px-3 sm:px-4 py-2.5 sm:py-3.5 border rounded-lg sm:rounded-xl transition-all duration-300 ${isLight ? 'bg-white/60 border-white/80 hover:bg-gradient-to-br hover:from-purple-100 hover:to-blue-100 hover:border-purple-300' : 'bg-white/[0.03] border-white/10 hover:bg-gradient-to-br hover:from-purple-600/20 hover:to-blue-600/20 hover:border-purple-500/50'}`}
              title="Copy ID"
            >
              <svg className={`w-4 h-4 sm:w-5 sm:h-5 transition-colors ${isLight ? 'text-[#5c5580] group-hover/copy:text-purple-600' : 'text-zinc-400 group-hover/copy:text-purple-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Привязка Telegram */}
        <div>
          <label className={`text-[10px] uppercase tracking-[0.2em] mb-3 block font-bold flex items-center gap-2 ${isLight ? 'text-[#5c5580]' : 'text-zinc-400'}`}>
            <svg className="w-4 h-4 text-[#0088cc]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
            </svg>
            Привязка Telegram
          </label>
          <SocialLinksManager 
            userId={user?.id} 
            onShowNotification={handleShowNotification}
          />
        </div>

        {/* Email */}
        <div>
          <label className={`text-[10px] uppercase tracking-widest mb-2 block ${isLight ? 'text-[#5c5580]' : 'text-zinc-500'}`}>Email</label>
          <div className="flex items-center gap-2 mb-2">
            <input 
              value={user?.email || ''}
              disabled
              className={`flex-1 px-3 sm:px-4 py-2.5 sm:py-3 border rounded-lg sm:rounded-xl text-xs sm:text-sm ${isLight ? 'bg-white/60 border-white/80 text-[#5c5580]' : 'bg-white/5 border-white/10 text-zinc-500'}`}
            />
            <button 
              onClick={() => copyToClipboard(user?.email || '')}
              className={`px-3 sm:px-4 py-2.5 sm:py-3 border rounded-lg sm:rounded-xl transition group ${isLight ? 'bg-white/60 border-white/80 hover:bg-purple-100 hover:border-purple-300' : 'bg-white/5 border-white/10 hover:bg-purple-600/20 hover:border-purple-500/50'}`}
              title="Скопировать email"
            >
              <svg className={`w-4 h-4 sm:w-5 sm:h-5 transition ${isLight ? 'text-[#5c5580] group-hover:text-purple-600' : 'text-zinc-400 group-hover:text-purple-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>

          {!showEmailChange ? (
            <button
              onClick={() => setShowEmailChange(true)}
              className="text-xs text-[#a090ea] hover:text-[#c4b5fd] transition flex items-center gap-1 font-semibold"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Изменить email
            </button>
          ) : (
            <div className={`space-y-2 sm:space-y-3 p-2.5 sm:p-3 border rounded-lg animate-[fadeIn_0.3s_ease-in-out] ${isLight ? 'bg-white/60 border-white/80' : 'bg-white/[0.03] border-white/10'}`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs sm:text-sm font-bold ${isLight ? 'text-[#1a1535]' : 'text-white'}`}>Смена email</span>
                <button
                  onClick={() => {
                    setShowEmailChange(false);
                    setNewEmail('');
                    setEmailError('');
                    setEmailSuccess('');
                  }}
                  className={`transition ${isLight ? 'text-gray-400 hover:text-gray-700' : 'text-zinc-500 hover:text-white'}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {emailError && (
                <div className="p-2 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-xs">
                  {emailError}
                </div>
              )}

              {emailSuccess && (
                <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded text-emerald-400 text-xs">
                  {emailSuccess}
                </div>
              )}

              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Новый email"
                className={`w-full px-3 py-2 border rounded text-xs sm:text-sm outline-none transition ${isLight ? 'bg-white border-gray-200 text-[#1a1535] focus:border-[#6050ba] focus:bg-white placeholder-gray-400' : 'bg-white/5 border-white/10 text-white focus:border-[#6050ba] focus:bg-white/10 placeholder-zinc-600'}`}
              />

              <button
                onClick={handleChangeEmail}
                disabled={emailLoading || !newEmail}
                className={`w-full py-2 sm:py-2.5 rounded text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-all ${
                  emailLoading || !newEmail
                    ? 'bg-[#8070da]/30 cursor-not-allowed text-zinc-400'
                    : 'bg-gradient-to-r from-[#8070da] to-[#a090ea] hover:shadow-lg hover:shadow-[#8070da]/40 text-white'
                }`}
              >
                {emailLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Отправка...
                  </span>
                ) : 'Отправить подтверждение'}
              </button>

              <p className={`text-[9px] ${isLight ? 'text-gray-500' : 'text-zinc-500'}`}>
                На новый email будет отправлено письмо с подтверждением
              </p>
            </div>
          )}
        </div>

        {/* Секция смены пароля */}
        <div>
          <label className={`text-[10px] uppercase tracking-widest mb-3 block ${isLight ? 'text-[#5c5580]' : 'text-zinc-500'}`}>Безопасность</label>
          
          {!showPasswordChange ? (
            <button
              onClick={() => setShowPasswordChange(true)}
              className={`w-full py-3 px-4 border text-sm font-medium rounded-xl transition-all flex items-center justify-center gap-2 ${isLight ? 'bg-white/60 border-white/80 text-[#5c5580] hover:bg-white/80 hover:border-purple-200' : 'bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10 hover:border-white/20'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Изменить пароль
            </button>
          ) : (
            <div className={`space-y-3 sm:space-y-4 p-3 sm:p-4 border rounded-lg sm:rounded-xl animate-[fadeIn_0.3s_ease-in-out] ${isLight ? 'bg-white/60 border-white/80' : 'bg-white/[0.03] border-white/10'}`}>
              <div className="flex items-center justify-between mb-1 sm:mb-2">
                <h3 className={`text-xs sm:text-sm font-bold ${isLight ? 'text-[#1a1535]' : 'text-white'}`}>Смена пароля</h3>
                <button
                  onClick={() => {
                    setShowPasswordChange(false);
                    setPasswordError('');
                    setPasswordSuccess('');
                  }}
                  className={`transition ${isLight ? 'text-gray-400 hover:text-gray-700' : 'text-zinc-500 hover:text-white'}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {passwordError && (
                <div className="p-2 sm:p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-[10px] sm:text-xs">
                  {passwordError}
                </div>
              )}

              {passwordSuccess && (
                <div className="p-2 sm:p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-[10px] sm:text-xs">
                  {passwordSuccess}
                </div>
              )}

              <p className={`text-[10px] sm:text-xs leading-relaxed ${isLight ? 'text-[#5c5580]' : 'text-zinc-400'}`}>
                На вашу почту <span className={`font-medium ${isLight ? 'text-[#1a1535]' : 'text-white'}`}>{user?.email}</span> будет отправлено письмо со ссылкой для смены пароля.
              </p>

              <button
                onClick={handleChangePassword}
                disabled={passwordLoading}
                className={`w-full py-2.5 sm:py-3 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-all ${
                  passwordLoading
                    ? 'bg-[#8070da]/30 cursor-not-allowed text-zinc-400'
                    : 'bg-gradient-to-r from-[#8070da] to-[#a090ea] hover:shadow-lg hover:shadow-[#8070da]/40 text-white'
                }`}
              >
                {passwordLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Отправка...
                  </span>
                ) : 'Отправить письмо для смены пароля'}
              </button>
            </div>
          )}
        </div>
        
        {/* Статус */}
        <div>
          <label className={`text-[10px] uppercase tracking-[0.2em] mb-3 block font-bold ${isLight ? 'text-[#5c5580]' : 'text-zinc-400'}`}>
            Статус аккаунта
          </label>
          <div 
            className={`group inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-5 py-2.5 sm:py-3.5 rounded-lg sm:rounded-xl border-2 ${config.borderColor} transition-all duration-300 hover:scale-105 ${isLight && role === 'basic' ? 'bg-gradient-to-br from-gray-200 via-gray-300 to-gray-400' : `bg-gradient-to-br ${config.color}`}`}
            style={{ boxShadow: `0 0 25px ${config.glowColor}, 0 4px 12px rgba(0,0,0,0.3)` }}
          >
            <span className={`text-xl sm:text-2xl ${isLight && role === 'basic' ? 'opacity-80' : ''}`}>{config.icon}</span>
            <div>
              <div className={`text-xs sm:text-sm font-bold uppercase tracking-wider ${isLight && role === 'basic' ? 'text-gray-700' : 'text-white'}`}>{config.shortLabel}</div>
              <div className={`text-[9px] sm:text-[10px] ${isLight && role === 'basic' ? 'text-gray-600' : 'text-white/70'}`}>{config.label}</div>
            </div>
          </div>
          {role === 'basic' && (
            <div className={`mt-3 p-3 bg-gradient-to-r from-[#f59e0b]/10 to-[#fbbf24]/10 border border-[#fbbf24]/30 rounded-xl`}>
              <p className={`text-xs leading-relaxed ${isLight ? 'text-[#5c5580]' : 'text-zinc-300'}`}>
                ✨ Want to become <span className="text-[#fbbf24] font-bold">Exclusive</span>?{' '}
                <Link href="/contacts" className="text-[#6050ba] hover:text-[#7060ca] font-bold underline decoration-2 underline-offset-2">
                  Contact us
                </Link>
              </p>
            </div>
          )}
        </div>

        {/* Настройка темы */}
        <div>
          <label className={`text-[10px] uppercase tracking-[0.2em] mb-3 block font-bold ${isLight ? 'text-[#5c5580]' : 'text-zinc-400'}`}>
            Тема интерфейса
          </label>
          <ThemeSelector />
        </div>

        {/* Кнопка выхода */}
        <button 
          onClick={onSignOut}
          className={`group w-full py-2.5 sm:py-3.5 px-3 sm:px-4 border text-xs sm:text-sm font-bold uppercase tracking-wider rounded-lg sm:rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${isLight ? 'bg-gradient-to-r from-gray-100 to-gray-200 border-gray-300 text-gray-600 hover:from-gray-200 hover:to-gray-300 hover:border-gray-400 hover:text-gray-800' : 'bg-gradient-to-r from-zinc-700/30 to-zinc-800/30 border-zinc-600/30 text-zinc-300 hover:from-zinc-600/40 hover:to-zinc-700/40 hover:border-zinc-500/50 hover:text-white hover:shadow-lg hover:shadow-zinc-900/30'}`}
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Выйти
        </button>
        </div>
        
        {/* Правая колонка - управление для Admin/Owner */}
        {(role === 'admin' || role === 'owner' || originalRole === 'admin' || originalRole === 'owner') && (
          <div className="space-y-4 sm:space-y-6">
            {/* Account Management */}
            <div className="group/card">
              <label className="text-[10px] text-zinc-400 uppercase tracking-[0.2em] mb-3 block font-bold flex items-center gap-2">
                <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Управление учетной записью
              </label>
              <div className="p-4 sm:p-6 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 border border-cyan-500/20 rounded-xl sm:rounded-2xl hover:border-cyan-500/40 transition-all duration-300 group-hover/card:shadow-lg group-hover/card:shadow-cyan-500/10">
                <AccountManager 
                  userId={user?.id} 
                  currentEmail={user?.email || ''} 
                />
              </div>
            </div>

            {/* Developer Info */}
            {originalRole === 'owner' && (
              <div className="p-3 sm:p-4 bg-gradient-to-br from-purple-500/5 to-pink-500/5 border border-purple-500/20 rounded-xl sm:rounded-2xl">
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="flex-shrink-0">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xs font-bold text-purple-300 mb-1">Доступ Owner</h4>
                    <p className="text-[9px] sm:text-[10px] text-zinc-400 leading-relaxed">
                      Как owner, у вас есть полный доступ ко всем ролям и функциям. Панель тестирования появляется в правом нижнем углу для быстрого переключения.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
    </>
  );
}
