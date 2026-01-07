'use client';

import { useTheme } from '@/contexts/ThemeContext';

interface RoleStatsProps {
  ownersCount: number;
  adminsCount: number;
  exclusiveCount: number;
  basicCount: number;
}

export function RoleStats({ ownersCount, adminsCount, exclusiveCount, basicCount }: RoleStatsProps) {
  const { themeName } = useTheme();
  const isLight = themeName === 'light';
  
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
      <div className={`p-3 sm:p-4 rounded-xl text-center ${
        isLight 
          ? 'bg-purple-100/60 border border-purple-300/40' 
          : 'bg-[#8b5cf6]/5 border border-[#8b5cf6]/20'
      }`}>
        <div className={`text-2xl sm:text-3xl font-black ${isLight ? 'text-purple-600' : 'text-[#a78bfa]'}`}>{ownersCount}</div>
        <div className={`text-[9px] sm:text-[10px] uppercase tracking-widest ${isLight ? 'text-purple-500/70' : 'text-zinc-500'}`}>Владельцев</div>
      </div>
      <div className={`p-3 sm:p-4 rounded-xl text-center ${
        isLight 
          ? 'bg-red-100/60 border border-red-300/40' 
          : 'bg-[#ff4757]/5 border border-[#ff4757]/20'
      }`}>
        <div className={`text-2xl sm:text-3xl font-black ${isLight ? 'text-red-500' : 'text-[#ff6b81]'}`}>{adminsCount}</div>
        <div className={`text-[9px] sm:text-[10px] uppercase tracking-widest ${isLight ? 'text-red-400/70' : 'text-zinc-500'}`}>Админов</div>
      </div>
      <div className={`p-3 sm:p-4 rounded-xl text-center ${
        isLight 
          ? 'bg-amber-100/60 border border-amber-300/40' 
          : 'bg-[#f59e0b]/5 border border-[#f59e0b]/20'
      }`}>
        <div className={`text-2xl sm:text-3xl font-black ${isLight ? 'text-amber-600' : 'text-[#fbbf24]'}`}>{exclusiveCount}</div>
        <div className={`text-[9px] sm:text-[10px] uppercase tracking-widest ${isLight ? 'text-amber-500/70' : 'text-zinc-500'}`}>Exclusive</div>
      </div>
      <div className={`p-3 sm:p-4 rounded-xl text-center ${
        isLight 
          ? 'bg-gray-100/60 border border-gray-300/40' 
          : 'bg-zinc-800/30 border border-zinc-700/50'
      }`}>
        <div className={`text-2xl sm:text-3xl font-black ${isLight ? 'text-gray-500' : 'text-zinc-400'}`}>{basicCount}</div>
        <div className={`text-[9px] sm:text-[10px] uppercase tracking-widest ${isLight ? 'text-gray-400' : 'text-zinc-500'}`}>Basic</div>
      </div>
    </div>
  );
}
