import React, { useState, useEffect } from 'react';
import { PlatformIcon, getPlatformColor } from '@/components/icons/PlatformIconsSVG';
import { PlatformGroupIcon } from '@/components/icons/RegionIcons';
import { useTheme } from '@/contexts/ThemeContext';

interface PlatformsStepProps {
  selectedPlatforms: number;
  setSelectedPlatforms: (count: number) => void;
  selectedPlatformsList?: string[];
  setSelectedPlatformsList?: (platforms: string[]) => void;
  onNext: () => void;
  onBack: () => void;
}

// Группы площадок (3 основных группы) - без эмодзи, используем SVG иконки
const platformGroups = {
  'Стриминг': {
    color: 'from-green-500/20 to-emerald-500/20',
    lightColor: 'from-green-50 to-emerald-50',
    gradient: 'border-green-500/30',
    lightGradient: 'border-green-300',
    platforms: [
      'Spotify', 'Apple Music', 'YouTube Music', 'Amazon Music', 'Deezer', 
      'Tidal', 'Pandora', 'iHeartRadio', 'Napster', 'Audiomack', 
      'Boomplay', 'Anghami', 'JioSaavn', 'Gaana',
      // Российские
      'Яндекс Музыка', 'VK Музыка', 'Звук (Sber)', 'МТС Music',
      // Азиатские
      'NetEase Cloud Music', 'QQ Music', 'KuGou', 'Kuwo', 'Melon', 'Genie',
      'FLO', 'Bugs!', 'KKBOX', 'LINE Music', 'AWA', 'Joox'
    ]
  },
  'Социальные сети и видео': {
    color: 'from-purple-500/20 to-pink-500/20',
    lightColor: 'from-purple-50 to-pink-50',
    gradient: 'border-purple-500/30',
    lightGradient: 'border-purple-300',
    platforms: [
      'TikTok', 'Instagram/Facebook', 'Snapchat', 'Triller'
    ]
  },
  'Магазины и другие': {
    color: 'from-amber-500/20 to-orange-500/20',
    lightColor: 'from-amber-50 to-orange-50',
    gradient: 'border-amber-500/30',
    lightGradient: 'border-amber-300',
    platforms: [
      'iTunes Store', 'Amazon Store', 'Beatport', 'Traxsource', 'Juno Download', 
      'Bandcamp', 'Shazam', 'Genius', 'MediaNet', '7digital', 'Gracenote', 
      'Claro Música', 'Nuuday', 'Peloton', 'Pretzel'
    ]
  }
};

// Все платформы в одном массиве
const allPlatformNames = Object.values(platformGroups).flatMap(g => g.platforms);

// Экспорт для инициализации
export const getAllPlatforms = () => allPlatformNames;

