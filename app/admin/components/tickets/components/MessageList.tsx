'use client';

import React, { useState } from 'react';
import TicketAvatar from '@/components/icons/TicketAvatar';
import { TicketMessage as TicketMessageType, MessageReaction } from '../types';

interface MessageListProps {
  messages: TicketMessageType[];
  currentUserId: string | null;
  releaseInfo?: {
    id: string;
    title: string;
    artist: string;
    artwork_url?: string;
    status: string;
  } | null;
  releaseId?: string;
  userTyping: boolean;
  userTypingName: string;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  messagesContainerRef: React.RefObject<HTMLDivElement | null>;
  onToggleReaction: (messageId: string, hasReaction: boolean) => void;
  onReply?: (message: TicketMessageType) => void;
  onDeleteMessage?: (messageId: string) => void;
}

export default function MessageList({
  messages,
  currentUserId,
  releaseInfo,
  releaseId,
  userTyping,
  userTypingName,
  messagesEndRef,
  messagesContainerRef,
  onToggleReaction,
  onReply,
  onDeleteMessage,
}: MessageListProps) {
  const [highlightedMessageId, setHighlightedMessageId] = React.useState<string | null>(null);
  const messageRefs = React.useRef<{ [key: string]: HTMLDivElement | null }>({});

  const scrollToMessage = (messageId: string) => {
    setHighlightedMessageId(messageId);
    setTimeout(() => {
      messageRefs.current[messageId]?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }, 100);
    setTimeout(() => {
      setHighlightedMessageId(null);
    }, 2000);
  };

  return (
    <div 
      ref={messagesContainerRef} 
      className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-900 hover:scrollbar-thumb-zinc-600"
    >
      {messages.map((msg, idx) => (
        <MessageBubble
          key={msg.id}
          message={msg}
          currentUserId={currentUserId}
          isFirstUserMessage={idx === 0 && !msg.is_admin && !!releaseId && !!releaseInfo}
          releaseInfo={releaseInfo}
          onToggleReaction={onToggleReaction}
          highlightedMessageId={highlightedMessageId}
          messageRefs={messageRefs}
          scrollToMessage={scrollToMessage}
          onReply={onReply}
          onDeleteMessage={onDeleteMessage}
        />
      ))}

      {/* Индикатор печати */}
      {userTyping && (
        <div className="flex justify-start px-4 py-1 animate-fade-in">
          <div className="bg-zinc-800/50 rounded-lg px-3 py-1.5 border border-zinc-700/50">
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-300">{userTypingName}</span>
              <span className="text-[10px] text-zinc-500">печатает</span>
              <div className="flex gap-0.5">
                <span className="w-1 h-1 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-1 h-1 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-1 h-1 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}

interface MessageBubbleProps {
  message: TicketMessageType;
  currentUserId: string | null;
  isFirstUserMessage: boolean;
  releaseInfo?: {
    id: string;
    title: string;
    artist: string;
    artwork_url?: string;
    status: string;
  } | null;
  onToggleReaction: (messageId: string, hasReaction: boolean) => void;
  onReply?: (message: TicketMessageType) => void;
  onDeleteMessage?: (messageId: string) => void;
  highlightedMessageId: string | null;
  messageRefs: React.MutableRefObject<{ [key: string]: HTMLDivElement | null }>;
  scrollToMessage: (messageId: string) => void;
}

function MessageBubble({ message, currentUserId, isFirstUserMessage, releaseInfo, onToggleReaction, onReply, onDeleteMessage, highlightedMessageId, messageRefs, scrollToMessage }: MessageBubbleProps) {
  const [showActions, setShowActions] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const isSystemMessage = message.sender_id === '00000000-0000-0000-0000-000000000000';
  const displayName = isSystemMessage 
    ? 'THQ Support' 
    : (message.sender_nickname || message.sender_username || message.sender_email?.split('@')[0] || (message.is_admin ? 'Администратор' : 'Пользователь'));
  
  const hasUserReaction = message.reactions?.some(r => r.user_id === currentUserId);
  const reactionsCount = message.reactions?.length || 0;

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
    } else {
      setIsDeleting(true);
      setTimeout(() => {
        onDeleteMessage?.(message.id);
      }, 500);
    }
  };

  return (
    <div
      className={`flex ${message.is_admin ? 'justify-start' : 'justify-end'} group transition-all duration-500 ${isDeleting ? 'opacity-0 scale-95 -translate-y-4' : 'opacity-100 scale-100'}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
        setConfirmDelete(false);
      }}
    >
      <div className={`max-w-[80%] ${message.is_admin ? '' : 'flex flex-col items-end'} relative`}>
        {/* Невидимая область для плавного перехода к кнопке */}
        <div className={`absolute ${message.is_admin ? 'left-full' : 'right-full'} top-0 w-12 h-full`} />
        
        <div 
          className={`absolute ${message.is_admin ? 'left-full ml-2' : 'right-full mr-2'} top-8 flex gap-1 transition-opacity duration-200 ${
            showActions ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          style={{ zIndex: 10 }}
        >
          {/* Кнопка ответить */}
          {onReply && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onReply(message);
              }}
              className="p-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 rounded-lg transition-colors"
              title="Ответить"
            >
              <svg className={`w-3.5 h-3.5 text-zinc-400 ${!message.is_admin ? 'transform scale-x-[-1]' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
            </button>
          )}
        </div>
        
        {/* Кнопка удалить - внизу сообщения */}
        {onDeleteMessage && (
          <button
            onClick={handleDelete}
            className={`absolute bottom-2 ${message.is_admin ? 'right-2' : 'left-2'} flex items-center gap-1.5 rounded-lg transition-all duration-300 ${
              confirmDelete 
                ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg shadow-red-500/50 px-3 py-1.5 scale-105' 
                : showActions
                  ? 'bg-zinc-800/80 backdrop-blur-sm hover:bg-red-900/60 border border-zinc-700/50 hover:border-red-500/50 text-zinc-400 hover:text-red-300 px-2 py-1 opacity-70 hover:opacity-100'
                  : 'opacity-0 pointer-events-none'
            }`}
            style={{ zIndex: 15 }}
            title={confirmDelete ? 'Нажмите ещё раз для удаления' : 'Удалить сообщение'}
          >
            {confirmDelete ? (
              <>
                <svg className="w-4 h-4 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                <span className="text-xs font-bold">Удалить?</span>
              </>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            )}
          </button>
        )}
        
        {/* Метка отправителя */}
        <div className={`flex items-center gap-2 mb-1 ${message.is_admin ? '' : 'flex-row-reverse'}`}>
          <TicketAvatar
            src={message.sender_avatar}
            name={displayName}
            email={message.sender_email}
            size="sm"
            isAdmin={message.is_admin}
          />
          <div className={`flex flex-col ${message.is_admin ? 'items-start' : 'items-end'}`}>
            <span className={`text-xs font-medium ${
              message.is_admin 
                ? 'bg-gradient-to-r from-green-400 to-emerald-400 text-transparent bg-clip-text' 
                : 'text-blue-300'
            }`}>
              {displayName}
            </span>
            {!message.is_admin && message.sender_email && (
              <span className="text-[10px] text-zinc-500">{message.sender_email}</span>
            )}
            {message.is_admin && !isSystemMessage && message.sender_email && (
              <span className="text-[10px] text-zinc-500">{message.sender_email}</span>
            )}
          </div>
        </div>

        <div 
          ref={(el) => { messageRefs.current[message.id] = el; }}
          className={`rounded-lg p-4 relative transition-all duration-300 ${
            message.is_admin
              ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 hover:from-green-500/25 hover:to-emerald-500/25'
              : 'bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/30 hover:from-blue-500/25 hover:to-indigo-500/25'
          } ${highlightedMessageId === message.id ? 'ring-4 ring-amber-400 !bg-amber-400/30 !border-amber-400 shadow-[0_0_30px_rgba(251,191,36,0.5)] animate-pulse' : ''}`}
          onDoubleClick={() => onToggleReaction(message.id, !!hasUserReaction)}
        >
          {/* Превью ответа на сообщение */}
          {message.reply_to_message && (
            <div 
              className="mb-2 p-2 bg-black/30 border-l-2 border-blue-400/50 rounded cursor-pointer hover:bg-black/40 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                scrollToMessage(message.reply_to_message.id);
              }}
              title="Перейти к сообщению"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <svg className="w-3 h-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
                <span className="text-xs text-blue-400 font-medium">
                  {message.reply_to_message.sender_nickname || message.reply_to_message.sender_username || 'Пользователь'}
                </span>
              </div>
              <p className="text-xs text-zinc-400 truncate">{message.reply_to_message.message}</p>
            </div>
          )}
          
          <p className="text-white whitespace-pre-wrap break-words">{message.message}</p>
          
          {/* Изображения */}
          {message.images && message.images.length > 0 && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              {message.images.map((url, index) => (
                <a key={index} href={url} target="_blank" rel="noopener noreferrer" className="block">
                  <img
                    src={url}
                    alt={`Attachment ${index + 1}`}
                    className="w-full h-32 object-cover rounded hover:opacity-80 transition-opacity cursor-pointer"
                  />
                </a>
              ))}
            </div>
          )}

          {/* Информация о релизе для первого сообщения */}
          {isFirstUserMessage && releaseInfo && (
            <ReleaseInfoInMessage release={releaseInfo} />
          )}

          <div className="text-xs text-zinc-500 mt-2">
            {new Date(message.created_at).toLocaleString('ru-RU')}
          </div>
        </div>
        
        {/* Кнопка реакции - показываем всегда */}
        <ReactionCounter
          hasUserReaction={!!hasUserReaction}
          reactionsCount={reactionsCount}
          reactions={message.reactions}
          isAdmin={message.is_admin}
          onToggle={() => onToggleReaction(message.id, !!hasUserReaction)}
          showOnHover={showActions}
        />
      </div>
    </div>
  );
}

function ReleaseInfoInMessage({ release }: { release: { title: string; artist: string; artwork_url?: string; status: string } }) {
  const statusLabels: Record<string, string> = {
    pending: '⏳ На модерации',
    distributed: '🚀 На дистрибьюции',
    rejected: '❌ Отклонён',
    published: '🎵 Опубликован',
  };

  return (
    <div className="mt-2 pt-2 border-t border-purple-500/30">
      <div className="flex items-center gap-1.5 mb-1.5">
        <svg className="w-3 h-3 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
        <span className="text-[10px] text-purple-300 font-medium">Обращение по релизу:</span>
      </div>
      <div className="flex items-center gap-2 bg-black/30 rounded-lg p-1.5">
        {release.artwork_url ? (
          <img src={release.artwork_url} alt={release.title} className="w-10 h-10 rounded object-cover flex-shrink-0" />
        ) : (
          <div className="w-10 h-10 rounded bg-gradient-to-br from-purple-500/30 to-blue-500/30 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-white truncate">{release.title}</div>
          <div className="text-[10px] text-zinc-400 truncate">{release.artist}</div>
          {release.status && statusLabels[release.status] && (
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-[9px] px-1 py-0.5 rounded bg-purple-500/20 text-purple-300">
                {statusLabels[release.status]}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface ReactionCounterProps {
  hasUserReaction: boolean;
  reactionsCount: number;
  reactions?: MessageReaction[];
  isAdmin: boolean;
  onToggle: () => void;
  showOnHover: boolean;
}

function ReactionCounter({ hasUserReaction, reactionsCount, reactions, isAdmin, onToggle, showOnHover }: ReactionCounterProps) {
  return (
    <div className={`flex items-center gap-1 mt-1 ${isAdmin ? 'justify-start' : 'justify-end'}`}>
      <div className="relative group/reactions">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className={`h-5 px-2 rounded-full flex items-center gap-1 transition-all text-[10px] border ${
            reactionsCount > 0
              ? hasUserReaction
                ? 'bg-pink-500/30 border-pink-400/40'
                : 'bg-zinc-700/50 border-zinc-500/40 hover:bg-pink-500/20 hover:border-pink-400/40'
              : `bg-zinc-800/60 border-zinc-600/40 ${showOnHover ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} hover:bg-pink-500/20 hover:border-pink-400/40`
          }`}
        >
          <span>{reactionsCount > 0 || hasUserReaction ? '❤️' : '🤍'}</span>
          {reactionsCount > 0 && (
            <span className={`font-medium ${hasUserReaction ? 'text-pink-300' : 'text-zinc-400'}`}>
              {reactionsCount}
            </span>
          )}
        </button>
        
        {/* Тултип с именами */}
        {reactionsCount > 0 && (
          <div className={`absolute ${isAdmin ? 'left-0' : 'right-0'} bottom-full mb-1 opacity-0 group-hover/reactions:opacity-100 transition-opacity pointer-events-none z-50`}>
            <div className="bg-zinc-900/95 backdrop-blur-xl border border-white/20 rounded-lg px-2 py-1.5 shadow-2xl max-w-[180px]">
              <div className="text-[9px] text-zinc-400 font-semibold mb-1">Понравилось:</div>
              <div className="flex flex-col gap-1 max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700">
                {reactions?.map((reaction, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 text-zinc-300">
                    {reaction.user?.avatar ? (
                      <div className="w-3 h-3 rounded-full bg-cover bg-center flex-shrink-0" style={{ backgroundImage: `url(${reaction.user.avatar})` }} />
                    ) : (
                      <div className="w-3 h-3 rounded-full bg-zinc-700 flex items-center justify-center flex-shrink-0">
                        <span className="text-[6px]">{reaction.user?.nickname?.charAt(0) || '?'}</span>
                      </div>
                    )}
                    <span className="text-[10px] truncate">
                      {reaction.user?.nickname || 'Пользователь'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
