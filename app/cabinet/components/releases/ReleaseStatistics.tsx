"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useTheme } from '@/contexts/ThemeContext';

interface ReleaseStatisticsProps {
  releaseId: string;
  releaseType: 'basic' | 'exclusive';
  coverUrl?: string;
}

interface StatData {
  totalStreams: number;
  totalRevenue: number;
  platforms: Array<{ name: string; streams: number; revenue: number }>;
  countries: Array<{ name: string; streams: number; revenue: number; code: string }>;
  quarters: Array<{ quarter: string; year: number; streams: number; revenue: number }>;
  tracks: Array<{ 
    title: string; 
    index: number;
    streams: number; 
    revenue: number;
    platforms: Array<{ name: string; streams: number; revenue: number }>;
  }>;
}

// Цвета платформ
const platformColors: Record<string, string> = {
  spotify: '#4ADE80',    // мягкий зелёный
  apple: '#F87171',      // мягкий красно-розовый
  yandex: '#FB923C',     // мягкий оранжевый
  vk: '#60A5FA',         // мягкий синий
  youtube: '#F87171',    // мягкий красный
  deezer: '#FBBF24',     // мягкий жёлтый
  tiktok: '#2DD4BF',     // мягкий бирюзовый
  soundcloud: '#FB923C', // мягкий оранжевый
  amazon: '#FBBF24',     // мягкий жёлтый
  tidal: '#67E8F9',      // мягкий голубой
  default: '#C084FC'     // мягкий фиолетовый
};

// Коды стран для SVG флагов
const countryToCode: Record<string, string> = {
  'Russia': 'RU', 'Russian Federation': 'RU', 'Россия': 'RU', 'RU': 'RU',
  'Ukraine': 'UA', 'Украина': 'UA', 'UA': 'UA',
  'Kazakhstan': 'KZ', 'Казахстан': 'KZ', 'KZ': 'KZ',
  'Belarus': 'BY', 'Беларусь': 'BY', 'BY': 'BY',
  'United States': 'US', 'USA': 'US', 'США': 'US', 'US': 'US',
  'Germany': 'DE', 'Германия': 'DE', 'DE': 'DE',
  'United Kingdom': 'GB', 'UK': 'GB', 'Великобритания': 'GB', 'GB': 'GB',
  'France': 'FR', 'Франция': 'FR', 'FR': 'FR',
  'Japan': 'JP', 'Япония': 'JP', 'JP': 'JP',
  'Brazil': 'BR', 'Бразилия': 'BR', 'BR': 'BR',
  'Canada': 'CA', 'Канада': 'CA', 'CA': 'CA',
  'Australia': 'AU', 'Австралия': 'AU', 'AU': 'AU',
  'Italy': 'IT', 'Италия': 'IT', 'IT': 'IT',
  'Spain': 'ES', 'Испания': 'ES', 'ES': 'ES',
  'Netherlands': 'NL', 'Нидерланды': 'NL', 'NL': 'NL',
  'Poland': 'PL', 'Польша': 'PL', 'PL': 'PL',
  'Turkey': 'TR', 'Турция': 'TR', 'TR': 'TR',
  'Sweden': 'SE', 'Швеция': 'SE', 'SE': 'SE',
  'Norway': 'NO', 'Норвегия': 'NO', 'NO': 'NO',
  'Finland': 'FI', 'Финляндия': 'FI', 'FI': 'FI',
  'Denmark': 'DK', 'Дания': 'DK', 'DK': 'DK',
  'Switzerland': 'CH', 'Швейцария': 'CH', 'CH': 'CH',
  'Austria': 'AT', 'Австрия': 'AT', 'AT': 'AT',
  'Belgium': 'BE', 'Бельгия': 'BE', 'BE': 'BE',
  'India': 'IN', 'Индия': 'IN', 'IN': 'IN',
  'China': 'CN', 'Китай': 'CN', 'CN': 'CN',
  'South Korea': 'KR', 'Южная Корея': 'KR', 'KR': 'KR',
  'Mexico': 'MX', 'Мексика': 'MX', 'MX': 'MX',
  'Argentina': 'AR', 'Аргентина': 'AR', 'AR': 'AR',
  'Uzbekistan': 'UZ', 'Узбекистан': 'UZ', 'UZ': 'UZ',
  'Azerbaijan': 'AZ', 'Азербайджан': 'AZ', 'AZ': 'AZ',
  'Georgia': 'GE', 'Грузия': 'GE', 'GE': 'GE',
  'Armenia': 'AM', 'Армения': 'AM', 'AM': 'AM',
  'Moldova': 'MD', 'Молдова': 'MD', 'MD': 'MD',
  'Kyrgyzstan': 'KG', 'Кыргызстан': 'KG', 'KG': 'KG',
  'Tajikistan': 'TJ', 'Таджикистан': 'TJ', 'TJ': 'TJ',
  'Ireland': 'IE', 'Ирландия': 'IE', 'IE': 'IE',
  'Portugal': 'PT', 'Португалия': 'PT', 'PT': 'PT',
  'Czech Republic': 'CZ', 'Czechia': 'CZ', 'Чехия': 'CZ', 'CZ': 'CZ',
  'Greece': 'GR', 'Греция': 'GR', 'GR': 'GR',
  'Romania': 'RO', 'Румыния': 'RO', 'RO': 'RO',
  'Hungary': 'HU', 'Венгрия': 'HU', 'HU': 'HU',
  'Israel': 'IL', 'Израиль': 'IL', 'IL': 'IL',
  'UAE': 'AE', 'United Arab Emirates': 'AE', 'ОАЭ': 'AE', 'AE': 'AE',
  'Saudi Arabia': 'SA', 'Саудовская Аравия': 'SA', 'SA': 'SA',
  'Singapore': 'SG', 'Сингапур': 'SG', 'SG': 'SG',
  'Thailand': 'TH', 'Таиланд': 'TH', 'TH': 'TH',
  'Vietnam': 'VN', 'Вьетнам': 'VN', 'VN': 'VN',
  'Indonesia': 'ID', 'Индонезия': 'ID', 'ID': 'ID',
  'Malaysia': 'MY', 'Малайзия': 'MY', 'MY': 'MY',
  'Philippines': 'PH', 'Филиппины': 'PH', 'PH': 'PH',
  'New Zealand': 'NZ', 'Новая Зеландия': 'NZ', 'NZ': 'NZ',
  'South Africa': 'ZA', 'ЮАР': 'ZA', 'ZA': 'ZA',
  'Egypt': 'EG', 'Египет': 'EG', 'EG': 'EG',
  'Chile': 'CL', 'Чили': 'CL', 'CL': 'CL',
  'Colombia': 'CO', 'Колумбия': 'CO', 'CO': 'CO',
  'Peru': 'PE', 'Перу': 'PE', 'PE': 'PE',
};

const getCountryCode = (country: string): string => countryToCode[country] || 'XX';

