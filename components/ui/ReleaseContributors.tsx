'use client';

import React, { useState, useRef } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

// Типы для контрибьюторов (авторов)
export interface Contributor {
  role: 'composer' | 'lyricist' | 'producer' | 'arranger' | 'performer' | 'mixer' | 'mastering' | 'other';
  fullName: string;
}

export const CONTRIBUTOR_ROLES = [
  { value: 'composer', label: 'Composer', labelRu: 'Композитор' },
  { value: 'lyricist', label: 'Lyricist', labelRu: 'Автор текста' },
  { value: 'producer', label: 'Producer', labelRu: 'Продюсер' },
  { value: 'arranger', label: 'Arranger', labelRu: 'Аранжир.' },
  { value: 'performer', label: 'Performer', labelRu: 'Исполнитель' },
  { value: 'mixer', label: 'Mixer', labelRu: 'Сведение' },
  { value: 'mastering', label: 'Mastering', labelRu: 'Мастеринг' },
  { value: 'other', label: 'Other', labelRu: 'Другое' },
] as const;

interface ReleaseContributorsProps {
  contributors: Contributor[];
  setContributors: (contributors: Contributor[]) => void;
  maxContributors?: number;
}

export default function ReleaseContributors({ 
  contributors, 
  setContributors, 
  maxContributors = 20 
}: ReleaseContributorsProps) {
  const { themeName } = useTheme();
  const isLight = themeName === 'light';
  
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<Contributor['role']>('composer');
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addContributor = () => {
    if (newName.trim() && contributors.length < maxContributors) {
      setContributors([...contributors, { role: newRole, fullName: newName.trim() }]);
      setNewName('');
      inputRef.current?.focus();
    }
  };

  const removeContributor = (index: number) => {
    setContributors(contributors.filter((_, i) => i !== index));
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newContributors = [...contributors];
    const [dragged] = newContributors.splice(draggedIndex, 1);
    newContributors.splice(targetIndex, 0, dragged);
    setContributors(newContributors);
    
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const getRoleInfo = (role: string) => {
    return CONTRIBUTOR_ROLES.find(r => r.value === role) || { label: role, labelRu: role };
  };

  // Показываем drag & drop только если больше 1 автора
  const showDragDrop = contributors.length > 1;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className={`text-sm flex items-center gap-2 ${isLight ? 'text-gray-600' : 'text-zinc-400'}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={isLight ? 'text-rose-500' : 'text-rose-400/70'}>
            <path d="M12 19l7-7 3 3-7 7-3-3z"/>
            <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
            <path d="M2 2l7.586 7.586"/>
            <circle cx="11" cy="11" r="2"/>
          </svg>
          Авторы
          {contributors.length > 0 && <span className={`text-xs ${isLight ? 'text-gray-500' : 'text-zinc-600'}`}>({contributors.length})</span>}
        </label>
      </div>

      {/* Пояснение */}
      <div className={`mb-3 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg ${isLight ? 'bg-rose-50 border border-rose-200' : 'bg-rose-500/5 border border-rose-500/10'}`}>
        <p className={`text-[11px] sm:text-xs flex items-start gap-1.5 sm:gap-2 ${isLight ? 'text-gray-600' : 'text-zinc-400'}`}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`flex-shrink-0 mt-0.5 w-3 h-3 sm:w-3.5 sm:h-3.5 ${isLight ? 'text-rose-400' : 'text-rose-400/50'}`}>
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="16" x2="12" y2="12"/>
            <line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
          <span>
            Укажите <strong>ФИО</strong> авторов для роялти и правообладания. Выберите роль и добавьте.
            {showDragDrop && <><br/><span className={isLight ? 'text-gray-500' : 'text-zinc-500'}>Перетаскивайте для изменения порядка.</span></>}
          </span>
        </p>
      </div>

      {/* Список авторов */}
      {contributors.length > 0 && (
        <div className="space-y-1.5 sm:space-y-2 mb-3">
          {contributors.map((contributor, idx) => {
            const roleInfo = getRoleInfo(contributor.role);
            return (
              <div
                key={idx}
                draggable={showDragDrop}
                onDragStart={showDragDrop ? (e) => handleDragStart(e, idx) : undefined}
                onDragOver={showDragDrop ? (e) => handleDragOver(e, idx) : undefined}
                onDragLeave={showDragDrop ? handleDragLeave : undefined}
                onDrop={showDragDrop ? (e) => handleDrop(e, idx) : undefined}
                onDragEnd={showDragDrop ? handleDragEnd : undefined}
                className={`
                  flex items-center gap-2 sm:gap-3 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-xl border transition-all
                  ${showDragDrop ? 'cursor-grab active:cursor-grabbing' : ''}
                  ${draggedIndex === idx ? 'opacity-50 border-dashed border-rose-400/50 bg-rose-500/10' : ''}
                  ${dragOverIndex === idx && draggedIndex !== idx ? 'border-rose-400/60 bg-rose-500/15 scale-[1.02]' : ''}
                  ${isLight 
                    ? 'bg-gradient-to-r from-rose-50 to-orange-50 border-rose-200 hover:border-rose-300' 
                    : 'bg-gradient-to-r from-rose-500/[0.08] to-orange-500/[0.04] border-rose-500/15 hover:border-rose-400/30'}
                `}
              >
                {/* Иконка перетаскивания - только если больше 1 */}
                {showDragDrop && (
                  <div className={`transition touch-manipulation min-w-[20px] sm:min-w-[16px] flex justify-center ${isLight ? 'text-rose-400 hover:text-rose-500' : 'text-rose-400/40 hover:text-rose-300/60'}`}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 sm:w-4 sm:h-4">
                      <circle cx="9" cy="5" r="1" fill="currentColor"/>
                      <circle cx="9" cy="12" r="1" fill="currentColor"/>
                      <circle cx="9" cy="19" r="1" fill="currentColor"/>
                      <circle cx="15" cy="5" r="1" fill="currentColor"/>
                      <circle cx="15" cy="12" r="1" fill="currentColor"/>
                      <circle cx="15" cy="19" r="1" fill="currentColor"/>
                    </svg>
                  </div>
                )}

                {/* Роль */}
                <div className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg text-[10px] sm:text-xs font-medium flex-shrink-0 ${isLight ? 'bg-rose-100 text-rose-600' : 'bg-rose-500/15 text-rose-300/80'}`}>
                  {roleInfo.label}
                </div>

                {/* ФИО */}
                <span className={`flex-1 text-sm sm:text-base truncate ${isLight ? 'text-gray-800' : 'text-white'}`}>
                  {contributor.fullName}
                </span>

                {/* Кнопка удаления */}
                <button
                  type="button"
                  onClick={() => removeContributor(idx)}
                  className={`p-1.5 sm:p-1.5 transition rounded-lg touch-manipulation min-w-[32px] sm:min-w-[28px] min-h-[32px] sm:min-h-[28px] flex items-center justify-center ${
                    isLight ? 'text-gray-400 hover:text-red-500 hover:bg-red-50' : 'text-zinc-500 hover:text-red-400 hover:bg-red-500/10'
                  }`}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 sm:w-3.5 sm:h-3.5">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Поле добавления */}
      <div className="flex flex-col sm:flex-row gap-1.5 sm:gap-2">
        {/* Выбор роли */}
        <div className="relative flex-shrink-0">
          <button
            type="button"
            onClick={() => setShowRoleDropdown(!showRoleDropdown)}
            className={`w-full sm:w-auto px-2.5 sm:px-3 py-2.5 sm:py-3 rounded-xl text-sm flex items-center gap-2 transition min-w-[120px] sm:min-w-[140px] border ${
              isLight 
                ? 'bg-white border-gray-300 hover:border-rose-400 text-gray-700' 
                : 'bg-gradient-to-br from-white/[0.07] to-white/[0.03] border-white/10 hover:border-rose-400/30 text-zinc-200'
            }`}
          >
            <span className="flex-1 text-left text-xs sm:text-sm">{getRoleInfo(newRole).label}</span>
            <svg 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              className={`transition-transform w-4 h-4 ${showRoleDropdown ? 'rotate-180' : ''} ${isLight ? 'text-rose-500' : 'text-rose-400/70'}`}
            >
              <polyline points="6 9 12 15 18 9" strokeWidth="2"/>
            </svg>
          </button>
          {showRoleDropdown && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowRoleDropdown(false)} />
              <div className={`absolute top-full left-0 right-0 sm:right-auto mt-1 rounded-xl shadow-xl z-20 overflow-hidden min-w-[180px] sm:min-w-[220px] max-h-[50vh] overflow-y-auto ${
                isLight ? 'bg-white border border-gray-200' : 'bg-[#0d0d0f] border border-rose-500/20'
              }`}>
                {CONTRIBUTOR_ROLES.map((role) => (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() => {
                      setNewRole(role.value as Contributor['role']);
                      setShowRoleDropdown(false);
                    }}
                    className={`w-full px-3 py-2.5 sm:py-2.5 text-left text-sm transition flex items-center justify-between gap-4 touch-manipulation ${
                      isLight ? 'hover:bg-gray-100 text-gray-800' : 'hover:bg-white/10 text-white'
                    }`}
                  >
                    <span>{role.label}</span>
                    <span className={`text-xs ${isLight ? 'text-gray-500' : 'text-zinc-500'}`}>{role.labelRu}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Поле ввода ФИО и кнопка */}
        <div className="flex gap-1.5 sm:gap-2 flex-1">
          <input
            ref={inputRef}
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addContributor();
              }
            }}
            onBlur={() => {
              if (newName.trim()) addContributor();
            }}
            placeholder="Фамилия Имя Отчество"
            disabled={contributors.length >= maxContributors}
            className={`flex-1 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border outline-none transition-all disabled:opacity-50 text-sm sm:text-base ${
              isLight 
                ? 'bg-white border-gray-300 placeholder:text-gray-400 hover:border-rose-300 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 text-gray-800' 
                : 'bg-gradient-to-br from-white/[0.07] to-white/[0.03] placeholder:text-zinc-600 border-white/10 hover:border-rose-400/30 focus:border-rose-400/50 focus:shadow-lg focus:shadow-rose-500/5'
            }`}
          />

          {/* Кнопка добавления */}
          <button
            type="button"
            onClick={addContributor}
            disabled={!newName.trim() || contributors.length >= maxContributors}
            className={`px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-sm font-medium transition disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center min-w-[44px] sm:min-w-[48px] border touch-manipulation ${
              isLight 
                ? 'bg-rose-100 hover:bg-rose-200 text-rose-700 border-rose-200' 
                : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border-rose-500/20'
            }`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5 sm:w-5 sm:h-5">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
        </div>
      </div>

      {contributors.length === 0 && (
        <p className={`text-xs mt-2 ${isLight ? 'text-gray-500' : 'text-zinc-500'}`}>
          Выберите роль, введите ФИО и нажмите Enter
        </p>
      )}
    </div>
  );
}
