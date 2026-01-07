"use client";
import React from 'react';
import { Release } from './types';
import { UserRole } from '../../lib/types';
import ReleaseCard, { AddReleaseCard } from './ReleaseCard';
import { useTheme } from '@/contexts/ThemeContext';

interface ReleasesGridProps {
  releases: Release[];
  userRole?: UserRole;
  showArchive: boolean;
  onReleaseClick: (release: Release) => void;
  onAddRelease: () => void;
  totalCount: number;
  draftsCount?: number;
  hasFilters: boolean;
  onResetFilters: () => void;
  onDeleteDraft?: (releaseId: string) => void;
  onDragStart?: (releaseId: string) => void;
  onDragEnd?: () => void;
  draggingReleaseId?: string | null;
  onDragEnter?: (releaseId: string) => void;
  dropTargetId?: string | null;
  onDrop?: (e: React.DragEvent) => void;
}

export default function ReleasesGrid({
  releases,
  userRole,
  showArchive,
  onReleaseClick,
  onAddRelease,
  totalCount,
  draftsCount = 0,
  hasFilters,
  onResetFilters,
  onDeleteDraft,
  onDragStart,
  onDragEnd,
  draggingReleaseId,
  onDragEnter,
  dropTargetId,
  onDrop
}: ReleasesGridProps) {
  // Вычисляем количество колонок для разных экранов
  const getColumns = () => {
    if (typeof window === 'undefined') return 5;
    const width = window.innerWidth;
    if (width < 640) return 2;  // sm
    if (width < 768) return 3;  // md
    if (width < 1024) return 4; // lg
    return 5;
  };

  const [columns, setColumns] = React.useState(getColumns());

  React.useEffect(() => {
    const handleResize = () => setColumns(getColumns());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Пустое состояние
  if (releases.length === 0) {
    return <EmptyState 
      showArchive={showArchive}
      totalCount={totalCount}
      draftsCount={draftsCount}
      userRole={userRole}
      hasFilters={hasFilters}
      onAddRelease={onAddRelease}
      onResetFilters={onResetFilters}
    />;
  }

  return (
    <div 
      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 auto-rows-fr"
      style={{
        gridAutoRows: '1fr'
      }}
      onDrop={onDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      {/* Карточка добавления релиза - показывается всегда */}
      {userRole && <AddReleaseCard onClick={onAddRelease} />}

      {/* Карточки релизов */}
      {releases.map((release, index) => {
        const isDraggingThis = draggingReleaseId === release.id;
        const isTarget = dropTargetId === release.id;
        
        // Пропускаем перетаскиваемый элемент - он будет скрыт через ReleaseCard
        
        return (
          <div 
            key={release.id} 
            className="relative"
            style={{
              transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
              transformOrigin: 'center center'
            }}
          >
            {/* Улучшенный Placeholder индикатор */}
            {isTarget && draggingReleaseId && !isDraggingThis && (
              <div className="absolute inset-0 rounded-2xl pointer-events-none z-10 overflow-hidden">
                {/* Анимированная граница */}
                <div className="absolute inset-0 rounded-2xl border-2 border-dashed border-purple-400 bg-gradient-to-br from-purple-500/20 to-blue-500/20 backdrop-blur-sm">
                  {/* Пульсирующее свечение */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-400/30 to-transparent animate-pulse" />
                </div>
                
                {/* Индикатор "Вставить сюда" */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-xl shadow-purple-500/50 flex items-center gap-1 animate-bounce">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M19 14l-7 7m0 0l-7-7m7 7V3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Вставить
                  </div>
                </div>
              </div>
            )}
            
            <ReleaseCard
              release={release}
              onClick={() => onReleaseClick(release)}
              onDelete={onDeleteDraft}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              isDragging={isDraggingThis}
              onDragEnter={onDragEnter}
              isDropTarget={isTarget}
            />
          </div>
        );
      })}
    </div>
  );
}

// Компонент пустого состояния
interface EmptyStateProps {
  showArchive: boolean;
  totalCount: number;
  draftsCount: number;
  userRole?: UserRole;
  hasFilters: boolean;
  onAddRelease: () => void;
  onResetFilters: () => void;
}

function EmptyState({ 
  showArchive, 
  totalCount, 
  draftsCount,
  userRole, 
  hasFilters, 
  onAddRelease,
  onResetFilters 
}: EmptyStateProps) {
  const { themeName } = useTheme();
  const isLight = themeName === 'light';
  
  // Нет релизов (кроме черновиков) - показываем "Начните свой путь"
  const isEmpty = totalCount === 0;
  // Показываем кнопку создания в обычном режиме (не архив)
  const showAddButton = !showArchive;

  return (
    <div 
      className="col-span-full flex items-center justify-center pt-12 pb-24"
      style={{ minHeight: showArchive ? 'auto' : '600px' }}
    >
      <div className="text-center max-w-md p-8">
        {/* Иконка - улучшенный дизайн с glassmorphism */}
        <div className="relative inline-block mb-8">
          {/* Размытое свечение */}
          <div 
            className="absolute inset-0 rounded-3xl"
            style={{ 
              background: isLight 
                ? 'radial-gradient(circle, rgba(138, 99, 210, 0.25) 0%, transparent 70%)'
                : 'radial-gradient(circle, rgba(168, 85, 247, 0.3) 0%, transparent 70%)',
              filter: 'blur(30px)',
              transform: 'scale(1.5)',
            }}
          />
          {/* Контейнер иконки */}
          <div 
            className="relative w-32 h-32 mx-auto rounded-3xl flex items-center justify-center"
            style={{
              background: isLight 
                ? 'linear-gradient(145deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.85) 100%)'
                : 'linear-gradient(145deg, rgba(39, 39, 42, 0.8) 0%, rgba(24, 24, 27, 0.9) 100%)',
              backdropFilter: 'blur(20px)',
              border: isLight 
                ? '2px solid rgba(138, 99, 210, 0.3)'
                : '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: isLight 
                ? '0 20px 60px rgba(138, 99, 210, 0.25), 0 0 40px rgba(138, 99, 210, 0.1), inset 0 1px 0 rgba(255, 255, 255, 1)'
                : '0 20px 60px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            }}
          >
            {/* Музыкальная иконка с градиентом */}
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #8a63d2 0%, #a78bfa 100%)',
                boxShadow: '0 8px 24px rgba(138, 99, 210, 0.4)',
              }}
            >
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
              </svg>
            </div>
          </div>
        </div>
        
        {/* Заголовок */}
        <h3 
          className="text-2xl font-black mb-4 uppercase tracking-tight"
          style={{ 
            color: isLight ? '#1a1535' : '#ffffff',
          }}
        >
          {showArchive 
            ? 'Архив пуст'
            : isEmpty ? 'Начните свой путь' : 'Ничего не найдено'
          }
        </h3>
        
        {/* Описание */}
        <p 
          className="text-sm leading-relaxed mb-8"
          style={{ 
            color: isLight ? '#5c5580' : '#a1a1aa',
            maxWidth: '320px',
            margin: '0 auto 2rem',
          }}
        >
          {showArchive
            ? 'В архиве пока нет черновиков. Сохраненные черновики будут отображаться здесь.'
            : isEmpty 
              ? 'У вас пока нет релизов. Создайте свой первый релиз и начните путь к успеху в музыкальной индустрии.'
              : 'По вашему запросу релизов не найдено. Попробуйте изменить параметры поиска или фильтры.'
          }
        </p>
        
        {/* Кнопки действий - показываем всегда в обычном режиме (не архив) */}
        {showAddButton && (
          <AddFirstReleaseButton 
            userRole={userRole}
            onAddRelease={onAddRelease}
          />
        )}
        
        {/* Кнопка сброса фильтров */}
        {hasFilters && !isEmpty && (
          <button
            onClick={onResetFilters}
            className={`inline-flex items-center gap-2 px-6 py-3 font-bold rounded-xl transition-all duration-300 border mt-3 ${isLight ? 'bg-white/80 hover:bg-white text-[#1a1535] border-gray-300 hover:border-purple-400 shadow-sm' : 'bg-white/5 hover:bg-white/10 text-white border-white/10'}`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Сбросить фильтры
          </button>
        )}
      </div>
    </div>
  );
}

// Кнопка добавления первого релиза - улучшенный дизайн
interface AddFirstReleaseButtonProps {
  userRole?: UserRole;
  onAddRelease: () => void;
}

function AddFirstReleaseButton({ userRole, onAddRelease }: AddFirstReleaseButtonProps) {
  const { themeName } = useTheme();
  const isLight = themeName === 'light';
  
  if (!userRole) return null;

  return (
    <button
      onClick={onAddRelease}
      className="inline-flex items-center gap-3 px-8 py-4 font-bold rounded-2xl transition-all duration-300 group"
      style={{ 
        background: 'linear-gradient(135deg, #8a63d2 0%, #a78bfa 50%, #8a63d2 100%)',
        backgroundSize: '200% 200%',
        color: '#ffffff',
        boxShadow: '0 10px 40px rgba(138, 99, 210, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)',
        border: 'none',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundPosition = '100% 100%';
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = '0 16px 50px rgba(138, 99, 210, 0.55), 0 0 60px rgba(138, 99, 210, 0.25)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundPosition = '0% 0%';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 10px 40px rgba(138, 99, 210, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)';
      }}
    >
      <svg className="w-5 h-5 transition-transform duration-300 group-hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
      <span>Добавить первый релиз</span>
    </button>
  );
}
