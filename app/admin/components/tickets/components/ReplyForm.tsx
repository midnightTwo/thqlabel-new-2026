'use client';

import React from 'react';
import { fetchWithAuth } from '@/app/cabinet/lib/fetchWithAuth';
import { TicketMessage } from '../types';
import { useTheme } from '@/contexts/ThemeContext';

interface ReplyFormProps {
  ticketId: string;
  replyMessage: string;
  setReplyMessage: (message: string) => void;
  replyImages: string[];
  setReplyImages: (images: string[]) => void;
  uploading: boolean;
  sending: boolean;
  error: string;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  onSendReply: (e: React.FormEvent) => Promise<void>;
  replyToMessage?: TicketMessage | null;
  setReplyToMessage?: (message: TicketMessage | null) => void;
  className?: string;
}

export default function ReplyForm({
  ticketId,
  replyMessage,
  setReplyMessage,
  replyImages,
  setReplyImages,
  uploading,
  sending,
  error,
  onImageUpload,
  onSendReply,
  replyToMessage,
  setReplyToMessage,
  className,
}: ReplyFormProps) {
  const { themeName } = useTheme();
  const isLight = themeName === 'light';

  return (
    <div className={`${className ? className + ' ' : ''}p-3 sm:p-4 border-t flex-shrink-0 ${isLight ? 'border-gray-300 bg-white/90 backdrop-blur-sm' : 'border-zinc-800 bg-zinc-900'}`}>
      <form onSubmit={onSendReply} className="space-y-2 sm:space-y-3">
        {/* Превью ответа на сообщение */}
        {replyToMessage && setReplyToMessage && (
          <div className={`p-2 border rounded-lg ${isLight ? 'bg-gray-100/90 border-gray-300' : 'bg-zinc-800/50 border-zinc-700'}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <svg className="w-3 h-3 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                  <span className={`text-xs font-medium ${isLight ? 'text-blue-600' : 'text-blue-400'}`}>
                    Ответ на {replyToMessage.sender_nickname || replyToMessage.sender_username || 'сообщение'}
                  </span>
                </div>
                <p className={`text-xs truncate ${isLight ? 'text-gray-700' : 'text-zinc-400'}`}>{replyToMessage.message}</p>
              </div>
              <button
                type="button"
                onClick={() => setReplyToMessage(null)}
                className={`p-1.5 rounded transition-colors flex-shrink-0 min-w-[32px] min-h-[32px] flex items-center justify-center ${isLight ? 'hover:bg-gray-200' : 'hover:bg-zinc-700'}`}
              >
                <svg className={`w-4 h-4 ${isLight ? 'text-gray-500' : 'text-zinc-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
        
        {/* Превью изображений */}
        {replyImages.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {replyImages.map((url, index) => (
              <div key={index} className="relative group">
                <img
                  src={url}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-16 sm:h-20 object-cover rounded"
                />
                <button
                  type="button"
                  onClick={() => setReplyImages(replyImages.filter((_, i) => i !== index))}
                  className="absolute top-1 right-1 p-1.5 bg-red-500 rounded-full sm:opacity-0 sm:group-hover:opacity-100 transition-opacity min-w-[28px] min-h-[28px] flex items-center justify-center"
                >
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 items-center">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={onImageUpload}
            className="hidden"
            id="admin-image-upload"
            disabled={uploading}
          />
          <label
            htmlFor="admin-image-upload"
            className={`p-2.5 sm:p-2 rounded-lg cursor-pointer transition-colors flex-shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center ${
              uploading ? 'opacity-50 cursor-not-allowed' : ''
            } ${isLight ? 'bg-gray-100 hover:bg-gray-200' : 'bg-zinc-800 hover:bg-zinc-700'}`}
            title="Прикрепить фото"
          >
            {uploading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
            ) : (
              <svg className={`w-5 h-5 ${isLight ? 'text-gray-500' : 'text-zinc-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            )}
          </label>

          <textarea
            value={replyMessage}
            onChange={(e) => {
              setReplyMessage(e.target.value);
              if (e.target.value.trim()) {
                fetchWithAuth(`/api/support/tickets/${ticketId}/typing`, {
                  method: 'POST',
                  body: JSON.stringify({ isTyping: true, isAdmin: true })
                }).catch(err => console.error('Error sending typing status:', err));
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (!sending && (replyMessage.trim() || replyImages.length > 0)) {
                  const form = e.currentTarget.closest('form');
                  if (form) {
                    form.requestSubmit();
                  }
                }
              }
            }}
            className={`flex-1 px-3 py-2.5 sm:py-2 border rounded-lg text-sm focus:outline-none focus:border-blue-500 transition-colors resize-none min-h-[44px] ${isLight ? 'bg-white text-gray-900 border-gray-300 placeholder-gray-400' : 'bg-zinc-800 text-white border-zinc-700 placeholder-zinc-500'}`}
            placeholder="Сообщение..."
            rows={1}
            disabled={sending}
          />

          <button
            type="submit"
            disabled={sending || (replyMessage.trim() === '' && replyImages.length === 0)}
            className="px-3 sm:px-4 py-2.5 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 min-h-[44px] flex items-center justify-center"
          >
            {sending ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <span className="hidden sm:inline">Отправить</span>
            )}
            {!sending && (
              <svg className="w-5 h-5 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>

        {error && (
          <div className="p-2 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm">
            {error}
          </div>
        )}
      </form>
    </div>
  );
}
