'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { SupabaseClient } from '@supabase/supabase-js';
import JSZip from 'jszip';
import { useTheme } from '@/contexts/ThemeContext';

// Тип для распакованного отчёта из архива
interface ExtractedReport {
  quarter: string;
  year: number;
  files: File[];
}

interface ReportsTabProps {
  supabase: SupabaseClient;
}

interface Report {
  id: string;
  quarter: string;
  year: number;
  quarter_key: string;
  status: 'processing' | 'completed' | 'failed';
  processing_progress: number;
  total_files: number;
  processed_files: number;
  total_rows: number;
  matched_tracks: number;
  unmatched_tracks: number;
  total_revenue: number;
  total_streams: number;
  created_at: string;
  error_log: string | null;
  notes: string | null;
}

interface ReportDetails {
  releases: Array<{
    releaseId: string | null;
    releaseType: string | null;
    releaseTitle: string;
    artistName: string;
    isMatched: boolean;
    totalStreams: number;
    totalRevenue: number;
    coverUrl: string | null;
    tracks: Array<{
      trackTitle: string;
      streams: number;
      revenue: number;
      isrc: string | null;
    }>;
  }>;
  platforms: Array<{ name: string; streams: number; revenue: number }>;
  countries: Array<{ name: string; streams: number; revenue: number }>;
  payouts: Array<{
    userId: string;
    artistName: string;
    email: string;
    avatarUrl: string | null;
    amount: number;
    status: string;
  }>;
}

interface ProcessingStep {
  id: string;
  label: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  detail?: string;
}

// Флаги стран (расширенный список)
const countryFlags: Record<string, string> = {
  // Русскоязычные страны
  'Russia': '🇷🇺', 'Russian Federation': '🇷🇺', 'RU': '🇷🇺', 'Россия': '🇷🇺',
  'Ukraine': '🇺🇦', 'UA': '🇺🇦', 'Украина': '🇺🇦',
  'Kazakhstan': '🇰🇿', 'KZ': '🇰🇿', 'Казахстан': '🇰🇿',
  'Belarus': '🇧🇾', 'BY': '🇧🇾', 'Беларусь': '🇧🇾',
  'Uzbekistan': '🇺🇿', 'UZ': '🇺🇿', 'Узбекистан': '🇺🇿',
  'Kyrgyzstan': '🇰🇬', 'KG': '🇰🇬', 'Кыргызстан': '🇰🇬',
  'Azerbaijan': '🇦🇿', 'AZ': '🇦🇿', 'Азербайджан': '🇦🇿',
  'Armenia': '🇦🇲', 'AM': '🇦🇲', 'Армения': '🇦🇲',
  'Georgia': '🇬🇪', 'GE': '🇬🇪', 'Грузия': '🇬🇪',
  'Moldova': '🇲🇩', 'MD': '🇲🇩', 'Молдова': '🇲🇩',
  'Tajikistan': '🇹🇯', 'TJ': '🇹🇯', 'Таджикистан': '🇹🇯',
  'Turkmenistan': '🇹🇲', 'TM': '🇹🇲', 'Туркменистан': '🇹🇲',
  // Европа
  'United States': '🇺🇸', 'US': '🇺🇸', 'USA': '🇺🇸', 'США': '🇺🇸',
  'Germany': '🇩🇪', 'DE': '🇩🇪', 'Германия': '🇩🇪',
  'France': '🇫🇷', 'FR': '🇫🇷', 'Франция': '🇫🇷',
  'United Kingdom': '🇬🇧', 'UK': '🇬🇧', 'GB': '🇬🇧', 'Великобритания': '🇬🇧',
  'Italy': '🇮🇹', 'IT': '🇮🇹', 'Италия': '🇮🇹',
  'Spain': '🇪🇸', 'ES': '🇪🇸', 'Испания': '🇪🇸',
  'Netherlands': '🇳🇱', 'NL': '🇳🇱', 'Нидерланды': '🇳🇱',
  'Belgium': '🇧🇪', 'BE': '🇧🇪', 'Бельгия': '🇧🇪',
  'Austria': '🇦🇹', 'AT': '🇦🇹', 'Австрия': '🇦🇹',
  'Switzerland': '🇨🇭', 'CH': '🇨🇭', 'Швейцария': '🇨🇭',
  'Sweden': '🇸🇪', 'SE': '🇸🇪', 'Швеция': '🇸🇪',
  'Norway': '🇳🇴', 'NO': '🇳🇴', 'Норвегия': '🇳🇴',
  'Denmark': '🇩🇰', 'DK': '🇩🇰', 'Дания': '🇩🇰',
  'Finland': '🇫🇮', 'FI': '🇫🇮', 'Финляндия': '🇫🇮',
  'Poland': '🇵🇱', 'PL': '🇵🇱', 'Польша': '🇵🇱',
  'Czech Republic': '🇨🇿', 'CZ': '🇨🇿', 'Чехия': '🇨🇿',
  'Hungary': '🇭🇺', 'HU': '🇭🇺', 'Венгрия': '🇭🇺',
  'Romania': '🇷🇴', 'RO': '🇷🇴', 'Румыния': '🇷🇴',
  'Bulgaria': '🇧🇬', 'BG': '🇧🇬', 'Болгария': '🇧🇬',
  'Greece': '🇬🇷', 'GR': '🇬🇷', 'Греция': '🇬🇷',
  'Portugal': '🇵🇹', 'PT': '🇵🇹', 'Португалия': '🇵🇹',
  'Ireland': '🇮🇪', 'IE': '🇮🇪', 'Ирландия': '🇮🇪',
  // Азия
  'Turkey': '🇹🇷', 'TR': '🇹🇷', 'Турция': '🇹🇷',
  'Japan': '🇯🇵', 'JP': '🇯🇵', 'Япония': '🇯🇵',
  'China': '🇨🇳', 'CN': '🇨🇳', 'Китай': '🇨🇳',
  'South Korea': '🇰🇷', 'KR': '🇰🇷', 'Южная Корея': '🇰🇷',
  'India': '🇮🇳', 'IN': '🇮🇳', 'Индия': '🇮🇳',
  'Thailand': '🇹🇭', 'TH': '🇹🇭', 'Таиланд': '🇹🇭',
  'Vietnam': '🇻🇳', 'VN': '🇻🇳', 'Вьетнам': '🇻🇳',
  'Indonesia': '🇮🇩', 'ID': '🇮🇩', 'Индонезия': '🇮🇩',
  'Malaysia': '🇲🇾', 'MY': '🇲🇾', 'Малайзия': '🇲🇾',
  'Philippines': '🇵🇭', 'PH': '🇵🇭', 'Филиппины': '🇵🇭',
  'Singapore': '🇸🇬', 'SG': '🇸🇬', 'Сингапур': '🇸🇬',
  'Israel': '🇮🇱', 'IL': '🇮🇱', 'Израиль': '🇮🇱',
  'UAE': '🇦🇪', 'AE': '🇦🇪', 'United Arab Emirates': '🇦🇪', 'ОАЭ': '🇦🇪',
  'Saudi Arabia': '🇸🇦', 'SA': '🇸🇦', 'Саудовская Аравия': '🇸🇦',
  // Америка
  'Canada': '🇨🇦', 'CA': '🇨🇦', 'Канада': '🇨🇦',
  'Mexico': '🇲🇽', 'MX': '🇲🇽', 'Мексика': '🇲🇽',
  'Brazil': '🇧🇷', 'BR': '🇧🇷', 'Бразилия': '🇧🇷',
  'Argentina': '🇦🇷', 'AR': '🇦🇷', 'Аргентина': '🇦🇷',
  'Chile': '🇨🇱', 'CL': '🇨🇱', 'Чили': '🇨🇱',
  'Colombia': '🇨🇴', 'CO': '🇨🇴', 'Колумбия': '🇨🇴',
  'Peru': '🇵🇪', 'PE': '🇵🇪', 'Перу': '🇵🇪',
  // Океания
  'Australia': '🇦🇺', 'AU': '🇦🇺', 'Австралия': '🇦🇺',
  'New Zealand': '🇳🇿', 'NZ': '🇳🇿', 'Новая Зеландия': '🇳🇿',
  // Африка
  'South Africa': '🇿🇦', 'ZA': '🇿🇦', 'ЮАР': '🇿🇦',
  'Egypt': '🇪🇬', 'EG': '🇪🇬', 'Египет': '🇪🇬',
  'Nigeria': '🇳🇬', 'NG': '🇳🇬', 'Нигерия': '🇳🇬',
  'Morocco': '🇲🇦', 'MA': '🇲🇦', 'Марокко': '🇲🇦',
};

