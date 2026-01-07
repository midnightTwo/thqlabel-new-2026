'use client';

import React, { useState, useRef } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

interface ReleaseArtistsProps {
  artists: string[];
  setArtists: (artists: string[]) => void;
  maxArtists?: number;
}

export default function ReleaseArtists({ 
  artists, 
  setArtists, 
  maxArtists = 10 
}: ReleaseArtistsProps) {
  const { themeName } = useTheme();
  const isLight = themeName === 'light';
  
  const [newArtist, setNewArtist] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addArtist = () => {
    if (newArtist.trim() && artists.length < maxArtists) {
      setArtists([...artists, newArtist.trim()]);
      setNewArtist('');
      inputRef.current?.focus();
    }
  };

  const removeArtist = (index: number) => {
    setArtists(artists.filter((_, i) => i !== index));
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

    const newArtists = [...artists];
    const [draggedArtist] = newArtists.splice(draggedIndex, 1);
    newArtists.splice(targetIndex, 0, draggedArtist);
    setArtists(newArtists);
    
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Показываем drag & drop только если больше 1 артиста
  const showDragDrop = artists.length > 1;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className={`text-sm flex items-center gap-2 ${isLight ? 'text-gray-600' : 'text-zinc-400'}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={isLight ? 'text-violet-500' : 'text-violet-400/70'}>
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
            <line x1="12" y1="19" x2="12" y2="22"/>
          </svg>
          Артисты релиза *
          {artists.length > 0 && <span className={`text-xs ${isLight ? 'text-gray-500' : 'text-zinc-600'}`}>({artists.length}/{maxArtists})</span>}
        </label>
      </div>

      {/* Пояснение */}
      <div className={`mb-3 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border ${isLight ? 'bg-violet-50 border-violet-200' : 'bg-violet-500/5 border-violet-500/10'}`}>
        <p className={`text-[11px] sm:text-xs flex items-start gap-1.5 sm:gap-2 ${isLight ? 'text-gray-600' : 'text-zinc-400'}`}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`flex-shrink-0 mt-0.5 w-3 h-3 sm:w-3.5 sm:h-3.5 ${isLight ? 'text-violet-500' : 'text-violet-400/50'}`}>
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="16" x2="12" y2="12"/>
            <line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
          <span>
            Это артисты всего <strong>релиза</strong>, не трека!
            {showDragDrop && <><br/><span className={isLight ? 'text-gray-500' : 'text-zinc-500'}>Перетаскивайте для изменения порядка.</span></>}
          </span>
        </p>
      </div>

      {/* Список артистов */}
      {artists.length > 0 && (
        <div className="space-y-1.5 sm:space-y-2 mb-3">
          {artists.map((artist, idx) => (
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
                ${draggedIndex === idx ? 'opacity-50 border-dashed border-violet-400/50 bg-violet-500/10' : ''}
                ${dragOverIndex === idx && draggedIndex !== idx ? 'border-violet-400/60 bg-violet-500/15 scale-[1.02]' : ''}
                ${isLight 
                  ? 'bg-gradient-to-r from-violet-50 to-indigo-50 border-violet-200 hover:border-violet-400' 
                  : 'bg-gradient-to-r from-violet-500/[0.08] to-indigo-500/[0.04] border-violet-500/15 hover:border-violet-400/30'
                }
              `}
            >
              {/* Иконка перетаскивания - только если больше 1 артиста */}
              {showDragDrop && (
                <div className={`transition touch-manipulation min-w-[20px] sm:min-w-[16px] flex justify-center ${isLight ? 'text-violet-400 hover:text-violet-500' : 'text-violet-400/40 hover:text-violet-300/60'}`}>
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

              {/* Номер позиции - только если больше 1 артиста */}
              {showDragDrop && (
                <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full text-[10px] sm:text-xs font-medium flex items-center justify-center flex-shrink-0 ${isLight ? 'bg-violet-100 text-violet-600' : 'bg-violet-500/15 text-violet-300/70'}`}>
                  {idx + 1}
                </div>
              )}

              {/* Имя артиста */}
              <span className={`flex-1 text-sm sm:text-base truncate ${isLight ? 'text-gray-800' : 'text-white'}`}>
                {artist}
              </span>

              {/* Кнопка удаления */}
              <button
                type="button"
                onClick={() => removeArtist(idx)}
                className={`p-1.5 sm:p-1.5 transition rounded-lg touch-manipulation min-w-[32px] sm:min-w-[28px] min-h-[32px] sm:min-h-[28px] flex items-center justify-center ${isLight ? 'text-gray-400 hover:text-red-500 hover:bg-red-50' : 'text-zinc-500 hover:text-red-400 hover:bg-red-500/10'}`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 sm:w-3.5 sm:h-3.5">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Поле добавления нового артиста */}
      <div className="flex gap-1.5 sm:gap-2">
        <input
          ref={inputRef}
          type="text"
          value={newArtist}
          onChange={(e) => setNewArtist(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addArtist();
            }
          }}
          onBlur={() => {
            if (newArtist.trim()) addArtist();
          }}
          placeholder="greyrock, tewiq"
          disabled={artists.length >= maxArtists}
          className={`flex-1 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border outline-none transition-all disabled:opacity-50 text-sm sm:text-base ${
            isLight 
              ? 'bg-white border-gray-300 placeholder:text-gray-400 text-gray-800 hover:border-gray-400 focus:border-violet-500 focus:shadow-lg focus:shadow-violet-500/10' 
              : 'bg-gradient-to-br from-white/[0.07] to-white/[0.03] border-white/10 placeholder:text-zinc-600 hover:border-violet-400/30 focus:border-violet-400/50 focus:shadow-lg focus:shadow-violet-500/5'
          }`}
        />
        <button
          type="button"
          onClick={addArtist}
          disabled={!newArtist.trim() || artists.length >= maxArtists}
          className={`px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-sm font-medium transition disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center min-w-[44px] sm:min-w-[48px] border touch-manipulation ${
            isLight 
              ? 'bg-violet-100 hover:bg-violet-200 text-violet-700 border-violet-200' 
              : 'bg-violet-500/20 hover:bg-violet-500/30 text-violet-200 border-violet-500/20'
          }`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5 sm:w-5 sm:h-5">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
      </div>

      {artists.length === 0 && (
        <p className={`text-xs mt-2 ${isLight ? 'text-gray-500' : 'text-zinc-500'}`}>
          Введите имя артиста и нажмите Enter или кликните вне поля
        </p>
      )}
    </div>
  );
}
