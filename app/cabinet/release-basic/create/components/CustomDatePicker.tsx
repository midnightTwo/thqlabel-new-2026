'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface CustomDatePickerProps {
  value: string; // формат: YYYY-MM-DD или DD.MM.YYYY
  onChange: (value: string) => void;
  isLight?: boolean;
  placeholder?: string;
  error?: string | null;
  hasValue?: boolean;
}

const MONTHS_RU = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

const WEEKDAYS_RU = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

function parseDate(value: string): Date | null {
  if (!value) return null;
  // Try YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  // Try DD.MM.YYYY
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(value)) {
    const [d, m, y] = value.split('.').map(Number);
    return new Date(y, m - 1, d);
  }
  return null;
}

function formatToYYYYMMDD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatToDisplay(date: Date): string {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}.${m}.${y}`;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  // 0 = Sunday, convert to Monday-first (0 = Monday)
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

export default function CustomDatePicker({
  value,
  onChange,
  isLight = false,
  placeholder = 'Выберите дату',
  error,
  hasValue
}: CustomDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const parsedDate = parseDate(value);
  const today = new Date();
  
  const [viewYear, setViewYear] = useState(parsedDate?.getFullYear() || today.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsedDate?.getMonth() ?? today.getMonth());
  const [showYearPicker, setShowYearPicker] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setShowYearPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  // Close on scroll
  useEffect(() => {
    if (!isOpen) return;
    const handleScroll = () => {
      setIsOpen(false);
      setShowYearPicker(false);
    };
    // Listen to scroll on window and any scrollable parent
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [isOpen]);

  // Position dropdown
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const openAbove = spaceBelow < 350 && rect.top > 350;
      
      setDropdownStyle({
        position: 'fixed',
        left: Math.max(8, Math.min(rect.left, window.innerWidth - 300)),
        top: openAbove ? rect.top - 340 : rect.bottom + 4,
        zIndex: 999999,
      });
    }
  }, [isOpen]);

  const handleSelectDate = (day: number) => {
    const selected = new Date(viewYear, viewMonth, day);
    onChange(formatToYYYYMMDD(selected));
    setIsOpen(false);
  };

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const handleYearSelect = (year: number) => {
    setViewYear(year);
    setShowYearPicker(false);
  };

  const handleClear = () => {
    onChange('');
    setIsOpen(false);
  };

  const handleToday = () => {
    const todayDate = new Date();
    onChange(formatToYYYYMMDD(todayDate));
    setViewYear(todayDate.getFullYear());
    setViewMonth(todayDate.getMonth());
    setIsOpen(false);
  };

  // Generate calendar grid
  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const prevMonthDays = getDaysInMonth(viewYear, viewMonth - 1);
  
  const calendarDays: { day: number; isCurrentMonth: boolean; isToday: boolean; isSelected: boolean }[] = [];
  
  // Previous month days
  for (let i = firstDay - 1; i >= 0; i--) {
    calendarDays.push({
      day: prevMonthDays - i,
      isCurrentMonth: false,
      isToday: false,
      isSelected: false
    });
  }
  
  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const isToday = d === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();
    const isSelected = parsedDate && d === parsedDate.getDate() && viewMonth === parsedDate.getMonth() && viewYear === parsedDate.getFullYear();
    calendarDays.push({ day: d, isCurrentMonth: true, isToday, isSelected: !!isSelected });
  }
  
  // Next month days to fill 6 rows
  const remaining = 42 - calendarDays.length;
  for (let d = 1; d <= remaining; d++) {
    calendarDays.push({ day: d, isCurrentMonth: false, isToday: false, isSelected: false });
  }

  // Year picker range
  const yearRange: number[] = [];
  for (let y = viewYear - 50; y <= viewYear + 10; y++) {
    yearRange.push(y);
  }

  const displayValue = parsedDate ? formatToDisplay(parsedDate) : '';

  const inputClasses = `w-full px-4 py-3.5 rounded-2xl text-base font-medium transition-all outline-none border-2 text-left flex items-center justify-between gap-2 ${
    error ? 'border-red-500/60 bg-red-500/5'
    : hasValue
      ? isLight ? 'border-emerald-400/60 bg-emerald-50/50'
                : 'border-emerald-500/40 bg-emerald-500/5'
      : isLight ? 'border-gray-200 bg-white hover:border-gray-300'
                : 'border-white/10 bg-white/5 hover:border-white/20'
  } ${isLight ? 'text-gray-900' : 'text-white'} cursor-pointer`;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={inputClasses}
      >
        <span className={displayValue ? (isLight ? 'text-gray-900' : 'text-white') : (isLight ? 'text-gray-400' : 'text-zinc-500')}>
          {displayValue || placeholder}
        </span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`flex-shrink-0 ${isLight ? 'text-gray-500' : 'text-zinc-500'}`}>
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      </button>

      {mounted && isOpen && createPortal(
        <div
          ref={dropdownRef}
          style={dropdownStyle}
          className={`w-[290px] rounded-2xl shadow-2xl border overflow-hidden ${
            isLight 
              ? 'bg-white border-gray-200 shadow-gray-200/50' 
              : 'bg-[#1a1a1f] border-white/10 shadow-black/50'
          }`}
        >
          {/* Header */}
          <div className={`px-4 py-3 flex items-center justify-between border-b ${isLight ? 'border-gray-100' : 'border-white/5'}`}>
            <button
              type="button"
              onClick={handlePrevMonth}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                isLight ? 'hover:bg-gray-100 text-gray-600' : 'hover:bg-white/10 text-zinc-400'
              }`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
            
            <button
              type="button"
              onClick={() => setShowYearPicker(!showYearPicker)}
              className={`px-3 py-1.5 rounded-lg font-bold text-sm transition-colors ${
                isLight 
                  ? 'hover:bg-purple-50' 
                  : 'hover:bg-white/10'
              }`}
            >
              <span style={{ color: isLight ? '#1f2937' : '#ffffff' }}>
                {MONTHS_RU[viewMonth]} {viewYear}
              </span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={isLight ? '#1f2937' : '#ffffff'} strokeWidth="2" className="inline-block ml-1">
                <polyline points={showYearPicker ? "18 15 12 9 6 15" : "6 9 12 15 18 9"}/>
              </svg>
            </button>
            
            <button
              type="button"
              onClick={handleNextMonth}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                isLight ? 'hover:bg-gray-100 text-gray-600' : 'hover:bg-white/10 text-zinc-400'
              }`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          </div>

          {showYearPicker ? (
            /* Year picker */
            <div className="p-2 max-h-[250px] overflow-y-auto scrollbar-thin">
              <div className="grid grid-cols-4 gap-1">
                {yearRange.map(year => (
                  <button
                    key={year}
                    type="button"
                    onClick={() => handleYearSelect(year)}
                    style={year === viewYear ? { color: '#ffffff' } : undefined}
                    className={`py-2 px-1 rounded-lg text-sm font-medium transition-colors ${
                      year === viewYear
                        ? 'bg-[#6050ba]'
                        : year === today.getFullYear()
                          ? isLight 
                            ? 'bg-purple-50 text-purple-700 hover:bg-purple-100' 
                            : 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30'
                          : isLight 
                            ? 'hover:bg-gray-100 text-gray-900' 
                            : 'hover:bg-white/10 text-zinc-300'
                    }`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Weekdays header */}
              <div className={`grid grid-cols-7 gap-1 px-2 py-2 text-center text-xs font-semibold ${isLight ? 'text-gray-500' : 'text-zinc-500'}`}>
                {WEEKDAYS_RU.map(day => (
                  <div key={day} className="py-1">{day}</div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1 px-2 pb-2">
                {calendarDays.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => item.isCurrentMonth && handleSelectDate(item.day)}
                    disabled={!item.isCurrentMonth}
                    style={item.isSelected ? { color: '#ffffff' } : undefined}
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                      item.isSelected
                        ? 'bg-[#6050ba] shadow-lg shadow-[#6050ba]/30'
                        : item.isToday
                          ? isLight 
                            ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' 
                            : 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30'
                          : item.isCurrentMonth
                            ? isLight 
                              ? 'hover:bg-gray-100 text-gray-900' 
                              : 'hover:bg-white/10 text-white'
                            : isLight 
                              ? 'text-gray-300 cursor-default' 
                              : 'text-zinc-700 cursor-default'
                    } ${item.isCurrentMonth ? 'cursor-pointer' : ''}`}
                  >
                    {item.day}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Footer */}
          <div className={`px-3 py-2 flex items-center justify-between border-t ${isLight ? 'border-gray-200' : 'border-white/5'}`}>
            <button
              type="button"
              onClick={handleClear}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                isLight 
                  ? 'text-red-600 hover:bg-red-50' 
                  : 'text-red-400 hover:bg-red-500/10'
              }`}
            >
              Очистить
            </button>
            <button
              type="button"
              onClick={handleToday}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                isLight 
                  ? 'text-[#6050ba] hover:bg-purple-50' 
                  : 'text-purple-400 hover:bg-purple-500/10'
              }`}
            >
              Сегодня
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
