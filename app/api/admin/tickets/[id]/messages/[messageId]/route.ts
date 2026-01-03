import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Удалить сообщение (только для админов)
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string; messageId: string }> }
) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    // Проверяем роль - только админы могут удалять сообщения
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.role === 'admin' || profile?.role === 'owner';

    if (!isAdmin) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { id: ticketId, messageId } = await context.params;

    // Проверяем что сообщение принадлежит этому тикету
    const { data: message, error: messageError } = await supabase
      .from('ticket_messages')
      .select('id, ticket_id')
      .eq('id', messageId)
      .eq('ticket_id', ticketId)
      .single();

    if (messageError || !message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Удаляем сообщение
    const { error: deleteError } = await supabase
      .from('ticket_messages')
      .delete()
      .eq('id', messageId);

    if (deleteError) {
      console.error('Error deleting message:', deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/admin/tickets/[id]/messages/[messageId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
