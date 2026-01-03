import React from 'react';

// Аутентичные SVG иконки музыкальных платформ
export const PlatformIcon: React.FC<{ platform: string; className?: string }> = ({ platform, className = 'w-6 h-6' }) => {
  const icons: { [key: string]: React.ReactNode } = {
    // ===== ОСНОВНЫЕ СТРИМИНГОВЫЕ ПЛАТФОРМЫ =====
    'Spotify': (
      <svg viewBox="0 0 24 24" className={className}>
        <circle cx="12" cy="12" r="12" fill="#1DB954"/>
        <path d="M16.5 16.5c-.2 0-.4-.1-.5-.2-2.5-1.5-5.6-1.8-9.3-1-.4.1-.7-.2-.8-.5-.1-.4.2-.7.5-.8 4-.9 7.5-.5 10.3 1.2.3.2.4.6.2.9-.1.3-.3.4-.4.4zm1.2-2.7c-.2 0-.4-.1-.6-.2-2.9-1.8-7.2-2.3-10.6-1.3-.4.1-.8-.1-.9-.5-.1-.4.1-.8.5-.9 3.9-1.2 8.7-.6 12 1.5.4.2.5.7.2 1-.1.2-.4.4-.6.4zm.1-2.8c-.2 0-.3 0-.5-.1-3.3-2-8.7-2.1-11.8-1.2-.4.1-.9-.1-1-.5-.1-.4.1-.9.5-1 3.6-1.1 9.5-.9 13.3 1.4.4.2.5.8.3 1.1-.2.2-.5.3-.8.3z" fill="#191414"/>
      </svg>
    ),
    'Apple Music': (
      <svg viewBox="0 0 24 24" className={className}>
        <defs>
          <linearGradient id="am-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FA2D48"/>
            <stop offset="100%" stopColor="#FB5C74"/>
          </linearGradient>
        </defs>
        <rect width="24" height="24" rx="5.4" fill="url(#am-grad)"/>
        <path d="M17.6 6.1v8.2c0 .9-.5 1.6-1.2 2-.4.2-.9.3-1.3.3-1.4 0-2.4-.9-2.4-2.1 0-1.3 1-2.1 2.4-2.1.4 0 .7.1 1.1.2V8.4l-5.7 1.3v7.5c0 .9-.5 1.6-1.2 2-.4.2-.9.3-1.3.3-1.4 0-2.4-.9-2.4-2.1 0-1.3 1-2.1 2.4-2.1.4 0 .7.1 1.1.2V7.5c0-.4.2-.7.6-.8l6.4-1.4c.2-.1.4-.1.6 0 .3.1.5.4.5.8z" fill="#fff"/>
      </svg>
    ),
    'YouTube Music': (
      <svg viewBox="0 0 24 24" className={className}>
        <rect width="24" height="24" rx="5" fill="#FF0000"/>
        <path d="M12 5a7 7 0 100 14 7 7 0 000-14zm0 12.6A5.6 5.6 0 1112 6.4a5.6 5.6 0 010 11.2z" fill="#fff"/>
        <path d="M10.2 9v6l4.8-3z" fill="#fff"/>
      </svg>
    ),
    'Amazon Music': (
      <svg viewBox="0 0 24 24" className={className}>
        <rect width="24" height="24" rx="5" fill="#00A8E1"/>
        <path d="M12 6c-3.3 0-6 2.7-6 6s2.7 6 6 6 6-2.7 6-6-2.7-6-6-6zm2.5 8.7l-3.5 2V7.3l3.5 2v5.4z" fill="#fff"/>
        <path d="M3 17.5s3.5 2 9 2 9-2 9-2" stroke="#FF9900" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      </svg>
    ),
    'Deezer': (
      <svg viewBox="0 0 24 24" className={className}>
        <rect width="24" height="24" rx="5" fill="#000"/>
        <path d="M3 16h3v3H3zM7.5 13h3v6h-3zM12 10h3v9h-3zM16.5 7h3v12h-3z" fill="#A238FF"/>
        <path d="M3 16h3v3H3z" fill="#FFED00"/>
        <path d="M7.5 13h3v3h-3z" fill="#FF0092"/>
        <path d="M12 10h3v3h-3z" fill="#00C7F2"/>
        <path d="M16.5 7h3v3h-3z" fill="#1CD159"/>
      </svg>
    ),
    'Tidal': (
      <svg viewBox="0 0 24 24" className={className}>
        <rect width="24" height="24" rx="5" fill="#000"/>
        <path d="M4 9l3.5 3.5L4 16l3.5-3.5zM7.5 9L11 12.5 7.5 16l3.5-3.5zM11 9l3.5 3.5L11 16l3.5-3.5zM14.5 5.5L18 9l-3.5 3.5L11 9z" fill="#fff"/>
      </svg>
    ),
    'SoundCloud': (
      <svg viewBox="0 0 24 24" className={className}>
        <rect width="24" height="24" rx="5" fill="#FF5500"/>
        <path d="M3 14v3M5 12v5M7 10v7M9 11v6M11 9v8M13 10v7h5.5c1.9 0 3.5-1.6 3.5-3.5S20.4 10 18.5 10c-.3 0-.5 0-.7.1-.4-2-2.1-3.6-4.3-3.6-1.5 0-2.9.8-3.7 2" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      </svg>
    ),
    'Pandora': (
      <svg viewBox="0 0 24 24" className={className}>
        <rect width="24" height="24" rx="5" fill="#3668FF"/>
        <path d="M8 4h5c3.3 0 6 2.2 6 5.5S16.3 15 13 15h-2v5H8V4zm3 8h2c1.7 0 3-1.1 3-2.5S14.7 7 13 7h-2v5z" fill="#fff"/>
      </svg>
    ),
    'iHeartRadio': (
      <svg viewBox="0 0 24 24" className={className}>
        <rect width="24" height="24" rx="5" fill="#C6002B"/>
        <path d="M12 4a8 8 0 00-8 8c0 2.8 1.5 5.3 3.7 6.7l.3.2V20l4-2.5 4 2.5v-1.1l.3-.2A8 8 0 0012 4zm0 12a4 4 0 110-8 4 4 0 010 8z" fill="#fff"/>
        <circle cx="12" cy="12" r="1.5" fill="#fff"/>
      </svg>
    ),
    'Napster': (
      <svg viewBox="0 0 24 24" className={className}>
        <rect width="24" height="24" rx="5" fill="#000"/>
        <path d="M7 12a3 3 0 106 0 3 3 0 00-6 0zM11 12a3 3 0 106 0 3 3 0 00-6 0z" fill="#fff"/>
        <path d="M8 8.5c0-2.5 2-4.5 4-4.5s4 2 4 4.5" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round"/>
      </svg>
    ),
    'Audiomack': (
      <svg viewBox="0 0 24 24" className={className}>
        <rect width="24" height="24" rx="5" fill="#FFA200"/>
        <path d="M5 14v4M8 11v7M11 8v10M14 11v7M17 14v4" stroke="#000" strokeWidth="2.5" strokeLinecap="round"/>
      </svg>
    ),
    'Boomplay': (
      <svg viewBox="0 0 24 24" className={className}>
        <rect width="24" height="24" rx="5" fill="#0E0E0E"/>
        <circle cx="12" cy="12" r="7" fill="#FFC107"/>
        <path d="M10 8.5v7l5.5-3.5z" fill="#0E0E0E"/>
      </svg>
    ),
    'Anghami': (
      <svg viewBox="0 0 24 24" className={className}>
        <rect width="24" height="24" rx="5" fill="#6B2B7C"/>
        <circle cx="12" cy="12" r="5" fill="none" stroke="#00FFCC" strokeWidth="2"/>
        <circle cx="12" cy="12" r="2" fill="#00FFCC"/>
      </svg>
    ),
    'JioSaavn': (
      <svg viewBox="0 0 24 24" className={className}>
        <rect width="24" height="24" rx="5" fill="#2BC5B4"/>
        <circle cx="12" cy="12" r="6" fill="#fff"/>
        <path d="M10 9v6l5-3z" fill="#2BC5B4"/>
      </svg>
    ),
    'Gaana': (
      <svg viewBox="0 0 24 24" className={className}>
        <rect width="24" height="24" rx="5" fill="#E72C30"/>
        <circle cx="12" cy="12" r="6" fill="#fff"/>
        <circle cx="12" cy="12" r="2" fill="#E72C30"/>
        <circle cx="12" cy="12" r="4" fill="none" stroke="#E72C30" strokeWidth="1"/>
      </svg>
    ),

    // ===== РОССИЙСКИЕ ПЛАТФОРМЫ =====
    'Яндекс Музыка': (
      <svg viewBox="0 0 24 24" className={className}>
        <rect width="24" height="24" rx="5" fill="#FFCC00"/>
        <path d="M13.7 5h-2.4v7.6L7.8 5H5v14h2.4v-8.4l4 8.4h2.3V5z" fill="#000"/>
      </svg>
    ),
    'VK Музыка': (
      <svg viewBox="0 0 24 24" className={className}>
        <rect width="24" height="24" rx="5" fill="#0077FF"/>
        <path d="M12.8 17c-4.5 0-7-3-7.1-8h2.2c.1 3.7 1.7 5.3 3 5.6V9h2.1v3.2c1.3-.1 2.6-1.6 3.1-3.2h2.1c-.4 2-1.8 3.5-2.8 4.1 1 .5 2.6 1.8 3.2 3.9h-2.3c-.5-1.5-1.6-2.6-3.3-2.8V17h-.2z" fill="#fff"/>
      </svg>
    ),
    'Звук (Sber)': (
      <svg viewBox="0 0 24 24" className={className}>
        <rect width="24" height="24" rx="5" fill="#21A038"/>
        <path d="M5 14v4M8 11v7M11 8v10M14 11v7M17 14v4" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="19" cy="12" r="2" fill="#fff"/>
      </svg>
    ),
    'МТС Music': (
      <svg viewBox="0 0 24 24" className={className}>
        <rect width="24" height="24" rx="5" fill="#E30611"/>
        <ellipse cx="12" cy="12" rx="3.5" ry="6" fill="#fff"/>
        <ellipse cx="7" cy="12" rx="2" ry="4" fill="#fff"/>
        <ellipse cx="17" cy="12" rx="2" ry="4" fill="#fff"/>
      </svg>
    ),

    // ===== АЗИАТСКИЕ ПЛАТФОРМЫ =====
    'NetEase Cloud Music': (
      <svg viewBox="0 0 24 24" className={className}>
        <rect width="24" height="24" rx="5" fill="#C20C0C"/>
        <path d="M12 5a7 7 0 107 7 7 7 0 00-7-7zm3.2 10.4a3.6 3.6 0 01-5.1 0 3.6 3.6 0 010-5.1 3.6 3.6 0 015.1 0" fill="none" stroke="#fff" strokeWidth="1.5"/>
        <circle cx="12" cy="12.3" r="1.5" fill="#fff"/>
      </svg>
    ),
    'QQ Music': (
      <svg viewBox="0 0 24 24" className={className}>
        <rect width="24" height="24" rx="5" fill="#31C27C"/>
        <ellipse cx="12" cy="10" rx="5" ry="4.5" fill="#fff"/>
        <ellipse cx="12" cy="15.5" rx="6" ry="3" fill="#fff"/>
        <circle cx="10" cy="9.5" r="1" fill="#31C27C"/>
        <circle cx="14" cy="9.5" r="1" fill="#31C27C"/>
      </svg>
    ),
    'KuGou': (
      <svg viewBox="0 0 24 24" className={className}>
        <rect width="24" height="24" rx="5" fill="#0091FF"/>
        <circle cx="12" cy="12" r="6" fill="#fff"/>
        <path d="M10 9v6l5-3z" fill="#0091FF"/>
      </svg>
    ),
    'Kuwo': (
      <svg viewBox="0 0 24 24" className={className}>
        <rect width="24" height="24" rx="5" fill="#FF6600"/>
        <path d="M12 5l2 5h5l-4 3.5 1.5 5.5-4.5-3-4.5 3 1.5-5.5L5 10h5z" fill="#fff"/>
      </svg>
    ),
    'Melon': (
      <svg viewBox="0 0 24 24" className={className}>
        <rect width="24" height="24" rx="5" fill="#00CD3C"/>
        <ellipse cx="12" cy="13" rx="5.5" ry="6" fill="#fff"/>
        <path d="M12 4v5" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
        <ellipse cx="12" cy="13" rx="2.5" ry="3" fill="#00CD3C"/>
      </svg>
    ),
    'Genie': (
      <svg viewBox="0 0 24 24" className={className}>
        <rect width="24" height="24" rx="5" fill="#0095D9"/>
        <path d="M12 5a7 7 0 100 14 7 7 0 000-14zm0 12a5 5 0 110-10 5 5 0 010 10z" fill="#fff"/>
        <path d="M10 9.5v5l4.5-2.5z" fill="#fff"/>
      </svg>
    ),
    'FLO': (
      <svg viewBox="0 0 24 24" className={className}>
        <rect width="24" height="24" rx="5" fill="#1F1F1F"/>
        <path d="M6 7h4v2H8v8H6V7zm5 0h4v2h-2v2h2v2h-2v4h-2V7zm6 0h4v10h-2v-4h-2V7zm2 2v2h-1V9h1z" fill="#fff"/>
      </svg>
    ),
    'Bugs!': (
      <svg viewBox="0 0 24 24" className={className}>
        <rect width="24" height="24" rx="5" fill="#FF3366"/>
        <circle cx="12" cy="12" r="6" fill="#fff"/>
        <circle cx="10" cy="11" r="1.5" fill="#FF3366"/>
        <circle cx="14" cy="11" r="1.5" fill="#FF3366"/>
        <path d="M9 14.5c1.5 1 4.5 1 6 0" stroke="#FF3366" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      </svg>
    ),
    'KKBOX': (
      <svg viewBox="0 0 24 24" className={className}>
        <rect width="24" height="24" rx="5" fill="#09CEF6"/>
        <path d="M6 7l3 5-3 5M10 7l3 5-3 5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        <rect x="14" y="7" width="4" height="10" rx="1" fill="#fff"/>
      </svg>
    ),
    'LINE Music': (
      <svg viewBox="0 0 24 24" className={className}>
        <rect width="24" height="24" rx="5" fill="#00B900"/>
        <path d="M12 4c-4.4 0-8 2.9-8 6.5 0 3.2 2.8 5.9 6.6 6.4.3.1.6.2.7.5.1.3.1.6 0 .9l-.1.5c0 .2-.2.8.7.4s4.8-2.8 6.5-4.8c1.2-1.3 1.8-2.7 1.8-4.3-.2-3.4-3.8-6.1-8.2-6.1z" fill="#fff"/>
        <path d="M10 9v4l3-2z" fill="#00B900"/>
      </svg>
    ),
    'AWA': (
      <svg viewBox="0 0 24 24" className={className}>
        <rect width="24" height="24" rx="5" fill="#FF5722"/>
        <path d="M5 16l3-8 3 8M6.5 13h3M14 16l3-8 3 8M15.5 13h3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      </svg>
    ),
    'Joox': (
      <svg viewBox="0 0 24 24" className={className}>
        <rect width="24" height="24" rx="5" fill="#00D26A"/>
        <circle cx="12" cy="12" r="6" fill="#fff"/>
        <path d="M10 9v6l5-3z" fill="#00D26A"/>
      </svg>
    ),

    // ===== СОЦИАЛЬНЫЕ СЕТИ =====
    'TikTok': (
      <svg viewBox="0 0 24 24" className={className}>
        <rect width="24" height="24" rx="5" fill="#000"/>
        <path d="M16.6 5.8c-.6-.7-1-1.6-1-2.6h-2.8v12.2c0 1.6-1.2 2.8-2.7 2.8s-2.7-1.3-2.7-2.8c0-1.6 1.2-2.8 2.7-2.8.3 0 .5 0 .8.1V9.8c-.3 0-.5-.1-.8-.1-3 0-5.5 2.5-5.5 5.6s2.5 5.6 5.5 5.6 5.5-2.5 5.5-5.6V9.1c1 .7 2.2 1.2 3.5 1.2V7.5c-1.3 0-2.5-.7-3.5-1.7z" fill="#fff"/>
        <path d="M16.6 5.8c-.6-.7-1-1.6-1-2.6h-2.8v12.2c0 1.6-1.2 2.8-2.7 2.8" fill="none" stroke="#25F4EE" strokeWidth=".5"/>
        <path d="M10.1 18.2c-1.5 0-2.7-1.3-2.7-2.8 0-1.6 1.2-2.8 2.7-2.8" fill="none" stroke="#FE2C55" strokeWidth=".5"/>
      </svg>
    ),
    'Instagram/Facebook': (
      <svg viewBox="0 0 24 24" className={className}>
        <defs>
          <linearGradient id="ig-grad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFDC80"/>
            <stop offset="25%" stopColor="#FCAF45"/>
            <stop offset="50%" stopColor="#F77737"/>
            <stop offset="75%" stopColor="#F56040"/>
            <stop offset="100%" stopColor="#C13584"/>
          </linearGradient>
        </defs>
        <rect width="24" height="24" rx="5" fill="url(#ig-grad)"/>
        <rect x="5" y="5" width="14" height="14" rx="4" fill="none" stroke="#fff" strokeWidth="1.5"/>
        <circle cx="12" cy="12" r="3.5" fill="none" stroke="#fff" strokeWidth="1.5"/>
        <circle cx="16.5" cy="7.5" r="1" fill="#fff"/>
      </svg>
    ),
    'Snapchat': (
      <svg viewBox="0 0 24 24" className={className}>
        <rect width="24" height="24" rx="5" fill="#FFFC00"/>
        <path d="M12 5c-2.2 0-4 1.5-4 4v2s-1-.2-1.5.5.2 1.2.5 1.3c-.3 1.5-1.5 2.5-2.5 3 0 0-.5.2-.5.7s.8.5 1.5.5c.5 0 1 .5 1 1s1 1.5 5.5 1.5 5.5-1 5.5-1.5-.5-1-1-1c-.5 0-1.5 0-1.5-.5s.5-.7.5-.7c-1-.5-2.2-1.5-2.5-3 .3-.1 1-.6.5-1.3S16 11 16 11V9c0-2.5-1.8-4-4-4z" fill="#fff" stroke="#000" strokeWidth=".5"/>
      </svg>
    ),
    'Triller': (
      <svg viewBox="0 0 24 24" className={className}>
        <rect width="24" height="24" rx="5" fill="#FF0050"/>
        <path d="M8 6v12l8-6z" fill="#fff"/>
        <path d="M8 6v12" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),

    // ===== МАГАЗИНЫ =====
    'iTunes Store': (
      <svg viewBox="0 0 24 24" className={className}>
        <defs>
          <linearGradient id="itunes-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#EA4CC0"/>
            <stop offset="100%" stopColor="#DC5AE8"/>
          </linearGradient>
        </defs>
        <rect width="24" height="24" rx="5" fill="url(#itunes-grad)"/>
        <path d="M17 6v9.5c0 1.4-1.1 2.5-2.5 2.5S12 16.9 12 15.5s1.1-2.5 2.5-2.5c.5 0 1 .2 1.5.4V8.5l-7 1.5v7.5c0 1.4-1.1 2.5-2.5 2.5S4 18.9 4 17.5 5.1 15 6.5 15c.5 0 1 .2 1.5.4V7.5l9-2z" fill="#fff"/>
      </svg>
    ),
    'Amazon Store': (
      <svg viewBox="0 0 24 24" className={className}>
        <rect width="24" height="24" rx="5" fill="#FF9900"/>
        <path d="M6 12c2.5 2.5 7 3.5 12 1" stroke="#000" strokeWidth="2" strokeLinecap="round" fill="none"/>
        <path d="M15 11l3 2-1 3" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        <path d="M7 9a5 5 0 018.5 3.5" stroke="#000" strokeWidth="1.5" fill="none"/>
      </svg>
    ),

    // ===== ДРУГИЕ ПЛАТФОРМЫ =====
    'Beatport': (
      <svg viewBox="0 0 24 24" className={className}>
        <rect width="24" height="24" rx="5" fill="#94D500"/>
        <circle cx="12" cy="12" r="6" fill="#000"/>
        <circle cx="12" cy="12" r="2" fill="#94D500"/>
      </svg>
    ),
    'Traxsource': (
      <svg viewBox="0 0 24 24" className={className}>
        <rect width="24" height="24" rx="5" fill="#F47920"/>
        <circle cx="12" cy="12" r="6" fill="#fff"/>
        <path d="M10 9v6l5-3z" fill="#F47920"/>
      </svg>
    ),
    'Juno Download': (
      <svg viewBox="0 0 24 24" className={className}>
        <rect width="24" height="24" rx="5" fill="#004B93"/>
        <path d="M8 8h8l-4 8z" fill="#fff"/>
      </svg>
    ),
    'Bandcamp': (
      <svg viewBox="0 0 24 24" className={className}>
        <rect width="24" height="24" rx="5" fill="#1DA0C3"/>
        <path d="M5 16h10l4-8H9z" fill="#fff"/>
      </svg>
    ),
    'Shazam': (
      <svg viewBox="0 0 24 24" className={className}>
        <rect width="24" height="24" rx="5" fill="#0088FF"/>
        <path d="M12 4c-2.2 0-4 1.8-4 4 0 1.5.8 2.8 2 3.5l3 1.5v3c0 .6-.4 1-1 1s-1-.4-1-1v-1H9v1c0 1.7 1.3 3 3 3s3-1.3 3-3v-4l-3-1.5c-.6-.3-1-.9-1-1.5 0-1.1.9-2 2-2s2 .9 2 2v1h2v-1c0-2.2-1.8-4-4-4z" fill="#fff"/>
      </svg>
    ),
    'Genius': (
      <svg viewBox="0 0 24 24" className={className}>
        <rect width="24" height="24" rx="5" fill="#FFFF64"/>
        <path d="M6 17V7h3v10H6zm4.5-5c0-2.8 2.2-5 5-5v2.5c-1.4 0-2.5 1.1-2.5 2.5s1.1 2.5 2.5 2.5V17c-2.8 0-5-2.2-5-5z" fill="#000"/>
      </svg>
    ),
    'MediaNet': (
      <svg viewBox="0 0 24 24" className={className}>
        <rect width="24" height="24" rx="5" fill="#E31B23"/>
        <path d="M6 7h2l2 6 2-6h2l2 6 2-6h2v10h-2v-6l-2 6h-1l-2-6v6h-1l-2-6v6H6V7z" fill="#fff"/>
      </svg>
    ),
    '7digital': (
      <svg viewBox="0 0 24 24" className={className}>
        <rect width="24" height="24" rx="5" fill="#000"/>
        <path d="M7 8h6l-5 8H7zM14 8h5v2l-4 6h-3l4-6h-2z" fill="#fff"/>
      </svg>
    ),
    'Gracenote': (
      <svg viewBox="0 0 24 24" className={className}>
        <rect width="24" height="24" rx="5" fill="#FF6B00"/>
        <circle cx="12" cy="12" r="4" fill="#fff"/>
        <path d="M12 8v8M8 12h8" stroke="#FF6B00" strokeWidth="2"/>
      </svg>
    ),
    'Claro Música': (
      <svg viewBox="0 0 24 24" className={className}>
        <rect width="24" height="24" rx="5" fill="#ED1C24"/>
        <circle cx="12" cy="12" r="5" fill="#fff"/>
        <path d="M10 9.5v5l4-2.5z" fill="#ED1C24"/>
      </svg>
    ),
    'Nuuday': (
      <svg viewBox="0 0 24 24" className={className}>
        <rect width="24" height="24" rx="5" fill="#5C2D91"/>
        <path d="M7 8v8l5-4zM12 8v8l5-4z" fill="#fff"/>
      </svg>
    ),
    'Peloton': (
      <svg viewBox="0 0 24 24" className={className}>
        <rect width="24" height="24" rx="5" fill="#000"/>
        <path d="M12 5a7 7 0 100 14 7 7 0 000-14zm0 11a4 4 0 110-8 4 4 0 010 8z" fill="#fff"/>
        <path d="M12 9v6l4-3z" fill="#FF0000"/>
      </svg>
    ),
    'Pretzel': (
      <svg viewBox="0 0 24 24" className={className}>
        <rect width="24" height="24" rx="5" fill="#FF4F00"/>
        <path d="M12 6c-3 0-5.5 2.5-5.5 5.5S9 17 12 17s5.5-2.5 5.5-5.5S15 6 12 6zm0 9c-2 0-3.5-1.5-3.5-3.5S10 8 12 8s3.5 1.5 3.5 3.5S14 15 12 15z" fill="#fff"/>
      </svg>
    ),
  };

  // Дефолтная иконка для неизвестных платформ
  const defaultIcon = (
    <svg viewBox="0 0 24 24" className={className}>
      <rect width="24" height="24" rx="5" fill="#6B7280"/>
      <circle cx="12" cy="12" r="5" fill="none" stroke="#fff" strokeWidth="1.5"/>
      <path d="M10 10v4l4-2z" fill="#fff"/>
    </svg>
  );

  return <>{icons[platform] || defaultIcon}</>;
};

