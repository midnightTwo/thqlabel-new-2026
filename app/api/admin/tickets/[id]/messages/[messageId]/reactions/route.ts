import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

interface RouteContext {
  params: Promise<{
    id: string;
    messageId: string;
  }>;
}

// Toggle reaction (admin version)
export async function POST(request: Request, context: RouteContext) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
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

    // Проверяем, что пользователь - администратор
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.role === 'admin' || profile?.role === 'owner';

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    const params = await context.params;
    const messageId = params.messageId;
    
    // Проверяем, есть ли уже реакция от этого админа
    const { data: existingReaction } = await supabase
      .from('ticket_message_reactions')
      .select('*')
      .eq('message_id', messageId)
      .eq('user_id', user.id)
      .single();

    if (existingReaction) {
      // Удаляем реакцию
      const { error: deleteError } = await supabase
        .from('ticket_message_reactions')
        .delete()
        .eq('message_id', messageId)
        .eq('user_id', user.id);

      if (deleteError) {
        console.error('Error deleting reaction:', deleteError);
        return NextResponse.json({ error: deleteError.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, removed: true });
    } else {
      // Добавляем реакцию
      const { data: newReaction, error: insertError } = await supabase
        .from('ticket_message_reactions')
        .insert({
          message_id: messageId,
          user_id: user.id,
          reaction: '❤️'
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error adding reaction:', insertError);
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }

      // Получаем информацию о пользователе для реакции
      const { data: userData } = await supabase
        .from('profiles')
        .select('nickname, avatar')
        .eq('id', user.id)
        .single();

      const reactionWithUser = {
        ...newReaction,
        user: userData
      };

      return NextResponse.json({ success: true, reaction: reactionWithUser });
    }
  } catch (err) {
    console.error('Error toggling reaction:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
