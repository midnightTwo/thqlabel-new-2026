'use client';
import React, { useState, useEffect, useRef } from 'react';
import { fetchWithAuth } from '../../lib/fetchWithAuth';
import { statusColors, statusLabels, categoryLabels, statusColorsLight } from './TicketCard';
import TicketAvatar from '@/components/icons/TicketAvatar';
import { supabase } from '@/lib/supabase/client';

interface TicketViewProps {
  ticket: any;
  onBack: () => void;
  onUpdate: () => void;
  onClose: () => void;
  onUpdateUnreadCount?: () => void;
  isLight?: boolean;
}

export default function TicketView({ ticket, onBack, onUpdate, onClose, onUpdateUnreadCount, isLight }: TicketViewProps) {
  const [messages, setMessages] = useState(ticket.ticket_messages || []);
  const [newMessage, setNewMessage] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [currentStatus, setCurrentStatus] = useState(ticket.status);
  const [adminTyping, setAdminTyping] = useState(false);
  const [adminTypingName, setAdminTypingName] = useState<string>('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [replyToMessage, setReplyToMessage] = useState<any>(null);
  const [showActions, setShowActions] = useState<string | null>(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMessagesLengthRef = useRef(messages.length);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messageRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const lastTapRef = useRef<{ time: number; messageId: string | null }>({ time: 0, messageId: null });

  // Определение мобильного устройства
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Обработчик двойного тапа для мобильных устройств
  const handleDoubleTap = (messageId: string, hasReaction: boolean) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    
    if (lastTapRef.current.messageId === messageId && now - lastTapRef.current.time < DOUBLE_TAP_DELAY) {
      // Двойной тап - ставим/убираем лайк
      toggleReaction(messageId, hasReaction);
      lastTapRef.current = { time: 0, messageId: null };
    } else {
      lastTapRef.current = { time: now, messageId };
    }
  };

  // Получаем текущего пользователя
  useEffect(() => {
    const getUser = async () => {
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);
    };
    getUser();
  }, []);

  // Функция для переключения реакции
  const toggleReaction = async (messageId: string, hasReaction: boolean) => {
    if (!supabase || !currentUserId) return;
    
    try {
      if (hasReaction) {
        // Удаляем реакцию
        await supabase
          .from('ticket_message_reactions')
          .delete()
          .eq('message_id', messageId)
          .eq('user_id', currentUserId);
        
        // Обновляем локально
        setMessages((prev: any[]) => prev.map(msg => {
          if (msg.id === messageId) {
            return {
              ...msg,
              reactions: (msg.reactions || []).filter((r: any) => r.user_id !== currentUserId)
            };
          }
          return msg;
        }));
      } else {
        // Добавляем реакцию
        const { data } = await supabase
          .from('ticket_message_reactions')
          .insert({
            message_id: messageId,
            user_id: currentUserId,
            reaction: '❤️'
          })
          .select()
          .single();
        
        if (data) {
          setMessages((prev: any[]) => prev.map(msg => {
            if (msg.id === messageId) {
              return {
                ...msg,
                reactions: [...(msg.reactions || []), data]
              };
            }
            return msg;
          }));
        }
      }
    } catch (e) {
      console.error('Ошибка реакции:', e);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (messages.length > prevMessagesLengthRef.current) {
      scrollToBottom();
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages]);

  useEffect(() => {
    if (adminTyping) {
      setTimeout(() => scrollToBottom(), 100);
    }
  }, [adminTyping]);

  useEffect(() => {
    const loadMessages = async () => {
      try {
        const response = await fetchWithAuth(`/api/support/tickets/${ticket.id}/messages`);
        const data = await response.json();
        if (response.ok) {
          setMessages(data.messages || []);
        }
      } catch (err) {
        console.error('Error loading messages:', err);
      }
    };

    const loadTicket = async () => {
      try {
        const response = await fetchWithAuth(`/api/support/tickets/${ticket.id}`);
        const data = await response.json();
        if (response.ok && data.ticket) {
          if (data.ticket.status === 'closed' && currentStatus !== 'closed') {
            setCurrentStatus('closed');
            onUpdate();
            setTimeout(() => onBack(), 500);
            return;
          }
          if (data.ticket.status !== currentStatus) {
            setCurrentStatus(data.ticket.status);
            onUpdate();
          }
        }
      } catch (err) {
        console.error('Error loading ticket:', err);
      }
    };

    const markAsRead = async () => {
      try {
        const response = await fetchWithAuth(`/api/support/tickets/${ticket.id}/read`, { method: 'POST' });
        if (response.ok) {
          onUpdateUnreadCount?.();
        }
      } catch (err) {
        console.error('Error marking as read:', err);
      }
    };

    // Отмечаем как прочитанное сразу при открытии
    markAsRead();
    loadMessages();
    loadTicket();
    
    // Интервал загрузки сообщений - каждый раз отмечаем как прочитанное
    const interval = setInterval(() => {
      loadMessages();
      loadTicket();
      markAsRead(); // Отмечаем прочитанным при каждом обновлении
    }, 2000);

    const typingInterval = setInterval(async () => {
      try {
        const response = await fetchWithAuth(`/api/support/tickets/${ticket.id}/typing`);
        const data = await response.json();
        if (response.ok && data.isTyping && data.isAdmin && data.username) {
          setAdminTyping(true);
          setAdminTypingName(data.username);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => {
            setAdminTyping(false);
            setAdminTypingName('');
          }, 3000);
        } else {
          setAdminTyping(false);
          setAdminTypingName('');
        }
      } catch (err) {
        console.error('Error checking typing status:', err);
      }
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(typingInterval);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    };
  }, [ticket.id, onUpdateUnreadCount, onUpdate, onBack, currentStatus]);

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
        const response = await fetchWithAuth('/api/support/upload', { method: 'POST', body: formData });
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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() && images.length === 0) return;

    setSending(true);
    setError('');

    const replyId = replyToMessage?.id || null;

    try {
      const response = await fetchWithAuth(`/api/support/tickets/${ticket.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: newMessage, 
          images,
          reply_to_message_id: replyId
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessages([...messages, data.message]);
        setNewMessage('');
        setImages([]);
        setReplyToMessage(null);
        onUpdate();
      } else {
        setError(data.error || 'Ошибка отправки сообщения');
      }
    } catch {
      setError('Ошибка соединения с сервером');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header - Glass Style */}
      <div 
        className="p-3 border-b"
        style={{
          background: isLight 
            ? 'linear-gradient(180deg, rgba(255, 255, 255, 0.6) 0%, rgba(245, 240, 255, 0.4) 100%)' 
            : 'linear-gradient(180deg, rgba(10, 10, 12, 0.96) 0%, rgba(20, 18, 35, 0.8) 100%)',
          borderColor: isLight ? 'rgba(157, 141, 241, 0.25)' : 'rgba(157, 141, 241, 0.15)',
          boxShadow: isLight 
            ? '0 4px 16px rgba(96, 80, 186, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.6)' 
            : 'inset 0 0 0 1px rgba(255, 255, 255, 0.08), inset 0 2px 4px rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(40px) saturate(180%)',
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <button
            onClick={onBack}
            className="sidebar-nav-btn px-4 py-2 flex items-center gap-2 text-sm rounded-xl transition-all duration-300 group flex-shrink-0 hover:scale-[1.02]"
            title="Назад к списку тикетов"
          >
            <svg className="w-4 h-4 sidebar-nav-icon group-hover:-translate-x-0.5 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="font-semibold">Назад</span>
          </button>
          
          <div className="flex-1 min-w-0 text-right">
            <h3 
              className="text-sm font-bold mb-1.5 truncate"
              style={{ color: isLight ? '#1a1535' : '#ffffff' }}
            >
              {ticket.subject}
            </h3>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <span 
                className="text-[10px] px-2.5 py-1 rounded-full font-medium"
                style={{
                  background: ticket.status === 'open' 
                    ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(74, 222, 128, 0.3) 100%)'
                    : ticket.status === 'in_progress'
                    ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(96, 165, 250, 0.3) 100%)'
                    : ticket.status === 'pending'
                    ? 'linear-gradient(135deg, rgba(234, 179, 8, 0.2) 0%, rgba(250, 204, 21, 0.3) 100%)'
                    : 'linear-gradient(135deg, rgba(113, 113, 122, 0.2) 0%, rgba(161, 161, 170, 0.3) 100%)',
                  border: ticket.status === 'open' 
                    ? '1px solid rgba(34, 197, 94, 0.35)'
                    : ticket.status === 'in_progress'
                    ? '1px solid rgba(59, 130, 246, 0.35)'
                    : ticket.status === 'pending'
                    ? '1px solid rgba(234, 179, 8, 0.35)'
                    : '1px solid rgba(113, 113, 122, 0.35)',
                  color: ticket.status === 'open' 
                    ? isLight ? '#15803d' : '#4ade80'
                    : ticket.status === 'in_progress'
                    ? isLight ? '#1d4ed8' : '#60a5fa'
                    : ticket.status === 'pending'
                    ? isLight ? '#a16207' : '#facc15'
                    : isLight ? '#52525b' : '#a1a1aa',
                  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.15)',
                }}
              >
                {statusLabels[ticket.status as keyof typeof statusLabels] || ticket.status}
              </span>
              
              {ticket.category && (
                <span 
                  className="text-[10px] px-2.5 py-1 rounded-full font-medium"
                  style={{
                    background: isLight 
                      ? 'linear-gradient(135deg, rgba(96, 80, 186, 0.15) 0%, rgba(157, 141, 241, 0.25) 100%)' 
                      : 'linear-gradient(135deg, rgba(96, 80, 186, 0.25) 0%, rgba(157, 141, 241, 0.35) 100%)',
                    border: isLight ? '1px solid rgba(157, 141, 241, 0.3)' : '1px solid rgba(157, 141, 241, 0.25)',
                    color: isLight ? '#6050ba' : '#c4b5fd',
                    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.15)',
                  }}
                >
                  {categoryLabels[ticket.category] || ticket.category}
                </span>
              )}
              <span className={`text-[10px] font-mono ${isLight ? 'text-gray-400' : 'text-zinc-500'}`}>#{ticket.id.slice(0, 8)}</span>
            </div>
          </div>
        </div>
        
        {/* Карточка транзакции в шапке */}
        {ticket?.transaction_id && ticket?.transaction && (
          <div 
            className="mt-3 p-2.5 rounded-xl"
            style={{
              background: isLight 
                ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(52, 211, 153, 0.12) 100%)' 
                : 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(52, 211, 153, 0.18) 100%)',
              border: isLight ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(52, 211, 153, 0.25)',
            }}
          >
            <div className="flex items-center gap-2.5">
              <div 
                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{
                  background: ['deposit', 'payout', 'bonus', 'refund', 'unfreeze'].includes(ticket.transaction.type)
                    ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                  border: ['deposit', 'payout', 'bonus', 'refund', 'unfreeze'].includes(ticket.transaction.type)
                    ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(239, 68, 68, 0.35)',
                }}
              >
                <svg 
                  className="w-4.5 h-4.5"
                  style={{
                    color: ['deposit', 'payout', 'bonus', 'refund', 'unfreeze'].includes(ticket.transaction.type)
                      ? '#10b981' : '#ef4444'
                  }}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span 
                    className="text-sm font-bold"
                    style={{
                      color: ['deposit', 'payout', 'bonus', 'refund', 'unfreeze'].includes(ticket.transaction.type)
                        ? '#10b981' : '#ef4444'
                    }}
                  >
                    {['deposit', 'payout', 'bonus', 'refund', 'unfreeze'].includes(ticket.transaction.type) ? '+' : '-'}
                    {Math.abs(ticket.transaction.amount).toLocaleString('ru-RU')} ₽
                  </span>
                  <span 
                    className="text-[9px] px-1.5 py-0.5 rounded font-medium"
                    style={{
                      background: ticket.transaction.type === 'deposit' ? 'rgba(59, 130, 246, 0.15)' :
                        ticket.transaction.type === 'withdrawal' ? 'rgba(239, 68, 68, 0.15)' :
                        ticket.transaction.type === 'payout' ? 'rgba(16, 185, 129, 0.15)' :
                        ticket.transaction.type === 'freeze' ? 'rgba(96, 165, 250, 0.15)' :
                        ticket.transaction.type === 'unfreeze' ? 'rgba(52, 211, 153, 0.15)' :
                        'rgba(167, 139, 250, 0.15)',
                      color: ticket.transaction.type === 'deposit' ? '#3b82f6' :
                        ticket.transaction.type === 'withdrawal' ? '#ef4444' :
                        ticket.transaction.type === 'payout' ? '#10b981' :
                        ticket.transaction.type === 'freeze' ? '#60a5fa' :
                        ticket.transaction.type === 'unfreeze' ? '#34d399' :
                        '#a78bfa',
                      border: `1px solid ${
                        ticket.transaction.type === 'deposit' ? 'rgba(59, 130, 246, 0.3)' :
                        ticket.transaction.type === 'withdrawal' ? 'rgba(239, 68, 68, 0.3)' :
                        ticket.transaction.type === 'payout' ? 'rgba(16, 185, 129, 0.3)' :
                        ticket.transaction.type === 'freeze' ? 'rgba(96, 165, 250, 0.3)' :
                        ticket.transaction.type === 'unfreeze' ? 'rgba(52, 211, 153, 0.3)' :
                        'rgba(167, 139, 250, 0.3)'
                      }`
                    }}
                  >
                    {ticket.transaction.type === 'deposit' && 'Пополнение'}
                    {ticket.transaction.type === 'withdrawal' && 'Вывод'}
                    {ticket.transaction.type === 'payout' && 'Роялти'}
                    {ticket.transaction.type === 'bonus' && 'Бонус'}
                    {ticket.transaction.type === 'refund' && 'Возврат'}
                    {ticket.transaction.type === 'freeze' && 'Заморозка'}
                    {ticket.transaction.type === 'unfreeze' && 'Разморозка'}
                    {ticket.transaction.type === 'adjustment' && 'Корректировка'}
                    {ticket.transaction.type === 'purchase' && 'Покупка'}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-[9px] font-mono ${isLight ? 'text-gray-500' : 'text-zinc-500'}`}>
                    #{ticket.transaction.id?.slice(0, 8)}
                  </span>
                  <span className={`text-[9px] ${isLight ? 'text-gray-400' : 'text-zinc-600'}`}>•</span>
                  <span className={`text-[9px] ${isLight ? 'text-gray-500' : 'text-zinc-500'}`}>
                    {new Date(ticket.transaction.created_at).toLocaleDateString('ru-RU')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Карточка релиза в шапке */}
        {ticket?.release_id && ticket?.release && (
          <div 
            className="mt-3 p-2.5 rounded-xl"
            style={{
              background: isLight 
                ? 'linear-gradient(135deg, rgba(96, 80, 186, 0.08) 0%, rgba(157, 141, 241, 0.12) 100%)' 
                : 'linear-gradient(135deg, rgba(96, 80, 186, 0.12) 0%, rgba(157, 141, 241, 0.18) 100%)',
              border: isLight ? '1px solid rgba(157, 141, 241, 0.25)' : '1px solid rgba(157, 141, 241, 0.25)',
            }}
          >
            <div className="flex items-center gap-2.5">
              {ticket.release.artwork_url ? (
                <img 
                  src={ticket.release.artwork_url} 
                  alt={ticket.release.title} 
                  className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                  style={{ border: '1px solid rgba(157, 141, 241, 0.3)' }}
                />
              ) : (
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, rgba(96, 80, 186, 0.4) 0%, rgba(157, 141, 241, 0.5) 100%)',
                    border: '1px solid rgba(157, 141, 241, 0.35)',
                  }}
                >
                  <svg className="w-5 h-5 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <div className={`text-sm font-medium truncate ${isLight ? 'text-gray-800' : 'text-white'}`}>
                    {ticket.release.title}
                  </div>
                  {(ticket.release as any).release_code && (
                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded flex-shrink-0 ${isLight ? 'bg-purple-100 text-purple-600' : 'bg-purple-500/15 text-purple-300'}`}>
                      {(ticket.release as any).release_code}
                    </span>
                  )}
                </div>
                <div className={`text-xs truncate ${isLight ? 'text-purple-600' : 'text-purple-400'}`}>
                  {ticket.release.artist}
                </div>
              </div>
              {ticket.release.status && (
                <span 
                  className="text-[9px] px-1.5 py-0.5 rounded flex-shrink-0"
                  style={{
                    background: ticket.release.status === 'pending' ? 'rgba(251, 191, 36, 0.15)' :
                      ticket.release.status === 'approved' ? 'rgba(52, 211, 153, 0.15)' :
                      ticket.release.status === 'rejected' ? 'rgba(248, 113, 113, 0.15)' :
                      'rgba(157, 141, 241, 0.15)',
                    color: ticket.release.status === 'pending' ? '#fbbf24' :
                      ticket.release.status === 'approved' ? '#34d399' :
                      ticket.release.status === 'rejected' ? '#f87171' :
                      '#9d8df1',
                    border: `1px solid ${
                      ticket.release.status === 'pending' ? 'rgba(251, 191, 36, 0.3)' :
                      ticket.release.status === 'approved' ? 'rgba(52, 211, 153, 0.3)' :
                      ticket.release.status === 'rejected' ? 'rgba(248, 113, 113, 0.3)' :
                      'rgba(157, 141, 241, 0.3)'
                    }`
                  }}
                >
                  {ticket.release.status === 'pending' && 'На модерации'}
                  {ticket.release.status === 'approved' && 'Одобрен'}
                  {ticket.release.status === 'rejected' && 'Отклонён'}
                  {ticket.release.status === 'published' && 'Опубликован'}
                  {ticket.release.status === 'distributed' && 'На дистрибьюции'}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-3">
        {messages.map((msg: any, idx: number) => {
          const isFromAdmin = msg.is_admin === true;
          // Системное сообщение (автоответ) - специальный ID
          const isSystemMessage = msg.sender_id === '00000000-0000-0000-0000-000000000000';
          
          const displayName = isSystemMessage 
            ? 'THQ Support' 
            : (msg.sender_nickname || msg.sender_username || msg.sender_email?.split('@')[0] || (isFromAdmin ? 'Поддержка' : 'Пользователь'));
          const displayAvatar = msg.sender_avatar;
          const displayEmail = msg.sender_email;
          
          // Реакции
          const hasUserReaction = msg.reactions?.some((r: any) => r.user_id === currentUserId);
          const reactionsCount = msg.reactions?.length || 0;
          
          return (
            <div 
              key={msg.id} 
              className={`flex ${isFromAdmin ? 'justify-start' : 'justify-end'} group`}
              onMouseEnter={() => setShowActions(msg.id)}
              onMouseLeave={() => setShowActions(null)}
            >
              <div className={`max-w-[85%] ${isFromAdmin ? '' : 'flex flex-col items-end'} relative`}>
                {/* Невидимая область для плавного перехода к кнопке */}
                <div className={`absolute ${isFromAdmin ? 'left-full' : 'right-full'} top-0 w-12 h-full`} />
                
                {/* Кнопка ответить при наведении */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setReplyToMessage(msg);
                    setHighlightedMessageId(msg.id);
                    
                    // Прокрутка к сообщению
                    setTimeout(() => {
                      messageRefs.current[msg.id]?.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'center' 
                      });
                    }, 100);
                    
                    // Убираем подсветку через 2 секунды
                    setTimeout(() => {
                      setHighlightedMessageId(null);
                    }, 2000);
                  }}
                  className={`absolute ${isFromAdmin ? 'left-full ml-2' : 'right-full mr-2'} top-8 p-1.5 rounded-lg transition-opacity duration-200 ${
                    showActions === msg.id ? 'opacity-100' : 'opacity-0 pointer-events-none'
                  } ${isLight ? 'bg-white hover:bg-gray-100 border border-gray-300' : 'bg-zinc-800/90 hover:bg-zinc-700 border border-zinc-600'}`}
                  style={{ zIndex: 10 }}
                  title="Ответить"
                >
                  <svg className={`w-3.5 h-3.5 ${isLight ? 'text-gray-500' : 'text-zinc-400'} ${!isFromAdmin ? 'transform scale-x-[-1]' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                </button>
                
                <div className={`flex items-center gap-2 mb-1 ${isFromAdmin ? '' : 'flex-row-reverse'}`}>
                  <TicketAvatar
                    src={displayAvatar}
                    name={displayName}
                    email={displayEmail}
                    size="xs"
                    isAdmin={isFromAdmin}
                  />
                  <div className={`flex flex-col ${isFromAdmin ? 'items-start' : 'items-end'}`}>
                    <span className={`text-xs font-medium ${
                      isFromAdmin 
                        ? (isLight ? 'text-green-600' : 'bg-gradient-to-r from-green-400 to-emerald-400 text-transparent bg-clip-text')
                        : (isLight ? 'text-blue-600' : 'text-blue-300')
                    }`}>
                      {displayName}
                    </span>
                  </div>
                </div>

                <div 
                  ref={(el) => { 
                    messageRefs.current[msg.id] = el;
                  }}
                  className={`px-4 py-3 rounded-2xl transition-all duration-300 cursor-pointer ${highlightedMessageId === msg.id ? 'ring-4 ring-amber-400 animate-pulse' : ''}`}
                  style={{
                    background: isFromAdmin
                      ? isLight 
                        ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(74, 222, 128, 0.25) 100%)'
                        : 'linear-gradient(135deg, rgba(34, 120, 80, 0.35) 0%, rgba(34, 160, 94, 0.45) 100%)'
                      : isLight
                        ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(96, 165, 250, 0.25) 100%)'
                        : 'linear-gradient(135deg, rgba(59, 100, 180, 0.35) 0%, rgba(80, 130, 200, 0.45) 100%)',
                    border: isFromAdmin
                      ? isLight ? '1px solid rgba(34, 197, 94, 0.35)' : '1px solid rgba(34, 197, 94, 0.3)'
                      : isLight ? '1px solid rgba(59, 130, 246, 0.35)' : '1px solid rgba(59, 130, 246, 0.3)',
                    boxShadow: highlightedMessageId === msg.id 
                      ? '0 0 30px rgba(251,191,36,0.6), 0 0 60px rgba(251,191,36,0.3)' 
                      : isFromAdmin 
                        ? '0 4px 20px rgba(34, 197, 94, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.15)' 
                        : '0 4px 20px rgba(59, 130, 246, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
                    backdropFilter: 'blur(15px) saturate(150%)',
                    ...(highlightedMessageId === msg.id ? { background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.3) 0%, rgba(251, 191, 36, 0.4) 100%)', borderColor: 'rgba(251, 191, 36, 0.6)' } : {}),
                  }}
                  onDoubleClick={() => toggleReaction(msg.id, hasUserReaction)}
                  onTouchEnd={(e) => {
                    // Двойной тап только на мобильных
                    if (!isMobile) return;
                    // Не обрабатываем тап на интерактивных элементах
                    if ((e.target as HTMLElement).closest('[title="Перейти к сообщению"]')) return;
                    if ((e.target as HTMLElement).tagName === 'A') return;
                    if ((e.target as HTMLElement).tagName === 'BUTTON') return;
                    
                    handleDoubleTap(msg.id, hasUserReaction);
                  }}
                  onClick={(e) => {
                    // Проверяем что клик не на превью ответа или другой интерактивный элемент
                    if ((e.target as HTMLElement).closest('[title="Перейти к сообщению"]')) return;
                    if ((e.target as HTMLElement).tagName === 'A') return;
                    
                    setHighlightedMessageId(msg.id);
                    
                    setTimeout(() => {
                      setHighlightedMessageId(null);
                    }, 2000);
                  }}
                >
                  {/* Превью ответа на сообщение */}
                  {msg.reply_to_message && (
                    <div 
                      className={`mb-2 p-2 border-l-2 rounded cursor-pointer transition-colors ${
                        isLight 
                          ? 'bg-gray-200/80 border-blue-400/50 hover:bg-gray-300/80' 
                          : 'bg-black/30 border-blue-400/50 hover:bg-black/40'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        const replyMsgId = msg.reply_to_message.id;
                        
                        setHighlightedMessageId(replyMsgId);
                        
                        // Прокрутка к исходному сообщению
                        setTimeout(() => {
                          const element = messageRefs.current[replyMsgId];
                          if (element) {
                            element.scrollIntoView({ 
                              behavior: 'smooth', 
                              block: 'center' 
                            });
                          }
                        }, 100);
                        
                        // Убираем подсветку через 2 секунды
                        setTimeout(() => {
                          setHighlightedMessageId(null);
                        }, 2000);
                      }}
                      title="Перейти к сообщению"
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <svg className="w-3 h-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                        <span className={`text-xs font-medium ${isLight ? 'text-blue-600' : 'text-blue-400'}`}>
                          {msg.reply_to_message.sender_nickname || msg.reply_to_message.sender_username || 'Пользователь'}
                        </span>
                      </div>
                      <p className={`text-xs truncate ${isLight ? 'text-gray-600' : 'text-zinc-400'}`}>{msg.reply_to_message.message}</p>
                    </div>
                  )}
                  
                  {msg.message && <p className={`text-sm whitespace-pre-wrap break-words ${isLight ? 'text-gray-800' : 'text-white'}`}>{msg.message}</p>}

                  {msg.images && msg.images.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {msg.images.map((url: string, i: number) => (
                        <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                          <img src={url} alt="" className="max-w-[200px] rounded cursor-pointer hover:opacity-80 transition-opacity" />
                        </a>
                      ))}
                    </div>
                  )}

                  <div className={`mt-1 text-[10px] ${isLight ? 'text-gray-500' : 'text-zinc-500'}`}>
                    {new Date(msg.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                
                {/* Кнопка реакции - под сообщением */}
                <div className={`flex items-center gap-1 mt-1 ${isFromAdmin ? 'justify-start' : 'justify-end'}`}>
                  <div className="relative group/reaction">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleReaction(msg.id, hasUserReaction);
                      }}
                      className={`h-5 px-1.5 rounded-full flex items-center gap-1 transition-all text-[10px] ${
                        reactionsCount > 0
                          ? hasUserReaction
                            ? 'bg-pink-500/30 border border-pink-400/40'
                            : (isLight ? 'bg-gray-200 border border-gray-400' : 'bg-zinc-700/50 border border-zinc-500/40')
                          : (isLight 
                              ? 'bg-gray-100 border border-gray-300 opacity-0 group-hover:opacity-100 hover:bg-pink-100 hover:border-pink-300' 
                              : 'bg-zinc-800/60 border border-zinc-600/40 opacity-0 group-hover:opacity-100 hover:bg-pink-500/20 hover:border-pink-400/40')
                      }`}
                    >
                      <span>{hasUserReaction ? '❤️' : '🤍'}</span>
                      {reactionsCount > 0 && (
                        <span className={`font-medium ${hasUserReaction ? 'text-pink-300' : (isLight ? 'text-gray-600' : 'text-zinc-400')}`}>{reactionsCount}</span>
                      )}
                    </button>
                    
                    {/* Тултип с именами кто поставил лайк */}
                    {reactionsCount > 0 && (
                      <div className={`absolute ${isFromAdmin ? 'left-0' : 'right-0'} bottom-full mb-1 opacity-0 group-hover/reaction:opacity-100 transition-opacity pointer-events-none z-50`}>
                        <div className={`backdrop-blur-xl border rounded-lg px-2 py-1.5 shadow-2xl max-w-[180px] ${
                          isLight ? 'bg-white/95 border-gray-300' : 'bg-zinc-900/95 border-white/20'
                        }`}>
                          <div className={`text-[9px] font-semibold mb-1 ${isLight ? 'text-gray-500' : 'text-zinc-400'}`}>Понравилось:</div>
                          <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
                            {msg.reactions?.map((reaction: any, idx: number) => {
                              const isCurrentUser = reaction.user_id === currentUserId;
                              return (
                                <div key={idx} className={`flex items-center gap-1.5 ${isCurrentUser ? 'text-pink-300' : (isLight ? 'text-gray-700' : 'text-zinc-300')}`}>
                                  {reaction.user?.avatar ? (
                                    <div className="w-3 h-3 rounded-full bg-cover bg-center flex-shrink-0" style={{ backgroundImage: `url(${reaction.user.avatar})` }} />
                                  ) : (
                                    <div className={`w-3 h-3 rounded-full flex items-center justify-center flex-shrink-0 ${isCurrentUser ? 'bg-pink-500/30' : (isLight ? 'bg-gray-300' : 'bg-zinc-700')}`}>
                                      <span className="text-[6px]">{reaction.user?.nickname?.charAt(0) || '?'}</span>
                                    </div>
                                  )}
                                  <span className="text-[10px] truncate">
                                    {reaction.user?.nickname || 'Пользователь'} {isCurrentUser && '(вы)'}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />

        {adminTyping && (
          <div className="flex justify-start px-4 py-1 animate-fade-in">
            <div 
              className="rounded-2xl px-4 py-2"
              style={{
                background: isLight 
                  ? 'linear-gradient(135deg, rgba(200, 200, 210, 0.5) 0%, rgba(180, 180, 190, 0.4) 100%)' 
                  : 'linear-gradient(135deg, rgba(20, 18, 35, 0.6) 0%, rgba(40, 35, 60, 0.7) 100%)',
                border: isLight ? '1px solid rgba(180, 180, 190, 0.4)' : '1px solid rgba(157, 141, 241, 0.2)',
                boxShadow: isLight 
                  ? 'inset 0 1px 0 rgba(255, 255, 255, 0.5)' 
                  : 'inset 0 1px 0 rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium ${isLight ? 'text-gray-700' : 'text-zinc-300'}`}>{adminTypingName}</span>
                <span className={`text-[10px] ${isLight ? 'text-gray-500' : 'text-zinc-500'}`}>печатает</span>
                <div className="flex gap-0.5">
                  <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ animationDelay: '0ms', background: isLight ? '#6050ba' : '#9d8df1' }}></span>
                  <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ animationDelay: '150ms', background: isLight ? '#7060ca' : '#c4b5fd' }}></span>
                  <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ animationDelay: '300ms', background: isLight ? '#8b7dd8' : '#ddd6fe' }}></span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input - Glass Style */}
      {ticket.status !== 'closed' && (
        <div 
          className="p-3 border-t mt-auto flex-shrink-0"
          style={{
            background: isLight 
              ? 'linear-gradient(180deg, rgba(245, 240, 255, 0.4) 0%, rgba(255, 255, 255, 0.6) 100%)' 
              : 'linear-gradient(180deg, rgba(20, 18, 35, 0.6) 0%, rgba(40, 35, 60, 0.8) 100%)',
            borderColor: isLight ? 'rgba(157, 141, 241, 0.25)' : 'rgba(157, 141, 241, 0.15)',
            boxShadow: isLight 
              ? '0 -4px 16px rgba(96, 80, 186, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.6)' 
              : '0 -4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <form onSubmit={handleSendMessage} className="space-y-2">
            {/* Превью ответа - Glass Style */}
            {replyToMessage && (
              <div 
                className="p-3 rounded-xl"
                style={{
                  background: isLight 
                    ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(96, 165, 250, 0.15) 100%)' 
                    : 'linear-gradient(135deg, rgba(59, 100, 180, 0.2) 0%, rgba(80, 130, 200, 0.3) 100%)',
                  border: isLight ? '1px solid rgba(59, 130, 246, 0.25)' : '1px solid rgba(59, 130, 246, 0.2)',
                  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <svg className={`w-3 h-3 flex-shrink-0 ${isLight ? 'text-blue-600' : 'text-blue-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                      </svg>
                      <span className={`text-xs font-semibold ${isLight ? 'text-blue-600' : 'text-blue-400'}`}>
                        Ответ на {replyToMessage.sender_nickname || replyToMessage.sender_username || 'сообщение'}
                      </span>
                    </div>
                    <p className={`text-xs truncate ${isLight ? 'text-gray-600' : 'text-zinc-400'}`}>{replyToMessage.message}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReplyToMessage(null)}
                    className="p-1.5 rounded-lg transition-all duration-200 flex-shrink-0 hover:scale-105"
                    style={{
                      background: isLight 
                        ? 'linear-gradient(135deg, rgba(200, 200, 210, 0.4) 0%, rgba(180, 180, 190, 0.3) 100%)' 
                        : 'linear-gradient(135deg, rgba(80, 70, 100, 0.4) 0%, rgba(60, 50, 80, 0.3) 100%)',
                      border: isLight ? '1px solid rgba(180, 180, 190, 0.3)' : '1px solid rgba(100, 90, 120, 0.2)',
                    }}
                  >
                    <svg className={`w-4 h-4 ${isLight ? 'text-gray-500' : 'text-zinc-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
            
            <textarea
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                if (e.target.value.trim()) {
                  fetchWithAuth(`/api/support/tickets/${ticket.id}/typing`, {
                    method: 'POST',
                    body: JSON.stringify({ isTyping: true, isAdmin: false })
                  }).catch(err => console.error('Error sending typing status:', err));
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (newMessage.trim() || images.length > 0) {
                    const form = e.currentTarget.closest('form');
                    if (form) form.requestSubmit();
                  }
                }
              }}
              placeholder="Отправить сообщение"
              className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none resize-none transition-all duration-300"
              style={{
                background: isLight 
                  ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(245, 240, 255, 0.6) 100%)' 
                  : 'linear-gradient(135deg, rgba(20, 18, 35, 0.7) 0%, rgba(40, 35, 60, 0.8) 100%)',
                border: isLight ? '1px solid rgba(157, 141, 241, 0.3)' : '1px solid rgba(157, 141, 241, 0.25)',
                boxShadow: isLight 
                  ? 'inset 0 2px 4px rgba(96, 80, 186, 0.1), 0 1px 0 rgba(255, 255, 255, 0.5)' 
                  : 'inset 0 2px 4px rgba(0, 0, 0, 0.2), 0 1px 0 rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
                color: isLight ? '#1a1535' : '#ffffff',
                minHeight: '38px',
                maxHeight: '80px',
              }}
              rows={1}
            />

            <div className="flex items-center gap-2">
              <label className="flex-1 cursor-pointer">
                <input type="file" accept="image/*" multiple onChange={handleImageUpload} disabled={uploading} className="hidden" />
                <div 
                  className="sidebar-nav-btn px-3 py-2 rounded-lg text-sm transition-all duration-300 flex items-center gap-1.5 hover:scale-[1.01]"
                >
                  <svg className="w-4 h-4 sidebar-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="font-medium">{uploading ? 'Загрузка...' : 'Прикрепить'}</span>
                </div>
              </label>

              <button
                type="submit"
                disabled={sending || uploading || (newMessage.trim() === '' && images.length === 0)}
                className="sidebar-nav-btn active px-4 py-2 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 font-semibold hover:scale-[1.02]"
              >
                {sending ? (
                  <>
                    <div 
                      className="animate-spin rounded-full h-4 w-4 border-2"
                      style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#ffffff' }}
                    />
                    <span>Отправка...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    <span>Отправить</span>
                  </>
                )}
              </button>
            </div>

            {images.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {images.map((url, i) => (
                  <div key={i} className="relative group">
                    <img 
                      src={url} 
                      alt="" 
                      className="w-20 h-20 object-cover rounded-xl"
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
            )}

            {error && (
              <div 
                className="p-3 rounded-xl text-xs"
                style={{
                  background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(248, 113, 113, 0.2) 100%)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  color: '#fca5a5',
                }}
              >
                {error}
              </div>
            )}
          </form>
        </div>
      )}
    </div>
  );
}
