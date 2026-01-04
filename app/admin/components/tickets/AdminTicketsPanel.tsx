'use client';

import React, { useState } from 'react';
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Ошибка API */}
      {error && (
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

      {/* Заголовок и фильтры */}
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

      {/* Контент */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Список тикетов */}
        <div className="lg:col-span-1 space-y-2 max-h-[700px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-900 hover:scrollbar-thumb-zinc-600">
          <TicketList
            tickets={filteredTickets}
            selectedTicket={selectedTicket}
            onSelectTicket={setSelectedTicket}
            onViewProfile={viewUserProfile}
            searchQuery={searchQuery}
          />
        </div>

        {/* Детали тикета */}
        <div className="lg:col-span-2">
          {!selectedTicket ? (
            <EmptyState />
          ) : (
            <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 flex flex-col h-[700px]">
              {/* Заголовок тикета */}
              <TicketDetail
                ticket={selectedTicket}
                onStatusChange={handleStatusChange}
                onViewRelease={setViewingRelease}
              />

              {/* Сообщения */}
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

              {/* Форма ответа */}
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
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Модальное окно профиля */}
      {viewingUser && (
        <UserProfileModal
          user={{
            id: viewingUser.id,
            email: viewingUser.email,
            nickname: viewingUser.nickname,
            avatar: viewingUser.avatar || viewingUser.avatar_url,
            role: viewingUser.role,
            balance: viewingUser.balance,
            member_id: viewingUser.member_id,
            telegram: viewingUser.telegram,
            created_at: viewingUser.created_at,
          }}
          profileLoading={profileLoading}
          userReleases={userReleases}
          userPayouts={userPayouts}
          userTickets={userTickets}
          userTransactions={userTransactions}
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
  return (
    <div className="h-full flex items-center justify-center bg-zinc-900/50 rounded-xl border border-zinc-800">
      <div className="text-center">
        <svg className="w-16 h-16 mx-auto text-zinc-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <p className="text-zinc-400">Выберите тикет</p>
      </div>
    </div>
  );
}
