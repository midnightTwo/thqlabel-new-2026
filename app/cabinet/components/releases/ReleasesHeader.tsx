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
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
        <button
          onClick={() => setShowArchive(false)}
          className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl transition-all border w-fit ${
            isLight 
              ? 'bg-white/90 hover:bg-white border-gray-300 hover:border-purple-400 text-[#1a1535] shadow-sm hover:shadow-md' 
              : 'bg-white/5 hover:bg-white/10 border-white/10 text-white'
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="text-sm font-medium">Назад</span>
        </button>
        <div className="flex-1">
          <h2 className={`text-xl sm:text-2xl font-black uppercase tracking-tight ${isLight ? 'text-[#1a1535]' : 'text-white'}`}>
            Архив
            <span className="hidden sm:inline"> (Черновики)</span>
          </h2>
          <p className={`text-xs sm:text-sm mt-0.5 sm:mt-1 ${isLight ? 'text-[#5c5580]' : 'text-zinc-500'}`}>
            Показано: {filteredCount} из {draftsCount}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 mb-4 sm:mb-6">
      <div className="min-w-0">
        <h2 className={`text-lg sm:text-2xl font-black uppercase tracking-tight ${isLight ? 'text-[#1a1535]' : 'text-white'}`}>Мои релизы</h2>
        <p className={`text-xs sm:text-sm mt-0.5 sm:mt-1 ${isLight ? 'text-[#5c5580]' : 'text-zinc-500'}`}>
          <span className="hidden sm:inline">Найдено: </span>{filteredCount} <span className="hidden xs:inline">из {releases.length}</span>
        </p>
      </div>
      <button
        onClick={() => setShowArchive(true)}
        className={`flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl transition-all border min-h-[44px] flex-shrink-0 ${
          isLight 
            ? 'bg-white/90 hover:bg-white border-gray-300 hover:border-purple-400 text-[#1a1535] shadow-sm hover:shadow-md' 
            : 'bg-white/5 hover:bg-white/10 border-white/10 text-white'
        }`}
      >
        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>
        <span className="text-xs sm:text-sm font-medium whitespace-nowrap">
          <span className="hidden sm:inline">Архив </span>({draftsCount})
        </span>
      </button>
    </div>
  );
}
