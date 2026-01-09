'use client';
import React, { memo } from 'react';
import { useTheme, themes, ThemeName } from '@/contexts/ThemeContext';

const ThemeSelector = memo(function ThemeSelector() {
  const { themeName, setTheme } = useTheme();
  const currentIsDark = themeName === 'dark';
  
  return (
    <div className="grid grid-cols-2 gap-3">
      {Object.entries(themes).map(([name, theme]) => {
        const isActive = themeName === name;
        const isLightTheme = name === 'light';
        
        return (
          <button
            key={name}
            onClick={() => setTheme(name as ThemeName)}
            className={`
              group relative p-3 sm:p-4 rounded-xl transition-all duration-300 text-left overflow-hidden 
              will-change-transform active:scale-[0.98]
            `}
            style={{
              background: isLightTheme 
                ? currentIsDark
                  ? '#f3f4f6'  // gray-100
                  : '#ffffff'
                : currentIsDark
                  ? '#18181b'  // zinc-900
                  : '#27272a',  // zinc-800 - тёмный фон
              border: isActive
                ? '2px solid #a78bfa'  // violet-400 - обводка выбранной темы
                : isLightTheme
                  ? currentIsDark
                    ? '1px solid #d1d5db'  // gray-300
                    : '1px solid #e9d5ff'  // purple-200
                  : currentIsDark
                    ? '1px solid #3f3f46'  // zinc-700
                    : '1px solid rgba(129, 140, 248, 0.5)',  // indigo-400/50
              boxShadow: isActive
                ? '0 0 0 3px rgba(167, 139, 250, 0.2), 0 4px 12px rgba(139, 92, 246, 0.15)'
                : isLightTheme
                  ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  : currentIsDark
                    ? '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
                    : '0 10px 15px -3px rgba(24, 24, 27, 0.2)',
              transform: isActive ? 'scale(1.01)' : 'scale(1)',
            }}
          >
            {/* Галочка для активной темы */}
            {isActive && (
              <div className="absolute top-2 right-2 z-20">
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-400 to-violet-500 flex items-center justify-center shadow-md shadow-purple-500/30">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            )}
            
            <div className="relative z-10 flex items-center gap-3">
              {/* Иконка */}
              <div className={`
                p-2.5 rounded-xl flex-shrink-0 transition-all duration-300
                ${isLightTheme 
                  ? 'bg-gradient-to-br from-amber-50 to-orange-100 border border-amber-200 shadow-sm shadow-amber-200/50' 
                  : currentIsDark
                    ? 'bg-gradient-to-br from-indigo-900/60 to-purple-900/60 border border-indigo-500/30'
                    : 'bg-gradient-to-br from-indigo-600 to-purple-600 border border-indigo-400/60'
                }
              `}>
                <div className={`
                  ${isLightTheme 
                    ? 'text-amber-500 drop-shadow-sm' 
                    : currentIsDark
                      ? 'text-indigo-300'
                      : 'text-white drop-shadow-lg'
                  }
                `}>
                  {theme.icon()}
                </div>
              </div>
              
              {/* Текст */}
              <div className="flex-1 min-w-0 pr-5">
                <div 
                  className="text-sm font-semibold truncate"
                  style={{
                    color: isLightTheme ? '#111827' : '#f4f4f5',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {theme.label}
                </div>
                <div 
                  className="text-[11px] mt-0.5 font-medium"
                  style={{
                    color: isActive 
                      ? '#a78bfa'  // violet-400
                      : isLightTheme 
                        ? '#4b5563'  // gray-600
                        : currentIsDark
                          ? '#d4d4d8'  // zinc-300
                          : '#e4e4e7',  // zinc-200
                  }}
                >
                  {isActive ? '✓ Активна' : 'Выбрать'}
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
});

export default ThemeSelector;
