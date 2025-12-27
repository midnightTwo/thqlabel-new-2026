"use client";
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null;

// Релизы thq label
const RELEASES = [
  { id: 1, title: 'не в сети', artist: 'angelgrind', cover: 'https://t2.genius.com/unsafe/430x430/https%3A%2F%2Fimages.genius.com%2Fd4892b6202a4051f807a8a847f44adc0.1000x1000x1.png' },
  { id: 2, title: 'заколки & кости', artist: 'kweetee', cover: 'https://t2.genius.com/unsafe/600x600/https%3A%2F%2Fimages.genius.com%2F9fa9951f735a169c17e47baf71ab45c7.1000x1000x1.png' },
  { id: 3, title: 'механизм', artist: 'athysue', cover: 'https://t2.genius.com/unsafe/430x430/https%3A%2F%2Fimages.genius.com%2Fa4b2333f9c0768cf4f07d1252caff125.1000x1000x1.png' },
  { id: 4, title: 'девчачий рок-альбом', artist: 'тенденция', cover: 'https://images.genius.com/2fa8d85da644fad7afc1ba3d40d0d513.1000x1000x1.png' },
  { id: 5, title: 'tired of you / what pain is', artist: 'breakfall', cover: 'https://cdn-images.dzcdn.net/images/cover/7101d738b828553e74b9f0035a6dfa1a/500x500-000000-80-0-0.jpg' },
  { id: 6, title: 'LABEL', artist: 'YUUKKII', cover: 'https://t2.genius.com/unsafe/430x430/https%3A%2F%2Fimages.genius.com%2F4dbc0ecc8a3f9924cc950ec1ae1390c4.600x600x1.webp' },
  { id: 7, title: 'кейон', artist: 'ева киллер', cover: 'https://m.media-amazon.com/images/I/51knFhnMP0L._UX716_FMwebp_QL85_.jpg' },
  { id: 8, title: 'Холодно', artist: 'qqdie', cover: 'https://images.genius.com/ece70e671b3422967c2012217763c557.807x807x1.jpg' },
];

// Анимированный счетчик (без багов) 
const AnimatedCounter = ({ end, duration = 2500, suffix = '' }: { end: number; duration?: number; suffix?: string }) => {
  const [count, setCount] = useState(0);
  const countRef = useRef(0);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    startTimeRef.current = null;
    countRef.current = 0;
    
    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      
      // Плавный easeOutQuart
      const easeOut = 1 - Math.pow(1 - progress, 4);
      const currentValue = Math.floor(end * easeOut);
      
      if (currentValue !== countRef.current) {
        countRef.current = currentValue;
        setCount(currentValue);
      }
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };
    
    const timer = setTimeout(() => requestAnimationFrame(animate), 200);
    return () => clearTimeout(timer);
  }, [end, duration]);

  // Форматирование числа с разделителями
  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(0) + 'K';
    return num.toString();
  };

  return <span className="tabular-nums">{formatNumber(count)}{suffix}</span>;
};

