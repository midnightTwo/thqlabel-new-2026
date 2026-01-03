import React, { useState, useEffect } from 'react';
import { PlatformIcon, getPlatformColor } from '@/components/icons/PlatformIconsSVG';
import { PlatformGroupIcon } from '@/components/icons/RegionIcons';

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
    gradient: 'border-green-500/30',
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
    gradient: 'border-purple-500/30',
    platforms: [
      'TikTok', 'Instagram/Facebook', 'Snapchat', 'Triller'
    ]
  },
  'Магазины и другие': {
    color: 'from-amber-500/20 to-orange-500/20',
    gradient: 'border-amber-500/30',
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
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center ring-1 ring-white/10">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-pink-300">
              <path d="M9 18V5l12-2v13"/>
              <circle cx="6" cy="18" r="3"/>
              <circle cx="18" cy="16" r="3"/>
            </svg>
          </div>
          <div>
            <h2 className="text-3xl font-black bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">Площадки</h2>
            <p className="text-sm text-zinc-500 mt-1">Выберите площадки для размещения ({allPlatformNames.length} площадок)</p>
          </div>
        </div>
      </div>
      
      <div className="relative p-5 bg-gradient-to-br from-pink-500/10 via-transparent to-purple-500/10 border border-pink-500/20 rounded-2xl mb-6 overflow-hidden">
        {/* Общая статистика и кнопки */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/10">
              <span className="text-zinc-400 text-sm">Выбрано:</span>
              <span className="ml-2 font-bold text-white text-lg">{localSelectedPlatforms.length}</span>
              <span className="text-zinc-500 text-sm">/{allPlatformNames.length}</span>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={selectAll}
              className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-lg text-sm font-medium transition-all"
            >
              ✓ Выбрать все
            </button>
            <button
              onClick={deselectAll}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 rounded-lg text-sm font-medium transition-all"
            >
              ✕ Снять все
            </button>
          </div>
        </div>
        
        {/* Вкладки групп - с вкладкой "Все" */}
        <div className="flex flex-wrap gap-2 mb-5 pb-5 border-b border-white/10">
          {/* Вкладка "Все" */}
          <button
            onClick={() => setActiveGroup('Все')}
            className={`group relative px-4 py-3 rounded-xl font-medium transition-all flex items-center gap-3 ${
              activeGroup === 'Все' 
                ? 'bg-gradient-to-r from-violet-500/20 to-purple-500/20 border-violet-500/30 border shadow-lg' 
                : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20'
            }`}
          >
            <div className="w-6 h-6">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={activeGroup === 'Все' ? 'text-violet-300' : 'text-zinc-400'}>
                <circle cx="12" cy="12" r="10"/>
                <path d="M8 12h8M12 8v8"/>
              </svg>
            </div>
            <div className="text-left">
              <div className={`font-bold ${activeGroup === 'Все' ? 'text-white' : 'text-zinc-300'}`}>Все</div>
              <div className="flex items-center gap-2 text-xs">
                <span className={`px-2 py-0.5 rounded-full ${
                  localSelectedPlatforms.length === allPlatformNames.length ? 'bg-emerald-500/30 text-emerald-300' :
                  localSelectedPlatforms.length > 0 ? 'bg-amber-500/30 text-amber-300' :
                  'bg-white/10 text-zinc-500'
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
                className={`group relative px-4 py-3 rounded-xl font-medium transition-all flex items-center gap-3 ${
                  isActive 
                    ? `bg-gradient-to-r ${groupInfo.color} ${groupInfo.gradient} border shadow-lg` 
                    : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20'
                }`}
              >
                <div className="w-6 h-6">
                  <PlatformGroupIcon group={groupName} className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <div className={`font-bold ${isActive ? 'text-white' : 'text-zinc-300'}`}>{groupName}</div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className={`px-2 py-0.5 rounded-full ${
                      isFullySelected ? 'bg-emerald-500/30 text-emerald-300' :
                      isPartiallySelected ? 'bg-amber-500/30 text-amber-300' :
                      'bg-white/10 text-zinc-500'
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
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          {/* Поиск */}
          <div className="relative flex-1 min-w-[200px] max-w-[300px]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск площадки..."
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/30 transition-all"
            />
          </div>
          
          {/* Кнопки управления группой (скрываем для "Все") */}
          {activeGroup !== 'Все' && (
          <div className="flex gap-2">
            <button
              onClick={() => selectGroup(activeGroup)}
              className="px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-lg text-xs font-medium transition-all"
            >
              ✓ Вся группа
            </button>
            <button
              onClick={() => deselectGroup(activeGroup)}
              className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 rounded-lg text-xs font-medium transition-all"
            >
              ✕ Снять группу
            </button>
          </div>
          )}
        </div>
        
        {/* Сетка платформ */}
        <div className="max-h-[400px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {filteredPlatforms.length === 0 ? (
            <div className="text-center py-10 text-zinc-500">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="mx-auto mb-3 opacity-50" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <p>Площадки не найдены</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {filteredPlatforms.map(platformName => {
                const isSelected = localSelectedPlatforms.includes(platformName);
                const platformColor = getPlatformColor(platformName);
                return (
                  <button
                    key={platformName}
                    onClick={() => togglePlatform(platformName)}
                    className={`group relative p-3 rounded-xl transition-all duration-200 border overflow-hidden ${
                      isSelected
                        ? 'bg-gradient-to-br from-[#6050ba]/30 to-purple-500/20 border-[#6050ba]/50 shadow-lg shadow-purple-500/10'
                        : 'bg-white/[0.02] border-white/5 hover:bg-white/5 hover:border-white/20'
                    }`}
                  >
                    {/* Фоновое свечение при выборе */}
                    {isSelected && (
                      <div 
                        className="absolute inset-0 opacity-10 blur-xl"
                        style={{ backgroundColor: platformColor }}
                      />
                    )}
                    
                    <div className="relative flex items-center gap-3">
                      {/* Иконка платформы */}
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                        isSelected 
                          ? 'bg-white/10 shadow-inner' 
                          : 'bg-white/5 group-hover:bg-white/10'
                      }`} style={isSelected ? { backgroundColor: `${platformColor}20` } : {}}>
                        <PlatformIcon platform={platformName} className="w-5 h-5" />
                      </div>
                      
                      {/* Название */}
                      <div className="flex-1 min-w-0">
                        <span className={`text-xs font-medium block truncate ${isSelected ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-300'}`}>
                          {platformName}
                        </span>
                      </div>
                      
                      {/* Индикатор выбора */}
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                        isSelected 
                          ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50' 
                          : 'bg-white/5 border border-white/20'
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

      <div className="mt-6 pt-5 border-t border-white/10 flex justify-between">
        <button onClick={onBack} className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold transition flex items-center gap-2 border border-white/10">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          Назад
        </button>
        <button 
          onClick={onNext}
          disabled={localSelectedPlatforms.length === 0}
          className="px-8 py-3 bg-gradient-to-r from-[#6050ba] to-[#7060ca] hover:from-[#7060ca] hover:to-[#8070da] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold transition flex items-center gap-2 shadow-lg shadow-purple-500/20"
        >
          Далее
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>
    </div>
  );
}
