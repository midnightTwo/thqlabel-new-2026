import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Получить все тикеты пользователя
export async function GET(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '100', 10), 200);
    const offset = (page - 1) * limit;
    
    // Получаем токен из заголовка Authorization
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized - No token' }, { status: 401 });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Проверяем роль пользователя
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.role === 'admin' || profile?.role === 'owner';

    // Получаем тикеты с кешированными данными пользователей
    let query = supabase
      .from('support_tickets')
      .select('*')
      .order('updated_at', { ascending: false})
      .range(offset, offset + limit - 1);

    // Если не админ, показываем только свои тикеты БЕЗ архивных
    if (!isAdmin) {
      query = query
        .eq('user_id', user.id)
        .is('archived_at', null);
    }

    const { data: tickets, error } = await query;

    if (error) {
      console.error('Error fetching tickets:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    if (!tickets || tickets.length === 0) {
      return NextResponse.json({ success: true, tickets: [] });
    }

    // Получаем сообщения для всех тикетов с кешированными данными
    const ticketIds = tickets.map(t => t.id);
    const { data: allMessages } = await supabase
      .from('ticket_messages')
      .select('*')
      .in('ticket_id', ticketIds)
      .order('created_at', { ascending: true })
      .limit(2000);

    // Получаем информацию о релизах для тикетов из ОБЕИХ таблиц
    const releaseIds = tickets
      .filter(t => t.release_id)
      .map(t => t.release_id);
    
    const releasesMap = new Map();
    if (releaseIds.length > 0) {
      // Пытаемся найти релизы в обеих таблицах
      const [basicReleases, exclusiveReleases] = await Promise.all([
        supabase
          .from('releases_basic')
          .select('id, artist_name, title, cover_url, status, created_at, custom_id')
          .in('id', releaseIds),
        supabase
          .from('releases_exclusive')
          .select('id, artist_name, title, cover_url, status, created_at, custom_id')
          .in('id', releaseIds)
      ]);
      
      // Добавляем basic релизы
      basicReleases.data?.forEach(release => {
        releasesMap.set(release.id, {
          id: release.id,
          artist: release.artist_name,
          title: release.title,
          artwork_url: release.cover_url,
          status: release.status,
          created_at: release.created_at,
          release_code: release.custom_id
        });
      });
      
      // Добавляем exclusive релизы
      exclusiveReleases.data?.forEach(release => {
        releasesMap.set(release.id, {
          id: release.id,
          artist: release.artist_name,
          title: release.title,
          artwork_url: release.cover_url,
          status: release.status,
          created_at: release.created_at,
          release_code: release.custom_id
        });
      });
    }

    // Получаем информацию о транзакциях для тикетов
    const transactionIds = tickets
      .filter(t => t.transaction_id)
      .map(t => t.transaction_id);
    
    const transactionsMap = new Map();
    if (transactionIds.length > 0) {
      const { data: transactions } = await supabase
        .from('transactions')
        .select('id, type, amount, status, description, created_at')
        .in('id', transactionIds);
      
      transactions?.forEach(tx => {
        transactionsMap.set(tx.id, tx);
      });
    }

    // Группируем сообщения по тикетам
    const messagesByTicket = new Map();
    allMessages?.forEach(msg => {
      if (!messagesByTicket.has(msg.ticket_id)) {
        messagesByTicket.set(msg.ticket_id, []);
      }
      messagesByTicket.get(msg.ticket_id).push(msg);
    });
    
    // Получаем информацию о сообщениях на которые ответили
    const replyToIds = [...new Set((allMessages || []).map(m => m.reply_to).filter(Boolean))];
    const replyToMessagesMap = new Map();
    
    if (replyToIds.length > 0) {
      const { data: replyToMessages } = await supabase
        .from('ticket_messages')
        .select('id, message, sender_id, is_admin')
        .in('id', replyToIds);
      
      replyToMessages?.forEach(msg => {
        replyToMessagesMap.set(msg.id, msg);
      });
    }

    // Загружаем реакции для всех сообщений
    const allMessageIds = allMessages?.map(m => m.id) || [];
    const reactionsMap = new Map();
    
    if (allMessageIds.length > 0) {
      const { data: reactions } = await supabase
        .from('ticket_message_reactions')
        .select('*')
        .in('message_id', allMessageIds);
      
      if (reactions && reactions.length > 0) {
        // Получаем профили пользователей которые поставили реакции
        const reactionUserIds = [...new Set(reactions.map(r => r.user_id))];
        const { data: reactionUsers } = await supabase
          .from('profiles')
          .select('id, nickname, avatar')
          .in('id', reactionUserIds);
        
        const reactionUsersMap = new Map();
        reactionUsers?.forEach(u => reactionUsersMap.set(u.id, u));
        
        // Группируем реакции по message_id с данными пользователей
        reactions.forEach(r => {
          const user = reactionUsersMap.get(r.user_id);
          const reactionWithUser = {
            ...r,
            user: user ? { nickname: user.nickname, avatar: user.avatar } : null
          };
          
          if (!reactionsMap.has(r.message_id)) {
            reactionsMap.set(r.message_id, []);
          }
          reactionsMap.get(r.message_id).push(reactionWithUser);
        });
      }
    }

    // Собираем ВСЕ уникальные ID пользователей (владельцы тикетов + отправители сообщений)
    // Исключаем системные ID (нулевой UUID для автоответов)
    const SYSTEM_ID = '00000000-0000-0000-0000-000000000000';
    const ticketUserIds = tickets.map(t => t.user_id).filter(id => id && id !== SYSTEM_ID);
    const messageSenderIds = (allMessages?.map(m => m.sender_id) || []).filter(id => id && id !== SYSTEM_ID);
    const allUserIds = [...new Set([...ticketUserIds, ...messageSenderIds])];
    
    const profilesMap = new Map();
    
    if (allUserIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, nickname, telegram, avatar, role')
        .in('id', allUserIds);
      
      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      }
      
      profiles?.forEach(p => profilesMap.set(p.id, p));
    }

    // Форматируем тикеты с СВЕЖИМИ данными профилей
    const formattedTickets = tickets.map((ticket) => {
      const profile = profilesMap.get(ticket.user_id);
      
      // Форматируем сообщения со свежими данными отправителей и реакциями
      const messages = (messagesByTicket.get(ticket.id) || []).map((msg: any) => {
        const senderProfile = profilesMap.get(msg.sender_id);
        const replyToMessage = msg.reply_to ? replyToMessagesMap.get(msg.reply_to) : null;
        
        // Добавляем данные отправителя для reply_to_message
        let formattedReplyTo = null;
        if (replyToMessage) {
          const replyToSenderProfile = profilesMap.get(replyToMessage.sender_id);
          formattedReplyTo = {
            ...replyToMessage,
            sender_nickname: replyToSenderProfile?.nickname,
            sender_username: replyToSenderProfile?.email?.split('@')[0],
            sender_email: replyToSenderProfile?.email
          };
        }
        
        return {
          ...msg,
          sender_email: senderProfile?.email || msg.sender_email,
          sender_nickname: senderProfile?.nickname || msg.sender_nickname,
          sender_avatar: senderProfile?.avatar || msg.sender_avatar,
          reactions: reactionsMap.get(msg.id) || [],
          reply_to_message: formattedReplyTo
        };
      });
      
      return {
        ...ticket,
        // Подставляем свежие данные из профиля
        user_email: profile?.email || ticket.user_email,
        user_nickname: profile?.nickname || ticket.user_nickname,
        user_telegram: profile?.telegram || ticket.user_telegram,
        user_avatar: profile?.avatar || ticket.user_avatar,
        user_role: profile?.role || ticket.user_role,
        ticket_messages: messages,
        release: ticket.release_id ? releasesMap.get(ticket.release_id) : null,
        transaction: ticket.transaction_id ? transactionsMap.get(ticket.transaction_id) : null
      };
    });

    return NextResponse.json({ success: true, tickets: formattedTickets });
  } catch (error) {
    console.error('Error in GET /api/support/tickets:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// Создать новый тикет
export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    // Получаем токен из заголовка Authorization
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized - No token' }, { status: 401 });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { subject, category, message, images, release_id, transaction_id } = body;

    if (!subject || !message) {
      return NextResponse.json(
        { error: 'Subject and message are required' },
        { status: 400 }
      );
    }

    // Получаем информацию о пользователе из profiles для кеширования
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, nickname, telegram, avatar, role')
      .eq('id', user.id)
      .single();

    // Создаем тикет с кешированными данными пользователя
    const ticketData: any = {
      user_id: user.id,
      subject,
      status: 'open',
      priority: 'medium'
    };

    // Добавляем опциональные поля только если они есть
    if (category) ticketData.category = category;
    if (release_id) ticketData.release_id = release_id;
    if (transaction_id) ticketData.transaction_id = transaction_id;
    if (profile?.email) ticketData.user_email = profile.email;
    if (profile?.nickname) ticketData.user_nickname = profile.nickname;
    if (profile?.telegram) ticketData.user_telegram = profile.telegram;
    if (profile?.avatar) ticketData.user_avatar = profile.avatar;
    if (profile?.role) ticketData.user_role = profile.role;

    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .insert(ticketData)
      .select()
      .single();

    if (ticketError || !ticket) {
      console.error('Error creating ticket:', ticketError);
      return NextResponse.json(
        { error: ticketError?.message || 'Failed to create ticket' },
        { status: 500 }
      );
    }

    // Определяем, является ли пользователь админом/овнером
    const isAdmin = profile?.role === 'admin' || profile?.role === 'owner';

    // Создаем первое сообщение (триггер автоматически заполнит sender_email, sender_nickname, sender_avatar)
    const { data: ticketMessage, error: messageError } = await supabase
      .from('ticket_messages')
      .insert({
        ticket_id: ticket.id,
        sender_id: user.id,
        message,
        is_admin: isAdmin,
        images: images || []
      })
      .select()
      .single();

    if (messageError) {
      console.error('Error creating message:', messageError);
      // Удаляем тикет если не удалось создать сообщение
      await supabase.from('support_tickets').delete().eq('id', ticket.id);
      return NextResponse.json(
        { error: messageError.message },
        { status: 500 }
      );
    }

    // Создаем автоматическое сообщение от системы
    // Используем специальный UUID для системы, чтобы триггер не перезаписывал данные
    const systemUserId = '00000000-0000-0000-0000-000000000000';
    const { data: autoReply } = await supabase
      .from('ticket_messages')
      .insert({
        ticket_id: ticket.id,
        sender_id: systemUserId,
        message: 'Здравствуйте! Ваше обращение принято. Наша команда поддержки свяжется с вами в ближайшее время.',
        is_admin: true,
        images: [],
        sender_email: 'support@thqlabel.com',
        sender_nickname: 'thqlabel Support',
        sender_username: 'THQ Support',
        sender_avatar: '/thqsupp logo.png'
      })
      .select()
      .single();

    // Загружаем данные релиза если он указан
    let releaseData = null;
    if (release_id) {
      const [basicRelease, exclusiveRelease] = await Promise.all([
        supabase
          .from('releases_basic')
          .select('id, artist_name, title, cover_url, status, created_at')
          .eq('id', release_id)
          .single(),
        supabase
          .from('releases_exclusive')
          .select('id, artist_name, title, cover_url, status, created_at')
          .eq('id', release_id)
          .single()
      ]);

      const release = basicRelease.data || exclusiveRelease.data;
      if (release) {
        releaseData = {
          id: release.id,
          artist: release.artist_name,
          title: release.title,
          artwork_url: release.cover_url,
          status: release.status,
          created_at: release.created_at
        };
      }
    }

    return NextResponse.json({
      ticket: {
        ...ticket,
        ticket_messages: autoReply ? [ticketMessage, autoReply] : [ticketMessage],
        release: releaseData
      }
    });
  } catch (error) {
    console.error('Error in POST /api/support/tickets:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
