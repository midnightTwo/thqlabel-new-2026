'use client';
import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '../../lib/fetchWithAuth';

interface CreateTicketFormProps {
  onCancel: () => void;
  onCreated: (ticket: any) => void;
  isLight?: boolean;
}

// Категории с иконками
const categories = [
  { 
    value: 'general', 
    label: 'Общий вопрос',
    description: 'Задать любой вопрос',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  },
  { 
    value: 'releases', 
    label: 'Релизы',
    description: 'Вопросы по релизам',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
      </svg>
    )
  },
  { 
    value: 'payout', 
    label: 'Выплаты',
    description: 'Вопросы по финансам',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  },
  { 
    value: 'problem', 
    label: 'Проблема',
    description: 'Сообщить о проблеме',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    )
  },
  { 
    value: 'account', 
    label: 'Аккаунт',
    description: 'Настройки профиля',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    )
  },
  { 
    value: 'other', 
    label: 'Другое',
    description: 'Прочие вопросы',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
      </svg>
    )
  }
];

// SVG иконки для статусов релизов
const StatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case 'pending':
      return (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'approved':
      return (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'rejected':
      return (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'published':
      return (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
      );
    default:
      return (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
      );
  }
};

// SVG иконки для типов транзакций
const TransactionIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'deposit':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8l-8 8-8-8" />
        </svg>
      );
    case 'withdrawal':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 20V4m-8 8l8-8 8 8" />
        </svg>
      );
    case 'purchase':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      );
    case 'payout':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      );
    case 'bonus':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
        </svg>
      );
    case 'refund':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
        </svg>
      );
    case 'freeze':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v18m0-18l4 4m-4-4L8 7m4 14l4-4m-4 4l-4-4M3 12h18M3 12l4-4m-4 4l4 4m14-4l-4-4m4 4l-4 4" />
        </svg>
      );
    case 'unfreeze':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
    case 'adjustment':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
      );
    default:
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
  }
};

