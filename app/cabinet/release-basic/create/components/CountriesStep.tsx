import React, { useState, useEffect, useMemo } from 'react';
import { CountryFlag, allCountriesByRegion, regionGroups, getCountriesByRegionGroup, getAllCountries } from '@/components/icons/CountryFlagsSVG';
import { RegionIcon } from '@/components/icons/RegionIcons';

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

// Цвета для групп регионов
const regionGroupColors: Record<string, { bg: string; border: string; text: string }> = {
  'Европа': { bg: 'from-blue-500/20 to-indigo-600/20', border: 'border-blue-500/30', text: 'text-blue-300' },
  'Америка': { bg: 'from-red-500/20 to-orange-600/20', border: 'border-red-500/30', text: 'text-red-300' },
  'Азия': { bg: 'from-amber-500/20 to-yellow-600/20', border: 'border-amber-500/30', text: 'text-amber-300' },
  'Африка и Океания': { bg: 'from-emerald-500/20 to-green-600/20', border: 'border-emerald-500/30', text: 'text-emerald-300' },
};

export default function CountriesStep({ 
  selectedCountries,
  setSelectedCountries,
  excludedCountries: excludedCountriesProp, 
  setExcludedCountries: setExcludedCountriesProp, 
  onNext, 
  onBack 
}: CountriesStepProps) {
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
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 flex items-center justify-center ring-1 ring-white/10">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-300">
              <circle cx="12" cy="12" r="10"/>
              <line x1="2" y1="12" x2="22" y2="12"/>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
          </div>
          <div>
            <h2 className="text-3xl font-black bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">Страны распространения</h2>
            <p className="text-sm text-zinc-500 mt-1">Выберите страны для распространения релиза ({allCountries.length} стран)</p>
          </div>
        </div>
      </div>
      
      <div className="relative p-5 bg-gradient-to-br from-purple-500/10 via-transparent to-purple-600/10 border border-purple-500/20 rounded-2xl mb-6 overflow-hidden">
        {/* Общая статистика и кнопки */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/10">
              <span className="text-zinc-400 text-sm">Выбрано:</span>
              <span className="ml-2 font-bold text-white text-lg">{selectedCount}</span>
              <span className="text-zinc-500 text-sm">/{allCountries.length}</span>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              type="button"
              onClick={selectAll}
              className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-lg text-sm font-medium transition-all"
            >
              ✓ Выбрать все
            </button>
            <button
              type="button"
              onClick={deselectAll}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 rounded-lg text-sm font-medium transition-all"
            >
              ✕ Снять все
            </button>
          </div>
        </div>
        
        {/* 5 вкладок: Все + 4 группы регионов */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
          {/* Вкладка "Все" */}
          <button
            onClick={() => setActiveGroup('Все')}
            className={`relative p-4 rounded-xl font-medium transition-all ${
              activeGroup === 'Все' 
                ? 'bg-gradient-to-br from-violet-500/20 to-purple-600/20 border-violet-500/30 border-2 shadow-lg' 
                : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={activeGroup === 'Все' ? 'text-violet-300' : 'text-zinc-400'}>
                <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
              </div>
              <div className={`font-bold text-lg ${activeGroup === 'Все' ? 'text-white' : 'text-zinc-300'}`}>Все</div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
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
                'text-zinc-500'
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
                className={`relative p-4 rounded-xl font-medium transition-all ${
                  isActive 
                    ? `bg-gradient-to-br ${colors.bg} ${colors.border} border-2 shadow-lg` 
                    : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={isActive ? colors.text : 'text-zinc-400'}>
                    {regionGroupIcons[groupName]}
                  </div>
                  <div className={`font-bold text-lg ${isActive ? 'text-white' : 'text-zinc-300'}`}>{groupName}</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-full h-1.5 rounded-full bg-white/10 overflow-hidden`}>
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
                    'text-zinc-500'
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
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
          <div className="flex flex-wrap gap-2">
            {(regionGroups[activeGroup] || []).map((subRegion) => {
              const stats = getSubRegionStats(subRegion);
              const isActive = activeSubRegion === subRegion;
              const isFullySelected = stats.selected === stats.total;
              
              return (
                <button
                  key={subRegion}
                  onClick={() => setActiveSubRegion(subRegion)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                    isActive 
                      ? 'bg-white/15 border border-white/20 text-white' 
                      : 'bg-white/5 border border-white/5 text-zinc-400 hover:bg-white/10 hover:text-zinc-300'
                  }`}
                >
                  <RegionIcon region={subRegion} className="w-4 h-4" />
                  <span>{subRegion}</span>
                  <span className={`px-1.5 py-0.5 rounded text-xs ${
                    isFullySelected ? 'bg-emerald-500/30 text-emerald-300' : 'bg-white/10 text-zinc-500'
                  }`}>
                    {stats.selected}/{stats.total}
                  </span>
                </button>
              );
            })}
          </div>
          
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => selectGroup(activeGroup)}
              className="px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-lg text-xs font-medium transition-all whitespace-nowrap"
            >
              ✓ Вся {activeGroup}
            </button>
            <button
              type="button"
              onClick={() => deselectGroup(activeGroup)}
              className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 rounded-lg text-xs font-medium transition-all whitespace-nowrap"
            >
              ✕ Снять
            </button>
          </div>
        </div>
        )}
        
        {/* Панель управления подрегионом */}
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
              placeholder="Поиск страны..."
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all"
            />
          </div>
          
          {/* Кнопки управления подрегионом (скрываем для "Все") */}
          {activeGroup !== 'Все' && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => selectSubRegion(activeSubRegion)}
              className="px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-lg text-xs font-medium transition-all"
            >
              ✓ Весь {activeSubRegion}
            </button>
            <button
              type="button"
              onClick={() => deselectSubRegion(activeSubRegion)}
              className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 rounded-lg text-xs font-medium transition-all"
            >
              ✕ Снять
            </button>
          </div>
          )}
        </div>
        
        {/* Сетка стран */}
        <div className="max-h-[400px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {filteredCountries.length === 0 ? (
            <div className="text-center py-10 text-zinc-500">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="mx-auto mb-3 opacity-50" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <p>Страны не найдены</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {filteredCountries.map(country => {
                const isExcluded = excludedCountries.includes(country);
                return (
                  <button
                    key={country}
                    onClick={() => toggleCountry(country)}
                    className={`group relative px-3 py-2.5 rounded-xl text-sm font-medium transition-all overflow-hidden ${
                      isExcluded
                        ? 'bg-white/[0.02] border border-white/5 text-zinc-500 hover:border-white/20 hover:bg-white/5'
                        : 'bg-gradient-to-br from-emerald-500/15 to-green-500/10 border border-emerald-500/30 text-white hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10'
                    }`}
                  >
                    <div className="relative flex items-center gap-2">
                      <CountryFlag country={country} className="w-5 h-4 flex-shrink-0 rounded-sm" />
                      <span className={`truncate ${isExcluded ? 'line-through opacity-50' : ''}`}>{country}</span>
                      {!isExcluded && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="ml-auto text-emerald-400 flex-shrink-0" strokeWidth="2.5">
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

      <div className="mt-6 pt-5 border-t border-white/10 flex justify-between">
        <button onClick={onBack} className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold transition flex items-center gap-2 border border-white/10">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          Назад
        </button>
        <button onClick={onNext} className="px-8 py-3 bg-gradient-to-r from-[#6050ba] to-[#7060ca] hover:from-[#7060ca] hover:to-[#8070da] rounded-xl font-bold transition flex items-center gap-2 shadow-lg shadow-purple-500/20">
          Далее
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>
    </div>
  );
}
