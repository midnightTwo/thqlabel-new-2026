"use client";
import React from 'react';
import { Release } from './types';
import { useTheme } from '@/contexts/ThemeContext';

interface ReleasesHeaderProps {
  showArchive: boolean;
  setShowArchive: (show: boolean) => void;
  releases: Release[];
  filteredCount: number;
}

export default function ReleasesHeader({
  showArchive,
  setShowArchive,
  releases,
  filteredCount
}: ReleasesHeaderProps) {
  const { themeName } = useTheme();
  const isLight = themeName === 'light';
  const draftsCount = releases.filter(r => r.status === 'draft').length;

  if (showArchive) {
    return (
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => setShowArchive(false)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all border ${
            isLight 
              ? 'bg-white/50 hover:bg-white/70 border-white/60 text-[#1a1535]' 
              : 'bg-white/5 hover:bg-white/10 border-white/10 text-white'
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="text-sm font-medium">Назад</span>
        </button>
        <div className="flex-1">
          <h2 className={`text-2xl font-black uppercase tracking-tight ${isLight ? 'text-[#1a1535]' : 'text-white'}`}>Архив (Черновики)</h2>
          <p className={`text-sm mt-1 ${isLight ? 'text-[#5c5580]' : 'text-zinc-500'}`}>
            Показано: {filteredCount} из {draftsCount}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h2 className={`text-2xl font-black uppercase tracking-tight ${isLight ? 'text-[#1a1535]' : 'text-white'}`}>Мои релизы</h2>
        <p className={`text-sm mt-1 ${isLight ? 'text-[#5c5580]' : 'text-zinc-500'}`}>
          Найдено: {filteredCount} из {releases.length}
        </p>
      </div>
      <button
        onClick={() => setShowArchive(true)}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all border ${
          isLight 
            ? 'bg-white/50 hover:bg-white/70 border-white/60 text-[#1a1535]' 
            : 'bg-white/5 hover:bg-white/10 border-white/10 text-white'
        }`}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>
        <span className="text-sm font-medium">Архив ({draftsCount})</span>
      </button>
    </div>
  );
}
