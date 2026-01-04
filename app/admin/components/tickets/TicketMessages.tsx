'use client';

import React, { useRef, useState, useEffect } from 'react';
import { TicketMessage } from './types';
import { fetchWithAuth } from '@/app/cabinet/lib/fetchWithAuth';
import { supabase } from '@/lib/supabase/client';

interface TicketMessagesProps {
  messages: TicketMessage[];
  userTyping: boolean;
  userTypingName: string;
  onSendMessage: (message: string, images: string[], replyToId?: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  sending: boolean;
  ticketId: string;
}

export default function TicketMessages({
  messages,
  userTyping,
  userTypingName,
  onSendMessage,
  onDeleteMessage,
  sending,
  ticketId
}: TicketMessagesProps) {
  const [replyMessage, setReplyMessage] = useState('');
  const [replyImages, setReplyImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [replyToMessage, setReplyToMessage] = useState<TicketMessage | null>(null);
  const [localMessages, setLocalMessages] = useState<TicketMessage[]>(messages);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Получаем текущего админа
  useEffect(() => {
    const getUser = async () => {
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);
    };
    getUser();
  }, []);

  // Синхронизируем локальные сообщения с пропсами
  useEffect(() => {
    setLocalMessages(messages);
  }, [messages]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setUploading(true);
    setError('');
    const MAX_FILE_SIZE = 10 * 1024 * 1024;

    try {
      const uploadedUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        if (!file.type.startsWith('image/')) {
          setError(`Файл "${file.name}" не является изображением.`);
          continue;
        }

        if (file.size > MAX_FILE_SIZE) {
          setError(`Файл "${file.name}" слишком большой. Максимум 10 МБ.`);
          continue;
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
          setError(data.error || 'Ошибка загрузки');
        }
      }

      setReplyImages([...replyImages, ...uploadedUrls]);
    } catch (err) {
      setError('Ошибка загрузки изображений');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim()) return;
    onSendMessage(replyMessage, replyImages, replyToMessage?.id);
    setReplyMessage('');
    setReplyImages([]);
    setReplyToMessage(null);
  };

