import React, { useState, useEffect, useMemo } from 'react';
import { CountryFlag, allCountriesByRegion, regionGroups, getCountriesByRegionGroup, getAllCountries } from '@/components/icons/CountryFlagsSVG';
import { RegionIcon } from '@/components/icons/RegionIcons';
import { useTheme } from '@/contexts/ThemeContext';

interface CountriesStepProps {
  // Поддержка двух режимов: selectedCountries ИЛИ excludedCountries
  selectedCountries?: string[];
  setSelectedCountries?: (countries: string[]) => void;
  excludedCountries?: string[];
  setExcludedCountries?: (countries: string[]) => void;
  onNext: () => void;
  onBack: () => void;
}

// Иконки для групп регионов
const regionGroupIcons: Record<string, React.ReactNode> = {
  'Европа': (
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M8 8L10 6L14 8L16 6L18 10L16 14L18 16L14 18L10 16L8 18L6 14L8 10Z" fill="currentColor" opacity="0.3"/>
      <circle cx="12" cy="12" r="3" fill="currentColor"/>
    </svg>
  ),
  'Америка': (
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
      <path d="M12 2L8 6L10 10L6 14L8 18L12 22L16 18L14 14L18 10L16 6Z" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.2"/>
      <circle cx="12" cy="10" r="2" fill="currentColor"/>
    </svg>
  ),
  'Азия': (
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
      <path d="M4 12C4 7.58 7.58 4 12 4C16.42 4 20 7.58 20 12C20 16.42 16.42 20 12 20" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M12 4V20M4 12H20" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
      <circle cx="14" cy="10" r="3" fill="currentColor" fillOpacity="0.3"/>
    </svg>
  ),
  'Африка и Океания': (
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
      <circle cx="10" cy="12" r="6" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.2"/>
      <circle cx="18" cy="16" r="3" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.3"/>
    </svg>
  ),
};

// Цвета для групп регионов (light and dark)
const getRegionGroupColors = (isLight: boolean): Record<string, { bg: string; border: string; text: string }> => ({
  'Европа': { 
    bg: isLight ? 'from-blue-100 to-indigo-100' : 'from-blue-500/20 to-indigo-600/20', 
    border: isLight ? 'border-blue-300' : 'border-blue-500/30', 
    text: isLight ? 'text-blue-600' : 'text-blue-300' 
  },
  'Америка': { 
    bg: isLight ? 'from-red-100 to-orange-100' : 'from-red-500/20 to-orange-600/20', 
    border: isLight ? 'border-red-300' : 'border-red-500/30', 
    text: isLight ? 'text-red-600' : 'text-red-300' 
  },
  'Азия': { 
    bg: isLight ? 'from-amber-100 to-yellow-100' : 'from-amber-500/20 to-yellow-600/20', 
    border: isLight ? 'border-amber-300' : 'border-amber-500/30', 
    text: isLight ? 'text-amber-600' : 'text-amber-300' 
  },
  'Африка и Океания': { 
    bg: isLight ? 'from-emerald-100 to-green-100' : 'from-emerald-500/20 to-green-600/20', 
    border: isLight ? 'border-emerald-300' : 'border-emerald-500/30', 
    text: isLight ? 'text-emerald-600' : 'text-emerald-300' 
  },
});

