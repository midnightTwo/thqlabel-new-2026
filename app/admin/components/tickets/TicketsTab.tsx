'use client';

import { useState, useEffect, useRef } from 'react';

interface Ticket {
  id: string;
  user_id: string;
  user_email?: string;
  user_avatar?: string;
  user_nickname?: string;
  subject: string;
  status: 'open' | 'in_progress' | 'closed';
  created_at: string;
  updated_at: string;
}

interface TicketMessage {
  id: string;
  ticket_id: string;
  user_id: string;
  message: string;
  is_admin: boolean;
  attachment_url?: string;
  created_at: string;
  user_avatar?: string;
  user_nickname?: string;
  user_email?: string;
}

export default function TicketsTab({ supabase }: { supabase: any }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState<'all' | 'open' | 'in_progress' | 'closed'>('all');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const { data: ticketsData, error } = await supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error loading tickets:', error);
        setTickets([]);
        return;
      }
      
      const ticketsWithEmail = await Promise.all((ticketsData || []).map(async (ticket: any) => {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email, avatar, nickname')
            .eq('id', ticket.user_id)
            .single();
          return { 
            ...ticket, 
            user_email: profile?.email || 'Неизвестный',
            user_avatar: profile?.avatar || null,
            user_nickname: profile?.nickname || null
          };
        } catch {
          return { 
            ...ticket, 
            user_email: 'Неизвестный',
            user_avatar: null,
            user_nickname: null
          };
        }
      }));
      
      setTickets(ticketsWithEmail);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (ticketId: string) => {
    const { data, error } = await supabase
      .from('ticket_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });
    
    if (!error && data) {
      // Загружаем профили для всех сообщений
      const messagesWithProfiles = await Promise.all(data.map(async (msg: any) => {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email, avatar, nickname')
            .eq('id', msg.user_id)
            .single();
          return {
            ...msg,
            user_avatar: profile?.avatar || null,
            user_nickname: profile?.nickname || null,
            user_email: profile?.email || null
          };
        } catch {
          return {
            ...msg,
            user_avatar: null,
            user_nickname: null,
            user_email: null
          };
        }
      }));
      
      setMessages(messagesWithProfiles);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  useEffect(() => {
    if (selectedTicket) {
      loadMessages(selectedTicket.id);
    }
  }, [selectedTicket]);

  const sendReply = async () => {
    if (!replyText.trim() || !selectedTicket) return;
    
    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('ticket_messages')
        .insert({
          ticket_id: selectedTicket.id,
          user_id: user?.id,
          message: replyText.trim(),
          is_admin: true
        });
      
      if (error) {
        console.error('Error sending reply:', error);
        return;
      }

      if (selectedTicket.status === 'open') {
        await supabase
          .from('tickets')
          .update({ status: 'in_progress', updated_at: new Date().toISOString() })
          .eq('id', selectedTicket.id);
        
        setSelectedTicket({ ...selectedTicket, status: 'in_progress' });
        loadTickets();
      }

      setReplyText('');
      loadMessages(selectedTicket.id);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setSending(false);
    }
  };

  const closeTicket = async () => {
    if (!selectedTicket) return;
    
    await supabase
      .from('tickets')
      .update({ status: 'closed', updated_at: new Date().toISOString() })
      .eq('id', selectedTicket.id);
    
    setSelectedTicket({ ...selectedTicket, status: 'closed' });
    loadTickets();
  };

  const reopenTicket = async () => {
    if (!selectedTicket) return;
    
    await supabase
      .from('tickets')
      .update({ status: 'open', updated_at: new Date().toISOString() })
      .eq('id', selectedTicket.id);
    
    setSelectedTicket({ ...selectedTicket, status: 'open' });
    loadTickets();
  };

  const filteredTickets = filter === 'all' 
    ? tickets 
    : tickets.filter(t => t.status === filter);

  const statusColors = {
    open: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400', label: 'Открыт' },
    in_progress: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400', label: 'В работе' },
    closed: { bg: 'bg-zinc-500/10', border: 'border-zinc-500/30', text: 'text-zinc-400', label: 'Закрыт' }
  };

  return (
    <div className="space-y-6">
      {!selectedTicket ? (
        <>
          {/* Фильтры */}
          <div className="flex gap-2 flex-wrap">
            {(['all', 'open', 'in_progress', 'closed'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${filter === f 
                  ? 'bg-[#6050ba] text-white' 
                  : 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700'}`}
              >
                {f === 'all' ? 'Все' : statusColors[f].label}
                <span className="ml-2 opacity-50">
                  ({f === 'all' ? tickets.length : tickets.filter(t => t.status === f).length})
                </span>
              </button>
            ))}
            <button
              onClick={loadTickets}
              className="ml-auto px-4 py-2 bg-zinc-800/80 hover:bg-zinc-700 rounded-xl text-xs text-zinc-300 transition"
            >
              ↻ Обновить
            </button>
          </div>

          {/* Список тикетов */}
          {loading ? (
            <div className="text-zinc-600 py-8 text-center">Загрузка тикетов...</div>
          ) : filteredTickets.length === 0 ? (
            <div className="text-zinc-600 py-8 text-center">
              <div className="flex justify-center mb-4">
                <svg className="w-16 h-16 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <p>Тикетов не найдено</p>
              {filter !== 'all' && (
                <button onClick={() => setFilter('all')} className="text-[#9d8df1] text-sm mt-2">
                  Показать все
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
              {filteredTickets.map(ticket => {
                const sc = statusColors[ticket.status];
                return (
                  <button
                    key={ticket.id}
                    onClick={() => setSelectedTicket(ticket)}
                    className={`w-full p-4 ${sc.bg} border ${sc.border} rounded-xl text-left hover:scale-[1.005] transition-all`}
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {/* Аватарка */}
                        <div 
                          className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 ${ticket.user_avatar ? 'bg-cover bg-center' : 'bg-[#6050ba]/20'}`}
                          style={ticket.user_avatar ? { backgroundImage: `url(${ticket.user_avatar})` } : {}}
                        >
                          {!ticket.user_avatar && (ticket.user_nickname?.charAt(0)?.toUpperCase() || ticket.user_email?.charAt(0)?.toUpperCase() || '?')}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[10px] px-2 py-0.5 ${sc.bg} ${sc.text} rounded-full border ${sc.border}`}>
                              {sc.label}
                            </span>
                            <span className="text-[10px] text-zinc-600">
                              #{ticket.id.slice(0, 8)}
                            </span>
                          </div>
                          <h3 className="font-bold text-white truncate">{ticket.subject}</h3>
                          <p className="text-xs text-zinc-500">{ticket.user_nickname || ticket.user_email}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-[10px] text-zinc-600">
                          {new Date(ticket.created_at).toLocaleDateString('ru-RU')}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <>
          {/* Просмотр тикета */}
          <button
            onClick={() => setSelectedTicket(null)}
            className="text-sm text-zinc-400 hover:text-white transition flex items-center gap-2"
          >
            ← Назад к списку
          </button>

          <div className={`p-4 ${statusColors[selectedTicket.status].bg} border ${statusColors[selectedTicket.status].border} rounded-xl`}>
            <div className="flex items-start gap-4">
              {/* Аватарка пользователя */}
              <div 
                className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold flex-shrink-0 ${
                  selectedTicket.user_avatar ? 'bg-cover bg-center' : 'bg-[#6050ba]/20'
                }`}
                style={selectedTicket.user_avatar ? { backgroundImage: `url(${selectedTicket.user_avatar})` } : {}}
              >
                {!selectedTicket.user_avatar && (selectedTicket.user_nickname?.charAt(0)?.toUpperCase() || selectedTicket.user_email?.charAt(0)?.toUpperCase() || '?')}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-4 mb-2">
                  <div>
                    <span className={`text-[10px] px-2 py-0.5 ${statusColors[selectedTicket.status].bg} ${statusColors[selectedTicket.status].text} rounded-full border ${statusColors[selectedTicket.status].border}`}>
                      {statusColors[selectedTicket.status].label}
                    </span>
                    <span className="text-[10px] text-zinc-600 ml-2">#{selectedTicket.id.slice(0, 8)}</span>
                  </div>
                  <div className="flex gap-2">
                    {selectedTicket.status !== 'closed' ? (
                      <button
                        onClick={closeTicket}
                        className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs rounded-lg transition"
                      >
                        Закрыть
                      </button>
                    ) : (
                      <button
                        onClick={reopenTicket}
                        className="px-3 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 text-xs rounded-lg transition"
                      >
                        Открыть заново
                      </button>
                    )}
                  </div>
                </div>
                <h2 className="text-xl font-bold text-white">{selectedTicket.subject}</h2>
                <p className="text-sm text-zinc-400 mt-1">От: {selectedTicket.user_nickname || selectedTicket.user_email}</p>
                <p className="text-xs text-zinc-500">ID: {selectedTicket.user_id}</p>
              </div>
            </div>
          </div>

          {/* Сообщения */}
          <div className="bg-zinc-900/80 rounded-xl p-4 max-h-96 overflow-y-auto space-y-3">
            {messages.length === 0 ? (
              <div className="text-zinc-600 text-center py-8">
                <p>Нет сообщений</p>
              </div>
            ) : (
              messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.is_admin ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {/* Аватарка */}
                  <div 
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      msg.user_avatar ? 'bg-cover bg-center' : msg.is_admin ? 'bg-[#6050ba]' : 'bg-zinc-700'
                    }`}
                    style={msg.user_avatar ? { backgroundImage: `url(${msg.user_avatar})` } : {}}
                    title={msg.user_nickname || msg.user_email || (msg.is_admin ? 'Администратор' : 'Пользователь')}
                  >
                    {!msg.user_avatar && (
                      msg.is_admin ? (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                        </svg>
                      ) : (msg.user_nickname?.charAt(0)?.toUpperCase() || msg.user_email?.charAt(0)?.toUpperCase() || 'U')
                    )}
                  </div>
                  
                  {/* Сообщение */}
                  <div
                    className={`p-3 rounded-xl max-w-[80%] ${msg.is_admin 
                      ? 'bg-[#6050ba]/20 border border-[#6050ba]/30' 
                      : 'bg-zinc-800/80 border border-zinc-700'}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-bold ${msg.is_admin ? 'text-[#9d8df1]' : 'text-zinc-400'}`}>
                        {msg.is_admin ? 'Администратор' : (msg.user_nickname || msg.user_email || 'Пользователь')}
                      </span>
                      <span className="text-[10px] text-zinc-600">
                        {new Date(msg.created_at).toLocaleString('ru-RU')}
                      </span>
                    </div>
                    <p className="text-sm text-white whitespace-pre-wrap">{msg.message}</p>
                    {msg.attachment_url && (
                      <a 
                        href={msg.attachment_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-[#9d8df1] hover:underline mt-2 inline-flex items-center gap-1"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        Вложение
                      </a>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Ответ */}
          {selectedTicket.status !== 'closed' && (
            <div className="space-y-3">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Напишите ответ..."
                className="w-full p-4 bg-zinc-900/80 border border-zinc-700 rounded-xl text-sm resize-none h-24 focus:border-[#6050ba]/50 transition"
              />
              <button
                onClick={sendReply}
                disabled={!replyText.trim() || sending}
                className="w-full py-3 bg-[#6050ba] hover:bg-[#5040aa] disabled:bg-zinc-700 disabled:cursor-not-allowed rounded-xl font-bold text-sm transition"
              >
                {sending ? 'Отправка...' : 'Отправить ответ'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