// SVG флаги стран
const CountryFlag = ({ country, size = 20 }: { country: string; size?: number }) => {
  const code = getCountryCode(country);
  
  // Россия
  if (code === 'RU') {
    return (
      <svg width={size} height={size} viewBox="0 0 640 480" className="rounded-sm overflow-hidden flex-shrink-0">
        <rect width="640" height="160" fill="#fff"/>
        <rect y="160" width="640" height="160" fill="#0039a6"/>
        <rect y="320" width="640" height="160" fill="#d52b1e"/>
      </svg>
    );
  }
  
  // США
  if (code === 'US') {
    return (
      <svg width={size} height={size} viewBox="0 0 640 480" className="rounded-sm overflow-hidden flex-shrink-0">
        <rect width="640" height="480" fill="#bd3d44"/>
        <path d="M0 55.3h640M0 129h640M0 203h640M0 277h640M0 351h640M0 425h640" stroke="#fff" strokeWidth="37"/>
        <rect width="364" height="258" fill="#192f5d"/>
      </svg>
    );
  }
  
  // Украина
  if (code === 'UA') {
    return (
      <svg width={size} height={size} viewBox="0 0 640 480" className="rounded-sm overflow-hidden flex-shrink-0">
        <rect width="640" height="240" fill="#005bbb"/>
        <rect y="240" width="640" height="240" fill="#ffd500"/>
      </svg>
    );
  }
  
  // Казахстан
  if (code === 'KZ') {
    return (
      <svg width={size} height={size} viewBox="0 0 640 480" className="rounded-sm overflow-hidden flex-shrink-0">
        <rect width="640" height="480" fill="#00afca"/>
        <circle cx="320" cy="240" r="80" fill="#fec50c"/>
      </svg>
    );
  }
  
  // Беларусь
  if (code === 'BY') {
    return (
      <svg width={size} height={size} viewBox="0 0 640 480" className="rounded-sm overflow-hidden flex-shrink-0">
        <rect width="640" height="320" fill="#c8313e"/>
        <rect y="320" width="640" height="160" fill="#4aa657"/>
        <rect width="80" height="480" fill="#fff"/>
      </svg>
    );
  }
  
  // Германия
  if (code === 'DE') {
    return (
      <svg width={size} height={size} viewBox="0 0 640 480" className="rounded-sm overflow-hidden flex-shrink-0">
        <rect width="640" height="160" fill="#000"/>
        <rect y="160" width="640" height="160" fill="#dd0000"/>
        <rect y="320" width="640" height="160" fill="#ffce00"/>
      </svg>
    );
  }
  
  // Великобритания
  if (code === 'GB') {
    return (
      <svg width={size} height={size} viewBox="0 0 640 480" className="rounded-sm overflow-hidden flex-shrink-0">
        <rect width="640" height="480" fill="#012169"/>
        <path d="M0 0l640 480M640 0L0 480" stroke="#fff" strokeWidth="80"/>
        <path d="M0 0l640 480M640 0L0 480" stroke="#c8102e" strokeWidth="50"/>
        <path d="M320 0v480M0 240h640" stroke="#fff" strokeWidth="120"/>
        <path d="M320 0v480M0 240h640" stroke="#c8102e" strokeWidth="70"/>
      </svg>
    );
  }
  
  // Франция
  if (code === 'FR') {
    return (
      <svg width={size} height={size} viewBox="0 0 640 480" className="rounded-sm overflow-hidden flex-shrink-0">
        <rect width="213" height="480" fill="#002654"/>
        <rect x="213" width="214" height="480" fill="#fff"/>
        <rect x="427" width="213" height="480" fill="#ce1126"/>
      </svg>
    );
  }
  
  // Япония
  if (code === 'JP') {
    return (
      <svg width={size} height={size} viewBox="0 0 640 480" className="rounded-sm overflow-hidden flex-shrink-0">
        <rect width="640" height="480" fill="#fff"/>
        <circle cx="320" cy="240" r="120" fill="#bc002d"/>
      </svg>
    );
  }
  
  // Бразилия
  if (code === 'BR') {
    return (
      <svg width={size} height={size} viewBox="0 0 640 480" className="rounded-sm overflow-hidden flex-shrink-0">
        <rect width="640" height="480" fill="#009c3b"/>
        <polygon points="320,60 580,240 320,420 60,240" fill="#ffdf00"/>
        <circle cx="320" cy="240" r="80" fill="#002776"/>
      </svg>
    );
  }
  
  // Канада
  if (code === 'CA') {
    return (
      <svg width={size} height={size} viewBox="0 0 640 480" className="rounded-sm overflow-hidden flex-shrink-0">
        <rect width="160" height="480" fill="#d52b1e"/>
        <rect x="160" width="320" height="480" fill="#fff"/>
        <rect x="480" width="160" height="480" fill="#d52b1e"/>
      </svg>
    );
  }
  
  // Италия
  if (code === 'IT') {
    return (
      <svg width={size} height={size} viewBox="0 0 640 480" className="rounded-sm overflow-hidden flex-shrink-0">
        <rect width="213" height="480" fill="#009246"/>
        <rect x="213" width="214" height="480" fill="#fff"/>
        <rect x="427" width="213" height="480" fill="#ce2b37"/>
      </svg>
    );
  }
  
  // Испания
  if (code === 'ES') {
    return (
      <svg width={size} height={size} viewBox="0 0 640 480" className="rounded-sm overflow-hidden flex-shrink-0">
        <rect width="640" height="120" fill="#aa151b"/>
        <rect y="120" width="640" height="240" fill="#f1bf00"/>
        <rect y="360" width="640" height="120" fill="#aa151b"/>
      </svg>
    );
  }
  
  // Польша
  if (code === 'PL') {
    return (
      <svg width={size} height={size} viewBox="0 0 640 480" className="rounded-sm overflow-hidden flex-shrink-0">
        <rect width="640" height="240" fill="#fff"/>
        <rect y="240" width="640" height="240" fill="#dc143c"/>
      </svg>
    );
  }
  
  // Турция
  if (code === 'TR') {
    return (
      <svg width={size} height={size} viewBox="0 0 640 480" className="rounded-sm overflow-hidden flex-shrink-0">
        <rect width="640" height="480" fill="#e30a17"/>
        <circle cx="260" cy="240" r="100" fill="#fff"/>
        <circle cx="290" cy="240" r="80" fill="#e30a17"/>
      </svg>
    );
  }
  
  // Швеция
  if (code === 'SE') {
    return (
      <svg width={size} height={size} viewBox="0 0 640 480" className="rounded-sm overflow-hidden flex-shrink-0">
        <rect width="640" height="480" fill="#006aa7"/>
        <rect x="160" width="80" height="480" fill="#fecc00"/>
        <rect y="200" width="640" height="80" fill="#fecc00"/>
      </svg>
    );
  }
  
  // Нидерланды
  if (code === 'NL') {
    return (
      <svg width={size} height={size} viewBox="0 0 640 480" className="rounded-sm overflow-hidden flex-shrink-0">
        <rect width="640" height="160" fill="#21468b"/>
        <rect y="160" width="640" height="160" fill="#fff"/>
        <rect y="320" width="640" height="160" fill="#ae1c28"/>
      </svg>
    );
  }
  
  // Австралия
  if (code === 'AU') {
    return (
      <svg width={size} height={size} viewBox="0 0 640 480" className="rounded-sm overflow-hidden flex-shrink-0">
        <rect width="640" height="480" fill="#00008b"/>
        <rect width="320" height="240" fill="#012169"/>
      </svg>
    );
  }
  
  // Швейцария
  if (code === 'CH') {
    return (
      <svg width={size} height={size} viewBox="0 0 640 480" className="rounded-sm overflow-hidden flex-shrink-0">
        <rect width="640" height="480" fill="#d52b1e"/>
        <rect x="255" y="120" width="130" height="240" fill="#fff"/>
        <rect x="200" y="185" width="240" height="110" fill="#fff"/>
      </svg>
    );
  }
  
  // Финляндия
  if (code === 'FI') {
    return (
      <svg width={size} height={size} viewBox="0 0 640 480" className="rounded-sm overflow-hidden flex-shrink-0">
        <rect width="640" height="480" fill="#fff"/>
        <rect x="130" width="90" height="480" fill="#003580"/>
        <rect y="175" width="640" height="130" fill="#003580"/>
      </svg>
    );
  }
  
  // Норвегия
  if (code === 'NO') {
    return (
      <svg width={size} height={size} viewBox="0 0 640 480" className="rounded-sm overflow-hidden flex-shrink-0">
        <rect width="640" height="480" fill="#ef2b2d"/>
        <rect x="140" width="80" height="480" fill="#fff"/>
        <rect y="160" width="640" height="160" fill="#fff"/>
        <rect x="160" width="40" height="480" fill="#002868"/>
        <rect y="180" width="640" height="120" fill="#002868"/>
      </svg>
    );
  }
  
  // Дания
  if (code === 'DK') {
    return (
      <svg width={size} height={size} viewBox="0 0 640 480" className="rounded-sm overflow-hidden flex-shrink-0">
        <rect width="640" height="480" fill="#c8102e"/>
        <rect x="140" width="80" height="480" fill="#fff"/>
        <rect y="160" width="640" height="160" fill="#fff"/>
      </svg>
    );
  }
  
  // Австрия
  if (code === 'AT') {
    return (
      <svg width={size} height={size} viewBox="0 0 640 480" className="rounded-sm overflow-hidden flex-shrink-0">
        <rect width="640" height="160" fill="#ed2939"/>
        <rect y="160" width="640" height="160" fill="#fff"/>
        <rect y="320" width="640" height="160" fill="#ed2939"/>
      </svg>
    );
  }
  
  // Бельгия
  if (code === 'BE') {
    return (
      <svg width={size} height={size} viewBox="0 0 640 480" className="rounded-sm overflow-hidden flex-shrink-0">
        <rect width="213" height="480" fill="#000"/>
        <rect x="213" width="214" height="480" fill="#ffd90c"/>
        <rect x="427" width="213" height="480" fill="#f31830"/>
      </svg>
    );
  }
  
  // Ирландия
  if (code === 'IE') {
    return (
      <svg width={size} height={size} viewBox="0 0 640 480" className="rounded-sm overflow-hidden flex-shrink-0">
        <rect width="213" height="480" fill="#169b62"/>
        <rect x="213" width="214" height="480" fill="#fff"/>
        <rect x="427" width="213" height="480" fill="#ff883e"/>
      </svg>
    );
  }
  
  // Португалия
  if (code === 'PT') {
    return (
      <svg width={size} height={size} viewBox="0 0 640 480" className="rounded-sm overflow-hidden flex-shrink-0">
        <rect width="256" height="480" fill="#006600"/>
        <rect x="256" width="384" height="480" fill="#ff0000"/>
        <circle cx="256" cy="240" r="60" fill="#ffcc00"/>
      </svg>
    );
  }
  
  // Чехия
  if (code === 'CZ') {
    return (
      <svg width={size} height={size} viewBox="0 0 640 480" className="rounded-sm overflow-hidden flex-shrink-0">
        <rect width="640" height="240" fill="#fff"/>
        <rect y="240" width="640" height="240" fill="#d7141a"/>
        <polygon points="0,0 320,240 0,480" fill="#11457e"/>
      </svg>
    );
  }
  
  // Греция
  if (code === 'GR') {
    return (
      <svg width={size} height={size} viewBox="0 0 640 480" className="rounded-sm overflow-hidden flex-shrink-0">
        <rect width="640" height="480" fill="#0d5eaf"/>
        <path d="M0 53h640M0 160h640M0 267h640M0 373h640" stroke="#fff" strokeWidth="53"/>
        <rect width="267" height="267" fill="#0d5eaf"/>
        <path d="M0 133h267M133 0v267" stroke="#fff" strokeWidth="53"/>
      </svg>
    );
  }
  
  // Индия
  if (code === 'IN') {
    return (
      <svg width={size} height={size} viewBox="0 0 640 480" className="rounded-sm overflow-hidden flex-shrink-0">
        <rect width="640" height="160" fill="#ff9933"/>
        <rect y="160" width="640" height="160" fill="#fff"/>
        <rect y="320" width="640" height="160" fill="#138808"/>
        <circle cx="320" cy="240" r="40" fill="#000080"/>
      </svg>
    );
  }
  
  // Китай
  if (code === 'CN') {
    return (
      <svg width={size} height={size} viewBox="0 0 640 480" className="rounded-sm overflow-hidden flex-shrink-0">
        <rect width="640" height="480" fill="#de2910"/>
        <polygon points="120,60 135,105 100,80 140,80 105,105" fill="#ffde00"/>
      </svg>
    );
  }
  
  // Южная Корея
  if (code === 'KR') {
    return (
      <svg width={size} height={size} viewBox="0 0 640 480" className="rounded-sm overflow-hidden flex-shrink-0">
        <rect width="640" height="480" fill="#fff"/>
        <circle cx="320" cy="240" r="100" fill="#c60c30"/>
        <path d="M320 140a100 100 0 0 0 0 200" fill="#003478"/>
      </svg>
    );
  }
  
  // Мексика
  if (code === 'MX') {
    return (
      <svg width={size} height={size} viewBox="0 0 640 480" className="rounded-sm overflow-hidden flex-shrink-0">
        <rect width="213" height="480" fill="#006341"/>
        <rect x="213" width="214" height="480" fill="#fff"/>
        <rect x="427" width="213" height="480" fill="#ce1126"/>
      </svg>
    );
  }
  
  // Аргентина
  if (code === 'AR') {
    return (
      <svg width={size} height={size} viewBox="0 0 640 480" className="rounded-sm overflow-hidden flex-shrink-0">
        <rect width="640" height="160" fill="#74acdf"/>
        <rect y="160" width="640" height="160" fill="#fff"/>
        <rect y="320" width="640" height="160" fill="#74acdf"/>
        <circle cx="320" cy="240" r="40" fill="#f6b40e"/>
      </svg>
    );
  }
  
  // Узбекистан
  if (code === 'UZ') {
    return (
      <svg width={size} height={size} viewBox="0 0 640 480" className="rounded-sm overflow-hidden flex-shrink-0">
        <rect width="640" height="160" fill="#0099b5"/>
        <rect y="160" width="640" height="40" fill="#ce1126"/>
        <rect y="200" width="640" height="120" fill="#fff"/>
        <rect y="320" width="640" height="160" fill="#1eb53a"/>
      </svg>
    );
  }
  
  // Default - глобус
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" className="flex-shrink-0">
      <circle cx="12" cy="12" r="10"/>
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  );
};