// Летающие 3D фигуры (квадраты и круги)
const FloatingShapes = () => {
  const [shapes, setShapes] = useState<any[]>([]);
  
  useEffect(() => {
    setShapes(Array.from({ length: 15 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 20 + Math.random() * 60,
      duration: 15 + Math.random() * 25,
      delay: Math.random() * -15,
      type: Math.random() > 0.5 ? 'circle' : 'square',
      rotateSpeed: 10 + Math.random() * 20,
    })));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {shapes.map(shape => (
        <div
          key={shape.id}
          className={`absolute ${shape.type === 'circle' ? 'rounded-full' : 'rounded-lg'}`}
          style={{
            left: `${shape.x}%`,
            top: `${shape.y}%`,
            width: shape.size,
            height: shape.size,
            border: '1px solid rgba(96, 80, 186, 0.2)',
            background: 'rgba(96, 80, 186, 0.03)',
            animation: `float-shape ${shape.duration}s ease-in-out infinite, rotate-shape ${shape.rotateSpeed}s linear infinite`,
            animationDelay: `${shape.delay}s`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes float-shape {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(30px, -40px); }
          50% { transform: translate(-20px, 30px); }
          75% { transform: translate(40px, 20px); }
        }
        @keyframes rotate-shape {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

// Летающие светящиеся частицы
const FloatingParticles = () => {
  const [particles, setParticles] = useState<any[]>([]);
  
  useEffect(() => {
    setParticles(Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 2 + Math.random() * 4,
      duration: 20 + Math.random() * 30,
      delay: Math.random() * -20,
      opacity: 0.3 + Math.random() * 0.5,
    })));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute rounded-full bg-[#9d8df1]"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            opacity: p.opacity,
            boxShadow: '0 0 10px #9d8df1, 0 0 20px #6050ba',
            animation: `particle-fly ${p.duration}s ease-in-out infinite`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes particle-fly {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.3; }
          25% { transform: translate(60px, -80px) scale(1.2); opacity: 0.8; }
          50% { transform: translate(-40px, 60px) scale(0.8); opacity: 0.5; }
          75% { transform: translate(80px, 40px) scale(1.1); opacity: 0.7; }
        }
      `}</style>
    </div>
  );
};

// 3D летающие карточки релизов по всему экрану - обновлённый дизайн
const FloatingReleaseCard = ({ release, index, isMobile }: { release: any; index: number; isMobile: boolean }) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ 
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);
  
  // Распределяем карточки равномерно и симметрично
  // Для мобильных - меньше карточек и другие позиции
  const positionsDesktop = [
    { x: '6%', y: '15%', rotate: -10 },
    { x: '86%', y: '15%', rotate: 10 },
    { x: '6%', y: '35%', rotate: 8 },
    { x: '86%', y: '35%', rotate: -8 },
    { x: '6%', y: '55%', rotate: -12 },
    { x: '86%', y: '55%', rotate: 12 },
    { x: '6%', y: '75%', rotate: 10 },
    { x: '86%', y: '75%', rotate: -10 },
  ];
  
  // 8 релизов для мобилки - распределены по всей странице равномерно
  const positionsMobile = [
    { x: '2%', y: '20%', rotate: -8 },
    { x: '75%', y: '28%', rotate: 6 },
    { x: '3%', y: '38%', rotate: -5 },
    { x: '78%', y: '50%', rotate: 7 },
    { x: '4%', y: '58%', rotate: 8 },
    { x: '76%', y: '65%', rotate: -7 },
    { x: '1%', y: '75%', rotate: 5 },
    { x: '77%', y: '82%', rotate: -6 },
  ];
  
  // Показываем все 8 релизов на мобилке
  if (isMobile && index >= 8) return null;
  
  const positions = isMobile ? positionsMobile : positionsDesktop;
  const pos = positions[index % positions.length];

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: pos.x,
        top: pos.y,
        transform: `perspective(1000px) rotateY(${pos.rotate + mousePos.x * 0.5}deg) rotateX(${-mousePos.y * 0.3}deg)`,
        transition: 'transform 0.1s ease-out',
        zIndex: isMobile ? -1 : 10, // На мобилке за всем фоном
      }}
    >
      <div 
        className="relative w-20 h-28 sm:w-24 sm:h-32 lg:w-32 lg:h-40 xl:w-36 xl:h-44 rounded-xl sm:rounded-2xl overflow-hidden backdrop-blur-md transition-all duration-500 group"
        style={{
          animation: `float-card ${6 + index}s ease-in-out infinite`,
          animationDelay: `${index * 0.3}s`,
          background: isMobile 
            ? 'rgba(0, 0, 0, 0.15)' // Едва заметный фон на мобилке
            : 'rgba(96, 80, 186, 0.08)',
          border: '1px solid rgba(157, 141, 241, 0.25)',
          boxShadow: isMobile
            ? '0 10px 30px -10px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(157, 141, 241, 0.1) inset' // Едва заметные тени
            : '0 20px 60px -15px rgba(96, 80, 186, 0.5), 0 0 0 1px rgba(157, 141, 241, 0.1) inset',
          opacity: isMobile ? 0.25 : 1, // Едва заметная видимость на мобилке
        }}
      >
        {/* Картинка обложки с оверлеем */}
        <div className="relative w-full h-16 sm:h-20 lg:h-28 xl:h-32 overflow-hidden">
          <img 
            src={release.cover} 
            alt={release.title}
            className="w-full h-full object-cover opacity-90"
          />
          {/* Градиентный оверлей */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#6050ba]/20 via-transparent to-black/80" />
          {/* Сияющая рамка */}
          <div className="absolute inset-0 border-b border-[#9d8df1]/30" />
        </div>

        {/* Инфо блок с glassmorphism */}
        <div className="absolute bottom-0 left-0 right-0 p-1.5 sm:p-2 lg:p-3 border-t border-[#6050ba]/30"
          style={{
            background: isMobile 
              ? 'rgba(0, 0, 0, 0.7)' // Менее темный для большей прозрачности
              : 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <p className="text-[8px] sm:text-[9px] lg:text-[11px] font-black text-white truncate uppercase tracking-wide drop-shadow-lg">{release.title}</p>
          <p className="text-[7px] sm:text-[8px] lg:text-[10px] text-[#9d8df1] font-bold drop-shadow-lg mt-0.5">{release.artist}</p>
          
          {/* Декоративная полоска */}
          <div className="mt-1 sm:mt-1.5 lg:mt-2 h-0.5 w-4 sm:w-6 lg:w-8 bg-gradient-to-r from-[#9d8df1] to-transparent rounded-full" />
        </div>

        {/* Светящаяся рамка */}
        <div 
          className="absolute inset-0 rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            boxShadow: '0 0 30px rgba(157, 141, 241, 0.6) inset, 0 0 50px rgba(96, 80, 186, 0.4)',
          }}
        />

        {/* Угловые акценты */}
        <div className="absolute top-1 right-1 sm:top-2 sm:right-2 w-2 h-2 sm:w-3 sm:h-3 lg:w-4 lg:h-4 border-t-2 border-r-2 border-[#9d8df1]/50 rounded-tr-lg" />
        <div className="absolute bottom-1 left-1 sm:bottom-2 sm:left-2 w-2 h-2 sm:w-3 sm:h-3 lg:w-4 lg:h-4 border-b-2 border-l-2 border-[#9d8df1]/50 rounded-bl-lg" />
      </div>
      
      <style jsx>{`
        @keyframes float-card {
          0% { transform: translateY(0px) translateX(0px); }
          25% { transform: translateY(-10px) translateX(5px); }
          50% { transform: translateY(-20px) translateX(0px); }
          75% { transform: translateY(-10px) translateX(-5px); }
          100% { transform: translateY(0px) translateX(0px); }
        }
      `}</style>
    </div>
  );
};

export default function FeedPage() {
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [scrollY, setScrollY] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [showCapybaraMsg, setShowCapybaraMsg] = useState(false);

  const capybaraMessages = [
    'Ок капибара 😎',
    'Капибара одобряет! 👍',
    'А ты хорош! ✨',
    'Капи капи! 💜',
    'Музыка кайф 🎵',
    'thq топ! 🚀',
  ];
  const [capybaraMsg, setCapybaraMsg] = useState(capybaraMessages[0]);

  useEffect(() => {
    // Принудительная прокрутка в самый верх при монтировании компонента
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
    setMounted(true);
    
    // Проверяем размер экрана
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // Проверяем авторизацию
    const checkAuth = async () => {
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    checkAuth();
    
    // Параллакс эффект
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  return (
    <main className="min-h-screen overflow-hidden relative">
      {/* Контейнер для релизов - привязан к документу, а не к экрану */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Летающие карточки релизов */}
        {mounted && RELEASES.map((release, i) => (
          <FloatingReleaseCard key={release.id} release={release} index={i} isMobile={isMobile} />
        ))}
      </div>

      {/* Летающие 3D фигуры и частицы */}
      <FloatingShapes />
      <FloatingParticles />
      
      {/* Градиентный фон с параллаксом */}
      <div className="fixed inset-0 pointer-events-none" style={{ transform: `translateY(${scrollY * 0.3}px)` }}>
        <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-[#6050ba]/10 rounded-full blur-[200px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-[#9d8df1]/10 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-[#6050ba]/5 rounded-full blur-[250px]" />
      </div>

      {/* HERO секция */}
      <section className="relative z-20 min-h-screen flex flex-col items-center justify-center px-6 pt-32">
        
        {/* Заголовок */}
        <div className={`text-center mb-8 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          
          {/* Большой логотип */}
          <div className="relative mb-12 flex justify-center">
            <img 
              src="/logo.png" 
              alt="thqlabel" 
              className="h-40 md:h-48 lg:h-56 w-auto object-contain drop-shadow-[0_0_80px_rgba(96,80,186,0.7)] relative z-10"
              style={{ transform: 'scale(2.2)', transformOrigin: 'center' }}
            />
            {/* Декоративные элементы - красивые большие квадраты */}
            <div className="absolute -top-8 -right-8 w-16 h-16 border-t-2 border-r-2 border-[#6050ba]/50 animate-pulse pointer-events-none" />
            <div className="absolute -bottom-8 -left-8 w-16 h-16 border-b-2 border-l-2 border-[#9d8df1]/50 animate-pulse pointer-events-none" style={{ animationDelay: '0.5s' }} />
          </div>
          
          {/* Лейбл ждёт тебя - компактный */}
          <div className="mb-4">
            <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] text-white uppercase tracking-[0.2em] font-black px-4 py-2 border-2 border-[#9d8df1] rounded-full bg-[#6050ba]/20 shadow-lg shadow-[#6050ba]/50">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              Лейбл ждёт тебя
            </span>
          </div>
          
          <p className="text-white text-base sm:text-lg md:text-xl max-w-xl mx-auto leading-relaxed mb-6 px-4 font-medium">
            Дистрибуция музыки на <span className="text-white font-bold">все платформы</span> мира. 
            <br/>Мы помогаем артистам стать <span className="text-[#c4b5fd] font-bold">услышанными</span>.
          </p>

          {/* Статистика сразу видна */}
          <div className={`flex flex-wrap justify-center gap-8 md:gap-12 mb-10 transition-all duration-1000 delay-300 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-[#9d8df1] to-[#6050ba]">
                <AnimatedCounter end={150} suffix="+" />
              </div>
              <div className="text-xs sm:text-sm text-white uppercase tracking-widest mt-2 font-bold">Релизов</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-[#9d8df1] to-[#6050ba]">
                <AnimatedCounter end={50} suffix="+" />
              </div>
              <div className="text-xs sm:text-sm text-white uppercase tracking-widest mt-2 font-bold">Артистов</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-[#9d8df1] to-[#6050ba]">
                <AnimatedCounter end={1000000} suffix="+" duration={3000} />
              </div>
              <div className="text-xs sm:text-sm text-white uppercase tracking-widest mt-2 font-bold">Прослушиваний</div>
            </div>
          </div>
        </div>

        {/* Кнопки */}
        <div className={`flex flex-col sm:flex-row gap-4 mb-16 transition-all duration-1000 delay-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <Link 
            href={user ? "/cabinet" : "/auth"}
            className="group relative px-10 py-5 rounded-2xl text-sm font-black uppercase tracking-widest transition-all duration-300 hover:scale-105 flex items-center justify-center gap-3 overflow-hidden text-white"
            style={{
              background: 'linear-gradient(135deg, #6050ba 0%, #9d8df1 100%)',
              boxShadow: '0 10px 40px -10px rgba(96, 80, 186, 0.5), inset 0 1px 0 rgba(255,255,255,0.2)',
            }}
          >
            <span className="relative z-10">{user ? 'Кабинет' : 'Войти'}</span>
            <div className="absolute inset-0 bg-gradient-to-r from-[#9d8df1] to-[#6050ba] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </Link>
          
          <Link 
            href="/news"
            className="group px-10 py-5 bg-white/5 border border-white/10 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-white/10 hover:border-[#6050ba]/50 transition-all hover:scale-105 flex items-center justify-center gap-3 backdrop-blur-sm text-white"
          >
            <span>Новости</span>
          </Link>
        </div>

        {/* Платформы */}
        <div className={`text-center transition-all duration-1000 delay-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
          <p className="text-xs sm:text-sm text-white uppercase tracking-widest mb-6 font-bold">Дистрибуция на платформы</p>
          <div className="flex flex-wrap gap-4 md:gap-6 justify-center">
            {[
              { name: 'Spotify', color: 'hover:text-green-400 hover:border-green-400/30 hover:shadow-[0_0_20px_rgba(34,197,94,0.3)]' },
              { name: 'Apple Music', color: 'hover:text-pink-400 hover:border-pink-400/30 hover:shadow-[0_0_20px_rgba(236,72,153,0.3)]' },
              { name: 'YouTube Music', color: 'hover:text-red-400 hover:border-red-400/30 hover:shadow-[0_0_20px_rgba(239,68,68,0.3)]' },
              { name: 'Яндекс Музыка', color: 'hover:text-yellow-400 hover:border-yellow-400/30 hover:shadow-[0_0_20px_rgba(250,204,21,0.3)]' },
              { name: 'VK Music', color: 'hover:text-blue-400 hover:border-blue-400/30 hover:shadow-[0_0_20px_rgba(96,165,250,0.3)]' },
            ].map((platform) => (
              <div 
                key={platform.name}
                className={`px-4 py-2.5 rounded-full border border-white/20 bg-white/10 text-white text-sm font-semibold transition-all duration-300 cursor-pointer hover:scale-110 ${platform.color}`}
              >
                {platform.name}
              </div>
            ))}
          </div>
        </div>

        {/* Ссылки внизу */}
        <div className={`flex flex-wrap justify-center gap-6 mt-16 mb-10 transition-all duration-1000 delay-900 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
          {[
            { href: '/faq', label: 'FAQ' },
            { href: '/contacts', label: 'Контакты' },
          ].map((link) => (
            <Link 
              key={link.href}
              href={link.href} 
              className="text-white hover:text-[#c4b5fd] text-sm font-bold uppercase tracking-widest transition-all hover:scale-105"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}