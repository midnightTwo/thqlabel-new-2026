'use client';
import React from 'react';
import { ROLE_CONFIG, UserRole } from '../../lib/types';
import { useTheme } from '@/contexts/ThemeContext';

interface AvatarUploadModalProps {
  show: boolean;
  onClose: () => void;
  avatar: string;
  avatarPreview: string | null;
  nickname: string;
  role: UserRole;
  uploadingAvatar: boolean;
  onFileSelect: (file: File) => void;
  onSave: () => void;
  onDelete: () => void;
  onClearPreview: () => void;
  showNotification: (message: string, type: 'success' | 'error') => void;
}

export default function AvatarUploadModal({
  show,
  onClose,
  avatar,
  avatarPreview,
  nickname,
  role,
  uploadingAvatar,
  onFileSelect,
  onSave,
  onDelete,
  onClearPreview,
  showNotification,
}: AvatarUploadModalProps) {
  const { themeName } = useTheme();
  const isLight = themeName === 'light';
  
  if (!show) return null;
  
  const config = ROLE_CONFIG[role];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      showNotification('Можно загружать только изображения', 'error');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showNotification('Файл слишком большой. Максимум 2MB', 'error');
      return;
    }
    
    onFileSelect(file);
  };

  return (
    <div className={`fixed inset-0 backdrop-blur-sm z-[100] flex items-start justify-center overflow-y-auto p-4 pt-16 pb-8 ${isLight ? 'bg-black/40' : 'bg-black/70'}`}>
      <div className={`border rounded-2xl p-6 max-w-md w-full animate-in fade-in zoom-in-95 duration-200 ${isLight ? 'bg-white border-[#6050ba]/20' : 'bg-[#1a1a1f] border-white/10'}`}>
        <div className="flex justify-between items-center mb-6">
          <h3 className={`text-xl font-bold ${isLight ? 'text-[#1a1535]' : 'text-white'}`}>Аватар профиля</h3>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition ${isLight ? 'hover:bg-gray-100' : 'hover:bg-white/10'}`}
          >
            <svg className={`w-5 h-5 ${isLight ? 'text-gray-500' : 'text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Предпросмотр */}
        <div className="flex justify-center mb-6">
          <div 
            className={`w-32 h-32 rounded-2xl ${(avatarPreview || avatar) ? 'bg-cover bg-center' : `bg-gradient-to-br ${config.color}`} flex items-center justify-center text-5xl font-black border-2 ${config.borderColor} overflow-hidden`}
            style={{ 
              boxShadow: `0 0 30px ${config.glowColor}`,
              backgroundImage: (avatarPreview || avatar) ? `url(${avatarPreview || avatar})` : 'none'
            }}
          >
            {!(avatarPreview || avatar) && <span className="text-white">{nickname.charAt(0).toUpperCase()}</span>}
          </div>
        </div>
        
        {/* Выбор файла */}
        <div className="space-y-4">
          <label className={`block w-full py-4 border border-dashed rounded-xl cursor-pointer transition text-center ${isLight ? 'bg-gray-50 hover:bg-gray-100 border-gray-300' : 'bg-white/5 hover:bg-white/10 border-white/20'}`}>
            <span className={`text-sm ${isLight ? 'text-[#5c5580]' : 'text-zinc-400'}`}>Выбрать изображение</span>
            <input 
              type="file" 
              accept="image/*" 
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
          
          {avatarPreview && (
            <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-sm text-emerald-600">Изображение выбрано</span>
            </div>
          )}
          
          {/* Кнопки действий */}
          <div className="flex gap-3 pt-2">
            {avatar && !avatarPreview && (
              <button
                onClick={onDelete}
                className="flex-1 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-500 rounded-xl font-bold text-sm transition"
              >
                Удалить
              </button>
            )}
            
            {avatarPreview && (
              <>
                <button
                  onClick={onClearPreview}
                  className={`flex-1 py-3 border rounded-xl font-bold text-sm transition ${isLight ? 'bg-gray-100 hover:bg-gray-200 border-gray-200 text-[#3d3660]' : 'bg-white/5 hover:bg-white/10 border-white/10 text-white'}`}
                >
                  Отмена
                </button>
                <button
                  onClick={onSave}
                  disabled={uploadingAvatar}
                  className={`flex-1 py-3 ${uploadingAvatar ? 'bg-zinc-400 cursor-wait' : 'bg-[#6050ba] hover:bg-[#7060ca]'} rounded-xl font-bold text-sm transition text-white`}
                >
                  {uploadingAvatar ? 'Загрузка...' : 'Сохранить'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
