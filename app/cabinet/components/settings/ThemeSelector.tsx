'use client';
import React from 'react';
import { useTheme, themes, ThemeName } from '@/contexts/ThemeContext';

export default function ThemeSelector() {
  const { themeName, setTheme } = useTheme();
  
  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3">
      {Object.entries(themes).map(([name, theme]) => {
        const isActive = themeName === name;
        return (
          <button
            key={name}
            onClick={() => setTheme(name as ThemeName)}
            className={`group relative p-3 sm:p-4 rounded-xl border-2 transition-all duration-300 text-left overflow-hidden ${
              isActive
                ? `${theme.colors.primary} border-transparent shadow-lg ${theme.colors.glow} scale-105`
                : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 hover:scale-102'
            }`}
          >
            {/* Галочка - вынесена за пределы flex контейнера */}
            {isActive && (
              <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 z-20">
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white drop-shadow-md" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
            <div className="relative z-10 flex items-center gap-2 sm:gap-3">
              <div className={`p-1.5 sm:p-2 rounded-lg flex-shrink-0 ${isActive ? 'bg-white/20' : 'bg-zinc-800'} transition-colors`}>
                {theme.icon()}
              </div>
              <div className="flex-1 min-w-0 pr-4 sm:pr-5">
                <div className={`text-xs sm:text-sm font-bold truncate ${isActive ? 'text-white' : 'text-zinc-300'}`}>
                  {theme.label}
                </div>
                <div className={`text-[9px] sm:text-[10px] mt-0.5 ${isActive ? 'text-white/70' : 'text-zinc-500'}`}>
                  {isActive ? 'Активна' : 'Выбрать'}
                </div>
              </div>
            </div>
            {!isActive && (
              <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </button>
        );
      })}
    </div>
  );
}
