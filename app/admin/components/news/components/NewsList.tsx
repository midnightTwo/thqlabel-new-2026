'use client';

import React from 'react';

interface NewsItem {
  id: number;
  title: string;
  content: string;
  category: string;
  image: string | null;
  created_at: string;
  updated_at: string;
}

interface NewsListProps {
  news: NewsItem[];
  loading: boolean;
  onEdit: (item: NewsItem) => void;
  onDelete: (id: number) => void;
}

export function NewsList({ news, loading, onEdit, onDelete }: NewsListProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 sm:gap-4">
        <h3 className="font-black text-base sm:text-lg">Опубликованные новости ({news.length})</h3>
        <p className="text-[10px] sm:text-xs text-zinc-500">Нажмите на новость для редактирования</p>
      </div>
      
      {loading ? (
        <div className="text-center py-12">
          <div className="text-zinc-600 animate-pulse">Загрузка новостей...</div>
        </div>
      ) : news.length === 0 ? (
        <EmptyState />
      ) : (
        news.map(item => (
          <NewsCard
            key={item.id}
            item={item}
            onEdit={() => onEdit(item)}
            onDelete={() => onDelete(item.id)}
          />
        ))
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-12 bg-white/[0.02] border border-white/5 rounded-2xl">
      <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-white/5 flex items-center justify-center">
        <svg className="w-6 h-6 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
        </svg>
      </div>
      <p className="text-zinc-500 font-bold">Новостей пока нет</p>
      <p className="text-xs text-zinc-600 mt-1">Создай первую новость используя форму выше</p>
    </div>
  );
}

interface NewsCardProps {
  item: NewsItem;
  onEdit: () => void;
  onDelete: () => void;
}

function NewsCard({ item, onEdit, onDelete }: NewsCardProps) {
  return (
    <div className="bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/10 rounded-2xl p-3 sm:p-5 hover:border-[#6050ba]/50 transition-all group">
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        {item.image && (
          <img src={item.image} alt="" className="w-full sm:w-24 h-40 sm:h-24 rounded-xl object-cover flex-shrink-0 border border-white/5" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center flex-wrap gap-2 mb-2">
            {item.category && (
              <span className="text-[10px] px-2.5 py-1 bg-[#6050ba]/20 text-[#9d8df1] rounded-full font-bold">{item.category}</span>
            )}
            <span className="text-[9px] text-zinc-600">ID: {item.id}</span>
          </div>
          <h4 className="font-bold text-white mb-2 line-clamp-2 sm:line-clamp-1 text-sm sm:text-base">{item.title}</h4>
          <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">{item.content || 'Без текста'}</p>
          <div className="flex items-center flex-wrap gap-2 sm:gap-3 mt-3">
            <p className="text-[10px] text-zinc-600">
              {new Date(item.created_at).toLocaleString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
            {item.updated_at !== item.created_at && (
              <p className="text-[10px] text-zinc-600">
                Изменено: {new Date(item.updated_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-row sm:flex-col gap-2 flex-shrink-0 mt-2 sm:mt-0">
          <button 
            onClick={onEdit}
            className="flex-1 sm:flex-none px-4 py-2 bg-[#6050ba]/20 hover:bg-[#6050ba]/40 rounded-lg text-xs font-bold transition active:scale-95 sm:group-hover:scale-105 min-h-[40px] sm:min-h-0"
          >
            Изменить
          </button>
          <button 
            onClick={onDelete}
            className="flex-1 sm:flex-none px-4 py-2 bg-red-500/10 hover:bg-red-500/30 text-red-400 rounded-lg text-xs font-bold transition active:scale-95 sm:group-hover:scale-105 min-h-[40px] sm:min-h-0"
          >
            Удалить
          </button>
        </div>
      </div>
    </div>
  );
}
