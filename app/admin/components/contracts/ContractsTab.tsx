"use client";
import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';

export default function ContractsTab() {
  const { themeName } = useTheme();
  const isLight = themeName === 'light';

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 mb-4 sm:mb-6">
        <p className={`text-xs sm:text-sm ${isLight ? 'text-gray-500' : 'text-zinc-500'}`}>Управление контрактами артистов</p>
        <span className="text-[10px] bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full font-bold">В разработке</span>
      </div>
      <div className={`text-center py-12 sm:py-20 ${isLight ? 'text-gray-500' : 'text-zinc-600'}`}>
        <div className="flex justify-center mb-4">
          <svg className={`w-16 h-16 sm:w-24 sm:h-24 ${isLight ? 'text-gray-400' : 'text-zinc-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p className="text-sm sm:text-base">Раздел контрактов в разработке</p>
      </div>
    </div>
  );
}