// Получить основной цвет платформы
export const getPlatformColor = (platform: string): string => {
  const colors: { [key: string]: string } = {
    'Spotify': '#1DB954',
    'Apple Music': '#FA2D48',
    'YouTube Music': '#FF0000',
    'Amazon Music': '#00A8E1',
    'Deezer': '#A238FF',
    'Tidal': '#000000',
    'SoundCloud': '#FF5500',
    'Pandora': '#3668FF',
    'iHeartRadio': '#C6002B',
    'Napster': '#000000',
    'Audiomack': '#FFA200',
    'Boomplay': '#FFC107',
    'Anghami': '#6B2B7C',
    'JioSaavn': '#2BC5B4',
    'Gaana': '#E72C30',
    'Яндекс Музыка': '#FFCC00',
    'VK Музыка': '#0077FF',
    'Звук (Sber)': '#21A038',
    'МТС Music': '#E30611',
    'NetEase Cloud Music': '#C20C0C',
    'QQ Music': '#31C27C',
    'KuGou': '#0091FF',
    'Kuwo': '#FF6600',
    'Melon': '#00CD3C',
    'Genie': '#0095D9',
    'FLO': '#1F1F1F',
    'Bugs!': '#FF3366',
    'KKBOX': '#09CEF6',
    'LINE Music': '#00B900',
    'AWA': '#FF5722',
    'Joox': '#00D26A',
    'TikTok': '#000000',
    'Instagram/Facebook': '#E1306C',
    'Snapchat': '#FFFC00',
    'Triller': '#FF0050',
    'iTunes Store': '#EA4CC0',
    'Amazon Store': '#FF9900',
    'Beatport': '#94D500',
    'Traxsource': '#F47920',
    'Juno Download': '#004B93',
    'Bandcamp': '#1DA0C3',
    'Shazam': '#0088FF',
    'Genius': '#FFFF64',
    'MediaNet': '#E31B23',
    '7digital': '#000000',
    'Gracenote': '#FF6B00',
    'Claro Música': '#ED1C24',
    'Nuuday': '#5C2D91',
    'Peloton': '#000000',
    'Pretzel': '#FF4F00',
  };
  return colors[platform] || '#6B7280';
};

export default PlatformIcon;