const getFlag = (country: string): string => countryFlags[country] || '🌍';

// Цвета платформ
const platformColors: Record<string, string> = {
  spotify: '#1DB954',
  apple: '#FC3C44',
  yandex: '#FC3F1D',
  vk: '#0077FF',
  youtube: '#FF0000',
  deezer: '#FEAA2D',
  tiktok: '#00F2EA',
  soundcloud: '#FF5500',
  amazon: '#FF9900',
  tidal: '#000000',
  default: '#A855F7'
};

// Иконки платформ с SVG
const PlatformIcon = ({ platform, size = 20 }: { platform: string; size?: number }) => {
  const p = platform.toLowerCase();
  
  // Spotify
  if (p.includes('spotify')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="#1DB954">
        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
      </svg>
    );
  }
  
  // Apple Music
  if (p.includes('apple')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="#FC3C44">
        <path d="M23.994 6.124a9.23 9.23 0 00-.24-2.19c-.317-1.31-1.062-2.31-2.18-3.043a5.022 5.022 0 00-1.877-.726 10.496 10.496 0 00-1.564-.15c-.04-.003-.083-.01-.124-.013H5.986c-.152.01-.303.017-.455.026-.747.043-1.49.123-2.193.4-1.336.53-2.3 1.452-2.865 2.78-.192.448-.292.925-.363 1.408-.056.392-.088.785-.1 1.18 0 .032-.007.062-.01.093v12.223c.01.14.017.283.027.424.05.815.154 1.624.497 2.373.65 1.42 1.738 2.353 3.234 2.801.42.127.856.187 1.293.228.555.053 1.11.06 1.667.06h11.03a12.5 12.5 0 001.57-.1c.822-.106 1.596-.35 2.295-.81a5.046 5.046 0 001.88-2.207c.186-.42.293-.87.37-1.324.113-.675.138-1.358.137-2.04-.002-3.8 0-7.595-.003-11.393zm-6.423 3.99v5.712c0 .417-.058.827-.244 1.206-.29.59-.76.962-1.388 1.14-.35.1-.706.157-1.07.173-.95.042-1.785-.56-2.07-1.483-.263-.855.062-1.783.838-2.293.314-.206.67-.342 1.04-.432.43-.104.87-.167 1.3-.255.217-.043.413-.129.567-.29.146-.153.2-.34.2-.554v-3.946c0-.304-.124-.478-.417-.524-.25-.04-.503-.065-.756-.095l-2.79-.366c-.063-.008-.128-.016-.19-.028-.238-.042-.354.023-.394.267-.005.032-.007.065-.007.098v6.177c0 .263-.02.525-.1.78-.163.53-.484.947-.962 1.227-.306.18-.642.282-.993.338-.496.078-1 .08-1.487-.05-.772-.204-1.306-.7-1.55-1.458-.197-.613-.1-1.197.262-1.73.303-.447.72-.752 1.22-.958.35-.144.718-.217 1.09-.27.374-.055.75-.094 1.124-.145.2-.027.39-.078.567-.17.254-.13.377-.338.377-.622V5.586c0-.152.02-.302.076-.446.12-.306.378-.468.682-.42.09.015.18.03.27.048l5.296 1.07c.405.082.64.318.68.727.012.127.01.255.01.383z"/>
      </svg>
    );
  }
  
  // Яндекс Музыка (официальная иконка - красный Y)
  if (p.includes('yandex') || p.includes('яндекс')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24">
        <rect width="24" height="24" rx="5" fill="#FC3F1D"/>
        <path d="M13.76 18.14h-1.8V7.38h-.9c-1.64 0-2.5.84-2.5 2.06 0 1.4.58 2.06 1.78 2.88l.98.66-2.88 5.16H6.44l2.56-4.56c-1.46-1.06-2.28-2.12-2.28-3.92 0-2.24 1.56-3.8 4.28-3.8h2.76v12.28z" fill="#fff"/>
      </svg>
    );
  }
  
  // VK Музыка
  if (p.includes('vk') || p.includes('uma') || p.includes('boom')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="#0077FF">
        <path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.408 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.864-.525-2.05-1.727-1.033-1-1.49-1.135-1.744-1.135-.356 0-.458.102-.458.593v1.575c0 .424-.135.678-1.253.678-1.846 0-3.896-1.118-5.335-3.202C4.624 10.857 4 8.467 4 7.985c0-.254.102-.491.593-.491h1.744c.44 0 .61.203.779.678.864 2.49 2.303 4.675 2.896 4.675.22 0 .322-.102.322-.66V9.721c-.068-1.186-.695-1.287-.695-1.71 0-.203.17-.407.44-.407h2.744c.373 0 .508.203.508.643v3.473c0 .372.17.508.271.508.22 0 .407-.136.813-.542 1.254-1.406 2.151-3.574 2.151-3.574.119-.254.322-.491.762-.491h1.744c.525 0 .644.27.525.643-.22 1.017-2.354 4.031-2.354 4.031-.186.305-.254.44 0 .78.186.254.796.779 1.203 1.253.745.847 1.32 1.558 1.473 2.05.17.49-.085.744-.576.744z"/>
      </svg>
    );
  }
  
  // YouTube Music
  if (p.includes('youtube')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="#FF0000">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    );
  }
  
  // Deezer
  if (p.includes('deezer')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="#FEAA2D">
        <path d="M18.81 4.16v3.03H24V4.16h-5.19zM6.27 8.38v3.027h5.189V8.38h-5.19zm12.54 0v3.027H24V8.38h-5.19zM0 12.62v3.028h5.19V12.62H0zm6.27 0v3.028h5.189V12.62h-5.19zm6.27 0v3.028h5.19V12.62h-5.19zm6.27 0v3.028H24V12.62h-5.19zM0 16.84v3.028h5.19V16.84H0zm6.27 0v3.028h5.189V16.84h-5.19zm6.27 0v3.028h5.19V16.84h-5.19zm6.27 0v3.028H24V16.84h-5.19z"/>
      </svg>
    );
  }
  
  // TikTok
  if (p.includes('tiktok')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="#00F2EA">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
      </svg>
    );
  }
  
  // SoundCloud
  if (p.includes('soundcloud')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="#FF5500">
        <path d="M1.175 12.225c-.051 0-.094.046-.101.1l-.233 2.154.233 2.105c.007.058.05.098.101.098.05 0 .09-.04.099-.098l.255-2.105-.27-2.154c-.01-.057-.05-.1-.1-.1zm-.566.947c-.08 0-.081.042-.088.098l-.212 1.312.212 1.28c.007.058.025.098.088.098.05 0 .094-.04.1-.098l.234-1.28-.234-1.312c-.006-.057-.05-.098-.1-.098zm5.552-2.478c-.08 0-.089.047-.096.103l-.183 3.208.183 2.997c.007.065.016.112.096.112.08 0 .09-.047.096-.112l.207-2.997-.207-3.208c-.006-.057-.016-.103-.096-.103zm-4.406.694c-.08 0-.089.047-.096.104l-.19 2.513.19 2.468c.007.058.016.104.096.104.08 0 .09-.047.097-.104l.218-2.468-.218-2.513c-.007-.058-.017-.104-.097-.104zm1.173-.435c-.08 0-.089.046-.096.103l-.181 2.948.181 2.817c.007.058.016.104.096.104.08 0 .09-.046.096-.104l.207-2.817-.207-2.948c-.006-.058-.016-.103-.096-.103zm.586-.164c-.08 0-.09.046-.097.103l-.173 3.112.173 2.87c.007.058.016.105.097.105.08 0 .09-.047.096-.105l.2-2.87-.2-3.112c-.006-.058-.016-.103-.096-.103zm.585-.164c-.08 0-.09.046-.096.103l-.165 3.276.165 2.923c.006.058.016.105.096.105.08 0 .09-.047.096-.105l.19-2.923-.19-3.276c-.006-.058-.016-.103-.096-.103zm4.986-.763c-.08 0-.09.047-.097.104l-.147 4.04.147 3.106c.007.058.017.104.097.104.08 0 .09-.046.096-.104l.168-3.106-.168-4.04c-.006-.058-.016-.104-.096-.104zm-.586.15c-.08 0-.09.047-.097.104l-.155 3.89.155 3.077c.007.057.017.103.097.103.08 0 .09-.046.096-.103l.177-3.077-.177-3.89c-.006-.058-.016-.104-.096-.104zm1.173-.174c-.08 0-.09.046-.097.103l-.14 4.064.14 3.048c.007.058.017.104.097.104.08 0 .09-.046.096-.104l.16-3.048-.16-4.064c-.006-.058-.016-.103-.096-.103zm.586-.164c-.08 0-.09.046-.096.103l-.132 4.228.132 3c.006.058.016.104.096.104.08 0 .09-.046.096-.104l.152-3-.152-4.228c-.006-.058-.016-.103-.096-.103zm3.515.762c-.08 0-.09.047-.097.104l-.108 3.467.108 2.87c.007.057.017.103.097.103.08 0 .09-.046.096-.103l.124-2.87-.124-3.467c-.006-.058-.016-.104-.096-.104zm-2.343-.598c-.08 0-.09.047-.096.104l-.124 4.063.124 2.952c.006.058.016.104.096.104.08 0 .09-.046.097-.104l.14-2.952-.14-4.063c-.007-.058-.017-.104-.097-.104zm1.173-.058c-.08 0-.09.046-.096.103l-.116 4.122.116 2.893c.006.057.016.103.096.103.08 0 .09-.046.096-.103l.132-2.893-.132-4.122c-.006-.058-.016-.103-.096-.103zm.584-.059c-.08 0-.09.047-.096.104l-.108 4.18.108 2.835c.006.058.016.104.096.104.08 0 .09-.046.096-.104l.124-2.835-.124-4.18c-.006-.058-.016-.104-.096-.104zM21.54 9.75c-.482 0-.94.104-1.355.29-.278-3.197-2.933-5.704-6.18-5.704-1.066 0-2.085.28-2.965.782-.335.192-.422.4-.426.793v11.4c.004.403.33.75.746.793h10.18c1.36 0 2.46-1.115 2.46-2.49 0-1.377-1.1-2.49-2.46-2.49z"/>
      </svg>
    );
  }
  
  // Amazon Music
  if (p.includes('amazon')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="#FF9900">
        <path d="M.045 18.02c.07-.116.168-.182.284-.232a19.2 19.2 0 0 0 3.54-2.025 13.753 13.753 0 0 0 4.506-5.11c.182-.326.32-.67.417-1.02.04-.143.068-.295.115-.44.122-.38.334-.65.704-.76.216-.064.413-.04.612.06.08.04.15.11.21.18.116.14.18.31.22.49.04.16.04.33.02.5-.1.78-.34 1.52-.66 2.23a15.39 15.39 0 0 1-2.03 3.42c-1.44 1.87-3.2 3.41-5.24 4.61-.37.22-.75.41-1.16.56-.15.05-.3.11-.46.13-.37.07-.68-.07-.88-.39-.05-.08-.07-.16-.08-.24v-.01c-.04-.06-.03-.11.04-.18zm17.135-11c.08-.07.17-.11.27-.14.28-.06.54.06.71.3.05.08.08.17.1.26.02.15-.01.3-.08.44-.2.43-.42.85-.66 1.26-.79 1.39-1.7 2.7-2.73 3.92-.5.6-1.03 1.17-1.6 1.7-.08.08-.17.14-.26.21-.18.13-.38.17-.58.1-.18-.06-.33-.18-.4-.36-.07-.17-.07-.36-.01-.55.04-.12.1-.23.17-.33.37-.54.72-1.1 1.06-1.66.85-1.43 1.58-2.92 2.13-4.48.05-.14.1-.29.16-.43.08-.22.18-.42.35-.57.1-.09.2-.16.32-.22zm6.82 3.41c0 .72-.44 1.32-1.13 1.54-.25.08-.5.12-.77.12-.43 0-.83-.09-1.2-.28-.41-.21-.74-.52-.97-.92-.14-.26-.22-.55-.22-.85 0-.47.18-.89.5-1.23.33-.35.76-.56 1.24-.62.13-.02.26-.02.4-.01.75.05 1.36.43 1.7 1.08.12.24.19.5.2.76.01.14.02.28.02.41.01.01.01.01.03 0zM12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0z"/>
      </svg>
    );
  }
  
  // Tidal
  if (p.includes('tidal')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="#ffffff">
        <path d="M12.012 3.992L8.008 7.996 4.004 3.992 0 7.996l4.004 4.004 4.004-4.004 4.004 4.004-4.004 4.004 4.004 4.004 4.004-4.004-4.004-4.004 4.004-4.004 4.004 4.004 4.004-4.004L20.02 3.992l-4.004 4.004z"/>
      </svg>
    );
  }
  
  // Default icon
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#A855F7">
      <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
    </svg>
  );
};

