'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '@/contexts/ThemeContext';
import { TicketMessage } from './types';

// Хуки
import { useTickets } from './hooks/useTickets';
import { useTicketMessages } from './hooks/useTicketMessages';
import { useUserProfile } from './hooks/useUserProfile';

// Компоненты
import { TicketList, MessageList, ReplyForm, TicketsHeader, TicketDetail } from './components';
import { ReleaseModal } from './modals';
import { UserProfileModal } from '../users/UserProfileModal';

export default function AdminTicketsPanel({ 
  supabase, 
  initialTicketId,
  onTicketOpened 
}: { 
  supabase: any;
  initialTicketId?: string | null;
  onTicketOpened?: () => void;
}) {
  const { themeName } = useTheme();
  const isLight = themeName === 'light';
  
  // Состояние для модального окна релиза
  const [viewingRelease, setViewingRelease] = useState<any>(null);
  
  // Состояние для reply
  const [replyToMessage, setReplyToMessage] = useState<TicketMessage | null>(null);
  
  // Состояния для редактирования профиля
  const [editingProfile, setEditingProfile] = useState(false);
  const [editNickname, setEditNickname] = useState('');
  const [editAvatar, setEditAvatar] = useState('');

  // Хуки для управления тикетами
  const {
    tickets,
    loading,
    error,
    selectedTicket,
    setSelectedTicket,
    filter,
    setFilter,
    searchQuery,
    setSearchQuery,
    loadTickets,
    handleStatusChange,
    filteredTickets,
  } = useTickets(supabase, initialTicketId, onTicketOpened);

  // Хуки для сообщений
  const {
    replyMessage,
    setReplyMessage,
    replyImages,
    setReplyImages,
    uploading,
    sending,
    error: messageError,
    setError: setMessageError,
    userTyping,
    userTypingName,
    messagesEndRef,
    messagesContainerRef,
    currentUserId,
    handleImageUpload,
    handleSendReply,
    toggleReaction,
    deleteMessage,
  } = useTicketMessages(supabase, selectedTicket, setSelectedTicket, loadTickets, replyToMessage, setReplyToMessage);

  // Хуки для профиля пользователя
  const {
    viewingUser,
    setViewingUser,
    profileLoading,
    userReleases,
    userPayouts,
    userTickets,
    userTransactions,
    viewUserProfile,
  } = useUserProfile(supabase);

  // Скрываем мобильный хедер и блокируем скролл когда открыт тикет
  useEffect(() => {
    const mobileHeader = document.querySelector('[data-mobile-header="true"]') as HTMLElement;
    const mobileSpacer = document.querySelector('[data-mobile-spacer="true"]') as HTMLElement;
    
    if (selectedTicket) {
      if (mobileHeader) mobileHeader.style.display = 'none';
      if (mobileSpacer) mobileSpacer.style.display = 'none';
      // Блокируем скролл на мобильных (только overflow)
      if (window.innerWidth < 1024) {
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
      }
    } else {
      if (mobileHeader) mobileHeader.style.display = '';
      if (mobileSpacer) mobileSpacer.style.display = '';
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    
    return () => {
      if (mobileHeader) mobileHeader.style.display = '';
      if (mobileSpacer) mobileSpacer.style.display = '';
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [selectedTicket]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className={`${selectedTicket ? 'lg:space-y-6' : 'space-y-6'}`}>
      {/* Ошибка API */}
      {error && !selectedTicket && (
        <div className="bg-red-500/10 border border-red-500 rounded-lg p-4">
          <p className="text-red-400 text-sm font-medium">{error}</p>
          <button 
            onClick={() => loadTickets(true)}
            className="mt-2 text-xs text-red-300 hover:text-red-200 underline"
          >
            Попробовать снова
          </button>
        </div>
      )}

      {/* Заголовок и фильтры - скрывается на мобильных при открытом тикете */}
      <div className={selectedTicket ? 'hidden lg:block' : ''}>
        <TicketsHeader
          totalCount={tickets.length}
          activeCount={tickets.filter(t => t.status !== 'closed').length}
          filter={filter}
          setFilter={setFilter}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          loading={loading}
          onRefresh={() => loadTickets(true)}
        />
      </div>

      {/* Контент */}
      <div className={`grid grid-cols-1 lg:grid-cols-3 lg:gap-6 ${selectedTicket ? 'gap-0' : 'gap-4'} h-[calc(100vh-280px)] sm:h-[700px]`}>
        {/* Список тикетов */}
        <div className={`lg:col-span-1 space-y-2 ${selectedTicket ? 'hidden lg:block' : ''} h-full overflow-y-auto pr-1 sm:pr-2 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-900 hover:scrollbar-thumb-zinc-600`}>
          <TicketList
            tickets={filteredTickets}
            selectedTicket={selectedTicket}
            onSelectTicket={setSelectedTicket}
            onViewProfile={viewUserProfile}
            searchQuery={searchQuery}
          />
        </div>

        {/* Детали тикета - полноэкранный на мобильных */}
        {/** We'll render ticket panel inline for desktop; on mobile we'll portal it to body */}
        <div className={`lg:col-span-2 ${!selectedTicket ? 'hidden lg:block' : ''} overflow-hidden h-full`}>
          {!selectedTicket ? (
            <EmptyState />
          ) : (
            <div className={`hidden lg:flex flex-col h-full overflow-hidden rounded-xl border backdrop-blur-sm ${
              isLight 
                ? 'bg-white/90 border-gray-300 shadow-sm' 
                : 'bg-zinc-900/50 border-zinc-800'
            }`}>
              {/* Desktop inline panel */}
              <div className="lg:hidden" />
              <TicketDetail
                ticket={selectedTicket}
                onStatusChange={handleStatusChange}
                onViewRelease={setViewingRelease}
              />
              <MessageList
                messages={selectedTicket.ticket_messages}
                currentUserId={currentUserId}
                releaseInfo={selectedTicket.release}
                releaseId={selectedTicket.release_id}
                userTyping={userTyping}
                userTypingName={userTypingName}
                messagesEndRef={messagesEndRef}
                messagesContainerRef={messagesContainerRef}
                onToggleReaction={toggleReaction}
                onReply={setReplyToMessage}
                onDeleteMessage={deleteMessage}
              />
              {selectedTicket.status !== 'closed' && (
                <ReplyForm
                  ticketId={selectedTicket.id}
                  replyMessage={replyMessage}
                  setReplyMessage={setReplyMessage}
                  replyImages={replyImages}
                  setReplyImages={setReplyImages}
                  uploading={uploading}
                  sending={sending}
                  error={messageError}
                  onImageUpload={handleImageUpload}
                  onSendReply={handleSendReply}
                  replyToMessage={replyToMessage}
                  setReplyToMessage={setReplyToMessage}
                  className="mt-auto"
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile portal for ticket panel */}
      {selectedTicket && typeof window !== 'undefined' && window.innerWidth < 1024 && createPortal(
        (
          <div className="fixed top-0 left-0 right-0 bottom-0 z-[9999] bg-transparent">
            <div className="mx-auto max-w-[720px] h-full flex flex-col">
              <div className="flex-shrink-0 flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800">
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors active:scale-95"
                >
                  <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium">Назад</span>
                </button>
                <span className="text-xs text-zinc-500">Чат поддержки</span>
              </div>

              <div className="bg-zinc-900 rounded-b-xl border border-zinc-800 flex flex-col flex-1 overflow-hidden">
                <TicketDetail
                  ticket={selectedTicket}
                  onStatusChange={handleStatusChange}
                  onViewRelease={setViewingRelease}
                />

                <MessageList
                  messages={selectedTicket.ticket_messages}
                  currentUserId={currentUserId}
                  releaseInfo={selectedTicket.release}
                  releaseId={selectedTicket.release_id}
                  userTyping={userTyping}
                  userTypingName={userTypingName}
                  messagesEndRef={messagesEndRef}
                  messagesContainerRef={messagesContainerRef}
                  onToggleReaction={toggleReaction}
                  onReply={setReplyToMessage}
                  onDeleteMessage={deleteMessage}
                />

                {selectedTicket.status !== 'closed' && (
                  <ReplyForm
                    ticketId={selectedTicket.id}
                    replyMessage={replyMessage}
                    setReplyMessage={setReplyMessage}
                    replyImages={replyImages}
                    setReplyImages={setReplyImages}
                    uploading={uploading}
                    sending={sending}
                    error={messageError}
                    onImageUpload={handleImageUpload}
                    onSendReply={handleSendReply}
                    replyToMessage={replyToMessage}
                    setReplyToMessage={setReplyToMessage}
                    className="mt-auto"
                  />
                )}
              </div>
            </div>
          </div>
        ),
        document.body
      )}

      {/* Модальное окно профиля */}
      {viewingUser && (
        <UserProfileModal
          user={{
            id: viewingUser.id,
            email: viewingUser.email,
            nickname: viewingUser.nickname || null,
            avatar: viewingUser.avatar || (viewingUser as any).avatar_url || null,
            role: (viewingUser.role as "basic" | "exclusive" | "admin" | "owner" | null) || null,
            balance: viewingUser.balance ?? 0,
            member_id: (viewingUser as any).member_id || null,
            telegram: (viewingUser as any).telegram || null,
            created_at: viewingUser.created_at || null,
          }}
          profileLoading={profileLoading}
          userReleases={userReleases}
          userPayouts={userPayouts}
          userTickets={userTickets}
          userTransactions={userTransactions as any}
          currentUserRole="admin"
          editingProfile={editingProfile}
          setEditingProfile={setEditingProfile}
          editNickname={editNickname}
          setEditNickname={setEditNickname}
          editAvatar={editAvatar}
          setEditAvatar={setEditAvatar}
          onSaveProfile={() => {}}
          onClose={() => {
            setViewingUser(null);
            setEditingProfile(false);
          }}
          supabase={supabase}
        />
      )}

      {/* Модальное окно релиза */}
      {viewingRelease && (
        <ReleaseModal
          release={viewingRelease}
          onClose={() => setViewingRelease(null)}
        />
      )}
    </div>
  );
}

function EmptyState() {
  const { themeName } = useTheme();
  const isLight = themeName === 'light';
  
  return (
    <div className={`h-full flex items-center justify-center rounded-xl border backdrop-blur-sm ${isLight ? 'bg-white/80 border-gray-300 shadow-sm' : 'bg-zinc-900/50 border-zinc-800'}`}>
      <div className="text-center">
        <svg className={`w-16 h-16 mx-auto mb-4 ${isLight ? 'text-gray-500' : 'text-zinc-700'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <p className={isLight ? 'text-gray-600' : 'text-zinc-400'}>Выберите тикет</p>
      </div>
    </div>
  );
}
