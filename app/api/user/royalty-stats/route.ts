import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Получаем текущего пользователя
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Получаем общую статистику по трекам пользователя
    const { data: trackStats, error: trackError } = await supabase
      .from('track_statistics')
      .select(`
        id,
        isrc,
        track_title,
        release_title,
        artist_name,
        streams,
        net_revenue,
        quarter,
        year,
        is_matched
      `)
      .eq('user_id', user.id)
      .order('net_revenue', { ascending: false });

    if (trackError) {
      console.error('Track stats error:', trackError);
      return NextResponse.json({ error: trackError.message }, { status: 500 });
    }

    // Получаем статистику по странам
    const trackIds = trackStats?.map(t => t.id) || [];
    
    let countryStats: any[] = [];
    if (trackIds.length > 0) {
      const { data: countries, error: countryError } = await supabase
        .from('country_statistics')
        .select('country_name, streams, net_revenue')
        .in('track_stat_id', trackIds);
      
      if (!countryError && countries) {
        // Агрегируем по странам
        const countryMap = new Map<string, { streams: number; revenue: number }>();
        countries.forEach(c => {
          const existing = countryMap.get(c.country_name) || { streams: 0, revenue: 0 };
          countryMap.set(c.country_name, {
            streams: existing.streams + (c.streams || 0),
            revenue: existing.revenue + parseFloat(c.net_revenue || '0')
          });
        });
        
        countryStats = Array.from(countryMap.entries())
          .map(([name, data]) => ({ name, ...data }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 10); // Топ 10 стран
      }
    }

    // Получаем статистику по платформам
    let platformStats: any[] = [];
    if (trackIds.length > 0) {
      const { data: platforms, error: platformError } = await supabase
        .from('platform_statistics')
        .select('platform_name, streams, net_revenue')
        .in('track_stat_id', trackIds);
      
      if (!platformError && platforms) {
        // Агрегируем по платформам
        const platformMap = new Map<string, { streams: number; revenue: number }>();
        platforms.forEach(p => {
          const existing = platformMap.get(p.platform_name) || { streams: 0, revenue: 0 };
          platformMap.set(p.platform_name, {
            streams: existing.streams + (p.streams || 0),
            revenue: existing.revenue + parseFloat(p.net_revenue || '0')
          });
        });
        
        platformStats = Array.from(platformMap.entries())
          .map(([name, data]) => ({ name, ...data }))
          .sort((a, b) => b.revenue - a.revenue);
      }
    }

    // Статистика по периодам (кварталам)
    const periodMap = new Map<string, { streams: number; revenue: number }>();
    trackStats?.forEach(t => {
      const key = `${t.quarter} ${t.year}`;
      const existing = periodMap.get(key) || { streams: 0, revenue: 0 };
      periodMap.set(key, {
        streams: existing.streams + (t.streams || 0),
        revenue: existing.revenue + parseFloat(t.net_revenue || '0')
      });
    });

    const periodStats = Array.from(periodMap.entries())
      .map(([period, data]) => ({ period, ...data }))
      .sort((a, b) => {
        // Сортируем по году и кварталу
        const [qA, yA] = a.period.split(' ');
        const [qB, yB] = b.period.split(' ');
        if (yA !== yB) return parseInt(yB) - parseInt(yA);
        return qB.localeCompare(qA);
      });

    // Общие суммы
    const totals = {
      totalStreams: trackStats?.reduce((sum, t) => sum + (t.streams || 0), 0) || 0,
      totalRevenue: trackStats?.reduce((sum, t) => sum + parseFloat(t.net_revenue || '0'), 0) || 0,
      totalTracks: trackStats?.length || 0,
      matchedTracks: trackStats?.filter(t => t.is_matched).length || 0
    };

    return NextResponse.json({
      totals,
      tracks: trackStats?.slice(0, 20) || [], // Топ 20 треков
      countries: countryStats,
      platforms: platformStats,
      periods: periodStats
    });

  } catch (error) {
    console.error('Royalty stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