export default function CreateTicketForm({ onCancel, onCreated, isLight = false }: CreateTicketFormProps) {
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('');
  const [message, setMessage] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [releases, setReleases] = useState<any[]>([]);
  const [selectedRelease, setSelectedRelease] = useState('');
  const [loadingReleases, setLoadingReleases] = useState(false);
  const [releaseSearch, setReleaseSearch] = useState('');
  
  // Новые состояния для транзакций
  const [transactions, setTransactions] = useState<any[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState('');
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [transactionSearch, setTransactionSearch] = useState('');

  useEffect(() => {
    if (category === 'releases') {
      loadReleases();
      setSelectedTransaction('');
    } else if (category === 'payout') {
      loadTransactions();
      setSelectedRelease('');
    } else {
      setSelectedRelease('');
      setSelectedTransaction('');
    }
  }, [category]);
  
  const loadTransactions = async () => {
    setLoadingTransactions(true);
    try {
      const response = await fetchWithAuth('/api/balance/transactions?limit=50');
      const data = await response.json();
      if (response.ok) {
        setTransactions(data.transactions || []);
      }
    } catch (err) {
      console.error('Error loading transactions:', err);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const loadReleases = async () => {
    setLoadingReleases(true);
    try {
      const response = await fetchWithAuth('/api/releases');
      const data = await response.json();
      if (response.ok) {
        const filteredReleases = (data.releases || []).filter((r: any) => r.status !== 'draft');
        setReleases(filteredReleases);
      }
    } catch (err) {
      console.error('Error loading releases:', err);
    } finally {
      setLoadingReleases(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError('');

    const uploadedUrls: string[] = [];
    const MAX_FILE_SIZE = 10 * 1024 * 1024;

    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) {
          setError(`Файл "${file.name}" не является изображением.`);
          setTimeout(() => setError(''), 3000);
          e.target.value = '';
          setUploading(false);
          return;
        }

        if (file.size > MAX_FILE_SIZE) {
          setError(`Файл "${file.name}" слишком большой. Максимум 10 МБ.`);
          setTimeout(() => setError(''), 3000);
          e.target.value = '';
          setUploading(false);
          return;
        }

        const formData = new FormData();
        formData.append('file', file);

        const response = await fetchWithAuth('/api/support/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        if (response.ok) {
          uploadedUrls.push(data.url);
        } else {
          setError(data.error || 'Ошибка загрузки изображения');
          e.target.value = '';
          break;
        }
      }

      if (uploadedUrls.length > 0) {
        setImages([...images, ...uploadedUrls]);
      }
    } catch (err) {
      console.error('Error uploading images:', err);
      setError('Ошибка загрузки изображений');
      e.target.value = '';
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!category) {
      setError('Выберите категорию обращения');
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (!subject.trim()) {
      setError('Пожалуйста, укажите тему обращения');
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (!message.trim() && images.length === 0) {
      setError('Напишите сообщение или прикрепите фото');
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (category === 'releases' && !selectedRelease) {
      setError('Выберите релиз из списка');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setCreating(true);
    setError('');

    try {
      const response = await fetchWithAuth('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          subject, 
          category: category || 'general', 
          message, 
          images,
          release_id: category === 'releases' ? selectedRelease : null,
          transaction_id: category === 'payout' ? selectedTransaction : null
        }),
      });

      const data = await response.json();

      if (response.ok) {
        onCreated(data.ticket);
      } else {
        setError(data.error || 'Ошибка создания тикета');
      }
    } catch (err) {
      console.error('Error creating ticket:', err);
      setError('Ошибка соединения с сервером');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header - Glass Style */}
      <div 
        className="p-4 border-b"
        style={{
          background: isLight 
            ? 'linear-gradient(180deg, rgba(255, 255, 255, 0.6) 0%, rgba(245, 240, 255, 0.4) 100%)' 
            : 'linear-gradient(180deg, rgba(20, 18, 35, 0.8) 0%, rgba(40, 35, 60, 0.6) 100%)',
          borderColor: isLight ? 'rgba(157, 141, 241, 0.25)' : 'rgba(157, 141, 241, 0.15)',
          backdropFilter: 'blur(40px) saturate(180%)',
          boxShadow: isLight 
            ? 'inset 0 1px 0 rgba(255, 255, 255, 0.8)' 
            : 'inset 0 0 0 1px rgba(255, 255, 255, 0.08), inset 0 2px 4px rgba(255, 255, 255, 0.1)',
        }}
      >
        <button
          onClick={onCancel}
          className="sidebar-nav-btn mb-3 px-4 py-2.5 flex items-center gap-2 rounded-xl transition-all duration-300 group hover:scale-[1.02]"
        >
          <svg className="w-5 h-5 sidebar-nav-icon group-hover:-translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="font-semibold">Назад</span>
        </button>
        <h3 
          className="text-lg font-bold"
          style={{
            background: isLight 
              ? 'linear-gradient(90deg, #1a1535 0%, #6050ba 100%)' 
              : 'linear-gradient(90deg, #ffffff 0%, #c4b5fd 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Новый тикет
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {/* Ошибка - Glass Style */}
          {error && (
            <div 
              className="p-4 rounded-2xl flex items-start gap-3 animate-fade-in"
              style={{
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(248, 113, 113, 0.2) 100%)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                boxShadow: '0 4px 16px rgba(239, 68, 68, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <div 
                className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5"
                style={{
                  background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.3) 0%, rgba(248, 113, 113, 0.4) 100%)',
                  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                }}
              >
                <svg className="w-3.5 h-3.5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-sm font-medium text-red-300">{error}</p>
            </div>
          )}

          {/* Категория - Красивые карточки */}
          <div>
            <label 
              className="block text-sm font-semibold mb-3 flex items-center gap-1"
              style={{ color: isLight ? '#1a1535' : '#e9e5f8' }}
            >
              Категория <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {categories.map(cat => {
                const isSelected = category === cat.value;
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategory(cat.value)}
                    className="relative p-3 rounded-xl cursor-pointer transition-all duration-200 text-left group hover:scale-[1.02]"
                    style={{
                      background: isSelected 
                        ? isLight 
                          ? 'linear-gradient(135deg, rgba(96, 80, 186, 0.2) 0%, rgba(157, 141, 241, 0.3) 100%)' 
                          : 'linear-gradient(135deg, rgba(96, 80, 186, 0.35) 0%, rgba(157, 141, 241, 0.4) 100%)'
                        : isLight
                          ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.5) 0%, rgba(245, 240, 255, 0.4) 100%)'
                          : 'linear-gradient(135deg, rgba(20, 18, 35, 0.5) 0%, rgba(40, 35, 60, 0.6) 100%)',
                      border: isSelected 
                        ? '2px solid rgba(157, 141, 241, 0.6)' 
                        : isLight ? '1px solid rgba(157, 141, 241, 0.2)' : '1px solid rgba(157, 141, 241, 0.15)',
                      boxShadow: isSelected 
                        ? '0 4px 20px rgba(96, 80, 186, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15)' 
                        : 'none',
                    }}
                  >
                    <div className="flex items-start gap-2.5">
                      <div 
                        className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200"
                        style={{
                          background: isSelected 
                            ? 'linear-gradient(135deg, #6050ba 0%, #9d8df1 100%)'
                            : isLight 
                              ? 'linear-gradient(135deg, rgba(96, 80, 186, 0.15) 0%, rgba(157, 141, 241, 0.2) 100%)'
                              : 'linear-gradient(135deg, rgba(96, 80, 186, 0.25) 0%, rgba(157, 141, 241, 0.3) 100%)',
                          boxShadow: isSelected ? '0 2px 8px rgba(96, 80, 186, 0.4)' : 'none',
                          color: isSelected ? '#ffffff' : isLight ? '#6050ba' : '#9d8df1',
                        }}
                      >
                        {cat.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span 
                            className="font-semibold text-sm"
                            style={{ color: isSelected 
                              ? isLight ? '#6050ba' : '#ffffff' 
                              : isLight ? '#1a1535' : '#e9e5f8' 
                            }}
                          >
                            {cat.label}
                          </span>
                          {isSelected && (
                            <div 
                              className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center"
                              style={{ background: 'linear-gradient(135deg, #6050ba 0%, #9d8df1 100%)' }}
                            >
                              <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <p 
                          className="text-[10px] mt-0.5 truncate"
                          style={{ color: isLight ? '#888' : '#888' }}
                        >
                          {cat.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Тема - Glass Input */}
          {category && (
          <div>
            <label 
              className="block text-sm font-semibold mb-2 flex items-center gap-1"
              style={{ color: isLight ? '#1a1535' : '#e9e5f8' }}
            >
              Тема <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-4 py-3 rounded-xl focus:outline-none transition-all duration-300"
              style={{
                background: isLight 
                  ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(245, 240, 255, 0.6) 100%)' 
                  : 'linear-gradient(135deg, rgba(20, 18, 35, 0.7) 0%, rgba(40, 35, 60, 0.8) 100%)',
                border: error && !subject.trim() 
                  ? '1.5px solid rgba(239, 68, 68, 0.5)' 
                  : isLight ? '1px solid rgba(157, 141, 241, 0.3)' : '1px solid rgba(157, 141, 241, 0.25)',
                boxShadow: error && !subject.trim()
                  ? '0 0 20px rgba(239, 68, 68, 0.2)'
                  : isLight 
                    ? 'inset 0 2px 4px rgba(96, 80, 186, 0.1), 0 1px 0 rgba(255, 255, 255, 0.5)' 
                    : 'inset 0 2px 4px rgba(0, 0, 0, 0.2), 0 1px 0 rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
                color: isLight ? '#1a1535' : '#ffffff',
              }}
              placeholder="Кратко опишите проблему"
              required
            />
          </div>
          )}

          {/* Выбор релиза */}
          {category === 'releases' && (
            <div>
              <label 
                className="block text-sm font-semibold mb-3"
                style={{ color: isLight ? '#1a1535' : '#e9e5f8' }}
              >
                Выберите релиз
              </label>
              
              {/* Поиск показываем только если нет выбранного релиза */}
              {!loadingReleases && releases.length > 0 && !selectedRelease && (
                <div className="mb-3 relative">
                  <input
                    type="text"
                    value={releaseSearch}
                    onChange={(e) => setReleaseSearch(e.target.value)}
                    placeholder="Поиск по названию..."
                    className="w-full px-3 py-2 pl-10 rounded-xl focus:outline-none text-sm transition-all duration-300"
                    style={{
                      background: isLight 
                        ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(245, 240, 255, 0.6) 100%)' 
                        : 'linear-gradient(135deg, rgba(20, 18, 35, 0.7) 0%, rgba(40, 35, 60, 0.8) 100%)',
                      border: isLight ? '1px solid rgba(157, 141, 241, 0.3)' : '1px solid rgba(157, 141, 241, 0.25)',
                      color: isLight ? '#1a1535' : '#ffffff',
                      backdropFilter: 'blur(10px)',
                    }}
                  />
                  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: isLight ? '#6050ba' : '#9d8df1' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              )}
              
              {loadingReleases ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#9d8df1' }}></div>
                </div>
              ) : releases.length === 0 ? (
                <div 
                  className="p-4 rounded-xl text-sm text-center"
                  style={{
                    background: isLight 
                      ? 'linear-gradient(135deg, rgba(245, 240, 255, 0.5) 0%, rgba(235, 230, 250, 0.4) 100%)' 
                      : 'linear-gradient(135deg, rgba(20, 18, 35, 0.5) 0%, rgba(40, 35, 60, 0.6) 100%)',
                    border: isLight ? '1px solid rgba(157, 141, 241, 0.3)' : '1px solid rgba(157, 141, 241, 0.25)',
                    color: isLight ? '#6050ba' : '#9d8df1',
                  }}
                >
                  У вас пока нет релизов
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {releases
                    .filter(release => {
                      // Если релиз выбран - показываем только его
                      if (selectedRelease) return release.id === selectedRelease;
                      // Иначе фильтруем по поиску
                      if (!releaseSearch.trim()) return true;
                      const searchLower = releaseSearch.toLowerCase();
                      return release.title.toLowerCase().includes(searchLower) || 
                             release.artist.toLowerCase().includes(searchLower);
                    })
                    .map(release => {
                    const isSelected = selectedRelease === release.id;
                    const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
                      pending: { label: 'На модерации', color: '#fbbf24', bgColor: 'rgba(251, 191, 36, 0.15)' },
                      approved: { label: 'Одобрен', color: '#34d399', bgColor: 'rgba(52, 211, 153, 0.15)' },
                      rejected: { label: 'Отклонен', color: '#f87171', bgColor: 'rgba(248, 113, 113, 0.15)' },
                      published: { label: 'Опубликован', color: '#c4b5fd', bgColor: 'rgba(157, 141, 241, 0.15)' }
                    };
                    const status = statusConfig[release.status] || { label: release.status, color: '#9d8df1', bgColor: 'rgba(157, 141, 241, 0.15)' };

                    return (
                      <div
                        key={release.id}
                        onClick={() => setSelectedRelease(isSelected ? '' : release.id)}
                        className="relative p-3 rounded-xl cursor-pointer transition-all duration-200"
                        style={{
                          background: isSelected 
                            ? isLight 
                              ? 'linear-gradient(135deg, rgba(96, 80, 186, 0.15) 0%, rgba(157, 141, 241, 0.2) 100%)' 
                              : 'linear-gradient(135deg, rgba(96, 80, 186, 0.25) 0%, rgba(157, 141, 241, 0.3) 100%)'
                            : isLight
                              ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.5) 0%, rgba(245, 240, 255, 0.4) 100%)'
                              : 'linear-gradient(135deg, rgba(20, 18, 35, 0.5) 0%, rgba(40, 35, 60, 0.6) 100%)',
                          border: isSelected 
                            ? '2px solid rgba(157, 141, 241, 0.5)' 
                            : isLight ? '2px solid rgba(157, 141, 241, 0.2)' : '2px solid rgba(157, 141, 241, 0.15)',
                          boxShadow: isSelected ? '0 4px 20px rgba(96, 80, 186, 0.25)' : 'none',
                        }}
                      >
                        <div className="flex gap-3">
                          {release.artwork_url ? (
                            <img src={release.artwork_url} alt={release.title} className="w-16 h-16 rounded-lg object-cover" style={{ border: '2px solid rgba(157, 141, 241, 0.2)' }} />
                          ) : (
                            <div 
                              className="w-16 h-16 rounded-lg flex items-center justify-center"
                              style={{
                                background: 'linear-gradient(135deg, rgba(96, 80, 186, 0.6) 0%, rgba(157, 141, 241, 0.7) 100%)',
                                border: '2px solid rgba(157, 141, 241, 0.3)',
                              }}
                            >
                              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                              </svg>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h4 className="font-bold text-sm truncate" style={{ color: isLight ? '#1a1535' : '#ffffff' }}>{release.title}</h4>
                              {isSelected && (
                                <div 
                                  className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                                  style={{ background: 'linear-gradient(135deg, #6050ba 0%, #9d8df1 100%)' }}
                                >
                                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <p className="text-xs mb-2" style={{ color: isLight ? '#6050ba' : '#9d8df1' }}>{release.artist}</p>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span 
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold"
                                style={{ 
                                  background: status.bgColor, 
                                  color: status.color, 
                                  border: `1px solid ${status.color}40`,
                                  boxShadow: `0 2px 8px ${status.color}20`
                                }}
                              >
                                <StatusIcon status={release.status} />
                                <span>{status.label}</span>
                              </span>
                              <span className="text-[10px]" style={{ color: isLight ? '#888' : '#777' }}>
                                {new Date(release.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Выбор транзакции для выплат */}
          {category === 'payout' && (
            <div>
              <label 
                className="block text-sm font-semibold mb-3"
                style={{ color: isLight ? '#1a1535' : '#e9e5f8' }}
              >
                Выберите транзакцию <span className="text-xs font-normal opacity-60">(опционально)</span>
              </label>
              
              {/* Поиск показываем только если нет выбранной транзакции */}
              {!loadingTransactions && transactions.length > 0 && !selectedTransaction && (
                <div className="mb-3 relative">
                  <input
                    type="text"
                    value={transactionSearch}
                    onChange={(e) => setTransactionSearch(e.target.value)}
                    placeholder="Поиск по описанию или ID..."
                    className="w-full px-3 py-2 pl-10 rounded-xl focus:outline-none text-sm transition-all duration-300"
                    style={{
                      background: isLight 
                        ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(245, 240, 255, 0.6) 100%)' 
                        : 'linear-gradient(135deg, rgba(20, 18, 35, 0.7) 0%, rgba(40, 35, 60, 0.8) 100%)',
                      border: isLight ? '1px solid rgba(157, 141, 241, 0.3)' : '1px solid rgba(157, 141, 241, 0.25)',
                      color: isLight ? '#1a1535' : '#ffffff',
                      backdropFilter: 'blur(10px)',
                    }}
                  />
                  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: isLight ? '#6050ba' : '#9d8df1' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              )}
              
              {loadingTransactions ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#9d8df1' }}></div>
                </div>
              ) : transactions.length === 0 ? (
                <div 
                  className="p-4 rounded-xl text-sm text-center"
                  style={{
                    background: isLight 
                      ? 'linear-gradient(135deg, rgba(245, 240, 255, 0.5) 0%, rgba(235, 230, 250, 0.4) 100%)' 
                      : 'linear-gradient(135deg, rgba(20, 18, 35, 0.5) 0%, rgba(40, 35, 60, 0.6) 100%)',
                    border: isLight ? '1px solid rgba(157, 141, 241, 0.3)' : '1px solid rgba(157, 141, 241, 0.25)',
                    color: isLight ? '#6050ba' : '#9d8df1',
                  }}
                >
                  У вас пока нет транзакций
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto overflow-x-hidden">
                  {transactions
                    .filter(tx => {
                      // Если транзакция выбрана - показываем только её
                      if (selectedTransaction) return tx.id === selectedTransaction;
                      // Иначе фильтруем по поиску
                      if (!transactionSearch.trim()) return true;
                      // Убираем # из поиска для поиска по ID
                      const searchLower = transactionSearch.toLowerCase().replace('#', '');
                      return (tx.description || '').toLowerCase().includes(searchLower) || 
                             tx.type.toLowerCase().includes(searchLower) ||
                             (tx.id || '').toLowerCase().includes(searchLower);
                    })
                    .map(tx => {
                    const isSelected = selectedTransaction === tx.id;
                    const typeConfig: Record<string, { label: string; color: string; bgColor: string }> = {
                      deposit: { label: 'Пополнение', color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.15)' },
                      withdrawal: { label: 'Вывод', color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.15)' },
                      purchase: { label: 'Покупка', color: '#8b5cf6', bgColor: 'rgba(139, 92, 246, 0.15)' },
                      payout: { label: 'Роялти', color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.15)' },
                      bonus: { label: 'Бонус', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.15)' },
                      refund: { label: 'Возврат', color: '#06b6d4', bgColor: 'rgba(6, 182, 212, 0.15)' },
                      freeze: { label: 'Заморозка', color: '#60a5fa', bgColor: 'rgba(96, 165, 250, 0.15)' },
                      unfreeze: { label: 'Разморозка', color: '#34d399', bgColor: 'rgba(52, 211, 153, 0.15)' },
                      adjustment: { label: 'Корректировка', color: '#a78bfa', bgColor: 'rgba(167, 139, 250, 0.15)' }
                    };
                    const typeInfo = typeConfig[tx.type] || { label: tx.type, color: '#9d8df1', bgColor: 'rgba(157, 141, 241, 0.15)' };
                    const isPositive = ['deposit', 'payout', 'bonus', 'refund', 'unfreeze'].includes(tx.type);

                    return (
                      <div
                        key={tx.id}
                        onClick={() => setSelectedTransaction(isSelected ? '' : tx.id)}
                        className="relative p-3 rounded-xl cursor-pointer transition-all duration-200 overflow-hidden"
                        style={{
                          background: isSelected 
                            ? isLight 
                              ? 'linear-gradient(135deg, rgba(96, 80, 186, 0.15) 0%, rgba(157, 141, 241, 0.2) 100%)' 
                              : 'linear-gradient(135deg, rgba(96, 80, 186, 0.25) 0%, rgba(157, 141, 241, 0.3) 100%)'
                            : isLight
                              ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.5) 0%, rgba(245, 240, 255, 0.4) 100%)'
                              : 'linear-gradient(135deg, rgba(20, 18, 35, 0.5) 0%, rgba(40, 35, 60, 0.6) 100%)',
                          border: isSelected 
                            ? '2px solid rgba(157, 141, 241, 0.5)' 
                            : isLight ? '1px solid rgba(157, 141, 241, 0.2)' : '1px solid rgba(157, 141, 241, 0.15)',
                          boxShadow: isSelected ? '0 4px 20px rgba(96, 80, 186, 0.25)' : 'none',
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div 
                            className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{
                              background: typeInfo.bgColor,
                              color: typeInfo.color,
                              border: `1px solid ${typeInfo.color}30`,
                            }}
                          >
                            <TransactionIcon type={tx.type} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <div className="flex items-center gap-2 min-w-0">
                                <span 
                                  className="px-2 py-0.5 rounded-md text-[10px] font-semibold"
                                  style={{ 
                                    background: typeInfo.bgColor, 
                                    color: typeInfo.color,
                                    border: `1px solid ${typeInfo.color}30`
                                  }}
                                >
                                  {typeInfo.label}
                                </span>
                                {isSelected && (
                                  <div 
                                    className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center"
                                    style={{ background: 'linear-gradient(135deg, #6050ba 0%, #9d8df1 100%)' }}
                                  >
                                    <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                )}
                              </div>
                              <span 
                                className="font-bold text-sm flex-shrink-0"
                                style={{ color: isPositive ? '#10b981' : '#ef4444' }}
                              >
                                {isPositive ? '+' : '-'}{Math.abs(tx.amount).toLocaleString('ru-RU')} ₽
                              </span>
                            </div>
                            {tx.description && (
                              <p className="text-xs truncate mb-1" style={{ color: isLight ? '#666' : '#aaa' }}>
                                {tx.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px]" style={{ color: isLight ? '#888' : '#777' }}>
                                {new Date(tx.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                              <span className="text-[10px]" style={{ color: isLight ? '#888' : '#777' }}>
                                {new Date(tx.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <span 
                                className="text-[9px] font-mono px-1.5 py-0.5 rounded truncate max-w-[80px]"
                                style={{ 
                                  background: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)',
                                  color: isLight ? '#888' : '#666'
                                }}
                              >
                                #{tx.id?.slice(0, 8)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Сообщение - Glass Textarea */}
          {category && (
          <div>
            <label 
              className="block text-sm font-semibold mb-2 flex items-center gap-1"
              style={{ color: isLight ? '#1a1535' : '#e9e5f8' }}
            >
              Сообщение <span className="text-red-400">*</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-4 py-3 rounded-xl focus:outline-none min-h-[120px] transition-all duration-300 resize-none"
              style={{
                background: isLight 
                  ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(245, 240, 255, 0.6) 100%)' 
                  : 'linear-gradient(135deg, rgba(20, 18, 35, 0.7) 0%, rgba(40, 35, 60, 0.8) 100%)',
                border: error && !message.trim() 
                  ? '1.5px solid rgba(239, 68, 68, 0.5)' 
                  : isLight ? '1px solid rgba(157, 141, 241, 0.3)' : '1px solid rgba(157, 141, 241, 0.25)',
                boxShadow: error && !message.trim()
                  ? '0 0 20px rgba(239, 68, 68, 0.2)'
                  : isLight 
                    ? 'inset 0 2px 4px rgba(96, 80, 186, 0.1), 0 1px 0 rgba(255, 255, 255, 0.5)' 
                    : 'inset 0 2px 4px rgba(0, 0, 0, 0.2), 0 1px 0 rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
                color: isLight ? '#1a1535' : '#ffffff',
              }}
              placeholder="Подробно опишите вашу проблему"
              required
            />
          </div>
          )}

          {/* Изображения - Glass Upload */}
          {category && (
          <div>
            <label 
              className="block text-sm font-semibold mb-2"
              style={{ color: isLight ? '#1a1535' : '#e9e5f8' }}
            >
              Изображения
            </label>
            <input type="file" accept="image/*" multiple onChange={handleImageUpload} disabled={uploading} className="hidden" id="ticket-image-upload" />
            
            {images.length === 0 ? (
              <label 
                htmlFor="ticket-image-upload" 
                className="block w-full px-4 py-4 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all duration-300 group hover:scale-[1.01]"
                style={{
                  background: isLight 
                    ? 'linear-gradient(135deg, rgba(245, 240, 255, 0.5) 0%, rgba(235, 230, 250, 0.4) 100%)' 
                    : 'linear-gradient(135deg, rgba(20, 18, 35, 0.5) 0%, rgba(40, 35, 60, 0.6) 100%)',
                  borderColor: isLight ? 'rgba(157, 141, 241, 0.4)' : 'rgba(157, 141, 241, 0.3)',
                  boxShadow: isLight 
                    ? 'inset 0 2px 8px rgba(96, 80, 186, 0.08)' 
                    : 'inset 0 2px 8px rgba(0, 0, 0, 0.15)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <div className="flex flex-col items-center gap-2.5">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                    style={{
                      background: isLight 
                        ? 'linear-gradient(135deg, rgba(96, 80, 186, 0.2) 0%, rgba(157, 141, 241, 0.3) 100%)' 
                        : 'linear-gradient(135deg, rgba(96, 80, 186, 0.3) 0%, rgba(157, 141, 241, 0.4) 100%)',
                      boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 4px 12px rgba(96, 80, 186, 0.2)',
                      border: isLight ? '1px solid rgba(157, 141, 241, 0.3)' : '1px solid rgba(157, 141, 241, 0.25)',
                    }}
                  >
                    <svg className={`w-6 h-6 ${isLight ? 'text-[#6050ba]' : 'text-purple-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p 
                      className="text-sm font-semibold transition-colors"
                      style={{ color: isLight ? '#1a1535' : '#ffffff' }}
                    >
                      {uploading ? 'Загрузка...' : 'Нажмите для выбора фото'}
                    </p>
                    <p className={`text-xs mt-0.5 ${isLight ? 'text-gray-500' : 'text-zinc-500'}`}>PNG, JPG, GIF, WebP до 10 МБ</p>
                  </div>
                </div>
              </label>
            ) : (
              <div 
                className="border-2 border-dashed rounded-2xl p-3"
                style={{
                  background: isLight 
                    ? 'linear-gradient(135deg, rgba(245, 240, 255, 0.5) 0%, rgba(235, 230, 250, 0.4) 100%)' 
                    : 'linear-gradient(135deg, rgba(20, 18, 35, 0.5) 0%, rgba(40, 35, 60, 0.6) 100%)',
                  borderColor: isLight ? 'rgba(157, 141, 241, 0.4)' : 'rgba(157, 141, 241, 0.3)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {images.map((url, i) => (
                    <div key={i} className="relative group">
                      <img 
                        src={url} 
                        alt="" 
                        className="w-full h-20 object-cover rounded-xl"
                        style={{
                          border: isLight ? '2px solid rgba(157, 141, 241, 0.3)' : '2px solid rgba(157, 141, 241, 0.25)',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setImages(images.filter((_, idx) => idx !== i))}
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 opacity-0 group-hover:opacity-100 hover:scale-110"
                        style={{
                          background: 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)',
                          boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)',
                        }}
                      >
                        <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
                <label 
                  htmlFor="ticket-image-upload" 
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm cursor-pointer transition-all duration-300 hover:scale-[1.02]"
                  style={{
                    background: isLight 
                      ? 'linear-gradient(135deg, rgba(96, 80, 186, 0.15) 0%, rgba(157, 141, 241, 0.25) 100%)' 
                      : 'linear-gradient(135deg, rgba(96, 80, 186, 0.25) 0%, rgba(157, 141, 241, 0.35) 100%)',
                    border: isLight ? '1px solid rgba(157, 141, 241, 0.3)' : '1px solid rgba(157, 141, 241, 0.25)',
                    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.15)',
                    color: isLight ? '#6050ba' : '#c4b5fd',
                  }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="font-medium">{uploading ? 'Загрузка...' : 'Добавить ещё'}</span>
                </label>
              </div>
            )}
          </div>
          )}
        </div>

        {/* Buttons - Glass Style */}
        {category && (
        <div className="mt-5 flex gap-3">
          <button 
            type="button" 
            onClick={onCancel} 
            className="sidebar-nav-btn px-5 py-3 rounded-xl transition-all duration-300 text-sm font-semibold hover:scale-[1.02]"
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={creating || uploading}
            className="sidebar-nav-btn active flex-1 px-5 py-3 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm font-bold hover:scale-[1.02]"
          >
            {creating ? (
              <>
                <div 
                  className="animate-spin rounded-full h-4 w-4 border-2"
                  style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#ffffff' }}
                />
                <span>Создание...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                <span>Создать тикет</span>
              </>
            )}
          </button>
        </div>
        )}
      </form>
    </div>
  );
}