export default function CountriesStep({ 
  selectedCountries,
  setSelectedCountries,
  excludedCountries: excludedCountriesProp, 
  setExcludedCountries: setExcludedCountriesProp, 
  onNext, 
  onBack 
}: CountriesStepProps) {
  const { themeName } = useTheme();
  const isLight = themeName === 'light';
  const regionGroupColors = getRegionGroupColors(isLight);
  
  const allCountries = getAllCountries();
  
  // Определяем режим работы
  // Если передан excludedCountries - используем его
  // Если передан selectedCountries - конвертируем в excludedCountries
  const useExcludedMode = excludedCountriesProp !== undefined || setExcludedCountriesProp !== undefined;
  
  // Вычисляем excludedCountries из props
  const excludedCountries = useMemo(() => {
    if (useExcludedMode) {
      return excludedCountriesProp || [];
    } else if (selectedCountries && selectedCountries.length > 0) {
      // Конвертируем selectedCountries в excludedCountries
      return allCountries.filter(c => !selectedCountries.includes(c));
    }
    // По умолчанию все исключены если selectedCountries пустой
    return allCountries;
  }, [useExcludedMode, excludedCountriesProp, selectedCountries, allCountries]);
  
  const setExcludedCountries = (newExcluded: string[]) => {
    if (useExcludedMode && setExcludedCountriesProp) {
      setExcludedCountriesProp(newExcluded);
    } else if (setSelectedCountries) {
      // Конвертируем excludedCountries обратно в selectedCountries
      const newSelected = allCountries.filter(c => !newExcluded.includes(c));
      setSelectedCountries(newSelected);
    }
  };
  
  // Активная группа регионов (вкладка) - "Все" показывает все страны
  const [activeGroup, setActiveGroup] = useState<string>('Все');
  
  // Активный подрегион внутри группы
  const [activeSubRegion, setActiveSubRegion] = useState<string>('СНГ');
  
  // Поиск стран
  const [searchQuery, setSearchQuery] = useState('');
  
  // Количество выбранных стран
  const selectedCount = allCountries.length - excludedCountries.length;

  // При смене группы - выбираем первый подрегион
  useEffect(() => {
    const subRegions = regionGroups[activeGroup] || [];
    if (subRegions.length > 0 && !subRegions.includes(activeSubRegion)) {
      setActiveSubRegion(subRegions[0]);
    }
  }, [activeGroup]);

  const toggleCountry = (country: string) => {
    if (excludedCountries.includes(country)) {
      setExcludedCountries(excludedCountries.filter(c => c !== country));
    } else {
      setExcludedCountries([...excludedCountries, country]);
    }
  };

  const selectAll = () => {
    setExcludedCountries([]);
  };

  const deselectAll = () => {
    setExcludedCountries([...allCountries]);
  };

  // Выбрать всю группу регионов
  const selectGroup = (groupName: string) => {
    const groupCountries = getCountriesByRegionGroup(groupName);
    setExcludedCountries(excludedCountries.filter(c => !groupCountries.includes(c)));
  };

  // Снять выбор со всей группы
  const deselectGroup = (groupName: string) => {
    const groupCountries = getCountriesByRegionGroup(groupName);
    const newExcluded = [...excludedCountries];
    groupCountries.forEach(c => {
      if (!newExcluded.includes(c)) newExcluded.push(c);
    });
    setExcludedCountries(newExcluded);
  };

  // Выбрать подрегион
  const selectSubRegion = (regionName: string) => {
    const regionCountries = allCountriesByRegion[regionName] || [];
    setExcludedCountries(excludedCountries.filter(c => !regionCountries.includes(c)));
  };

  // Снять подрегион
  const deselectSubRegion = (regionName: string) => {
    const regionCountries = allCountriesByRegion[regionName] || [];
    const newExcluded = [...excludedCountries];
    regionCountries.forEach(c => {
      if (!newExcluded.includes(c)) newExcluded.push(c);
    });
    setExcludedCountries(newExcluded);
  };

  // Фильтрация стран по поиску
  const getFilteredCountries = (countries: string[]) => {
    if (!searchQuery.trim()) return countries;
    const query = searchQuery.toLowerCase();
    return countries.filter(c => c.toLowerCase().includes(query));
  };

  // Текущие страны подрегиона (или все страны если выбрана вкладка "Все")
  const currentSubRegionCountries = activeGroup === 'Все' 
    ? allCountries 
    : (allCountriesByRegion[activeSubRegion] || []);
  const filteredCountries = getFilteredCountries(currentSubRegionCountries);

  // Статистика по группе регионов
  const getGroupStats = (groupName: string) => {
    const countries = getCountriesByRegionGroup(groupName);
    const selected = countries.filter(c => !excludedCountries.includes(c)).length;
    return { selected, total: countries.length };
  };

  // Статистика по подрегиону
  const getSubRegionStats = (regionName: string) => {
    const countries = allCountriesByRegion[regionName] || [];
    const selected = countries.filter(c => !excludedCountries.includes(c)).length;
    return { selected, total: countries.length };
  };

  return (
    <div className="animate-fade-up">
      <div className="mb-4 sm:mb-6">
        <div className="flex items-center gap-2.5 sm:gap-3 mb-3">
          <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br ${isLight ? 'from-purple-100 to-purple-200' : 'from-purple-500/20 to-purple-600/20'} flex items-center justify-center ring-1 ${isLight ? 'ring-purple-200' : 'ring-white/10'}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`${isLight ? 'text-purple-600' : 'text-purple-300'} sm:w-7 sm:h-7`}>
              <circle cx="12" cy="12" r="10"/>
              <line x1="2" y1="12" x2="22" y2="12"/>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
          </div>
          <div>
            <h2 className={`text-xl sm:text-3xl font-black bg-gradient-to-r ${isLight ? 'from-gray-900 to-gray-600' : 'from-white to-zinc-400'} bg-clip-text text-transparent`}>Страны распространения</h2>
            <p className={`text-xs sm:text-sm ${isLight ? 'text-gray-500' : 'text-zinc-500'} mt-0.5 sm:mt-1`}>Выберите страны для распространения релиза ({allCountries.length} стран)</p>
          </div>
        </div>
      </div>
      
      <div className={`relative p-4 sm:p-5 bg-gradient-to-br ${isLight ? 'from-purple-50 via-white to-purple-50 border-purple-200' : 'from-purple-500/10 via-transparent to-purple-600/10 border-purple-500/20'} border rounded-xl sm:rounded-2xl mb-4 sm:mb-6 overflow-hidden`}>
        {/* Общая статистика и кнопки */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-5">
          <div className="flex items-center justify-center sm:justify-start gap-3">
            <div className={`px-3 sm:px-4 py-1.5 sm:py-2 ${isLight ? 'bg-gray-100' : 'bg-white/5'} rounded-lg sm:rounded-xl border ${isLight ? 'border-gray-200' : 'border-white/10'}`}>
              <span className={`${isLight ? 'text-gray-600' : 'text-zinc-400'} text-xs sm:text-sm`}>Выбрано:</span>
              <span className={`ml-2 font-bold ${isLight ? 'text-gray-900' : 'text-white'} text-base sm:text-lg`}>{selectedCount}</span>
              <span className={`${isLight ? 'text-gray-500' : 'text-zinc-500'} text-xs sm:text-sm`}>/{allCountries.length}</span>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              type="button"
              onClick={selectAll}
              className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 ${isLight ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-600' : 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-300'} border rounded-lg text-xs sm:text-sm font-medium transition-all touch-manipulation`}
            >
              ✓ Выбрать все
            </button>
            <button
              type="button"
              onClick={deselectAll}
              className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 ${isLight ? 'bg-gray-100 hover:bg-gray-200 border-gray-200 text-gray-700' : 'bg-white/5 hover:bg-white/10 border-white/10 text-zinc-300'} border rounded-lg text-xs sm:text-sm font-medium transition-all touch-manipulation`}
            >
              ✕ Снять все
            </button>
          </div>
        </div>
        
        {/* 5 вкладок: Все + 4 группы регионов */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 sm:gap-3 mb-4 sm:mb-5">
          {/* Вкладка "Все" */}
          <button
            onClick={() => setActiveGroup('Все')}
            className={`relative p-3 sm:p-4 rounded-lg sm:rounded-xl font-medium transition-all touch-manipulation ${
              activeGroup === 'Все' 
                ? `bg-gradient-to-br ${isLight ? 'from-violet-100 to-purple-100 border-violet-400' : 'from-violet-500/20 to-purple-600/20 border-violet-500/30'} border-2 shadow-lg` 
                : `${isLight ? 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300' : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'} border`
            }`}
          >
            <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
              <div className={activeGroup === 'Все' ? (isLight ? 'text-violet-600' : 'text-violet-300') : (isLight ? 'text-gray-500' : 'text-zinc-400')}>
                <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 sm:w-6 sm:h-6">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
              </div>
              <div className={`font-bold text-base sm:text-lg ${activeGroup === 'Все' ? (isLight ? 'text-gray-900' : 'text-white') : (isLight ? 'text-gray-700' : 'text-zinc-300')}`}>Все</div>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-full h-1.5 rounded-full ${isLight ? 'bg-gray-200' : 'bg-white/10'} overflow-hidden`}>
                <div 
                  className={`h-full rounded-full transition-all ${
                    selectedCount === allCountries.length ? 'bg-emerald-500' :
                    selectedCount > 0 ? 'bg-amber-500' :
                    'bg-zinc-600'
                  }`}
                  style={{ width: `${(selectedCount / allCountries.length) * 100}%` }}
                />
              </div>
              <span className={`text-xs font-medium min-w-[45px] text-right ${
                selectedCount === allCountries.length ? 'text-emerald-400' :
                selectedCount > 0 ? 'text-amber-400' :
                (isLight ? 'text-gray-500' : 'text-zinc-500')
              }`}>
                {selectedCount}/{allCountries.length}
              </span>
            </div>
          </button>
          
          {Object.keys(regionGroups).map((groupName) => {
            const stats = getGroupStats(groupName);
            const colors = regionGroupColors[groupName];
            const isActive = activeGroup === groupName;
            const isFullySelected = stats.selected === stats.total;
            const isPartiallySelected = stats.selected > 0 && stats.selected < stats.total;
            
            return (
              <button
                key={groupName}
                onClick={() => setActiveGroup(groupName)}
                className={`relative p-3 sm:p-4 rounded-lg sm:rounded-xl font-medium transition-all touch-manipulation ${
                  isActive 
                    ? `bg-gradient-to-br ${colors.bg} ${colors.border} border-2 shadow-lg` 
                    : `${isLight ? 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300' : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'} border`
                }`}
              >
                <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
                  <div className={`${isActive ? colors.text : (isLight ? 'text-gray-500' : 'text-zinc-400')} [&_svg]:w-5 [&_svg]:h-5 sm:[&_svg]:w-6 sm:[&_svg]:h-6`}>
                    {regionGroupIcons[groupName]}
                  </div>
                  <div className={`font-bold text-sm sm:text-lg truncate ${isActive ? (isLight ? 'text-gray-900' : 'text-white') : (isLight ? 'text-gray-700' : 'text-zinc-300')}`}>{groupName}</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-full h-1.5 rounded-full ${isLight ? 'bg-gray-200' : 'bg-white/10'} overflow-hidden`}>
                    <div 
                      className={`h-full rounded-full transition-all ${
                        isFullySelected ? 'bg-emerald-500' :
                        isPartiallySelected ? 'bg-amber-500' :
                        'bg-zinc-600'
                      }`}
                      style={{ width: `${(stats.selected / stats.total) * 100}%` }}
                    />
                  </div>
                  <span className={`text-xs font-medium min-w-[45px] text-right ${
                    isFullySelected ? 'text-emerald-400' :
                    isPartiallySelected ? 'text-amber-400' :
                    (isLight ? 'text-gray-500' : 'text-zinc-500')
                  }`}>
                    {stats.selected}/{stats.total}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Кнопки выбора всей группы (скрываем для "Все") */}
        {activeGroup !== 'Все' && (
        <div className={`flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4 pb-4 border-b ${isLight ? 'border-gray-200' : 'border-white/10'}`}>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {(regionGroups[activeGroup] || []).map((subRegion) => {
              const stats = getSubRegionStats(subRegion);
              const isActive = activeSubRegion === subRegion;
              const isFullySelected = stats.selected === stats.total;
              
              return (
                <button
                  key={subRegion}
                  onClick={() => setActiveSubRegion(subRegion)}
                  className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 sm:gap-2 touch-manipulation ${
                    isActive 
                      ? `${isLight ? 'bg-gray-200 border-gray-300 text-gray-900' : 'bg-white/15 border-white/20 text-white'} border` 
                      : `${isLight ? 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-800' : 'bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10 hover:text-zinc-300'} border`
                  }`}
                >
                  <RegionIcon region={subRegion} className="w-4 h-4" />
                  <span>{subRegion}</span>
                  <span className={`px-1.5 py-0.5 rounded text-xs ${
                    isFullySelected ? 'bg-emerald-500/30 text-emerald-300' : (isLight ? 'bg-gray-200 text-gray-500' : 'bg-white/10 text-zinc-500')
                  }`}>
                    {stats.selected}/{stats.total}
                  </span>
                </button>
              );
            })}
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => selectGroup(activeGroup)}
              className={`flex-1 sm:flex-none px-2.5 sm:px-3 py-1.5 sm:py-2 ${isLight ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-600' : 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-300'} border rounded-lg text-[10px] sm:text-xs font-medium transition-all whitespace-nowrap touch-manipulation`}
            >
              ✓ Вся {activeGroup}
            </button>
            <button
              type="button"
              onClick={() => deselectGroup(activeGroup)}
              className={`flex-1 sm:flex-none px-2.5 sm:px-3 py-1.5 sm:py-2 ${isLight ? 'bg-gray-100 hover:bg-gray-200 border-gray-200 text-gray-600' : 'bg-white/5 hover:bg-white/10 border-white/10 text-zinc-400'} border rounded-lg text-[10px] sm:text-xs font-medium transition-all whitespace-nowrap touch-manipulation`}
            >
              ✕ Снять
            </button>
          </div>
        </div>
        )}
        
        {/* Панель управления подрегионом */}
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
              placeholder="Поиск страны..."
              className={`w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 ${isLight ? 'bg-white border-gray-200 text-gray-900 placeholder-gray-400' : 'bg-white/5 border-white/10 text-white placeholder-zinc-500'} border rounded-lg sm:rounded-xl text-sm sm:text-base focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all`}
            />
          </div>
          
          {/* Кнопки управления подрегионом (скрываем для "Все") */}
          {activeGroup !== 'Все' && (
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => selectSubRegion(activeSubRegion)}
              className={`flex-1 sm:flex-none px-2.5 sm:px-3 py-1.5 sm:py-2 ${isLight ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-600' : 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-300'} border rounded-lg text-[10px] sm:text-xs font-medium transition-all touch-manipulation`}
            >
              ✓ Весь {activeSubRegion}
            </button>
            <button
              type="button"
              onClick={() => deselectSubRegion(activeSubRegion)}
              className={`flex-1 sm:flex-none px-2.5 sm:px-3 py-1.5 sm:py-2 ${isLight ? 'bg-gray-100 hover:bg-gray-200 border-gray-200 text-gray-600' : 'bg-white/5 hover:bg-white/10 border-white/10 text-zinc-400'} border rounded-lg text-[10px] sm:text-xs font-medium transition-all touch-manipulation`}
            >
              ✕ Снять
            </button>
          </div>
          )}
        </div>
        
        {/* Сетка стран */}
        <div className="max-h-[300px] sm:max-h-[400px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {filteredCountries.length === 0 ? (
            <div className={`text-center py-8 sm:py-10 ${isLight ? 'text-gray-500' : 'text-zinc-500'}`}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="mx-auto mb-3 opacity-50 w-10 h-10 sm:w-12 sm:h-12" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <p className="text-xs sm:text-sm">Страны не найдены</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1.5 sm:gap-2">
              {filteredCountries.map(country => {
                const isExcluded = excludedCountries.includes(country);
                return (
                  <button
                    key={country}
                    onClick={() => toggleCountry(country)}
                    className={`group relative px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all overflow-hidden touch-manipulation ${
                      isExcluded
                        ? `${isLight ? 'bg-gray-50 border-gray-200 text-gray-400 hover:border-gray-300 hover:bg-gray-100' : 'bg-white/[0.02] border-white/5 text-zinc-500 hover:border-white/20 hover:bg-white/5'} border`
                        : `${isLight ? 'bg-emerald-50 border-emerald-300 text-gray-900 hover:border-emerald-400 hover:shadow-md' : 'bg-gradient-to-br from-emerald-500/15 to-green-500/10 border-emerald-500/30 text-white hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10'} border`
                    }`}
                  >
                    <div className="relative flex items-center gap-2">
                      <CountryFlag country={country} className="w-5 h-4 flex-shrink-0 rounded-sm" />
                      <span className={`truncate ${isExcluded ? 'line-through opacity-50' : ''}`}>{country}</span>
                      {!isExcluded && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" className={`ml-auto ${isLight ? 'text-emerald-600' : 'text-emerald-400'} flex-shrink-0`} strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      )}
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
        <button onClick={onNext} className={`px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-[#6050ba] to-[#7060ca] hover:from-[#7060ca] hover:to-[#8070da] rounded-xl font-bold transition flex items-center gap-2 ${isLight ? 'shadow-md shadow-purple-300/30' : 'shadow-lg shadow-purple-500/20'} text-sm sm:text-base touch-manipulation`} style={{ color: 'white' }}>
          Далее
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-4 h-4"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>
    </div>
  );
}