export default function PlatformsStep({ 
  selectedPlatforms, 
  setSelectedPlatforms, 
  selectedPlatformsList,
  setSelectedPlatformsList,
  onNext, 
  onBack 
}: PlatformsStepProps) {
  const { themeName } = useTheme();
  const isLight = themeName === 'light';
  
  const [localSelectedPlatforms, setLocalSelectedPlatforms] = useState<string[]>(
    selectedPlatformsList && selectedPlatformsList.length > 0 
      ? selectedPlatformsList 
      : allPlatformNames
  );
  
  // Активная группа (вкладка) - "Все" показывает все площадки
  const [activeGroup, setActiveGroup] = useState<string>('Все');
  
  // Поиск
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setSelectedPlatforms(localSelectedPlatforms.length);
    if (setSelectedPlatformsList) {
      setSelectedPlatformsList(localSelectedPlatforms);
    }
  }, [localSelectedPlatforms, setSelectedPlatforms, setSelectedPlatformsList]);

  const togglePlatform = (platformName: string) => {
    if (localSelectedPlatforms.includes(platformName)) {
      setLocalSelectedPlatforms(localSelectedPlatforms.filter(p => p !== platformName));
    } else {
      setLocalSelectedPlatforms([...localSelectedPlatforms, platformName]);
    }
  };

  const selectAll = () => {
    setLocalSelectedPlatforms([...allPlatformNames]);
  };

  const deselectAll = () => {
    setLocalSelectedPlatforms([]);
  };

  const selectGroup = (groupName: string) => {
    const groupPlatforms = platformGroups[groupName as keyof typeof platformGroups]?.platforms || [];
    const newPlatforms = [...localSelectedPlatforms];
    groupPlatforms.forEach(p => {
      if (!newPlatforms.includes(p)) newPlatforms.push(p);
    });
    setLocalSelectedPlatforms(newPlatforms);
  };

  const deselectGroup = (groupName: string) => {
    const groupPlatforms = platformGroups[groupName as keyof typeof platformGroups]?.platforms || [];
    setLocalSelectedPlatforms(localSelectedPlatforms.filter(p => !groupPlatforms.includes(p)));
  };

  // Фильтрация платформ по поиску
  const getFilteredPlatforms = (platforms: string[]) => {
    if (!searchQuery.trim()) return platforms;
    const query = searchQuery.toLowerCase();
    return platforms.filter(p => p.toLowerCase().includes(query));
  };

  // Статистика по группе
  const getGroupStats = (groupName: string) => {
    const platforms = platformGroups[groupName as keyof typeof platformGroups]?.platforms || [];
    const selected = platforms.filter(p => localSelectedPlatforms.includes(p)).length;
    return { selected, total: platforms.length };
  };

  // Текущие платформы группы (или все площадки если выбрана вкладка "Все")
  const currentGroupPlatforms = activeGroup === 'Все' 
    ? allPlatformNames 
    : (platformGroups[activeGroup as keyof typeof platformGroups]?.platforms || []);
  const filteredPlatforms = getFilteredPlatforms(currentGroupPlatforms);

  return (
    <div className="animate-fade-up">
      <div className="mb-4 sm:mb-6">
        <div className="flex items-center gap-2.5 sm:gap-3 mb-3">
          <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br ${isLight ? 'from-pink-100 to-purple-100 ring-pink-200' : 'from-pink-500/20 to-purple-500/20 ring-white/10'} flex items-center justify-center ring-1`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`${isLight ? 'text-pink-500' : 'text-pink-300'} sm:w-7 sm:h-7`}>
              <path d="M9 18V5l12-2v13"/>
              <circle cx="6" cy="18" r="3"/>
              <circle cx="18" cy="16" r="3"/>
            </svg>
          </div>
          <div>
            <h2 className={`text-xl sm:text-3xl font-black bg-gradient-to-r ${isLight ? 'from-gray-900 to-gray-600' : 'from-white to-zinc-400'} bg-clip-text text-transparent`}>Площадки</h2>
            <p className={`text-xs sm:text-sm ${isLight ? 'text-gray-500' : 'text-zinc-500'} mt-0.5 sm:mt-1`}>Выберите площадки для размещения ({allPlatformNames.length} площадок)</p>
          </div>
        </div>
      </div>
      
      <div className={`relative p-4 sm:p-5 bg-gradient-to-br ${isLight ? 'from-pink-50 via-white to-purple-50 border-pink-200' : 'from-pink-500/10 via-transparent to-purple-500/10 border-pink-500/20'} border rounded-xl sm:rounded-2xl mb-4 sm:mb-6 overflow-hidden`}>
        {/* Общая статистика и кнопки */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-5">
          <div className="flex items-center justify-center sm:justify-start gap-3">
            <div className={`px-3 sm:px-4 py-1.5 sm:py-2 ${isLight ? 'bg-gray-100 border-gray-200' : 'bg-white/5 border-white/10'} rounded-lg sm:rounded-xl border`}>
              <span className={`${isLight ? 'text-gray-600' : 'text-zinc-400'} text-xs sm:text-sm`}>Выбрано:</span>
              <span className={`ml-2 font-bold ${isLight ? 'text-gray-900' : 'text-white'} text-base sm:text-lg`}>{localSelectedPlatforms.length}</span>
              <span className={`${isLight ? 'text-gray-500' : 'text-zinc-500'} text-xs sm:text-sm`}>/{allPlatformNames.length}</span>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={selectAll}
              className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 ${isLight ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-600' : 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-300'} border rounded-lg text-xs sm:text-sm font-medium transition-all touch-manipulation`}
            >
              ✓ Выбрать все
            </button>
            <button
              onClick={deselectAll}
              className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 ${isLight ? 'bg-gray-100 hover:bg-gray-200 border-gray-200 text-gray-700' : 'bg-white/5 hover:bg-white/10 border-white/10 text-zinc-300'} border rounded-lg text-xs sm:text-sm font-medium transition-all touch-manipulation`}
            >
              ✕ Снять все
            </button>
          </div>
        </div>
        
        {/* Вкладки групп - с вкладкой "Все" */}
        <div className={`flex flex-wrap gap-1.5 sm:gap-2 mb-4 sm:mb-5 pb-4 sm:pb-5 border-b ${isLight ? 'border-gray-200' : 'border-white/10'}`}>
          {/* Вкладка "Все" */}
          <button
            onClick={() => setActiveGroup('Все')}
            className={`group relative px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-medium transition-all flex items-center gap-2 sm:gap-3 touch-manipulation ${
              activeGroup === 'Все' 
                ? isLight
                  ? 'bg-gradient-to-r from-violet-50 to-purple-50 border-violet-300 border shadow-lg'
                  : 'bg-gradient-to-r from-violet-500/20 to-purple-500/20 border-violet-500/30 border shadow-lg'
                : isLight
                  ? 'bg-gray-50 border border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                  : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20'
            }`}
          >
            <div className="w-5 h-5 sm:w-6 sm:h-6">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={activeGroup === 'Все' ? (isLight ? 'text-violet-600' : 'text-violet-300') : (isLight ? 'text-gray-500' : 'text-zinc-400')}>
                <circle cx="12" cy="12" r="10"/>
                <path d="M8 12h8M12 8v8"/>
              </svg>
            </div>
            <div className="text-left">
              <div className={`font-bold text-sm sm:text-base ${activeGroup === 'Все' ? (isLight ? 'text-gray-900' : 'text-white') : (isLight ? 'text-gray-700' : 'text-zinc-300')}`}>Все</div>
              <div className="flex items-center gap-2 text-[10px] sm:text-xs">
                <span className={`px-1.5 sm:px-2 py-0.5 rounded-full ${
                  localSelectedPlatforms.length === allPlatformNames.length 
                    ? isLight ? 'bg-emerald-100 text-emerald-600' : 'bg-emerald-500/30 text-emerald-300' 
                    : localSelectedPlatforms.length > 0 
                      ? isLight ? 'bg-amber-100 text-amber-600' : 'bg-amber-500/30 text-amber-300'
                      : isLight ? 'bg-gray-100 text-gray-500' : 'bg-white/10 text-zinc-500'
                }`}>
                  {localSelectedPlatforms.length}/{allPlatformNames.length}
                </span>
              </div>
            </div>
          </button>
          
          {Object.keys(platformGroups).map((groupName) => {
            const stats = getGroupStats(groupName);
            const groupInfo = platformGroups[groupName as keyof typeof platformGroups];
            const isActive = activeGroup === groupName;
            const isFullySelected = stats.selected === stats.total;
            const isPartiallySelected = stats.selected > 0 && stats.selected < stats.total;
            
            return (
              <button
                key={groupName}
                onClick={() => setActiveGroup(groupName)}
                className={`group relative px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-medium transition-all flex items-center gap-2 sm:gap-3 touch-manipulation ${
                  isActive 
                    ? isLight
                      ? `bg-gradient-to-r ${groupInfo.lightColor} ${groupInfo.lightGradient} border shadow-lg`
                      : `bg-gradient-to-r ${groupInfo.color} ${groupInfo.gradient} border shadow-lg`
                    : isLight
                      ? 'bg-gray-50 border border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                      : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20'
                }`}
              >
                <div className="w-5 h-5 sm:w-6 sm:h-6">
                  <PlatformGroupIcon group={groupName} className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="text-left">
                  <div className={`font-bold text-xs sm:text-base truncate max-w-[80px] sm:max-w-none ${isActive ? (isLight ? 'text-gray-900' : 'text-white') : (isLight ? 'text-gray-700' : 'text-zinc-300')}`}>{groupName}</div>
                  <div className="flex items-center gap-2 text-[10px] sm:text-xs">
                    <span className={`px-1.5 sm:px-2 py-0.5 rounded-full ${
                      isFullySelected 
                        ? isLight ? 'bg-emerald-100 text-emerald-600' : 'bg-emerald-500/30 text-emerald-300'
                        : isPartiallySelected 
                          ? isLight ? 'bg-amber-100 text-amber-600' : 'bg-amber-500/30 text-amber-300'
                          : isLight ? 'bg-gray-100 text-gray-500' : 'bg-white/10 text-zinc-500'
                    }`}>
                      {stats.selected}/{stats.total}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        
        {/* Панель управления группой */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 mb-3 sm:mb-4">
          {/* Поиск */}
          <div className="relative flex-1 min-w-0 sm:min-w-[200px] sm:max-w-[300px]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className={`absolute left-3 top-1/2 -translate-y-1/2 ${isLight ? 'text-gray-400' : 'text-zinc-500'} w-4 h-4 sm:w-[18px] sm:h-[18px]`} strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск площадки..."
              className={`w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 ${isLight ? 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-pink-400 focus:ring-pink-300' : 'bg-white/5 border-white/10 text-white placeholder-zinc-500 focus:border-pink-500/50 focus:ring-pink-500/30'} border rounded-lg sm:rounded-xl text-sm sm:text-base focus:outline-none focus:ring-1 transition-all`}
            />
          </div>
          
          {/* Кнопки управления группой (скрываем для "Все") */}
          {activeGroup !== 'Все' && (
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={() => selectGroup(activeGroup)}
              className={`flex-1 sm:flex-none px-2.5 sm:px-3 py-1.5 sm:py-2 ${isLight ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-600' : 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-300'} border rounded-lg text-[10px] sm:text-xs font-medium transition-all touch-manipulation`}
            >
              ✓ Вся группа
            </button>
            <button
              onClick={() => deselectGroup(activeGroup)}
              className={`flex-1 sm:flex-none px-2.5 sm:px-3 py-1.5 sm:py-2 ${isLight ? 'bg-gray-100 hover:bg-gray-200 border-gray-200 text-gray-600' : 'bg-white/5 hover:bg-white/10 border-white/10 text-zinc-400'} border rounded-lg text-[10px] sm:text-xs font-medium transition-all touch-manipulation`}
            >
              ✕ Снять группу
            </button>
          </div>
          )}
        </div>
        
        {/* Сетка платформ */}
        <div className="max-h-[300px] sm:max-h-[400px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {filteredPlatforms.length === 0 ? (
            <div className={`text-center py-8 sm:py-10 ${isLight ? 'text-gray-500' : 'text-zinc-500'}`}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="mx-auto mb-3 opacity-50 w-10 h-10 sm:w-12 sm:h-12" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <p className="text-xs sm:text-sm">Площадки не найдены</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
              {filteredPlatforms.map(platformName => {
                const isSelected = localSelectedPlatforms.includes(platformName);
                const platformColor = getPlatformColor(platformName);
                return (
                  <button
                    key={platformName}
                    onClick={() => togglePlatform(platformName)}
                    className={`group relative p-2.5 sm:p-3 rounded-lg sm:rounded-xl transition-all duration-200 border overflow-hidden touch-manipulation ${
                      isSelected
                        ? isLight
                          ? 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-300 shadow-lg shadow-purple-200/50'
                          : 'bg-gradient-to-br from-[#6050ba]/30 to-purple-500/20 border-[#6050ba]/50 shadow-lg shadow-purple-500/10'
                        : isLight
                          ? 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                          : 'bg-white/[0.02] border-white/5 hover:bg-white/5 hover:border-white/20'
                    }`}
                  >
                    {/* Фоновое свечение при выборе */}
                    {isSelected && (
                      <div 
                        className={`absolute inset-0 ${isLight ? 'opacity-5' : 'opacity-10'} blur-xl`}
                        style={{ backgroundColor: platformColor }}
                      />
                    )}
                    
                    <div className="relative flex items-center gap-2 sm:gap-3">
                      {/* Иконка платформы */}
                      <div className={`w-7 h-7 sm:w-9 sm:h-9 rounded-md sm:rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                        isSelected 
                          ? isLight ? 'bg-purple-100 shadow-inner' : 'bg-white/10 shadow-inner'
                          : isLight ? 'bg-gray-100 group-hover:bg-gray-200' : 'bg-white/5 group-hover:bg-white/10'
                      }`} style={isSelected ? { backgroundColor: isLight ? `${platformColor}15` : `${platformColor}20` } : {}}>
                        <PlatformIcon platform={platformName} className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      
                      {/* Название */}
                      <div className="flex-1 min-w-0">
                        <span className={`text-[10px] sm:text-xs font-medium block truncate ${
                          isSelected 
                            ? isLight ? 'text-gray-900' : 'text-white'
                            : isLight ? 'text-gray-600 group-hover:text-gray-800' : 'text-zinc-400 group-hover:text-zinc-300'
                        }`}>
                          {platformName}
                        </span>
                      </div>
                      
                      {/* Индикатор выбора */}
                      <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                        isSelected 
                          ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50' 
                          : isLight ? 'bg-gray-100 border border-gray-300' : 'bg-white/5 border border-white/20'
                      }`}>
                        {isSelected && (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className={`mt-5 sm:mt-6 pt-4 sm:pt-5 border-t ${isLight ? 'border-gray-200' : 'border-white/10'} flex justify-between`}>
        <button onClick={onBack} className={`px-4 sm:px-6 py-2.5 sm:py-3 ${isLight ? 'bg-gray-100 hover:bg-gray-200 border-gray-200 text-gray-700' : 'bg-white/5 hover:bg-white/10 border-white/10 text-white'} rounded-xl font-bold transition flex items-center gap-2 border text-sm sm:text-base touch-manipulation`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polyline points="15 18 9 12 15 6"/></svg>
          Назад
        </button>
        <button 
          onClick={onNext}
          disabled={localSelectedPlatforms.length === 0}
          className={`px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-[#6050ba] to-[#7060ca] hover:from-[#7060ca] hover:to-[#8070da] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold transition flex items-center gap-2 ${isLight ? 'shadow-lg shadow-purple-300/30' : 'shadow-lg shadow-purple-500/20'} text-sm sm:text-base touch-manipulation`}
          style={{ color: 'white' }}
        >
          Далее
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-4 h-4"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>
    </div>
  );
}
