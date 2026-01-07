"use client";
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function DemosTab() {
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('demos').select('*').order('created_at', { ascending: false });
      if (!data) { setGroups([]); setLoading(false); return; }

      // parse notes and group by batchId
      const map: Record<string, any> = {};
      data.forEach((d: any) => {
        let meta: any = null;
        try { meta = d.notes ? JSON.parse(d.notes) : null; } catch(e) { meta = null; }
        const batch = (meta && meta.batchId) ? meta.batchId : `single_${d.id}`;
        if (!map[batch]) map[batch] = { batchId: batch, items: [], coverUrl: meta?.coverUrl || null, releaseTitle: meta?.releaseTitle || null, type: meta?.type || 'single', created_at: d.created_at };
        map[batch].items.push(d);
      });

      const arr = Object.values(map).sort((a: any,b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setGroups(arr as any[]);
    } catch (e) {
      console.warn('Не удалось загрузить демо:', e);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const acceptGroup = async (group: any) => {
    if (!confirm('Принять релиз и создать релиз/трек(и)?')) return;
    try {
      const first = group.items[0];
      const meta = (() => { try { return first.notes ? JSON.parse(first.notes) : {}; } catch(e){ return {}; } })();
      const releasePayload: any = {
        title: meta.releaseTitle || first.title || first.track_name || 'Untitled',
        artist_name: first.artist_name || first.artist || null,
        cover_url: meta.coverUrl || null,
        status: 'distributed',
        type: meta.type || (group.items.length > 1 ? 'album' : 'single'),
        user_id: first.user_id || null,
        release_date: new Date().toISOString(),
      };
      const { data: relData, error: relErr } = await supabase.from('releases').insert(releasePayload).select().single();
      if (relErr) throw relErr;
      const releaseId = relData.id;

      for (const item of group.items) {
        const trackPayload = { release_id: releaseId, title: item.title || item.track_name, audio_url: item.audio_url || item.file_url, created_at: item.created_at };
        await supabase.from('tracks').insert(trackPayload);
      }

      const ids = group.items.map((i: any) => i.id);
      await supabase.from('demos').update({ status: 'accepted' }).in('id', ids);
      alert('Релиз принят и опубликован');
      load();
    } catch (e: any) {
      console.error(e);
      alert('Ошибка принятия: ' + (e.message || e));
    }
  };

  const rejectGroup = async (group: any) => {
    if (!confirm('Отклонить этот релиз?')) return;
    try {
      const ids = group.items.map((i: any) => i.id);
      await supabase.from('demos').update({ status: 'rejected' }).in('id', ids);
      alert('Релиз отклонён');
      load();
    } catch (e: any) {
      console.error(e);
      alert('Ошибка отклонения: ' + (e.message || e));
    }
  };

  if (loading) return <div className="text-zinc-600">Загрузка демо...</div>;

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-4 sm:mb-6">
        <p className="text-zinc-500 text-xs sm:text-sm">Входящие демо от артистов</p>
        <span className="text-[10px] bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full font-bold self-start sm:self-auto">
          {groups.reduce((s,g)=>s + g.items.filter((i:any)=>i.status==='reviewing').length,0)} на модерации
        </span>
      </div>

      {groups.map(group => (
        <div key={group.batchId} className="bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-5 hover:border-[#6050ba]/50 transition-all">
          <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-3 sm:gap-0">
            <div className="flex gap-3 sm:gap-4">
              <div className="w-16 h-16 sm:w-24 sm:h-24 bg-black/20 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0">
                {group.coverUrl ? <img src={group.coverUrl} className="w-full h-full object-cover" alt="Cover" /> : (
                  <svg className="w-8 h-8 sm:w-12 sm:h-12 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                )}
              </div>
              <div className="space-y-0.5 sm:space-y-1 flex-1 min-w-0">
                <h3 className="font-bold text-white text-sm sm:text-base truncate">{group.releaseTitle || group.items[0].title || group.items[0].track_name}</h3>
                <p className="text-xs sm:text-sm text-zinc-400 truncate">{group.items[0].artist_name || group.items[0].artist}</p>
                <p className="text-[10px] sm:text-xs text-zinc-600 truncate">{group.items[0].email}</p>
                <div className="text-[10px] text-zinc-500 mt-1 sm:mt-2">{group.type === 'album' ? `${group.items.length} трек(ов)` : 'Single'}</div>
                <p className="text-[10px] text-zinc-600">
                  {new Date(group.items[0].created_at).toLocaleDateString('ru-RU')}
                </p>
              </div>
            </div>
            <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 sm:text-right sm:space-y-2 pl-[76px] sm:pl-0">
              <div className={`text-[9px] px-2 py-1 rounded-full text-white font-bold ${
                group.items.some((i:any)=>i.status==='reviewing') ? 'bg-yellow-500' : 
                group.items.every((i:any)=>i.status==='accepted') ? 'bg-green-500' : 'bg-zinc-500'
              }`}>
                {group.items.some((i:any)=>i.status==='reviewing') ? 'На модерации' : 
                 group.items.every((i:any)=>i.status==='accepted') ? 'Принято' : '—'}
              </div>
              {group.items.some((i:any)=>i.status==='reviewing') && (
                <div className="flex gap-2">
                  <button onClick={() => acceptGroup(group)} className="px-4 py-2 sm:px-3 sm:py-1 bg-green-500 hover:bg-green-400 text-black text-xs font-bold rounded-lg transition min-h-[40px] sm:min-h-0">✓</button>
                  <button onClick={() => rejectGroup(group)} className="px-4 py-2 sm:px-3 sm:py-1 bg-red-500 hover:bg-red-400 text-white text-xs font-bold rounded-lg transition min-h-[40px] sm:min-h-0">✗</button>
                </div>
              )}
            </div>
          </div>
          {group.items.length > 1 && (
            <div className="mt-3 pl-[76px] sm:pl-28 space-y-1">
              {group.items.map((item: any, idx: number) => (
                <div key={item.id} className="text-[10px] sm:text-xs text-zinc-500">
                  {idx + 1}. {item.title || item.track_name}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
