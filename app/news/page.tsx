"use client";
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import AnimatedBackground from '@/components/AnimatedBackground';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null;

// Тестовые новости (fallback если нет данных из БД)
const DEFAULT_NEWS: any[] = [];

// Компонент карточки новости
const NewsCard = ({ news, onClick, featured = false }: any) => {
  const date = new Date(news.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  
  return (
    <div 
      onClick={onClick}
      className={`group cursor-pointer ${featured ? 'md:col-span-2 md:row-span-2' : ''}`}
    >
      <div className={`relative overflow-hidden rounded-2xl sm:rounded-3xl border border-white/5 hover:border-[#6050ba]/50 transition-all duration-500 ${featured ? 'h-[300px] sm:h-[400px] md:h-[500px]' : 'h-[250px] sm:h-[280px]'}`}>
        {news.image ? (
          <img src={news.image} alt={news.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#6050ba]/20 to-[#0a0a0c]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        <div className="absolute inset-0 p-4 sm:p-6 flex flex-col justify-end">
          {news.category && (
            <div className="mb-2 sm:mb-3">
              <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-[#6050ba] rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-widest">{news.category}</span>
            </div>
          )}
          <h3 className={`text-white font-black uppercase tracking-tight mb-3 sm:mb-4 group-hover:text-[#9d8df1] transition-colors ${featured ? 'text-xl sm:text-2xl md:text-3xl' : 'text-base sm:text-lg'}`}>{news.title}</h3>
          <div className="flex items-center gap-3 sm:gap-4">
            <span className="text-[9px] sm:text-[10px] text-white/60 uppercase tracking-widest">{date}</span>
            <span className="text-[9px] sm:text-[10px] text-purple-400 font-bold uppercase tracking-widest group-hover:translate-x-2 transition-transform">Читать →</span>
          </div>
        </div>
        <div className="absolute inset-0 bg-[#6050ba]/0 group-hover:bg-[#6050ba]/10 transition-colors duration-500" />
      </div>
    </div>
  );
};

// Модальное окно новости  
const NewsModal = ({ news, onClose }: any) => {
  const date = new Date(news.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 pt-16 sm:pt-20 pb-4 sm:pb-6" onClick={onClose}>
      <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" />
      <div className="relative w-full max-w-3xl h-full overflow-y-auto bg-[#0d0d0f] rounded-2xl sm:rounded-3xl border border-white/10 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#6050ba]/40 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-[#6050ba]/60" onClick={(e) => e.stopPropagation()}>
        <div className="relative h-[200px] sm:h-[250px] md:h-[350px]">
          {news.image ? (
            <img src={news.image} alt={news.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#6050ba]/30 to-[#0a0a0c]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0f] via-transparent to-transparent" />
          <button onClick={onClose} className="absolute top-3 sm:top-4 md:top-6 right-3 sm:right-4 md:right-6 w-10 h-10 sm:w-12 sm:h-12 bg-[#6050ba]/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-[#6050ba] hover:scale-110 transition-all duration-200 text-white group">
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="absolute bottom-3 sm:bottom-4 md:bottom-6 left-3 sm:left-4 md:left-6 flex items-center gap-2 sm:gap-3 md:gap-4 flex-wrap">
            {news.category && <span className="px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 bg-[#6050ba] rounded-full text-[9px] sm:text-[10px] md:text-[11px] font-bold uppercase tracking-widest">{news.category}</span>}
            <span className="text-[9px] sm:text-[10px] md:text-[11px] text-zinc-400 uppercase tracking-widest">{date}</span>
          </div>
        </div>
        <div className="p-4 sm:p-6 md:p-8 lg:p-12">
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black uppercase tracking-tight mb-6 sm:mb-8 text-white">{news.title}</h1>
          <div className="prose prose-invert prose-sm sm:prose-base lg:prose-lg max-w-none">
            {news.content?.split('\n').map((paragraph: string, i: number) => {
              if (paragraph.trim() === '---') return <hr key={i} className="border-t border-white/20 my-6 sm:my-8" />;
              if (paragraph.startsWith('# ')) return <h1 key={i} className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white mt-8 sm:mt-10 mb-4 sm:mb-6">{paragraph.replace('# ', '')}</h1>;
              if (paragraph.startsWith('## ')) return <h2 key={i} className="text-lg sm:text-xl font-black uppercase tracking-tight text-[#9d8df1] mt-6 sm:mt-8 mb-3 sm:mb-4">{paragraph.replace('## ', '')}</h2>;
              if (paragraph.startsWith('> ')) return <blockquote key={i} className="border-l-4 border-[#6050ba] pl-3 sm:pl-4 py-2 my-3 sm:my-4 text-white/70 italic bg-white/5 rounded-r-lg text-sm sm:text-base">{paragraph.replace('> ', '')}</blockquote>;
              if (paragraph.startsWith('- ')) return <li key={i} className="text-white/90 ml-3 sm:ml-4 text-sm sm:text-base">{paragraph.replace('- ', '')}</li>;
              if (paragraph.trim()) {
                let processed = paragraph;
                processed = processed.replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-white">$1</strong>');
                processed = processed.replace(/\*(.+?)\*/g, '<em class="italic text-zinc-300">$1</em>');
                processed = processed.replace(/`(.+?)`/g, '<code class="bg-black/40 px-2 py-1 rounded text-[#9d8df1] text-xs sm:text-sm font-mono">$1</code>');
                processed = processed.replace(/\[(.+?)\]\((.+?)\)/g, (match, text, url) => {
                  const href = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
                  return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="text-[#9d8df1] underline hover:text-[#b8a8ff]">${text}</a>`;
                });
                return <p key={i} className="text-white/80 mb-3 sm:mb-4 text-sm sm:text-base" dangerouslySetInnerHTML={{ __html: processed }} />;
              }
              return null;
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function NewsPage() {
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNews, setSelectedNews] = useState<any>(null);

  useEffect(() => {
    const loadNews = async () => {
      if (!supabase) { 
        console.warn('Supabase не инициализирован');
        setNews(DEFAULT_NEWS); 
        setLoading(false); 
        return; 
      }
      try {
        const { data, error } = await supabase.from('news').select('*').order('created_at', { ascending: false });
        if (error) {
          console.error('Ошибка загрузки новостей:', error);
          setNews(DEFAULT_NEWS);
        } else {
          // Если есть новости в БД - показываем их, иначе дефолтные
          setNews(data && data.length > 0 ? data : DEFAULT_NEWS);
        }
      } catch (e) {
        console.error('Исключение при загрузке новостей:', e);
        setNews(DEFAULT_NEWS);
      } finally {
        setLoading(false);
      }
    };
    loadNews();
  }, []);

  return (
    <main className="min-h-screen pt-24 sm:pt-28 md:pt-32 pb-12 sm:pb-16 md:pb-20 px-4 sm:px-6 md:px-8 relative">
      <AnimatedBackground />
      <div className="max-w-6xl mx-auto relative z-20">
        <div className="mb-8 sm:mb-10 md:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black italic uppercase tracking-tighter mb-3 sm:mb-4">
            <span className="text-white">Ново</span><span className="text-[#6050ba]">сти</span>
          </h1>
          <p className="text-zinc-500 text-xs sm:text-sm tracking-widest">Последние обновления от thqlabel</p>
        </div>

        {loading ? (
          <div className="text-center py-16 sm:py-20"><div className="text-sm sm:text-base text-zinc-600 animate-pulse">Загрузка новостей...</div></div>
        ) : news.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 sm:py-32 px-4">
            <div className="relative mb-4 sm:mb-6">
              <div className="absolute inset-0 bg-[#6050ba]/20 blur-3xl rounded-full"></div>
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-[#6050ba]/30 to-[#6050ba]/10 rounded-full border border-[#6050ba]/30 flex items-center justify-center">
                <svg className="w-10 h-10 sm:w-12 sm:h-12 text-[#9d8df1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
              </div>
            </div>
            <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white mb-2 text-center">Новостей пока нет</h3>
            <p className="text-zinc-500 text-xs sm:text-sm text-center">Следите за обновлениями — скоро здесь появятся важные новости</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {news.map((item, index) => (
              <NewsCard key={item.id} news={item} featured={index === 0} onClick={() => setSelectedNews(item)} />
            ))}
          </div>
        )}
      </div>
      {selectedNews && <NewsModal news={selectedNews} onClose={() => setSelectedNews(null)} />}
    </main>
  );
}