const getPlatformColor = (platform: string): string => {
  const p = platform.toLowerCase();
  if (p.includes('spotify')) return platformColors.spotify;
  if (p.includes('apple')) return platformColors.apple;
  if (p.includes('yandex') || p.includes('яндекс')) return platformColors.yandex;
  if (p.includes('vk') || p.includes('boom') || p.includes('uma')) return platformColors.vk;
  if (p.includes('youtube')) return platformColors.youtube;
  if (p.includes('deezer')) return platformColors.deezer;
  if (p.includes('tiktok')) return platformColors.tiktok;
  if (p.includes('soundcloud')) return platformColors.soundcloud;
  if (p.includes('amazon')) return platformColors.amazon;
  if (p.includes('tidal')) return platformColors.tidal;
  return platformColors.default;
};

// SVG иконки платформ
const PlatformIcon = ({ platform, size = 18 }: { platform: string; size?: number }) => {
  const p = platform.toLowerCase();
  
  // Spotify
  if (p.includes('spotify')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="#1DB954" className="flex-shrink-0">
        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
      </svg>
    );
  }
  
  // Apple Music
  if (p.includes('apple')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="#FC3C44" className="flex-shrink-0">
        <path d="M23.994 6.124a9.23 9.23 0 00-.24-2.19c-.317-1.31-1.062-2.31-2.18-3.043a5.022 5.022 0 00-1.877-.726 10.496 10.496 0 00-1.564-.15c-.04-.003-.083-.01-.124-.013H5.986c-.152.01-.303.017-.455.026-.747.043-1.49.123-2.193.4-1.336.53-2.3 1.452-2.865 2.78-.192.448-.292.925-.363 1.408-.056.392-.088.785-.1 1.18 0 .032-.007.062-.01.093v12.223c.01.14.017.283.027.424.05.815.154 1.624.497 2.373.65 1.42 1.738 2.353 3.234 2.801.42.127.856.187 1.293.228.555.053 1.11.06 1.667.06h11.03a12.5 12.5 0 001.57-.1c.822-.106 1.596-.35 2.295-.81a5.046 5.046 0 001.88-2.207c.186-.42.293-.87.37-1.324.113-.675.138-1.358.137-2.04-.002-3.8 0-7.595-.003-11.393zm-6.423 3.99v5.712c0 .417-.058.827-.244 1.206-.29.59-.76.962-1.388 1.14-.35.1-.706.157-1.07.173-.95.042-1.785-.56-2.07-1.483-.263-.855.062-1.783.838-2.293.314-.206.67-.342 1.04-.432.43-.104.87-.167 1.3-.255.217-.043.413-.129.567-.29.146-.153.2-.34.2-.554v-3.946c0-.304-.124-.478-.417-.524-.25-.04-.503-.065-.756-.095l-2.79-.366c-.063-.008-.128-.016-.19-.028-.238-.042-.354.023-.394.267-.005.032-.007.065-.007.098v6.177c0 .263-.02.525-.1.78-.163.53-.484.947-.962 1.227-.306.18-.642.282-.993.338-.496.078-1 .08-1.487-.05-.772-.204-1.306-.7-1.55-1.458-.197-.613-.1-1.197.262-1.73.303-.447.72-.752 1.22-.958.35-.144.718-.217 1.09-.27.374-.055.75-.094 1.124-.145.2-.027.39-.078.567-.17.254-.13.377-.338.377-.622V5.586c0-.152.02-.302.076-.446.12-.306.378-.468.682-.42.09.015.18.03.27.048l5.296 1.07c.405.082.64.318.68.727.012.127.01.255.01.383z"/>
      </svg>
    );
  }
  
  // Яндекс Музыка - официальный логотип (красный Y)
  if (p.includes('yandex') || p.includes('яндекс')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" className="flex-shrink-0">
        <rect width="24" height="24" rx="5" fill="#FC3F1D"/>
        <path d="M13.76 18.14h-1.8V7.38h-.9c-1.64 0-2.5.84-2.5 2.06 0 1.4.58 2.06 1.78 2.88l.98.66-2.88 5.16H6.44l2.56-4.56c-1.46-1.06-2.28-2.12-2.28-3.92 0-2.24 1.56-3.8 4.28-3.8h2.76v12.28z" fill="#fff"/>
      </svg>
    );
  }
  
  // VK Музыка
  if (p.includes('vk') || p.includes('boom') || p.includes('uma')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="#0077FF" className="flex-shrink-0">
        <path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.408 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.864-.525-2.05-1.727-1.033-1-1.49-1.135-1.744-1.135-.356 0-.458.102-.458.593v1.575c0 .424-.135.678-1.253.678-1.846 0-3.896-1.118-5.335-3.202C4.624 10.857 4 8.467 4 7.985c0-.254.102-.491.593-.491h1.744c.44 0 .61.203.779.678.864 2.49 2.303 4.675 2.896 4.675.22 0 .322-.102.322-.66V9.721c-.068-1.186-.695-1.287-.695-1.71 0-.203.17-.407.44-.407h2.744c.373 0 .508.203.508.643v3.473c0 .372.17.508.271.508.22 0 .407-.136.813-.542 1.254-1.406 2.151-3.574 2.151-3.574.119-.254.322-.491.762-.491h1.744c.525 0 .644.27.525.643-.22 1.017-2.354 4.031-2.354 4.031-.186.305-.254.44 0 .78.186.254.796.779 1.203 1.253.745.847 1.32 1.558 1.473 2.05.17.49-.085.744-.576.744z"/>
      </svg>
    );
  }
  
  // YouTube Music
  if (p.includes('youtube')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="#FF0000" className="flex-shrink-0">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    );
  }
  
  // Deezer
  if (p.includes('deezer')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="#FEAA2D" className="flex-shrink-0">
        <path d="M18.81 4.16v3.03H24V4.16h-5.19zM6.27 8.38v3.027h5.189V8.38h-5.19zm12.54 0v3.027H24V8.38h-5.19zM0 12.62v3.028h5.19V12.62H0zm6.27 0v3.028h5.189V12.62h-5.19zm6.27 0v3.028h5.19V12.62h-5.19zm6.27 0v3.028H24V12.62h-5.19zM0 16.84v3.028h5.19V16.84H0zm6.27 0v3.028h5.189V16.84h-5.19zm6.27 0v3.028h5.19V16.84h-5.19zm6.27 0v3.028H24V16.84h-5.19z"/>
      </svg>
    );
  }
  
  // TikTok
  if (p.includes('tiktok')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" className="flex-shrink-0">
        <path fill="#00F2EA" d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
      </svg>
    );
  }
  
  // SoundCloud
  if (p.includes('soundcloud')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="#FF5500" className="flex-shrink-0">
        <path d="M1.175 12.225c-.051 0-.094.046-.101.1l-.233 2.154.233 2.105c.007.058.05.098.101.098.05 0 .09-.04.099-.098l.255-2.105-.27-2.154c-.01-.057-.05-.1-.1-.1m5.552-2.478c-.08 0-.089.047-.096.103l-.183 3.208.183 2.997c.007.065.016.112.096.112.08 0 .09-.047.096-.112l.207-2.997-.207-3.208c-.006-.057-.016-.103-.096-.103"/>
      </svg>
    );
  }
  
  // Amazon Music
  if (p.includes('amazon')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="#FF9900" className="flex-shrink-0">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15l-4-4 1.41-1.41L11 14.17l6.59-6.59L19 9l-8 8z"/>
      </svg>
    );
  }
  
  // Tidal
  if (p.includes('tidal')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="#00FFFF" className="flex-shrink-0">
        <path d="M12.012 3.992L8.008 7.996 4.004 3.992 0 7.996l4.004 4.004 4.004-4.004 4.004 4.004-4.004 4.004 4.004 4.004 4.004-4.004-4.004-4.004 4.004-4.004 4.004 4.004 4.004-4.004L20.02 3.992l-4.004 4.004z"/>
      </svg>
    );
  }
  
  // Default music icon
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#A855F7" className="flex-shrink-0">
      <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
    </svg>
  );
};

