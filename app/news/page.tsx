"use client";
import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
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
      <div className={`relative overflow-hidden rounded-2xl sm:rounded-3xl border border-white/10 hover:border-[#6050ba]/60 transition-all duration-700 transform hover:scale-[1.02] hover:shadow-2xl ${featured ? 'h-[300px] sm:h-[400px] md:h-[550px]' : 'h-[280px] sm:h-[320px]'}`}>
        {news.image ? (
          <img src={news.image} alt={news.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 group-hover:rotate-1" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#6050ba]/30 via-[#9d8df1]/20 to-[#0a0a0c]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
        <div className="absolute inset-0 p-5 sm:p-7 flex flex-col justify-end">
          {news.category && (
            <div className="mb-3 sm:mb-4 animate-fadeIn">
              <span className="px-3 sm:px-4 py-1 sm:py-1.5 bg-gradient-to-r from-[#6050ba] to-[#8b7dd8] rounded-full text-[10px] sm:text-[11px] font-black uppercase tracking-widest shadow-lg">{news.category}</span>
            </div>
          )}
          <h3 className={`text-white font-black uppercase tracking-tight mb-4 sm:mb-5 group-hover:text-[#c4b5fd] transition-all duration-500 leading-tight ${featured ? 'text-2xl sm:text-3xl md:text-4xl' : 'text-lg sm:text-xl'}`}>
            {news.title}
          </h3>
          <div className="flex items-center gap-4 sm:gap-5">
            <span className="text-[10px] sm:text-[11px] text-white/70 uppercase tracking-widest font-semibold">{date}</span>
            <div className="flex items-center gap-2 text-[10px] sm:text-[11px] text-purple-400 font-black uppercase tracking-widest group-hover:gap-3 transition-all">
              <span>Читать</span>
              <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-[#6050ba]/0 via-[#6050ba]/0 to-[#6050ba]/20 group-hover:from-[#6050ba]/20 group-hover:via-[#6050ba]/10 group-hover:to-[#6050ba]/30 transition-all duration-700" />
      </div>
    </div>
  );
};

// Модальное окно новости  
const NewsModal = ({ news, onClose }: any) => {
  const date = new Date(news.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 pt-16 sm:pt-20 pb-4 sm:pb-6 animate-fadeIn" onClick={onClose}>
      <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl" />
      <div className="relative w-full max-w-4xl h-full overflow-y-auto bg-gradient-to-b from-[#0d0d0f] to-black rounded-2xl sm:rounded-3xl border border-white/20 shadow-2xl [&::-webkit-scrollbar]:hidden" onClick={(e) => e.stopPropagation()}>
        <div className="relative h-[220px] sm:h-[280px] md:h-[400px]">
          {news.image ? (
            <img src={news.image} alt={news.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#6050ba]/40 via-[#9d8df1]/30 to-[#0a0a0c]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0f] via-transparent to-transparent" />
          <button onClick={onClose} className="absolute top-4 sm:top-5 md:top-6 right-4 sm:right-5 md:right-6 w-11 h-11 sm:w-12 sm:h-12 bg-gradient-to-br from-[#6050ba] to-[#8b7dd8] backdrop-blur-md rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-200 text-white group shadow-lg">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="absolute bottom-4 sm:bottom-5 md:bottom-6 left-4 sm:left-5 md:left-6 flex items-center gap-3 sm:gap-4 flex-wrap">
            {news.category && <span className="px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 bg-gradient-to-r from-[#6050ba] to-[#8b7dd8] rounded-full text-[10px] sm:text-[11px] md:text-xs font-black uppercase tracking-widest shadow-lg">{news.category}</span>}
            <span className="text-[10px] sm:text-[11px] md:text-xs text-zinc-300 uppercase tracking-widest font-semibold backdrop-blur-sm bg-black/30 px-3 py-1.5 rounded-full">{date}</span>
          </div>
        </div>
        <div className="p-5 sm:p-7 md:p-10 lg:p-14">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black uppercase tracking-tight mb-8 sm:mb-10 text-white leading-tight bg-gradient-to-r from-white via-[#c4b5fd] to-white bg-clip-text text-transparent">{news.title}</h1>
          <div className="prose prose-invert prose-sm sm:prose-base lg:prose-lg max-w-none">
            {news.content?.split('\n').map((paragraph: string, i: number) => {
              if (paragraph.trim() === '---') return <hr key={i} className="border-t-2 border-[#6050ba]/30 my-8 sm:my-10" />;
              if (paragraph.startsWith('# ')) return <h1 key={i} className="text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tight text-white mt-10 sm:mt-12 mb-5 sm:mb-6">{paragraph.replace('# ', '')}</h1>;
              if (paragraph.startsWith('## ')) return <h2 key={i} className="text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-tight text-[#c4b5fd] mt-8 sm:mt-10 mb-4 sm:mb-5">{paragraph.replace('## ', '')}</h2>;
              if (paragraph.startsWith('> ')) return <blockquote key={i} className="border-l-4 border-[#6050ba] pl-4 sm:pl-5 py-3 my-5 sm:my-6 text-white/80 italic bg-[#6050ba]/10 rounded-r-xl text-sm sm:text-base">{paragraph.replace('> ', '')}</blockquote>;
              if (paragraph.startsWith('- ')) return <li key={i} className="text-white/90 ml-4 sm:ml-5 text-sm sm:text-base leading-relaxed">{paragraph.replace('- ', '')}</li>;
              if (paragraph.trim()) {
                let processed = paragraph;
                processed = processed.replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-white">$1</strong>');
                processed = processed.replace(/\*(.+?)\*/g, '<em class="italic text-zinc-300">$1</em>');
                processed = processed.replace(/`(.+?)`/g, '<code class="bg-black/50 px-2 py-1 rounded text-[#c4b5fd] text-xs sm:text-sm font-mono">$1</code>');
                processed = processed.replace(/\[(.+?)\]\((.+?)\)/g, (match, text, url) => {
                  const href = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
                  return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="text-[#c4b5fd] underline hover:text-[#b8a8ff] transition-colors">${text}</a>`;
                });
                return <p key={i} className="text-white/85 mb-4 sm:mb-5 text-sm sm:text-base leading-relaxed" dangerouslySetInnerHTML={{ __html: processed }} />;
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
  const searchParams = useSearchParams();
  const router = useRouter();
  const newsId = searchParams.get('id');
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNews, setSelectedNews] = useState<any>(null);

  // Функция для открытия новости с обновлением URL
  const openNews = (newsItem: any) => {
    setSelectedNews(newsItem);
    router.push(`/news?id=${newsItem.id}`, { scroll: false });
  };

  // Функция для закрытия новости с очисткой URL
  const closeNews = () => {
    setSelectedNews(null);
    router.push('/news', { scroll: false });
  };

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
          const loadedNews = data && data.length > 0 ? data : DEFAULT_NEWS;
          setNews(loadedNews);
          
          // Автоматически открываем новость по ID из URL
          if (newsId && loadedNews.length > 0) {
            const newsItem = loadedNews.find((item: any) => item.id.toString() === newsId);
            if (newsItem) {
              setSelectedNews(newsItem);
            }
          }
        }
      } catch (e) {
        console.error('Исключение при загрузке новостей:', e);
        setNews(DEFAULT_NEWS);
      } finally {
        setLoading(false);
      }
    };
    loadNews();
  }, [newsId]);

  return (
    <main className="min-h-screen pt-24 sm:pt-28 md:pt-32 pb-12 sm:pb-16 md:pb-20 px-4 sm:px-6 md:px-8 relative overflow-hidden">
      <AnimatedBackground />
      
      {/* Декоративные элементы */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-gradient-to-r from-[#6050ba]/20 to-[#9d8df1]/20 rounded-full blur-[100px] animate-pulse"></div>
      <div className="absolute top-40 right-20 w-96 h-96 bg-gradient-to-l from-[#8b7dd8]/15 to-[#c4b5fd]/15 rounded-full blur-[120px] animate-pulse" style={{animationDelay: '2s'}}></div>
      
      <div className="max-w-7xl mx-auto relative z-20">
        <div className="mb-10 sm:mb-12 md:mb-16 text-center">
          <div className="inline-block mb-4">
            <span className="px-4 py-1.5 bg-gradient-to-r from-[#6050ba]/20 to-[#9d8df1]/20 border border-[#6050ba]/30 rounded-full text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-[#c4b5fd]">
              THQLABEL Updates
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black uppercase tracking-tighter mb-4 sm:mb-5 leading-none">
            <span className="inline-block bg-gradient-to-r from-white via-[#c4b5fd] to-white bg-clip-text text-transparent animate-gradient">
              Новости
            </span>
          </h1>
          <p className="text-zinc-400 text-sm sm:text-base tracking-wide max-w-2xl mx-auto">
            Последние обновления, анонсы релизов и важные события от лейбла
          </p>
        </div>

        {loading ? (
          <div className="text-center py-20 sm:py-28">
            <div className="inline-block">
              <div className="w-12 h-12 border-4 border-[#6050ba]/30 border-t-[#6050ba] rounded-full animate-spin"></div>
              <div className="text-sm sm:text-base text-zinc-500 mt-4 font-semibold">Загрузка новостей...</div>
            </div>
          </div>
        ) : news.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-28 sm:py-36 px-4">
            <div className="relative mb-6 sm:mb-8">
              <div className="absolute inset-0 bg-[#6050ba]/20 blur-3xl rounded-full animate-pulse"></div>
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 bg-gradient-to-br from-[#6050ba]/40 to-[#9d8df1]/20 rounded-2xl border-2 border-[#6050ba]/40 flex items-center justify-center shadow-2xl">
                <svg className="w-12 h-12 sm:w-14 sm:h-14 text-[#c4b5fd]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
              </div>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white mb-3 text-center">Новостей пока нет</h3>
            <p className="text-zinc-400 text-sm sm:text-base text-center max-w-md leading-relaxed">
              Следите за обновлениями — скоро здесь появятся важные анонсы и события от лейбла
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 md:gap-7 lg:gap-8">
            {news.map((item, index) => (
              <NewsCard key={item.id} news={item} featured={index === 0} onClick={() => openNews(item)} />
            ))}
          </div>
        )}
      </div>
      {selectedNews && <NewsModal news={selectedNews} onClose={closeNews} />}
    </main>
  );
}
