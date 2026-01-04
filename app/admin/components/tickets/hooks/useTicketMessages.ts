'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { fetchWithAuth } from '@/app/cabinet/lib/fetchWithAuth';
import { Ticket, TicketMessage } from '../types';

interface UseTicketMessagesReturn {
  replyMessage: string;
  setReplyMessage: (message: string) => void;
  replyImages: string[];
  setReplyImages: (images: string[]) => void;
  uploading: boolean;
  sending: boolean;
  error: string;
  setError: (error: string) => void;
  userTyping: boolean;
  userTypingName: string;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  messagesContainerRef: React.RefObject<HTMLDivElement | null>;
  currentUserId: string | null;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleSendReply: (e: React.FormEvent) => Promise<void>;
  toggleReaction: (messageId: string, hasReaction: boolean) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  scrollToBottom: () => void;
}

export function useTicketMessages(
  supabase: any,
  selectedTicket: Ticket | null,
  setSelectedTicket: (ticket: Ticket | null) => void,
  loadTickets: () => Promise<void>,
  replyToMessage?: TicketMessage | null,
  setReplyToMessage?: (message: TicketMessage | null) => void
): UseTicketMessagesReturn {
  const [replyMessage, setReplyMessage] = useState('');
  const [replyImages, setReplyImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userTyping, setUserTyping] = useState(false);
  const [userTypingName, setUserTypingName] = useState('');
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Получаем текущего пользователя
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);
    };
    getUser();
  }, [supabase]);

  // Проверяем, находится ли пользователь внизу списка
  const isNearBottom = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return true;
    const threshold = 150;
    return container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
  }, []);

  // Автопрокрутка к последнему сообщению
  const scrollToBottom = useCallback(() => {
    if (isNearBottom()) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isNearBottom]);

  // Прокручиваем при изменении сообщений
  useEffect(() => {
    if (selectedTicket?.ticket_messages) {
      scrollToBottom();
    }
  }, [selectedTicket?.ticket_messages, scrollToBottom]);

  // Прокручиваем вниз когда появляется индикатор печати
  useEffect(() => {
    if (userTyping) {
      setTimeout(() => scrollToBottom(), 100);
    }
  }, [userTyping, scrollToBottom]);

  // Проверка статуса печати пользователя
  useEffect(() => {
    if (!selectedTicket) return;

    const checkTyping = async () => {
      try {
        const response = await fetchWithAuth(`/api/support/tickets/${selectedTicket.id}/typing`);
        const data = await response.json();
        if (response.ok && data.isTyping && !data.isAdmin && data.username) {
          setUserTyping(true);
          setUserTypingName(data.username);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => {
            setUserTyping(false);
            setUserTypingName('');
          }, 3000);
        } else {
          setUserTyping(false);
          setUserTypingName('');
        }
      } catch (err) {
        console.error('Error checking typing status:', err);
      }
    };

    const typingInterval = setInterval(checkTyping, 1000);
    return () => {
      clearInterval(typingInterval);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [selectedTicket?.id]);

  // Функция переключения реакции (через API)
  const toggleReaction = async (messageId: string, hasReaction: boolean) => {
    if (!currentUserId || !selectedTicket) return;
    
    try {
      const response = await fetchWithAuth(`/api/admin/tickets/${selectedTicket.id}/messages/${messageId}/reactions`, {
        method: 'POST'
      });
      
      const data = await response.json();
      
      if (response.ok) {
        if (data.removed) {
          // Удаляем реакцию
          setSelectedTicket({
            ...selectedTicket,
            ticket_messages: selectedTicket.ticket_messages.map(msg => {
              if (msg.id === messageId) {
                return {
                  ...msg,
                  reactions: (msg.reactions || []).filter(r => r.user_id !== currentUserId)
                };
              }
              return msg;
            })
          });
        } else {
          // Добавляем реакцию
          setSelectedTicket({
            ...selectedTicket,
            ticket_messages: selectedTicket.ticket_messages.map(msg => {
              if (msg.id === messageId) {
                return {
                  ...msg,
                  reactions: [...(msg.reactions || []), data.reaction]
                };
              }
              return msg;
            })
          });
        }
      }
    } catch (e) {
      console.error('Ошибка реакции:', e);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setUploading(true);
    setError('');

    const MAX_FILE_SIZE = 10 * 1024 * 1024;

    try {
      const uploadedUrls: string[] = [];
      let hasError = false;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        if (!file.type.startsWith('image/')) {
          setError(`Файл "${file.name}" не является изображением. Разрешены только фото.`);
          hasError = true;
          continue;
        }

        if (file.size > MAX_FILE_SIZE) {
          setError(`Файл "${file.name}" слишком большой (${(file.size / 1024 / 1024).toFixed(2)} МБ). Максимальный размер: 10 МБ.`);
          hasError = true;
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
          setError(data.error || 'Ошибка загрузки изображения');
          hasError = true;
        }
      }

      setReplyImages([...replyImages, ...uploadedUrls]);
      
      if (hasError) {
        e.target.value = '';
      }
    } catch (err) {
      console.error('Error uploading images:', err);
      setError('Ошибка загрузки изображений');
      e.target.value = '';
    } finally {
      setUploading(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTicket || (!replyMessage.trim() && replyImages.length === 0)) return;

    setSending(true);
    setError('');

    try {
      const response = await fetchWithAuth(`/api/support/tickets/${selectedTicket.id}/messages`, {
        method: 'POST',
        body: JSON.stringify({ 
          message: replyMessage, 
          images: replyImages,
          reply_to_message_id: replyToMessage?.id || null
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSelectedTicket({
          ...selectedTicket,
          ticket_messages: [...selectedTicket.ticket_messages, data.message],
        });
        setReplyMessage('');
        setReplyImages([]);
        if (setReplyToMessage) {
          setReplyToMessage(null);
        }
        loadTickets();
      } else {
        setError(data.error || 'Ошибка отправки сообщения');
      }
    } catch (err) {
      console.error('Error sending reply:', err);
      setError('Ошибка соединения с сервером');
    } finally {
      setSending(false);
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!selectedTicket) return;

    try {
      const response = await fetchWithAuth(`/api/admin/tickets/${selectedTicket.id}/messages/${messageId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Удаляем сообщение из локального состояния
        setSelectedTicket({
          ...selectedTicket,
          ticket_messages: selectedTicket.ticket_messages.filter(msg => msg.id !== messageId)
        });
        loadTickets();
      } else {
        const data = await response.json();
        setError(data.error || 'Ошибка удаления сообщения');
      }
    } catch (err) {
      console.error('Error deleting message:', err);
      setError('Ошибка соединения с сервером');
    }
  };

  return {
    replyMessage,
    setReplyMessage,
    replyImages,
    setReplyImages,
    uploading,
    sending,
    error,
    setError,
    userTyping,
    userTypingName,
    messagesEndRef,
    messagesContainerRef,
    currentUserId,
    handleImageUpload,
    handleSendReply,
    toggleReaction,
    deleteMessage,
    scrollToBottom,
  };
}