const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toLocaleString();
};

const formatCurrency = (num: number): string => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 2
  }).format(num);
};

export default function ReleaseStatistics({ releaseId, releaseType, coverUrl }: ReleaseStatisticsProps) {
  const { themeName } = useTheme();
  const isLight = themeName === 'light';
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<StatData | null>(null);
  const [hoveredPlatform, setHoveredPlatform] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Загрузка статистики из отчётов
  const loadStats = async () => {
    if (!supabase || loaded) return;
    
    setLoading(true);
    try {
      // Запрос track_statistics с названием и индексом трека
      const { data: trackStats, error: trackError } = await supabase
        .from('track_statistics')
        .select('id, streams, net_revenue, quarter, year, track_title, track_index')
        .eq('release_id', releaseId);

      if (trackError) {
        console.error('Error loading track stats:', trackError);
        setLoading(false);
        return;
      }

      if (trackStats && trackStats.length > 0) {
        const trackStatIds = trackStats.map(t => t.id);
        
        // Параллельные запросы для платформ и стран
        const [platformRes, countryRes] = await Promise.all([
          supabase
            .from('platform_statistics')
            .select('track_stat_id, platform_name, streams, net_revenue')
            .in('track_stat_id', trackStatIds),
          supabase
            .from('country_statistics')
            .select('track_stat_id, country_name, streams, net_revenue')
            .in('track_stat_id', trackStatIds)
        ]);

        const platformStats = platformRes.data || [];
        const countryStats = countryRes.data || [];

        const platformMap = new Map<string, { streams: number; revenue: number }>();
        const countryMap = new Map<string, { streams: number; revenue: number }>();
        const quarterMap = new Map<string, { streams: number; revenue: number }>();
        
        // Группировка по трекам
        const trackMap = new Map<string, { 
          title: string; 
          index: number; 
          streams: number; 
          revenue: number;
          platformMap: Map<string, { streams: number; revenue: number }>;
        }>();
        
        let totalStreams = 0;
        let totalRevenue = 0;

        // Создаём карту track_stat_id -> track_title/track_index
        const trackStatToTrack = new Map<string, { title: string; index: number }>();
        trackStats.forEach((stat: any) => {
          trackStatToTrack.set(stat.id, { 
            title: stat.track_title || 'Без названия', 
            index: stat.track_index ?? 0 
          });
        });

        trackStats.forEach((stat: any) => {
          totalStreams += stat.streams || 0;
          totalRevenue += stat.net_revenue || 0;

          const quarterKey = `${stat.quarter} ${stat.year}`;
          const existingQuarter = quarterMap.get(quarterKey) || { streams: 0, revenue: 0 };
          quarterMap.set(quarterKey, {
            streams: existingQuarter.streams + (stat.streams || 0),
            revenue: existingQuarter.revenue + (stat.net_revenue || 0)
          });
          
          // Группируем по трекам
          const trackKey = stat.track_title || 'Unknown';
          const existingTrack = trackMap.get(trackKey) || { 
            title: stat.track_title || 'Без названия', 
            index: stat.track_index ?? 0,
            streams: 0, 
            revenue: 0,
            platformMap: new Map()
          };
          trackMap.set(trackKey, {
            ...existingTrack,
            streams: existingTrack.streams + (stat.streams || 0),
            revenue: existingTrack.revenue + (stat.net_revenue || 0)
          });
        });

        // Обработка платформ
        platformStats.forEach((ps: any) => {
          const existing = platformMap.get(ps.platform_name) || { streams: 0, revenue: 0 };
          platformMap.set(ps.platform_name, {
            streams: existing.streams + (ps.streams || 0),
            revenue: existing.revenue + (ps.net_revenue || 0)
          });
          
          // Добавляем платформу к треку
          const trackInfo = trackStatToTrack.get(ps.track_stat_id);
          if (trackInfo) {
            const track = trackMap.get(trackInfo.title);
            if (track) {
              const existingPlatform = track.platformMap.get(ps.platform_name) || { streams: 0, revenue: 0 };
              track.platformMap.set(ps.platform_name, {
                streams: existingPlatform.streams + (ps.streams || 0),
                revenue: existingPlatform.revenue + (ps.net_revenue || 0)
              });
            }
          }
        });

        // Обработка стран
        countryStats.forEach((cs: any) => {
          const existing = countryMap.get(cs.country_name) || { streams: 0, revenue: 0 };
          countryMap.set(cs.country_name, {
            streams: existing.streams + (cs.streams || 0),
            revenue: existing.revenue + (cs.net_revenue || 0)
          });
        });

        // Преобразуем треки
        const tracksArray = Array.from(trackMap.values())
          .map(track => ({
            title: track.title,
            index: track.index,
            streams: track.streams,
            revenue: track.revenue,
            platforms: Array.from(track.platformMap.entries())
              .map(([name, data]) => ({ name, ...data }))
              .sort((a, b) => b.streams - a.streams)
          }))
          .sort((a, b) => a.index - b.index);

        setStats({
          totalStreams,
          totalRevenue,
          platforms: Array.from(platformMap.entries())
            .map(([name, data]) => ({ name, ...data }))
            .sort((a, b) => b.streams - a.streams),
          countries: Array.from(countryMap.entries())
            .map(([name, data]) => ({ name, code: getCountryCode(name), ...data }))
            .sort((a, b) => b.streams - a.streams),
          quarters: Array.from(quarterMap.entries())
            .map(([key, data]) => {
              const [quarter, year] = key.split(' ');
              return { quarter, year: parseInt(year), ...data };
            })
            .sort((a, b) => b.year - a.year || b.quarter.localeCompare(a.quarter)),
          tracks: tracksArray
        });
        setLoaded(true);
      } else {
        setStats({
          totalStreams: 0,
          totalRevenue: 0,
          platforms: [],
          countries: [],
          quarters: [],
          tracks: []
        });
        setLoaded(true);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && !loaded) {
      loadStats();
    }
  }, [isOpen]);

  const hasData = stats && (stats.totalStreams > 0 || stats.platforms.length > 0);

  return (
    <div className="mb-3 sm:mb-4 md:mb-6">
      {/* Заголовок-кнопка */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full p-3 sm:p-4 rounded-xl sm:rounded-2xl transition-all duration-300 group min-h-[56px] sm:min-h-[64px] ${
          isLight 
            ? 'bg-gradient-to-r from-purple-100 to-blue-100 hover:from-purple-200 hover:to-blue-200 border border-gray-200 hover:border-purple-300'
            : 'bg-gradient-to-r from-purple-500/10 to-blue-500/10 hover:from-purple-500/15 hover:to-blue-500/15 border border-white/10 hover:border-purple-500/30'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            {coverUrl && (
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl overflow-hidden ring-2 ring-purple-500/20 flex-shrink-0">
                <img src={coverUrl} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            {!coverUrl && (
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            )}
            <div className="text-left">
              <p className={`font-semibold text-sm sm:text-base ${isLight ? 'text-gray-900' : 'text-white'}`}>Статистика релиза</p>
              <p className={`text-[10px] sm:text-xs ${isLight ? 'text-gray-500' : 'text-zinc-400'}`}>
                {stats ? `${formatNumber(stats.totalStreams)} прослушиваний · ${formatCurrency(stats.totalRevenue)}` : 'Данные из отчётов'}
              </p>
            </div>
          </div>
          
          <svg 
            className={`w-4 h-4 sm:w-5 sm:h-5 transition-all duration-300 flex-shrink-0 ${isOpen ? 'rotate-180' : ''} ${isLight ? 'text-gray-400 group-hover:text-purple-500' : 'text-zinc-400 group-hover:text-purple-400'}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Контент */}
      {isOpen && (
        <div className={`mt-2 sm:mt-3 p-3 sm:p-5 rounded-xl sm:rounded-2xl animate-fade-in ${
          isLight 
            ? 'bg-gray-50 border border-gray-200'
            : 'bg-zinc-900/50 border border-white/10'
        }`}>
          {loading ? (
            <div className="flex items-center justify-center py-6 sm:py-8">
              <div className="animate-spin rounded-full h-7 w-7 sm:h-8 sm:w-8 border-b-2 border-purple-500" />
            </div>
          ) : hasData ? (
            <div className="space-y-4 sm:space-y-6">
              {/* Общая статистика */}
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <div className={`rounded-xl p-3 sm:p-4 ${
                  isLight
                    ? 'bg-purple-50 border border-purple-200'
                    : 'bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20'
                }`}>
                  <p className={`text-[10px] sm:text-xs mb-0.5 ${isLight ? 'text-gray-500' : 'text-zinc-400'}`}>Всего прослушиваний</p>
                  <p className={`text-lg sm:text-xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>{formatNumber(stats!.totalStreams)}</p>
                </div>
                <div className={`rounded-xl p-3 sm:p-4 ${
                  isLight
                    ? 'bg-emerald-50 border border-emerald-200'
                    : 'bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20'
                }`}>
                  <p className={`text-[10px] sm:text-xs mb-0.5 ${isLight ? 'text-gray-500' : 'text-zinc-400'}`}>Доход</p>
                  <p className={`text-lg sm:text-xl font-bold ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`}>{formatCurrency(stats!.totalRevenue)}</p>
                </div>
              </div>

              {/* Платформы с круговой диаграммой */}
              {stats!.platforms.length > 0 && (
                <div className={`rounded-xl p-3 sm:p-4 ${
                  isLight 
                    ? 'bg-white border border-gray-200'
                    : 'bg-white/5 border border-white/10'
                }`}>
                  <h4 className={`text-sm font-medium mb-3 sm:mb-4 ${isLight ? 'text-gray-700' : 'text-zinc-300'}`}>По платформам</h4>
                  
                  <div className="flex flex-col items-center gap-4 sm:gap-6 sm:flex-row">
                    <div 
                      className="relative w-28 h-28 sm:w-36 sm:h-36 flex-shrink-0"
                      onMouseLeave={() => setHoveredPlatform(null)}
                    >
                      <svg viewBox="0 0 100 100" className="w-full h-full" style={{ overflow: 'visible' }}>
                        {(() => {
                          const total = stats!.platforms.reduce((sum, p) => sum + p.streams, 0);
                          let cumulativePercent = 0;
                          const cx = 50;
                          const cy = 50;
                          
                          // Собираем все данные сегментов
                          const segments = stats!.platforms.map((p, idx) => {
                            const percent = total > 0 ? (p.streams / total) : 0;
                            const startAngle = cumulativePercent * 2 * Math.PI - Math.PI / 2;
                            cumulativePercent += percent;
                            const endAngle = cumulativePercent * 2 * Math.PI - Math.PI / 2;
                            const largeArc = percent > 0.5 ? 1 : 0;
                            const color = getPlatformColor(p.name);
                            return { p, idx, percent, startAngle, endAngle, largeArc, color };
                          });
                          
                          // Функция для создания path
                          const createPath = (startAngle: number, endAngle: number, innerR: number, outerR: number, largeArc: number, percent: number) => {
                            const ix1 = cx + innerR * Math.cos(startAngle);
                            const iy1 = cy + innerR * Math.sin(startAngle);
                            const ix2 = cx + innerR * Math.cos(endAngle);
                            const iy2 = cy + innerR * Math.sin(endAngle);
                            const ox1 = cx + outerR * Math.cos(startAngle);
                            const oy1 = cy + outerR * Math.sin(startAngle);
                            const ox2 = cx + outerR * Math.cos(endAngle);
                            const oy2 = cy + outerR * Math.sin(endAngle);
                            
                            return percent >= 0.9999 
                              ? `M ${cx} ${cy - outerR} A ${outerR} ${outerR} 0 1 1 ${cx - 0.01} ${cy - outerR} Z`
                              : `M ${ox1} ${oy1} A ${outerR} ${outerR} 0 ${largeArc} 1 ${ox2} ${oy2} L ${ix2} ${iy2} A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix1} ${iy1} Z`;
                          };
                          
                          const hasHover = hoveredPlatform !== null;
                          
                          return (
                            <>
                              {/* Слой свечения - рисуется ПОД основными сегментами */}
                              {segments.map(({ p, idx, percent, startAngle, endAngle, largeArc, color }) => {
                                const isHovered = hoveredPlatform === p.name;
                                if (!isHovered) return null;
                                
                                // Свечение - несколько слоёв с увеличивающимися радиусами
                                return [3, 2, 1].map((layer) => {
                                  const glowInner = 26 - layer * 1.5;
                                  const glowOuter = 42 + layer * 2;
                                  const glowPath = createPath(startAngle, endAngle, glowInner, glowOuter, largeArc, percent);
                                  return (
                                    <path
                                      key={`glow-${idx}-${layer}`}
                                      d={glowPath}
                                      fill={color}
                                      opacity={0.15 / layer}
                                      className="pointer-events-none"
                                    />
                                  );
                                });
                              })}
                              
                              {/* Основные сегменты */}
                              {segments.map(({ p, idx, percent, startAngle, endAngle, largeArc, color }) => {
                                const isHovered = hoveredPlatform === p.name;
                                
                                // Размеры: базовый компактный, при наведении чуть больше
                                const innerRadius = isHovered ? 28 : 30;
                                const outerRadius = isHovered ? 42 : 38;
                                
                                const d = createPath(startAngle, endAngle, innerRadius, outerRadius, largeArc, percent);
                                
                                return (
                                  <path
                                    key={idx}
                                    d={d}
                                    fill={color}
                                    className="cursor-pointer"
                                    style={{ 
                                      opacity: hasHover && !isHovered ? 0.35 : 1,
                                      transition: 'opacity 0.2s ease-out'
                                    }}
                                    onMouseEnter={() => setHoveredPlatform(p.name)}
                                  />
                                );
                              })}
                            </>
                          );
                        })()}
                        {/* Центральный круг */}
                        <circle cx="50" cy="50" r="26" fill={isLight ? "rgb(249 250 251)" : "rgb(24 24 27)"} className="pointer-events-none" />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        {hoveredPlatform ? (
                          <>
                            <span className={`text-xs sm:text-sm font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                              {formatNumber(stats!.platforms.find(p => p.name === hoveredPlatform)?.streams || 0)}
                            </span>
                            <span className={`text-[8px] sm:text-[9px] truncate max-w-[60px] sm:max-w-[70px] text-center ${isLight ? 'text-gray-500' : 'text-zinc-400'}`}>{hoveredPlatform}</span>
                          </>
                        ) : (
                          <>
                            <span className={`text-base sm:text-lg font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>{formatNumber(stats!.totalStreams)}</span>
                            <span className={`text-[9px] sm:text-[10px] ${isLight ? 'text-gray-500' : 'text-zinc-400'}`}>всего</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex-1 w-full grid grid-cols-2 gap-1.5 sm:gap-2">
                      {stats!.platforms.slice(0, 8).map((p) => {
                        const total = stats!.platforms.reduce((sum, pl) => sum + pl.streams, 0);
                        const percentage = total > 0 ? (p.streams / total) * 100 : 0;
                        const isHovered = hoveredPlatform === p.name;
                        const color = getPlatformColor(p.name);
                        return (
                          <div 
                            key={p.name} 
                            className={`relative flex items-center gap-1.5 sm:gap-2 cursor-pointer rounded-full p-1.5 sm:p-2 transition-all duration-300 min-h-[40px] sm:min-h-[44px] overflow-hidden ${
                              isHovered ? 'scale-[1.02]' : ''
                            }`}
                            style={{
                              border: isHovered ? `1px solid ${color}60` : `1px solid ${color}20`,
                              background: isHovered 
                                ? `linear-gradient(90deg, ${color}25 0%, ${color}08 ${percentage}%, transparent ${percentage}%)`
                                : `linear-gradient(90deg, ${color}08 0%, transparent 50%)`,
                              boxShadow: isHovered ? `0 0 20px ${color}30` : 'none'
                            }}
                            onMouseEnter={() => setHoveredPlatform(p.name)}
                            onMouseLeave={() => setHoveredPlatform(null)}
                          >
                            <PlatformIcon platform={p.name} size={16} />
                            <span className={`relative text-[10px] sm:text-xs flex-1 truncate transition-colors ${isHovered ? (isLight ? 'text-gray-900 font-medium' : 'text-white font-medium') : (isLight ? 'text-gray-700' : 'text-zinc-300')}`}>{p.name}</span>
                            <span className={`relative text-[9px] sm:text-[10px] font-medium ${isHovered ? (isLight ? 'text-gray-900' : 'text-white') : (isLight ? 'text-gray-500' : 'text-zinc-500')}`}>{percentage.toFixed(0)}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Страны с SVG флагами */}
              {stats!.countries.length > 0 && (
                <div className={`rounded-2xl p-3 sm:p-5 ${
                  isLight 
                    ? 'bg-white border border-gray-200'
                    : 'bg-white/5 border border-white/10'
                }`}>
                  <h4 className={`text-sm sm:text-base font-semibold mb-3 sm:mb-4 flex items-center gap-2 ${isLight ? 'text-gray-900' : 'text-white'}`}>
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Статистика по странам
                  </h4>
                  <div className="space-y-1.5 sm:space-y-2">
                    {stats!.countries.slice(0, 8).map((c, idx) => {
                      const total = stats!.countries.reduce((sum, cn) => sum + cn.streams, 0);
                      const percentage = total > 0 ? (c.streams / total) * 100 : 0;
                      const colors = [
                        'from-emerald-500 to-teal-400',
                        'from-blue-500 to-cyan-400',
                        'from-purple-500 to-pink-400',
                        'from-orange-500 to-yellow-400',
                        'from-rose-500 to-red-400',
                        'from-indigo-500 to-blue-400',
                        'from-amber-500 to-orange-400',
                        'from-fuchsia-500 to-purple-400',
                      ];
                      const color = colors[idx % colors.length];
                      return (
                        <div key={c.name} className="group relative">
                          {/* Фоновый прогресс-бар */}
                          <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
                            <div 
                              className={`h-full bg-gradient-to-r ${color} ${isLight ? 'opacity-10 group-hover:opacity-20' : 'opacity-15 group-hover:opacity-25'} transition-opacity`}
                              style={{ width: `${percentage}%` }} 
                            />
                          </div>
                          {/* Контент - мобильная версия */}
                          <div className="relative flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl min-h-[44px]">
                            {/* Позиция */}
                            <span className={`w-5 sm:w-6 text-[10px] sm:text-xs font-bold text-center ${isLight ? 'text-gray-400' : 'text-zinc-400'}`}>{idx + 1}</span>
                            {/* SVG флаг */}
                            <div className="flex-shrink-0">
                              <CountryFlag country={c.name} size={24} />
                            </div>
                            {/* Название страны */}
                            <span className={`text-xs sm:text-sm font-medium flex-1 truncate ${isLight ? 'text-gray-900' : 'text-white'}`}>{c.name}</span>
                            {/* Мини-бар - только на десктопе */}
                            <div className={`w-16 sm:w-24 h-1.5 sm:h-2 rounded-full overflow-hidden hidden md:block ${isLight ? 'bg-gray-200' : 'bg-white/10'}`}>
                              <div 
                                className={`h-full bg-gradient-to-r ${color} rounded-full transition-all duration-500`}
                                style={{ width: `${percentage}%` }} 
                              />
                            </div>
                            {/* Процент и стримы - адаптивные */}
                            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-0.5 sm:gap-2">
                              <span className={`text-[10px] sm:text-xs font-semibold ${
                                isLight 
                                  ? idx === 0 ? 'text-emerald-600' : idx === 1 ? 'text-blue-600' : idx === 2 ? 'text-purple-600' : 'text-gray-600'
                                  : idx < 3 ? `bg-gradient-to-r ${color} bg-clip-text text-transparent` : 'text-zinc-400'
                              }`}>
                                {percentage.toFixed(1)}%
                              </span>
                              <span className={`text-[9px] sm:text-xs tabular-nums ${isLight ? 'text-gray-600' : 'text-zinc-400'}`}>{formatNumber(c.streams)}</span>
                            </div>
                            {/* Доход - только на больших экранах */}
                            <span className={`hidden lg:block text-xs font-bold w-20 text-right tabular-nums ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`}>{formatCurrency(c.revenue)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Статистика по трекам (для EP/альбомов) */}
              {stats!.tracks && stats!.tracks.length > 1 && (
                <div className={`rounded-2xl p-3 sm:p-5 ${
                  isLight 
                    ? 'bg-gradient-to-br from-purple-50 via-white to-blue-50 border border-gray-200'
                    : 'bg-gradient-to-br from-purple-500/5 via-white/5 to-blue-500/5 border border-white/10'
                }`}>
                  <h4 className={`text-sm sm:text-base font-semibold mb-3 sm:mb-5 flex items-center gap-2 flex-wrap ${isLight ? 'text-gray-900' : 'text-white'}`}>
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                      </svg>
                    </div>
                    <span className="flex-1">Статистика по трекам</span>
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-medium ${
                      isLight 
                        ? 'bg-gray-100 text-gray-600 border border-gray-200'
                        : 'bg-zinc-800/80 text-zinc-300 border border-white/5'
                    }`}>
                      {stats!.tracks.length} треков
                    </span>
                  </h4>
                  <div className="space-y-2 sm:space-y-3">
                    {stats!.tracks.map((track, idx) => {
                      const maxStreams = Math.max(...stats!.tracks.map(t => t.streams));
                      const percentage = maxStreams > 0 ? (track.streams / maxStreams) * 100 : 0;
                      const totalPercentage = stats!.totalStreams > 0 ? (track.streams / stats!.totalStreams) * 100 : 0;
                      const isTopTrack = track.streams === maxStreams && maxStreams > 0;
                      
                      // Градиенты для разных позиций
                      const gradients = [
                        'from-amber-500 via-orange-500 to-red-500', // 1 место - золото
                        'from-zinc-300 via-zinc-400 to-zinc-500', // 2 место - серебро
                        'from-amber-700 via-amber-600 to-amber-800', // 3 место - бронза
                        'from-purple-500 to-blue-500',
                        'from-emerald-500 to-teal-500',
                        'from-pink-500 to-rose-500',
                        'from-cyan-500 to-blue-500',
                        'from-violet-500 to-purple-500',
                      ];
                      const gradient = gradients[idx % gradients.length];
                      
                      return (
                        <div 
                          key={track.title + idx} 
                          className={`group relative rounded-xl sm:rounded-2xl overflow-hidden transition-all duration-300 ${
                            isLight 
                              ? 'bg-white border border-gray-200 hover:border-purple-300 hover:shadow-lg hover:shadow-purple-100'
                              : 'bg-zinc-900/50 border border-white/5 hover:border-white/20 hover:shadow-lg hover:shadow-purple-500/10'
                          }`}
                        >
                          {/* Прогресс-бар снизу */}
                          <div className={`absolute bottom-0 left-0 right-0 h-1 ${isLight ? 'bg-gray-100' : 'bg-white/5'}`}>
                            <div 
                              className={`h-full bg-gradient-to-r ${gradient} transition-all duration-700 ease-out`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          
                          <div className="p-3 sm:p-4">
                            <div className="flex items-start sm:items-center gap-2.5 sm:gap-4">
                              {/* Обложка с номером */}
                              <div className="relative flex-shrink-0">
                                {coverUrl ? (
                                  <div className={`w-11 h-11 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl overflow-hidden ring-2 transition-all ${
                                    isLight 
                                      ? 'ring-gray-200 group-hover:ring-purple-300'
                                      : 'ring-white/10 group-hover:ring-purple-500/30'
                                  }`}>
                                    <img src={coverUrl} alt="" className="w-full h-full object-cover" />
                                  </div>
                                ) : (
                                  <div className={`w-11 h-11 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                                    </svg>
                                  </div>
                                )}
                                {/* Бейдж с номером */}
                                <div className={`absolute -top-1 -left-1 w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg flex items-center justify-center text-[10px] sm:text-xs font-bold shadow-lg ${
                                  isLight 
                                    ? 'bg-white border border-gray-200 text-gray-700'
                                    : 'bg-zinc-800 border border-zinc-600 text-white'
                                }`}>
                                  {idx + 1}
                                </div>
                              </div>
                              
                              {/* Информация о треке */}
                              <div className="flex-1 min-w-0">
                                <h5 className={`text-sm sm:text-base font-semibold truncate transition-colors ${
                                  isLight 
                                    ? 'text-gray-900 group-hover:text-purple-600'
                                    : 'text-white group-hover:text-purple-300'
                                }`}>
                                  {track.title}
                                </h5>
                                <div className="flex items-center gap-2 sm:gap-3 mt-0.5 sm:mt-1">
                                  <span className={`text-[10px] sm:text-xs ${isLight ? 'text-gray-500' : 'text-zinc-500'}`}>
                                    {totalPercentage.toFixed(1)}% от общего
                                  </span>
                                  {isTopTrack && (
                                    <span className="inline-flex items-center gap-0.5 sm:gap-1 px-1 sm:px-1.5 py-0.5 bg-amber-500/20 text-amber-500 text-[9px] sm:text-[10px] font-medium rounded">
                                      <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                                      </svg>
                                      ТОП
                                    </span>
                                  )}
                                </div>
                                {/* Статистика - мобильная версия под названием */}
                                <div className="flex sm:hidden items-center gap-2 mt-1.5">
                                  <p className={`text-sm font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>{formatNumber(track.streams)}</p>
                                  <p className={`text-xs font-medium ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`}>{formatCurrency(track.revenue)}</p>
                                </div>
                              </div>
                              
                              {/* Статистика - десктоп */}
                              <div className="hidden sm:block text-right flex-shrink-0">
                                <p className={`text-lg font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>{formatNumber(track.streams)}</p>
                                <p className={`text-sm font-medium ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`}>{formatCurrency(track.revenue)}</p>
                              </div>
                            </div>
                            
                            {/* Платформы трека - компактнее */}
                            {track.platforms.length > 0 && (
                              <div className={`flex flex-wrap gap-1 sm:gap-1.5 mt-2 sm:mt-3 pt-2 sm:pt-3 border-t ${isLight ? 'border-gray-100' : 'border-white/5'}`}>
                                {track.platforms.slice(0, 5).map(platform => {
                                  const platformPercentage = track.streams > 0 ? (platform.streams / track.streams) * 100 : 0;
                                  return (
                                    <div 
                                      key={platform.name}
                                      className={`flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg transition-colors min-h-[28px] sm:min-h-[32px] ${
                                        isLight 
                                          ? 'bg-gray-50 hover:bg-gray-100'
                                          : 'bg-white/5 hover:bg-white/10'
                                      }`}
                                      title={`${platform.name}: ${formatNumber(platform.streams)} стримов`}
                                    >
                                      <PlatformIcon platform={platform.name} size={12} />
                                      <span className={`text-[9px] sm:text-[10px] font-medium ${isLight ? 'text-gray-600' : 'text-zinc-300'}`}>{platformPercentage.toFixed(0)}%</span>
                                    </div>
                                  );
                                })}
                                {track.platforms.length > 5 && (
                                  <div className={`flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg min-h-[28px] sm:min-h-[32px] ${
                                    isLight ? 'bg-gray-50' : 'bg-white/5'
                                  }`}>
                                    <span className={`text-[9px] sm:text-[10px] ${isLight ? 'text-gray-400' : 'text-zinc-500'}`}>+{track.platforms.length - 5}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* По кварталам */}
              {stats!.quarters.length > 0 && (
                <div className={`rounded-xl p-3 sm:p-4 ${
                  isLight 
                    ? 'bg-white border border-gray-200'
                    : 'bg-white/5 border border-white/10'
                }`}>
                  <h4 className={`text-sm font-medium mb-2 sm:mb-3 ${isLight ? 'text-gray-700' : 'text-zinc-300'}`}>По отчётам</h4>
                  <div className="space-y-1 sm:space-y-2">
                    {stats!.quarters.map(q => (
                      <div key={`${q.quarter}-${q.year}`} className={`flex flex-col sm:flex-row sm:items-center justify-between p-2 rounded-lg transition-colors gap-1 sm:gap-0 min-h-[44px] ${
                        isLight ? 'hover:bg-gray-50' : 'hover:bg-white/5'
                      }`}>
                        <span className={`text-sm font-medium ${isLight ? 'text-gray-900' : 'text-white'}`}>{q.quarter} {q.year}</span>
                        <div className="flex items-center gap-3 sm:gap-4">
                          <span className={`text-[10px] sm:text-xs ${isLight ? 'text-gray-500' : 'text-zinc-400'}`}>{formatNumber(q.streams)} стримов</span>
                          <span className={`text-[10px] sm:text-xs font-medium ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`}>{formatCurrency(q.revenue)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6 sm:py-8">
              <div className={`w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-2 sm:mb-3 rounded-xl sm:rounded-2xl flex items-center justify-center ${
                isLight ? 'bg-gray-100' : 'bg-white/5'
              }`}>
                <svg className={`w-6 h-6 sm:w-7 sm:h-7 ${isLight ? 'text-gray-400' : 'text-zinc-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <p className={`text-sm mb-0.5 sm:mb-1 ${isLight ? 'text-gray-500' : 'text-zinc-400'}`}>Статистика пока недоступна</p>
              <p className={`text-[10px] sm:text-xs ${isLight ? 'text-gray-400' : 'text-zinc-500'}`}>Данные появятся после первого квартала с момента публикации релиза</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