  // Функция для переключения реакции (лайка)
  const toggleReaction = async (messageId: string) => {
    if (!currentUserId) return;
    
    try {
      const response = await fetchWithAuth(`/api/admin/tickets/${ticketId}/messages/${messageId}/reactions`, {
        method: 'POST'
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Обновляем локальное состояние
        setLocalMessages(prev => prev.map(msg => {
          if (msg.id === messageId) {
            const currentReactions = msg.reactions || [];
            
            if (data.removed) {
              // Удаляем реакцию
              return {
                ...msg,
                reactions: currentReactions.filter(r => r.user_id !== currentUserId)
              };
            } else {
              // Добавляем реакцию
              return {
                ...msg,
                reactions: [...currentReactions, data.reaction]
              };
            }
          }
          return msg;
        }));
      }
    } catch (err) {
      console.error('Error toggling reaction:', err);
    }
  };

  return (
    <>
      {/* Область сообщений */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-900"
      >
        {localMessages.map((msg) => (
          <MessageBubble 
            key={msg.id} 
            message={msg} 
            currentUserId={currentUserId}
            onToggleReaction={toggleReaction}
            onReply={setReplyToMessage}
            onDeleteMessage={onDeleteMessage}
          />
        ))}
        
        {/* Индикатор печати */}
        {userTyping && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-xs">
                {userTypingName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="bg-zinc-800/80 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[70%]">
              <p className="text-xs text-blue-400 font-medium mb-1">{userTypingName}</p>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Форма ответа */}
      <div className="p-4 border-t border-zinc-800">
        {error && (
          <div className="mb-3 p-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs">
            {error}
          </div>
        )}

        {/* Превью ответа на сообщение */}
        {replyToMessage && (
          <div className="mb-3 p-2 bg-zinc-800/50 border border-zinc-700 rounded-lg">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <svg className="w-3 h-3 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                  <span className="text-xs font-medium text-blue-400">
                    Ответ на {replyToMessage.sender_nickname || replyToMessage.sender_username || 'сообщение'}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 truncate">{replyToMessage.message}</p>
              </div>
              <button
                type="button"
                onClick={() => setReplyToMessage(null)}
                className="p-1 hover:bg-zinc-700 rounded transition-colors flex-shrink-0"
              >
                <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Превью загруженных изображений */}
        {replyImages.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {replyImages.map((url, idx) => (
              <div key={idx} className="relative group">
                <img src={url} alt="" className="w-16 h-16 object-cover rounded-lg border border-zinc-700" />
                <button
                  type="button"
                  onClick={() => setReplyImages(replyImages.filter((_, i) => i !== idx))}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="flex-1 flex gap-2">
            <input
              type="text"
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              placeholder="Введите ответ..."
              className="flex-1 px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
            />
            
            {/* Кнопка загрузки изображений */}
            <label className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg cursor-pointer hover:bg-zinc-700 transition-colors flex items-center">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
                disabled={uploading}
              />
              {uploading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              )}
            </label>
          </div>
          
          <button
            type="submit"
            disabled={sending || !replyMessage.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:cursor-not-allowed rounded-lg text-sm font-medium text-white transition-colors"
          >
            {sending ? 'Отправка...' : 'Отправить'}
          </button>
        </form>
      </div>
    </>
  );
}

// Компонент сообщения
function MessageBubble({ 
  message, 
  currentUserId,
  onToggl,
  onDeleteMessage
}: { 
  message: TicketMessage;
  currentUserId: string | null;
  onToggleReaction: (messageId: string) => void;
  onReply: (message: TicketMessage) => void;
  onDeleteMessage?: (messageId: stringring) => void;
  onReply: (message: TicketMessage) => void;
}) {
  const isAdmin = message.is_admin;
  const [showActions, setShowActions] = useState(false);
  
  const hasUserReaction = message.reactions?.some(r => r.user_id === currentUserId);
  const reactionsCount = message.reactions?.length || 0;

  return (
    <div 
      className={`flex items-start gap-3 ${isAdmin ? 'flex-row-reverse' : ''} group`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Аватар */}
      {message.sender_avatar ? (
        <div 
          className="w-8 h-8 rounded-full bg-cover bg-center flex-shrink-0 border border-zinc-700"
          style={{ backgroundImage: `url(${message.sender_avatar})` }}
        />
      ) : (
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          isAdmin 
            ? 'bg-gradient-to-br from-blue-600 to-blue-700'
            : 'bg-gradient-to-br from-blue-500 to-indigo-600'
        }`}>
          <span className="text-white font-bold text-xs">
            {(message.sender_nickname || message.sender_username || message.sender_email || (isAdmin ? 'A' : 'U')).charAt(0).toUpperCase()}
          </span>
        </div>
      )}

      {/* Сообщение */}
      <div className={`max-w-[70%] ${isAdmin ? 'items-end' : 'items-start'} relative`}>
        {/* Кнопки действий при наведении */}
        <div 
          className={`absolute ${isAdmin ? 'right-full mr-2' : 'left-full ml-2'} top-0 flex gap-1 transition-opacity ${
            showActions ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* Кнопка ответить */}
          <button
            onClick={() => onReply(message)}
            className="p-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 rounded-lg transition-colors"
            title="Ответить"
          >
            <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </button>
          
          {/* Кнопка лайк */}
          <button
            onClick={() => onToggleReaction(message.id)}
            className={`p-1.5 rounded-lg transition-colors border ${
              hasUserReaction
                ? 'bg-pink-500/20 border-pink-400/40 hover:bg-pink-500/30'
                : 'bg-zinc-800 hover:bg-zinc-700 border-zinc-600'
            }`}
            title="Лайк"
          >
            <svg 
              className={`w-3.5 h-3.5 ${hasUserReaction ? 'text-pink-400' : 'text-zinc-400'}`}
              fill={hasUserReaction ? 'currentColor' : 'none'}
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
              />
            </svg>
          </button>
          
          {/* Кнопка удалить */}
          {onDeleteMessage && (
            <button
              onClick={() => {
                if (confirm('Удалить это сообщение?')) {
                  onDeleteMessage(message.id);
                }
              }}
              className="p-1.5 bg-red-900/30 hover:bg-red-800/50 border border-red-600/50 rounded-lg transition-colors"
              title="Удалить"
            >
              <svg className="w-3.5 h-3.5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>

        <div className={`rounded-2xl px-4 py-3 ${
          isAdmin 
            ? 'bg-blue-600/20 rounded-tr-sm border border-blue-500/30'
            : 'bg-zinc-800/80 rounded-tl-sm'
        }`}>
          <p className={`text-xs font-medium mb-1 ${isAdmin ? 'text-blue-400' : 'text-zinc-400'}`}>
            {message.sender_nickname || message.sender_username || message.sender_email || (isAdmin ? 'Поддержка' : 'Пользователь')}
            {isAdmin && <span className="ml-1 text-[10px] bg-blue-500/30 px-1.5 py-0.5 rounded">Админ</span>}
          </p>
          <p className="text-sm text-white whitespace-pre-wrap break-words">{message.message}</p>
          
          {/* Изображения */}
          {message.images && message.images.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {message.images.map((img, idx) => (
                <a key={idx} href={img} target="_blank" rel="noopener noreferrer">
                  <img 
                    src={img} 
                    alt="" 
                    className="max-w-[200px] max-h-[200px] rounded-lg object-cover hover:opacity-80 transition-opacity"
                  />
                </a>
              ))}
            </div>
          )}
        </div>
        
        {/* Счетчик реакций */}
        <div className={`flex items-center gap-1 mt-1 ${isAdmin ? 'justify-end' : 'justify-start'}`}>
          {reactionsCount > 0 && (
            <div className="relative group/reactions">
              <button
                onClick={() => onToggleReaction(message.id)}
                className={`h-5 px-2 rounded-full flex items-center gap-1 transition-all text-[10px] border ${
                  hasUserReaction
                    ? 'bg-pink-500/30 border-pink-400/40'
                    : 'bg-zinc-700/50 border-zinc-500/40 hover:bg-pink-500/20 hover:border-pink-400/40'
                }`}
              >
                <span>❤️</span>
                <span className={`font-medium ${hasUserReaction ? 'text-pink-300' : 'text-zinc-400'}`}>
                  {reactionsCount}
                </span>
              </button>
              
              {/* Тултип с именами */}
              <div className={`absolute ${isAdmin ? 'right-0' : 'left-0'} bottom-full mb-1 opacity-0 group-hover/reactions:opacity-100 transition-opacity pointer-events-none z-50`}>
                <div className="bg-zinc-900/95 backdrop-blur-xl border border-white/20 rounded-lg px-2 py-1.5 shadow-2xl max-w-[180px]">
                  <div className="text-[9px] text-zinc-400 font-semibold mb-1">Понравилось:</div>
                  <div className="flex flex-col gap-1 max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700">
                    {message.reactions?.map((reaction, idx) => {
                      const isCurrentUser = reaction.user_id === currentUserId;
                      return (
                        <div key={idx} className={`flex items-center gap-1.5 ${isCurrentUser ? 'text-pink-300' : 'text-zinc-300'}`}>
                          {reaction.user?.avatar ? (
                            <div className="w-3 h-3 rounded-full bg-cover bg-center flex-shrink-0" style={{ backgroundImage: `url(${reaction.user.avatar})` }} />
                          ) : (
                            <div className={`w-3 h-3 rounded-full ${isCurrentUser ? 'bg-pink-500/30' : 'bg-zinc-700'} flex items-center justify-center flex-shrink-0`}>
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
            </div>
          )}
        </div>
        
        <p className={`text-[10px] text-zinc-500 mt-1 ${isAdmin ? 'text-right' : ''}`}>
          {new Date(message.created_at).toLocaleString('ru-RU')}
        </p>
      </div>
    </div>
  );
}