// Получить цвет платформы
const getPlatformColor = (platform: string): string => {
  const p = platform.toLowerCase();
  if (p.includes('spotify')) return platformColors.spotify;
  if (p.includes('apple')) return platformColors.apple;
  if (p.includes('yandex') || p.includes('яндекс')) return platformColors.yandex;
  if (p.includes('vk') || p.includes('uma') || p.includes('boom')) return platformColors.vk;
  if (p.includes('youtube')) return platformColors.youtube;
  if (p.includes('deezer')) return platformColors.deezer;
  if (p.includes('tiktok')) return platformColors.tiktok;
  if (p.includes('soundcloud')) return platformColors.soundcloud;
  if (p.includes('amazon')) return platformColors.amazon;
  if (p.includes('tidal')) return platformColors.tidal;
  return platformColors.default;
};

// Иконки
const UploadIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);

const ChartIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const XIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const RefreshIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const EyeIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const SparklesIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
  </svg>
);

export default function ReportsTab({ supabase }: ReportsTabProps) {
  const { themeName } = useTheme();
  const isLight = themeName === 'light';
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedReportDetails, setSelectedReportDetails] = useState<ReportDetails | null>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([]);
  const [selectedQuarter, setSelectedQuarter] = useState('Q1');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [activeReportId, setActiveReportId] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadMode, setUploadMode] = useState<'single' | 'archive'>('single');
  const [extractedReports, setExtractedReports] = useState<ExtractedReport[]>([]);
  const [processingArchive, setProcessingArchive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Закрытие модалок по Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedReport) {
          setSelectedReport(null);
          setSelectedReportDetails(null);
        } else if (showUploadModal) {
          setShowUploadModal(false);
          setFiles([]);
        }
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [selectedReport, showUploadModal]);

  // Загрузка отчётов
  const loadReports = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return;
      }

      const response = await fetch('/api/admin/reports', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setReports(data);
      }
    } catch {
      // Ошибка загрузки отчётов
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  // Polling для обновления статуса обработки
  useEffect(() => {
    if (activeReportId) {
      pollIntervalRef.current = setInterval(async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) return;

          const response = await fetch(`/api/admin/reports?id=${activeReportId}`, {
            headers: {
              'Authorization': `Bearer ${session.access_token}`
            }
          });

          if (response.ok) {
            const report = await response.json();
            
            // Обновляем шаги обработки
            updateProcessingSteps(report);
            
            if (report.status === 'completed' || report.status === 'failed') {
              setActiveReportId(null);
              setUploading(false);
              loadReports();
              
              if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
              }
            }
          }
        } catch (error) {
          console.error('Error polling report status:', error);
        }
      }, 1000);

      return () => {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
        }
      };
    }
  }, [activeReportId, supabase, loadReports]);

  // Обновление шагов обработки
  const updateProcessingSteps = (report: Report) => {
    const progress = report.processing_progress;
    
    setProcessingSteps([
      {
        id: 'upload',
        label: 'Загрузка файлов',
        status: progress > 0 ? 'completed' : 'processing',
        detail: `${report.total_files} файлов`
      },
      {
        id: 'parse',
        label: 'Парсинг CSV данных',
        status: progress >= 25 ? 'completed' : progress > 0 ? 'processing' : 'pending',
        detail: progress >= 25 ? `${report.total_rows.toLocaleString()} строк` : undefined
      },
      {
        id: 'match',
        label: 'Поиск треков в системе',
        status: progress >= 50 ? 'completed' : progress >= 25 ? 'processing' : 'pending',
        detail: progress >= 50 ? `${report.matched_tracks} найдено` : undefined
      },
      {
        id: 'save',
        label: 'Сохранение статистики',
        status: progress >= 75 ? 'completed' : progress >= 50 ? 'processing' : 'pending',
        detail: progress >= 75 ? `${report.total_streams.toLocaleString()} прослушиваний` : undefined
      },
      {
        id: 'payout',
        label: 'Начисление выплат',
        status: progress >= 100 ? 'completed' : progress >= 75 ? 'processing' : 'pending',
        detail: progress >= 100 ? `${report.total_revenue.toFixed(2)} RUB` : undefined
      }
    ]);
    
    setUploadProgress(progress);
  };

  // Обработка drag & drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    
    // Проверяем, есть ли ZIP файл
    const zipFile = droppedFiles.find(f => f.name.toLowerCase().endsWith('.zip'));
    if (zipFile) {
      await processZipFile(zipFile);
      return;
    }
    
    // Обычные CSV файлы
    const csvFiles = droppedFiles.filter(file => file.name.endsWith('.csv'));
    setFiles(prev => [...prev, ...csvFiles]);
    setUploadMode('single');
  };

  // Парсинг названия папки для определения квартала и года
  const parseQuarterFolder = (folderName: string): { quarter: string; year: number } | null => {
    // Паттерны: "q1 2025", "Q1_2025", "q1-2025", "2025_q1", "2025 Q1" и т.д.
    const patterns = [
      /[qQ]([1-4])[\s_-]*(\d{4})/,  // q1 2025, Q1_2025, q1-2025
      /(\d{4})[\s_-]*[qQ]([1-4])/,  // 2025_q1, 2025 Q1
    ];
    
    for (const pattern of patterns) {
      const match = folderName.match(pattern);
      if (match) {
        if (pattern === patterns[0]) {
          return { quarter: `Q${match[1]}`, year: parseInt(match[2]) };
        } else {
          return { quarter: `Q${match[2]}`, year: parseInt(match[1]) };
        }
      }
    }
    return null;
  };

  // Обработка ZIP архива
  const processZipFile = async (zipFile: File) => {
    setProcessingArchive(true);
    try {
      const zip = await JSZip.loadAsync(zipFile);
      const reports: Map<string, { quarter: string; year: number; files: File[] }> = new Map();
      
      // Группируем файлы по папкам (кварталам)
      const filePromises: Promise<void>[] = [];
      
      zip.forEach((relativePath, zipEntry) => {
        if (zipEntry.dir) return; // Пропускаем папки
        // Поддержка любых файлов: CSV, XLSX, XLS
        const lowerPath = relativePath.toLowerCase();
        if (!lowerPath.endsWith('.csv') && !lowerPath.endsWith('.xlsx') && !lowerPath.endsWith('.xls')) return;

        const pathParts = relativePath.split('/');
        let quarterInfo: { quarter: string; year: number } | null = null;

        // Ищем квартал и год в любом сегменте пути
        for (const part of pathParts) {
          const match = part.match(/q([1-4])\s*(\d{4})/i);
          if (match) {
            quarterInfo = { quarter: `Q${match[1]}`, year: parseInt(match[2]) };
            break;
          }
        }

        // Если не нашли квартал в пути, пропускаем
        if (!quarterInfo) return;

        const key = `${quarterInfo.quarter}_${quarterInfo.year}`;

        filePromises.push(
          zipEntry.async('blob').then(blob => {
            const fileName = pathParts[pathParts.length - 1];
            // Тип файла по расширению
            let type = 'text/csv';
            if (lowerPath.endsWith('.xlsx')) type = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
            if (lowerPath.endsWith('.xls')) type = 'application/vnd.ms-excel';
            const file = new File([blob], fileName, { type });

            if (!reports.has(key)) {
              reports.set(key, { ...quarterInfo!, files: [] });
            }
            reports.get(key)!.files.push(file);
          })
        );
      });
      
      await Promise.all(filePromises);
      
      // Сортируем по году и кварталу
      const sortedReports = Array.from(reports.values()).sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.quarter.localeCompare(b.quarter);
      });
      
      setExtractedReports(sortedReports);
      setUploadMode('archive');
    } catch (error) {
      console.error('Error processing ZIP:', error);
      alert('Ошибка при распаковке архива');
    } finally {
      setProcessingArchive(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      
      // Проверяем, есть ли ZIP файл
      const zipFile = selectedFiles.find(f => f.name.toLowerCase().endsWith('.zip'));
      if (zipFile) {
        await processZipFile(zipFile);
        return;
      }
      
      // Обычные CSV файлы
      const csvFiles = selectedFiles.filter(file => file.name.endsWith('.csv'));
      setFiles(prev => [...prev, ...csvFiles]);
      setUploadMode('single');
    }
  };

  // Загрузка отчёта (обычный режим)
  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);
    setProcessingSteps([
      { id: 'upload', label: 'Загрузка файлов', status: 'processing' },
      { id: 'parse', label: 'Парсинг CSV данных', status: 'pending' },
      { id: 'match', label: 'Поиск треков в системе', status: 'pending' },
      { id: 'save', label: 'Сохранение статистики', status: 'pending' },
      { id: 'payout', label: 'Начисление выплат', status: 'pending' }
    ]);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const formData = new FormData();
      files.forEach(file => formData.append('files', file));
      formData.append('quarter', selectedQuarter);
      formData.append('year', selectedYear.toString());

      const response = await fetch('/api/admin/reports', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Upload error response:', errorData);
        throw new Error(errorData.error || `Upload failed: ${response.status}`);
      }

      const result = await response.json();
      setActiveReportId(result.report_id);
      setFiles([]);
      setShowUploadModal(false);
      
      // Обновляем первый шаг как завершённый
      setProcessingSteps(prev => prev.map((s, i) => 
        i === 0 ? { ...s, status: 'completed' as const } : 
        i === 1 ? { ...s, status: 'processing' as const } : s
      ));
      setUploadProgress(10);
      
    } catch {
      setUploading(false);
      setProcessingSteps(prev => prev.map(s => ({ ...s, status: 'error' as const })));
    }
  };

  // Загрузка всех отчётов из архива
  const handleUploadArchive = async () => {
    if (extractedReports.length === 0) return;

    setUploading(true);
    setUploadProgress(0);
    
    const totalReports = extractedReports.length;
    let completedReports = 0;
    
    setProcessingSteps([
      { id: 'unpack', label: 'Архив распакован', status: 'completed' },
      { id: 'upload', label: `Загрузка 0/${totalReports} отчётов`, status: 'processing' },
      { id: 'complete', label: 'Завершение', status: 'pending' }
    ]);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      for (const report of extractedReports) {
        const formData = new FormData();
        report.files.forEach(file => formData.append('files', file));
        formData.append('quarter', report.quarter);
        formData.append('year', report.year.toString());

        const response = await fetch('/api/admin/reports', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          },
          body: formData
        });

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error');
          console.error(`Error uploading ${report.quarter} ${report.year}:`, response.status, response.statusText, errorText);
          continue; // Продолжаем со следующим отчётом
        }

        completedReports++;
        const progress = Math.round((completedReports / totalReports) * 80);
        setUploadProgress(progress);
        setProcessingSteps(prev => prev.map((s, i) => 
          i === 1 ? { ...s, label: `Загрузка ${completedReports}/${totalReports} отчётов` } : s
        ));
        
        // Небольшая задержка между запросами
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Ждём завершения всех отчётов
      setProcessingSteps(prev => prev.map((s, i) => 
        i === 1 ? { ...s, status: 'completed' as const } :
        i === 2 ? { ...s, status: 'processing' as const } : s
      ));
      setUploadProgress(90);
      
      // Ждём завершения обработки последнего отчёта
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      setProcessingSteps(prev => prev.map(s => ({ ...s, status: 'completed' as const })));
      setUploadProgress(100);
      
      // Закрываем модалку и обновляем список
      setTimeout(() => {
        setUploading(false);
        setShowUploadModal(false);
        setExtractedReports([]);
        setUploadMode('single');
        loadReports();
      }, 1500);
      
    } catch (error) {
      console.error('Error uploading archive:', error);
      setUploading(false);
      setProcessingSteps(prev => prev.map(s => ({ ...s, status: 'error' as const })));
    }
  };

  // Форматирование чисел
  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toLocaleString();
  };

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 2
    }).format(num);
  };

  // Удаление отчёта
  const [deletingReportId, setDeletingReportId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Report | null>(null);

  // Переименование отчёта
  const [renamingReportId, setRenamingReportId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);

  const startRename = (report: Report, e: React.MouseEvent) => {
    e.stopPropagation();
    setRenamingReportId(report.id);
    setRenameValue(report.notes || `${report.quarter} ${report.year}`);
    setTimeout(() => renameInputRef.current?.focus(), 50);
  };

  const saveRename = async (reportId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/admin/reports', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: reportId, name: renameValue.trim() })
      });

      if (response.ok) {
        // Обновляем локальный список
        setReports(prev => prev.map(r => 
          r.id === reportId ? { ...r, notes: renameValue.trim() || null } : r
        ));
      }
    } catch {
      // Ошибка переименования
    } finally {
      setRenamingReportId(null);
    }
  };

  const cancelRename = () => {
    setRenamingReportId(null);
    setRenameValue('');
  };

  const deleteReport = async (report: Report) => {
    setDeletingReportId(report.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/admin/reports?id=${report.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });

      if (response.ok) {
        // Обновляем список
        loadReports();
      } else {
        const error = await response.json();
        alert('Ошибка удаления: ' + error.error);
      }
    } catch {
      // Ошибка удаления отчёта
    } finally {
      setDeletingReportId(null);
      setShowDeleteConfirm(null);
    }
  };

  // Загрузка деталей отчёта
  const loadReportDetails = async (report: Report) => {
    if (report.status !== 'completed') return;
    
    setLoadingDetails(true);
    setSelectedReport(report);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/admin/reports?id=${report.id}&details=true`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedReportDetails(data.details);
      }
    } catch {
      // Ошибка загрузки деталей
    } finally {
      setLoadingDetails(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Модалка подтверждения удаления - через Portal */}
      {showDeleteConfirm && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setShowDeleteConfirm(null)}
        >
          <div 
            className="bg-zinc-900 rounded-2xl border border-red-500/30 w-full max-w-md p-4 sm:p-6 animate-fade-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-white">Удалить отчёт?</h3>
                <p className="text-sm text-zinc-400 truncate">{showDeleteConfirm.quarter} {showDeleteConfirm.year}</p>
              </div>
            </div>
            
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
              <p className="text-sm text-red-300 mb-2">
                <strong>Внимание!</strong> Это действие необратимо. Будут удалены:
              </p>
              <ul className="text-xs sm:text-sm text-zinc-400 space-y-1">
                <li>• Вся статистика прослушиваний</li>
                <li>• Данные по платформам и странам</li>
                <li>• Начисления артистам ({formatCurrency(showDeleteConfirm.total_revenue)})</li>
                <li>• Баланс пользователей будет уменьшен</li>
              </ul>
            </div>
            
            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-3 sm:px-4 py-2.5 sm:py-2.5 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors text-sm sm:text-base min-h-[44px]"
              >
                Отмена
              </button>
              <button
                onClick={() => deleteReport(showDeleteConfirm)}
                disabled={deletingReportId === showDeleteConfirm.id}
                className="flex-1 px-3 sm:px-4 py-2.5 sm:py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm sm:text-base min-h-[44px]"
              >
                {deletingReportId === showDeleteConfirm.id ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span className="hidden sm:inline">Удаление...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span className="hidden sm:inline">Удалить</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Заголовок */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-lg sm:text-2xl font-bold text-white flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center flex-shrink-0">
              <ChartIcon />
            </div>
            <span className="truncate">Отчёты по роялти</span>
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm mt-1 hidden sm:block">Загрузка и обработка квартальных отчётов дистрибьютора</p>
        </div>
        
        <button
          onClick={() => setShowUploadModal(true)}
          disabled={uploading}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] w-full sm:w-auto flex-shrink-0"
        >
          <UploadIcon />
          <span className="sm:hidden">Загрузить</span>
          <span className="hidden sm:inline">Загрузить отчёт</span>
        </button>
      </div>

      {/* Модалка загрузки - через Portal */}
      {showUploadModal && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowUploadModal(false);
              setFiles([]);
            }
          }}
        >
          <div className="relative bg-zinc-900 rounded-2xl border border-white/10 w-full max-w-lg overflow-hidden shadow-2xl">
            {/* Декоративная полоска сверху */}
            <div className="h-0.5 bg-gradient-to-r from-emerald-500 to-teal-500" />
            
            <div className="p-6">
              {/* Заголовок */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    {uploadMode === 'archive' ? (
                      <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {uploadMode === 'archive' ? 'Архив отчётов' : 'Загрузка отчёта'}
                    </h3>
                    <p className="text-zinc-500 text-xs">
                      {uploadMode === 'archive' 
                        ? `Найдено ${extractedReports.length} квартальных отчётов`
                        : 'CSV файлы или ZIP архив'
                      }
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => { 
                    setShowUploadModal(false); 
                    setFiles([]); 
                    setExtractedReports([]);
                    setUploadMode('single');
                  }}
                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                >
                  <XIcon />
                </button>
              </div>

              {/* Режим архива - показываем найденные кварталы */}
              {uploadMode === 'archive' && extractedReports.length > 0 ? (
                <>
                  <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                    <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Архив распакован — кварталы определены автоматически
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-5 max-h-64 overflow-y-auto pr-2">
                    {extractedReports.map((report, idx) => (
                      <div 
                        key={idx}
                        className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10"
                      >
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
                          <span className="text-emerald-400 font-bold text-sm">{report.quarter}</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-white font-medium">{report.quarter} {report.year}</p>
                          <p className="text-xs text-zinc-500">{report.files.length} файлов</p>
                        </div>
                        <div className="flex flex-wrap gap-1 max-w-[150px]">
                          {report.files.slice(0, 2).map((f, i) => (
                            <span key={i} className="text-[10px] px-1.5 py-0.5 bg-white/10 rounded text-zinc-400 truncate max-w-[70px]">
                              {f.name}
                            </span>
                          ))}
                          {report.files.length > 2 && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-white/10 rounded text-zinc-400">
                              +{report.files.length - 2}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setExtractedReports([]);
                        setUploadMode('single');
                      }}
                      className="flex-1 py-3 rounded-xl font-medium bg-white/10 text-zinc-300 hover:bg-white/15 transition-colors"
                    >
                      Отмена
                    </button>
                    <button
                      onClick={handleUploadArchive}
                      className="flex-1 py-3 rounded-xl font-medium bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-lg hover:shadow-emerald-500/25 transition-all"
                    >
                      Загрузить все ({extractedReports.length})
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Выбор периода - только когда файлы уже выбраны */}
                  {files.length > 0 && (
                    <div className="grid grid-cols-2 gap-3 mb-5">
                      <div className="relative">
                        <label className="block text-xs font-medium text-zinc-400 mb-1.5">Квартал</label>
                        <select
                          value={selectedQuarter}
                          onChange={(e) => setSelectedQuarter(e.target.value)}
                          className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 appearance-none cursor-pointer text-sm"
                        >
                          <option value="Q1">Q1 — Янв-Мар</option>
                          <option value="Q2">Q2 — Апр-Июн</option>
                          <option value="Q3">Q3 — Июл-Сен</option>
                          <option value="Q4">Q4 — Окт-Дек</option>
                        </select>
                        <div className="absolute right-3 top-[2.1rem] pointer-events-none text-zinc-400">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                      <div className="relative">
                        <label className="block text-xs font-medium text-zinc-400 mb-1.5">Год</label>
                        <select
                          value={selectedYear}
                          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                          className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 appearance-none cursor-pointer text-sm"
                        >
                          {[2024, 2025, 2026, 2027].map(year => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                        </select>
                        <div className="absolute right-3 top-[2.1rem] pointer-events-none text-zinc-400">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Drag & Drop зона */}
                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => {
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                        fileInputRef.current.click();
                      }
                    }}
                    className={`relative rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 group ${
                      dragActive 
                        ? 'bg-emerald-500/10 border-2 border-emerald-400' 
                        : processingArchive
                        ? 'bg-amber-500/10 border-2 border-amber-400'
                        : 'bg-white/[0.02] border-2 border-dashed border-white/20 hover:border-emerald-500/50 hover:bg-emerald-500/5'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept=".csv,.zip"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                
                <div className="flex flex-col items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                    dragActive 
                      ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30' 
                      : 'bg-white/10 group-hover:bg-emerald-500/20'
                  }`}>
                    <svg className={`w-7 h-7 ${dragActive ? 'text-white' : 'text-zinc-400 group-hover:text-emerald-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  
                  <div>
                    <p className={`text-lg font-medium ${dragActive ? 'text-emerald-400' : 'text-white'}`}>
                      {dragActive ? 'Отпустите файлы' : processingArchive ? 'Распаковка архива...' : 'Перетащите файлы'}
                    </p>
                    <p className="text-sm text-zinc-500 mt-1">
                      {processingArchive ? 'Подождите...' : 'CSV файлы или ZIP архив с папками по кварталам'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Список файлов */}
              {files.length > 0 && (
                <div className="mt-4 space-y-1.5">
                  <p className="text-xs text-zinc-500">Выбрано файлов: <span className="text-emerald-400">{files.length}</span> — укажите квартал выше</p>
                  <div className="max-h-28 overflow-y-auto space-y-1.5 pr-1">
                    {files.map((file, idx) => (
                      <div 
                        key={idx} 
                        className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg border border-white/5 group"
                      >
                        <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="flex-1 text-sm text-white truncate">{file.name}</span>
                        <span className="text-xs text-zinc-500">{(file.size / 1024).toFixed(0)} KB</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setFiles(prev => prev.filter((_, i) => i !== idx));
                          }}
                          className="w-6 h-6 rounded bg-red-500/10 text-red-400 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-500/20 transition-all"
                        >
                          <XIcon />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Кнопка загрузки */}
              <button
                onClick={handleUpload}
                disabled={files.length === 0}
                className={`w-full mt-5 py-3 rounded-xl font-medium transition-all ${
                  files.length > 0 
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-lg hover:shadow-emerald-500/25' 
                    : 'bg-white/10 text-zinc-500 cursor-not-allowed'
                }`}
              >
                {files.length > 0 ? `Начать обработку (${files.length})` : 'Выберите файлы'}
              </button>
            </>
          )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Анимация обработки - через Portal */}
      {uploading && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-zinc-900 rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
            {/* Декоративная полоска */}
            <div className="h-0.5 bg-gradient-to-r from-emerald-500 to-teal-500" />
            
            <div className="p-6">
              {/* Центральная анимация */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  {/* Внешнее кольцо */}
                  <div className="absolute -inset-4 rounded-full border border-emerald-500/20 animate-spin" style={{ animationDuration: '6s' }}>
                    <div className="absolute top-0 left-1/2 w-1.5 h-1.5 bg-emerald-400 rounded-full -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  
                  {/* Основной круг с прогрессом */}
                  <div className="relative w-20 h-20">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                      <circle 
                        cx="50" cy="50" r="45" 
                        fill="none" 
                        stroke="url(#progressGradient)" 
                        strokeWidth="8" 
                        strokeLinecap="round"
                        strokeDasharray={`${uploadProgress * 2.83} 283`}
                        className="transition-all duration-500"
                      />
                      <defs>
                        <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#10b981" />
                          <stop offset="100%" stopColor="#14b8a6" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold text-emerald-400">{uploadProgress}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Заголовок */}
              <div className="text-center mb-5">
                <h3 className="text-lg font-semibold text-white mb-1">Обработка отчёта</h3>
                <p className="text-sm text-zinc-500">
                  <span className="text-emerald-400">{selectedQuarter}</span> • <span className="text-zinc-400">{selectedYear}</span>
                </p>
              </div>

              {/* Шаги обработки */}
              <div className="space-y-2">
                {processingSteps.map((step, idx) => (
                  <div 
                    key={step.id}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                      step.status === 'processing' 
                        ? 'bg-emerald-500/10 border border-emerald-500/30' 
                        : step.status === 'completed' 
                        ? 'bg-white/[0.02]' 
                        : 'opacity-40'
                    }`}
                  >
                    {/* Иконка статуса */}
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      step.status === 'completed' 
                        ? 'bg-emerald-500' 
                        : step.status === 'processing' 
                        ? 'bg-emerald-500/20' 
                        : 'bg-white/10'
                    }`}>
                      {step.status === 'completed' ? (
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : step.status === 'processing' ? (
                        <div className="w-3.5 h-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <span className="text-xs text-zinc-500">{idx + 1}</span>
                      )}
                    </div>

                    {/* Текст */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${
                        step.status === 'completed' ? 'text-white' : 
                        step.status === 'processing' ? 'text-emerald-400' : 'text-zinc-600'
                      }`}>
                        {step.label}
                      </p>
                      {step.detail && step.status === 'processing' && (
                        <p className="text-xs text-zinc-500 truncate">{step.detail}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Статусная строка */}
              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-zinc-500">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  <span>Обработка...</span>
                </div>
                <div className="text-zinc-600">thqlabel</div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Список отчётов */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <ChartIcon />
              </div>
            </div>
            <p className="text-zinc-400 text-sm">Загрузка отчётов...</p>
          </div>
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-20 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 rounded-3xl border border-dashed border-white/10">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Нет загруженных отчётов</h3>
          <p className="text-zinc-400 max-w-md mx-auto mb-6">
            Загрузите CSV файлы квартального отчёта для автоматического начисления роялти артистам
          </p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 transition-all"
          >
            <UploadIcon />
            Загрузить первый отчёт
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map(report => {
            const isExpanded = selectedReport?.id === report.id;
            return (
              <div 
                key={report.id}
                className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                  isExpanded 
                    ? 'bg-gradient-to-br from-white/[0.08] to-white/[0.02] border-emerald-500/30 shadow-xl shadow-emerald-500/5' 
                    : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.05] hover:border-white/20'
                }`}
              >
                {/* Заголовок карточки */}
                <div 
                  className="p-3 sm:p-5 cursor-pointer"
                  onClick={() => {
                    if (isExpanded) {
                      setSelectedReport(null);
                      setSelectedReportDetails(null);
                    } else if (report.status === 'completed') {
                      loadReportDetails(report);
                    }
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                      {/* Иконка периода */}
                      <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0 ${
                        report.status === 'completed' 
                          ? 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20' 
                          : report.status === 'processing'
                          ? 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20'
                          : 'bg-gradient-to-br from-red-500/20 to-pink-500/20'
                      }`}>
                        <span className="text-lg sm:text-2xl font-bold text-white">{report.quarter.replace('Q', '')}</span>
                      </div>
                      
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                          {renamingReportId === report.id ? (
                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                              <input
                                ref={renameInputRef}
                                type="text"
                                value={renameValue}
                                onChange={(e) => setRenameValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveRename(report.id);
                                  if (e.key === 'Escape') cancelRename();
                                }}
                                className="px-2 py-1 text-sm sm:text-base font-bold bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 w-40 sm:w-56"
                                placeholder="Название отчёта"
                              />
                              <button
                                onClick={(e) => { e.stopPropagation(); saveRename(report.id); }}
                                className="p-1.5 bg-emerald-500/20 rounded-lg hover:bg-emerald-500/30 transition-colors"
                                title="Сохранить"
                              >
                                <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); cancelRename(); }}
                                className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                                title="Отмена"
                              >
                                <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ) : (
                            <>
                              <h3 className="text-base sm:text-xl font-bold text-white whitespace-nowrap">
                                {report.notes || `${report.quarter} ${report.year}`}
                              </h3>
                              {report.notes && (
                                <span className="px-1.5 py-0.5 text-[10px] bg-white/10 text-zinc-400 rounded-full font-medium whitespace-nowrap">
                                  {report.quarter} {report.year}
                                </span>
                              )}
                            </>
                          )}
                          {report.status === 'processing' && (
                            <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-xs bg-yellow-500/20 text-yellow-400 rounded-full animate-pulse font-medium whitespace-nowrap">
                              ⏳ <span className="hidden sm:inline">Обработка</span>
                            </span>
                          )}
                          {report.status === 'completed' && (
                            <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-xs bg-emerald-500/20 text-emerald-400 rounded-full font-medium whitespace-nowrap">
                              ✓ <span className="hidden sm:inline">Готов</span>
                            </span>
                          )}
                          {report.status === 'failed' && (
                            <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-xs bg-red-500/20 text-red-400 rounded-full font-medium whitespace-nowrap">
                              ✕ <span className="hidden sm:inline">Ошибка</span>
                            </span>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-zinc-500 mt-0.5 truncate">
                          {new Date(report.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                        {/* Мобильная статистика */}
                        <div className="flex items-center gap-3 mt-1 sm:hidden text-xs">
                          <span className="text-zinc-400">{formatNumber(report.total_streams)} стримов</span>
                          <span className="text-emerald-400 font-medium">{formatCurrency(report.total_revenue)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
                      {/* Мини-статистика - только десктоп */}
                      <div className="hidden md:flex items-center gap-4 mr-4">
                        <div className="text-right">
                          <p className="text-xs text-zinc-500">Прослушивания</p>
                          <p className="text-lg font-bold text-white">{formatNumber(report.total_streams)}</p>
                        </div>
                        <div className="w-px h-8 bg-white/10" />
                        <div className="text-right">
                          <p className="text-xs text-zinc-500">Выплачено</p>
                          <p className="text-lg font-bold text-emerald-400">{formatCurrency(report.total_revenue)}</p>
                        </div>
                      </div>
                      
                      {/* Кнопки */}
                      <button
                        onClick={(e) => startRename(report, e)}
                        className="p-2 hover:bg-blue-500/20 rounded-xl transition-colors text-zinc-500 hover:text-blue-400 min-w-[40px] min-h-[40px] flex items-center justify-center"
                        title="Переименовать отчёт"
                      >
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(report); }}
                        disabled={deletingReportId === report.id}
                        className="p-2 hover:bg-red-500/20 rounded-xl transition-colors text-zinc-500 hover:text-red-400 disabled:opacity-50 min-w-[40px] min-h-[40px] flex items-center justify-center"
                        title="Удалить отчёт"
                      >
                        {deletingReportId === report.id ? (
                          <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                      </button>
                      
                      {/* Стрелка раскрытия */}
                      {report.status === 'completed' && (
                        <div className={`p-1.5 sm:p-2 rounded-xl transition-all min-w-[36px] min-h-[36px] flex items-center justify-center ${isExpanded ? 'bg-emerald-500/20 rotate-180' : ''}`}>
                          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Прогресс если обрабатывается */}
                  {report.status === 'processing' && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
                        <span>Обработка файлов...</span>
                        <span>{report.processing_progress}%</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all duration-500 rounded-full"
                          style={{ width: `${report.processing_progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Ошибки */}
                  {report.error_log && (
                    <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                      <p className="text-sm text-red-400 font-mono">{report.error_log}</p>
                    </div>
                  )}
                </div>
                
                {/* Раскрытые детали */}
                {isExpanded && (
                  <div className="border-t border-white/10 bg-black/20">
                    {loadingDetails ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="flex items-center gap-3 text-zinc-400">
                          <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                          <span>Загрузка деталей...</span>
                        </div>
                      </div>
                    ) : selectedReportDetails ? (
                      <div className="p-3 sm:p-5 space-y-4 sm:space-y-6">
                        {/* Общая статистика */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
                          <div className="bg-white/5 rounded-xl p-3 sm:p-4 border border-white/5">
                            <p className="text-zinc-500 text-[10px] sm:text-xs mb-1 flex items-center gap-1 sm:gap-1.5">
                              <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                              <span className="truncate">Файлов</span>
                            </p>
                            <p className="text-lg sm:text-xl font-bold text-white">{report.processed_files}/{report.total_files}</p>
                          </div>
                          <div className="bg-white/5 rounded-xl p-3 sm:p-4 border border-white/5">
                            <p className="text-zinc-500 text-[10px] sm:text-xs mb-1 flex items-center gap-1 sm:gap-1.5">
                              <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                              <span className="truncate">Строк</span>
                            </p>
                            <p className="text-lg sm:text-xl font-bold text-white">{formatNumber(report.total_rows)}</p>
                          </div>
                          <div className="bg-white/5 rounded-xl p-3 sm:p-4 border border-white/5">
                            <p className="text-zinc-500 text-[10px] sm:text-xs mb-1 flex items-center gap-1 sm:gap-1.5">
                              <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
                              <span className="truncate">Треков</span>
                            </p>
                            <p className="text-lg sm:text-xl font-bold text-emerald-400">{report.matched_tracks}</p>
                          </div>
                          <div className="bg-white/5 rounded-xl p-3 sm:p-4 border border-white/5">
                            <p className="text-zinc-500 text-[10px] sm:text-xs mb-1 flex items-center gap-1 sm:gap-1.5">
                              <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              <span className="truncate">Стримы</span>
                            </p>
                            <p className="text-lg sm:text-xl font-bold text-white">{formatNumber(report.total_streams)}</p>
                          </div>
                          <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-xl p-3 sm:p-4 border border-emerald-500/20 col-span-2 sm:col-span-1">
                            <p className="text-emerald-400/70 text-[10px] sm:text-xs mb-1 flex items-center gap-1 sm:gap-1.5">
                              <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              <span className="truncate">Выплачено</span>
                            </p>
                            <p className="text-lg sm:text-xl font-bold text-emerald-400">{formatCurrency(report.total_revenue)}</p>
                          </div>
                        </div>
                        
                        {/* ГЛАВНАЯ СЕКЦИЯ: Выплаты по пользователям */}
                        {selectedReportDetails.payouts && selectedReportDetails.payouts.length > 0 && (
                          <div className="bg-gradient-to-br from-fuchsia-500/5 to-purple-500/5 rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-fuchsia-500/20">
                            <h4 className="text-sm sm:text-base font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
                              <span className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-fuchsia-500/20 flex items-center justify-center flex-shrink-0">
                                <svg className="w-3 h-3 sm:w-4 sm:h-4 text-fuchsia-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                              </span>
                              <span className="truncate">Выплаты артистам ({selectedReportDetails.payouts.length})</span>
                            </h4>
                            <div className="space-y-2 max-h-64 sm:max-h-80 overflow-y-auto pr-1 sm:pr-2">
                              {selectedReportDetails.payouts.map((payout, idx) => (
                                <div 
                                  key={idx}
                                  className="flex items-center gap-2 sm:gap-4 p-2 sm:p-3 bg-white/5 hover:bg-white/[0.08] rounded-xl border border-white/5 transition-colors"
                                >
                                  {/* Аватар */}
                                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-fuchsia-500/30 to-purple-500/30 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                    {payout.avatarUrl ? (
                                      <img 
                                        src={payout.avatarUrl} 
                                        alt={payout.artistName}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <span className="text-white font-bold text-xs sm:text-sm">
                                        {payout.artistName.charAt(0).toUpperCase()}
                                      </span>
                                    )}
                                  </div>
                                  
                                  {/* Имя и email */}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-white font-medium text-sm sm:text-base truncate">{payout.artistName}</p>
                                    <p className="text-[10px] sm:text-xs text-zinc-500 truncate">{payout.email}</p>
                                  </div>
                                  
                                  {/* Статус - скрыт на мобилке */}
                                  <span className={`hidden sm:inline-block px-2 py-0.5 text-xs rounded-full flex-shrink-0 ${
                                    payout.status === 'credited' 
                                      ? 'bg-emerald-500/20 text-emerald-400' 
                                      : 'bg-yellow-500/20 text-yellow-400'
                                  }`}>
                                    {payout.status === 'credited' ? 'Начислено' : payout.status}
                                  </span>
                                  
                                  {/* Сумма */}
                                  <div className="text-right">
                                    <p className="text-lg font-bold text-emerald-400">{formatCurrency(payout.amount)}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                            
                            {/* Итого */}
                            <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                              <span className="text-zinc-400">Всего выплачено:</span>
                              <span className="text-xl font-bold text-emerald-400">
                                {formatCurrency(selectedReportDetails.payouts.reduce((sum, p) => sum + p.amount, 0))}
                              </span>
                            </div>
                          </div>
                        )}
                        
                        {/* Платформы и Страны */}
                        <div className="grid md:grid-cols-2 gap-4">
                          {/* Платформы */}
                          {selectedReportDetails.platforms.length > 0 && (
                            <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                              <h4 className="text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
                                <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
                                По платформам
                              </h4>
                              <div className="space-y-2">
                                {selectedReportDetails.platforms.slice(0, 6).map((p, idx) => (
                                  <div key={idx} className="flex items-center gap-3">
                                    <PlatformIcon platform={p.name} size={20} />
                                    <span className="text-sm text-white flex-1 truncate">{p.name}</span>
                                    <span className="text-xs text-zinc-500 w-12 text-right tabular-nums">{formatNumber(p.streams)}</span>
                                    <span className="text-xs text-emerald-400 font-medium w-20 text-right tabular-nums">{formatCurrency(p.revenue)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Страны */}
                          {selectedReportDetails.countries.length > 0 && (
                            <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                              <h4 className="text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
                                <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                По странам
                              </h4>
                              <div className="space-y-2">
                                {selectedReportDetails.countries.slice(0, 6).map((c, idx) => (
                                  <div key={idx} className="flex items-center gap-3">
                                    <span className="text-lg w-6 flex-shrink-0">{getFlag(c.name)}</span>
                                    <span className="text-sm text-white flex-1 truncate">{c.name}</span>
                                    <span className="text-xs text-zinc-500 w-12 text-right tabular-nums">{formatNumber(c.streams)}</span>
                                    <span className="text-xs text-emerald-400 font-medium w-20 text-right tabular-nums">{formatCurrency(c.revenue)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Релизы с выплатами - НОВЫЙ ДИЗАЙН С ОБЛОЖКАМИ */}
                        {selectedReportDetails.releases.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-zinc-300 mb-4 flex items-center gap-2">
                              <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
                              Начисления по релизам 
                              <span className="px-2 py-0.5 bg-white/10 rounded-full text-xs text-zinc-400">
                                {selectedReportDetails.releases.length}
                              </span>
                            </h4>
                            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                              {selectedReportDetails.releases.map((release, idx) => (
                                <div 
                                  key={idx} 
                                  className={`group relative rounded-2xl border transition-all duration-300 overflow-hidden ${
                                    release.isMatched 
                                      ? 'bg-gradient-to-r from-white/[0.03] to-transparent border-white/10 hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/5' 
                                      : 'bg-gradient-to-r from-amber-500/[0.03] to-transparent border-amber-500/20 hover:border-amber-500/40'
                                  }`}
                                >
                                  {/* Полоска статуса слева */}
                                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                                    release.isMatched 
                                      ? 'bg-gradient-to-b from-emerald-400 to-teal-500' 
                                      : 'bg-gradient-to-b from-amber-400 to-orange-500'
                                  }`} />
                                  
                                  <div className="flex items-stretch pl-3">
                                    {/* Обложка релиза */}
                                    <div className="relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden my-2 shadow-lg">
                                      {release.coverUrl ? (
                                        <img 
                                          src={release.coverUrl} 
                                          alt={release.releaseTitle}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-700 to-zinc-800">
                                          <svg className="w-8 h-8 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                                          </svg>
                                        </div>
                                      )}
                                    </div>
                                    
                                    {/* Информация о релизе */}
                                    <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                                      <div className="flex items-start justify-between gap-4">
                                        <div className="min-w-0 flex-1">
                                          <div className="flex items-center gap-2">
                                            <h5 className={`font-semibold truncate transition-colors ${
                                              release.isMatched ? 'text-white group-hover:text-emerald-400' : 'text-zinc-300'
                                            }`}>
                                              {release.releaseTitle}
                                            </h5>
                                            {/* Бейдж статуса */}
                                            <span className={`flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                              release.isMatched 
                                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                                                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                            }`}>
                                              {release.isMatched ? (
                                                <>
                                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                                                  </svg>
                                                  В системе
                                                </>
                                              ) : (
                                                <>
                                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/>
                                                  </svg>
                                                  Не найден
                                                </>
                                              )}
                                            </span>
                                          </div>
                                          <p className="text-sm text-zinc-400 truncate">{release.artistName}</p>
                                        </div>
                                        {/* Статистика */}
                                        <div className="flex-shrink-0 text-right">
                                          <p className={`text-lg font-bold ${release.isMatched ? 'text-emerald-400' : 'text-amber-400'}`}>
                                            {formatCurrency(release.totalRevenue)}
                                          </p>
                                          <p className="text-xs text-zinc-500">{formatNumber(release.totalStreams)} стримов</p>
                                        </div>
                                      </div>
                                      
                                      {/* Треки */}
                                      {release.tracks.length > 0 && (
                                        <div className="mt-3 flex items-center gap-2 text-xs text-zinc-500">
                                          <span className="px-2 py-0.5 bg-white/5 rounded-full">
                                            {release.tracks.length} {release.tracks.length === 1 ? 'трек' : release.tracks.length < 5 ? 'трека' : 'треков'}
                                          </span>
                                          {release.tracks.length > 1 && (
                                            <span className="truncate">
                                              {release.tracks.slice(0, 2).map(t => t.trackTitle).join(', ')}
                                              {release.tracks.length > 2 && ` и ещё ${release.tracks.length - 2}`}
                                            </span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* Раскрывающийся список треков */}
                                  {release.tracks.length > 1 && (
                                    <div className="border-t border-white/5 bg-black/20">
                                      <div className="p-3 space-y-1.5">
                                        {release.tracks.map((track, tidx) => (
                                          <div key={tidx} className="flex items-center gap-3 text-xs py-1.5 px-2 rounded-lg hover:bg-white/5 transition-colors">
                                            <span className="w-5 h-5 rounded bg-white/5 flex items-center justify-center text-zinc-500 flex-shrink-0">
                                              {tidx + 1}
                                            </span>
                                            <span className="text-zinc-300 truncate flex-1">{track.trackTitle}</span>
                                            <span className="text-zinc-600 flex-shrink-0">{formatNumber(track.streams)}</span>
                                            <span className="text-emerald-400 font-medium flex-shrink-0 w-20 text-right">{formatCurrency(track.revenue)}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="py-8 text-center text-zinc-500">
                        Не удалось загрузить детали
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
