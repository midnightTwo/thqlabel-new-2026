"use client";
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

const OWNER_EMAIL = 'maksbroska@gmail.com';

const PRESETS = [
  { label: 'Технические работы', value: 'Плановые технические работы. Скоро вернёмся!' },
  { label: 'Обновление системы', value: 'Идёт обновление системы. Это займёт совсем немного времени.' },
  { label: 'Временно недоступен', value: 'Сайт временно недоступен. Приносим извинения за неудобства.' },
  { label: 'Сайт закрыт', value: 'Сайт закрыт.' },
  { label: 'Свой текст', value: '' },
];

const PRESETS_LABELS = [
  'Технические работы',
  'Обновление системы',
  'Временно недоступен',
  'Сайт закрыт',
  'Свой текст',
];

const TABS = [
  { id: 'maintenance', icon: 'lock', label: 'Закрытие сайта' },
  { id: 'stats', icon: 'chart', label: 'Статистика' },
  { id: 'ban', icon: 'ban', label: 'Бан' },
  { id: 'broadcast', icon: 'radio', label: 'Рассылка' },
  { id: 'impersonate', icon: 'user', label: 'Войти как' },
];

function IconLock() {
  return (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );
}
function IconChart() {
  return (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  );
}
function IconBan() {
  return (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
    </svg>
  );
}
function IconRadio() {
  return (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"/>
    </svg>
  );
}
function IconUser() {
  return (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  );
}
function IconShield() {
  return (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  );
}

function getTabIcon(icon: string) {
  if (icon === 'lock') return <IconLock />;
  if (icon === 'chart') return <IconChart />;
  if (icon === 'ban') return <IconBan />;
  if (icon === 'radio') return <IconRadio />;
  if (icon === 'user') return <IconUser />;
  return null;
}

export default function SysPanel() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [token, setToken] = useState('');
  const [activeTab, setActiveTab] = useState('maintenance');
  const [toast, setToast] = useState<{ text: string; ok: boolean } | null>(null);

  // maintenance
  const [maintenance, setMaintenance] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [customMsg, setCustomMsg] = useState('');
  const [maintenanceSaving, setMaintenanceSaving] = useState(false);

  // stats
  const [stats, setStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // ban
  const [banEmail, setBanEmail] = useState('');
  const [banLoading, setBanLoading] = useState(false);
  const [banResult, setBanResult] = useState('');

  // broadcast
  const [bTitle, setBTitle] = useState('');
  const [bMsg, setBMsg] = useState('');
  const [bLoading, setBLoading] = useState(false);
  const [bResult, setBResult] = useState('');

  // impersonate
  const [impEmail, setImpEmail] = useState('');
  const [impLink, setImpLink] = useState('');
  const [impLoading, setImpLoading] = useState(false);

  const showToast = (text: string, ok = true) => {
    setToast({ text, ok });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || session.user.email !== OWNER_EMAIL) {
        router.replace('/');
        return;
      }
      setToken(session.access_token);
      setAuthorized(true);
      setLoading(false);
      const res = await fetch('/api/owner/settings');
      const data = await res.json();
      setMaintenance(!!data.maintenance_mode);
    })();
  }, [router]);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await fetch('/api/owner/stats', {
        headers: { authorization: 'Bearer ' + token },
      });
      setStats(await res.json());
    } catch {}
    setStatsLoading(false);
  }, [token]);

  useEffect(() => {
    if (authorized && activeTab === 'stats') loadStats();
  }, [authorized, activeTab, loadStats]);

  const toggleMaintenance = async (on: boolean) => {
    const msg = selectedPreset === 4 ? customMsg : PRESETS[selectedPreset].value;
    setMaintenanceSaving(true);
    try {
      const res = await fetch('/api/owner/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', authorization: 'Bearer ' + token },
        body: JSON.stringify({ maintenance_mode: on, maintenance_message: msg }),
      });
      const data = await res.json();
      if (data.success) {
        setMaintenance(on);
        showToast(on ? 'Сайт закрыт' : 'Сайт открыт');
      } else {
        showToast('Ошибка: ' + data.error, false);
      }
    } catch { showToast('Ошибка сети', false); }
    setMaintenanceSaving(false);
  };

  const handleBan = async (action: 'ban' | 'unban') => {
    setBanLoading(true);
    setBanResult('');
    try {
      const res = await fetch('/api/owner/ban', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', authorization: 'Bearer ' + token },
        body: JSON.stringify({ email: banEmail, action }),
      });
      const data = await res.json();
      setBanResult(data.message || data.error || '');
    } catch { setBanResult('Ошибка сети'); }
    setBanLoading(false);
  };

  const handleBroadcast = async () => {
    setBLoading(true);
    setBResult('');
    try {
      const res = await fetch('/api/owner/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', authorization: 'Bearer ' + token },
        body: JSON.stringify({ title: bTitle, message: bMsg }),
      });
      const data = await res.json();
      setBResult(data.success ? 'Отправлено ' + data.sent + ' пользователям' : 'Ошибка: ' + data.error);
    } catch { setBResult('Ошибка сети'); }
    setBLoading(false);
  };

  const handleImpersonate = async () => {
    setImpLoading(true);
    setImpLink('');
    try {
      const res = await fetch('/api/owner/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', authorization: 'Bearer ' + token },
        body: JSON.stringify({ email: impEmail }),
      });
      const data = await res.json();
      if (data.link) setImpLink(data.link);
      else showToast('Ошибка: ' + data.error, false);
    } catch { showToast('Ошибка сети', false); }
    setImpLoading(false);
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0a0a12', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Проверка доступа...</div>
    </div>
  );

  if (!authorized) return null;

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a12', display: 'flex', fontFamily: 'system-ui, -apple-system, sans-serif', color: '#fff' }}>

      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 99999,
          background: toast.ok ? '#6050ba' : '#dc2626',
          borderRadius: 12, padding: '12px 20px',
          color: '#fff', fontSize: 13, fontWeight: 600,
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          border: '1px solid rgba(255,255,255,0.15)',
        }}>{toast.text}</div>
      )}

      {/* Sidebar */}
      <aside style={{
        width: 72, flexShrink: 0,
        background: 'rgba(255,255,255,0.03)',
        borderRight: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '18px 0', gap: 4,
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12, marginBottom: 24,
          background: 'linear-gradient(135deg, #6050ba, #9d8df1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, fontWeight: 900, color: '#fff', flexShrink: 0,
        }}>S</div>

        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            title={tab.label}
            style={{
              width: 46, height: 46, borderRadius: 12,
              border: activeTab === tab.id ? '1px solid rgba(157,141,241,0.5)' : '1px solid transparent',
              background: activeTab === tab.id ? 'rgba(96,80,186,0.4)' : 'transparent',
              color: activeTab === tab.id ? '#c4b5fd' : 'rgba(255,255,255,0.35)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s', flexShrink: 0,
            }}
          >{getTabIcon(tab.icon)}</button>
        ))}

        <div style={{ flex: 1 }} />

        <a
          href="/admin"
          title="Админ-панель"
          style={{
            width: 46, height: 46, borderRadius: 12,
            border: '1px solid transparent',
            color: 'rgba(255,255,255,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            textDecoration: 'none', transition: 'all 0.15s', flexShrink: 0,
          }}
        ><IconShield /></a>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, padding: '40px 56px', overflowY: 'auto', maxWidth: 760 }}>

        <div style={{ marginBottom: 36 }}>
          <h1 style={{ margin: '0 0 6px 0', fontSize: 24, fontWeight: 900, letterSpacing: -0.5 }}>
            {TABS.find(t => t.id === activeTab)?.label}
          </h1>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>
            Панель владельца &middot; {OWNER_EMAIL}
          </div>
        </div>

        {/* MAINTENANCE TAB */}
        {activeTab === 'maintenance' && (
          <div>
            <div style={{
              padding: '24px 28px', borderRadius: 18, marginBottom: 16,
              background: maintenance ? 'rgba(220,38,38,0.12)' : 'rgba(22,163,74,0.12)',
              border: '1px solid ' + (maintenance ? 'rgba(220,38,38,0.3)' : 'rgba(22,163,74,0.3)'),
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>
                  {maintenance ? 'Сайт ЗАКРЫТ' : 'Сайт ОТКРЫТ'}
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
                  {maintenance ? 'Недоступен для всех пользователей' : 'Все пользователи имеют доступ'}
                </div>
              </div>
              <div
                onClick={() => !maintenanceSaving && toggleMaintenance(!maintenance)}
                style={{
                  width: 56, height: 30, borderRadius: 30, cursor: 'pointer', flexShrink: 0,
                  background: maintenance ? '#dc2626' : 'rgba(255,255,255,0.15)',
                  position: 'relative', transition: 'background 0.25s',
                }}
              >
                <div style={{
                  position: 'absolute', top: 4, left: maintenance ? 30 : 4,
                  width: 22, height: 22, borderRadius: '50%', background: '#fff',
                  transition: 'left 0.25s', boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                }} />
              </div>
            </div>

            <div style={{
              padding: '22px 26px', borderRadius: 18, marginBottom: 16,
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
            }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 14, fontWeight: 700 }}>
                Сообщение
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                {PRESETS_LABELS.map((label, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedPreset(i)}
                    style={{
                      padding: '7px 14px', borderRadius: 9, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      background: selectedPreset === i ? 'rgba(96,80,186,0.4)' : 'rgba(255,255,255,0.05)',
                      border: '1px solid ' + (selectedPreset === i ? 'rgba(157,141,241,0.6)' : 'rgba(255,255,255,0.08)'),
                      color: selectedPreset === i ? '#c4b5fd' : 'rgba(255,255,255,0.45)',
                    }}
                  >{label}</button>
                ))}
              </div>
              {selectedPreset === 4 ? (
                <textarea
                  value={customMsg}
                  onChange={e => setCustomMsg(e.target.value)}
                  placeholder="Свой текст..."
                  rows={2}
                  style={{
                    width: '100%', background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
                    padding: '10px 14px', color: '#fff', fontSize: 13,
                    resize: 'vertical', outline: 'none', boxSizing: 'border-box',
                  }}
                />
              ) : (
                <div style={{
                  padding: '10px 14px', borderRadius: 10,
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                  color: 'rgba(255,255,255,0.4)', fontSize: 13, fontStyle: 'italic',
                }}>"{PRESETS[selectedPreset].value}"</div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => toggleMaintenance(true)}
                disabled={maintenanceSaving}
                style={{
                  padding: '11px 24px', background: 'linear-gradient(135deg,#dc2626,#b91c1c)',
                  border: 'none', borderRadius: 12, color: '#fff', fontWeight: 700,
                  fontSize: 13, cursor: 'pointer',
                }}
              >{maintenanceSaving ? '...' : 'Закрыть сайт'}</button>
              <button
                onClick={() => toggleMaintenance(false)}
                disabled={maintenanceSaving}
                style={{
                  padding: '11px 24px', background: 'linear-gradient(135deg,#16a34a,#15803d)',
                  border: 'none', borderRadius: 12, color: '#fff', fontWeight: 700,
                  fontSize: 13, cursor: 'pointer',
                }}
              >{maintenanceSaving ? '...' : 'Открыть сайт'}</button>
            </div>
          </div>
        )}

        {/* STATS TAB */}
        {activeTab === 'stats' && (
          <div>
            <button
              onClick={loadStats}
              style={{
                marginBottom: 24, padding: '8px 18px',
                background: 'rgba(96,80,186,0.35)', border: '1px solid rgba(157,141,241,0.4)',
                borderRadius: 10, color: '#c4b5fd', fontWeight: 700, fontSize: 12, cursor: 'pointer',
              }}
            >{statsLoading ? '...' : 'Обновить'}</button>

            {stats ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14, marginBottom: 24 }}>
                  {[
                    { label: 'Пользователи', value: stats.users, bg: 'rgba(96,80,186,0.15)', border: 'rgba(96,80,186,0.3)' },
                    { label: 'Релизов всего', value: stats.releases, bg: 'rgba(124,58,237,0.15)', border: 'rgba(124,58,237,0.3)' },
                    { label: 'Basic', value: stats.releasesBasic, bg: 'rgba(8,145,178,0.15)', border: 'rgba(8,145,178,0.3)' },
                    { label: 'Exclusive', value: stats.releasesExclusive, bg: 'rgba(217,119,6,0.15)', border: 'rgba(217,119,6,0.3)' },
                  ].map((s, i) => (
                    <div key={i} style={{ padding: '20px 22px', borderRadius: 16, background: s.bg, border: '1px solid ' + s.border }}>
                      <div style={{ fontSize: 32, fontWeight: 900 }}>{s.value ?? ''}</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
                {stats.recentUsers?.length > 0 && (
                  <div style={{ padding: '20px 24px', borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 14, fontWeight: 700 }}>
                      Последние регистрации
                    </div>
                    {stats.recentUsers.map((u: any, i: number) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '8px 0',
                        borderBottom: i < stats.recentUsers.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                      }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: 9,
                          background: 'rgba(96,80,186,0.4)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 13, fontWeight: 700, color: '#c4b5fd',
                        }}>{(u.nickname || '?')[0].toUpperCase()}</div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{u.nickname}</div>
                          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{u.email}</div>
                        </div>
                        <div style={{ marginLeft: 'auto', fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>
                          {new Date(u.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>Загрузка...</div>
            )}
          </div>
        )}

        {/* BAN TAB */}
        {activeTab === 'ban' && (
          <div style={{ padding: '24px 28px', borderRadius: 18, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 18 }}>
              Заблокировать или разблокировать по email
            </div>
            <input
              value={banEmail}
              onChange={e => setBanEmail(e.target.value)}
              placeholder="user@example.com"
              style={{
                width: '100%', background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
                padding: '11px 14px', color: '#fff', fontSize: 14,
                outline: 'none', boxSizing: 'border-box', marginBottom: 14,
              }}
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => handleBan('ban')}
                disabled={!banEmail || banLoading}
                style={{ padding: '11px 22px', background: 'linear-gradient(135deg,#dc2626,#b91c1c)', border: 'none', borderRadius: 11, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
              >{banLoading ? '...' : 'Забанить'}</button>
              <button
                onClick={() => handleBan('unban')}
                disabled={!banEmail || banLoading}
                style={{ padding: '11px 22px', background: 'linear-gradient(135deg,#16a34a,#15803d)', border: 'none', borderRadius: 11, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
              >{banLoading ? '...' : 'Разбанить'}</button>
            </div>
            {banResult && (
              <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 10, background: 'rgba(96,80,186,0.15)', border: '1px solid rgba(96,80,186,0.3)', color: '#c4b5fd', fontSize: 13 }}>
                {banResult}
              </div>
            )}
          </div>
        )}

        {/* BROADCAST TAB */}
        {activeTab === 'broadcast' && (
          <div style={{ padding: '24px 28px', borderRadius: 18, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 18 }}>
              Отправить системное уведомление всем пользователям
            </div>
            <input
              value={bTitle}
              onChange={e => setBTitle(e.target.value)}
              placeholder="Заголовок"
              style={{
                width: '100%', background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
                padding: '11px 14px', color: '#fff', fontSize: 14,
                outline: 'none', boxSizing: 'border-box', marginBottom: 10,
              }}
            />
            <textarea
              value={bMsg}
              onChange={e => setBMsg(e.target.value)}
              placeholder="Текст сообщения..."
              rows={4}
              style={{
                width: '100%', background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
                padding: '11px 14px', color: '#fff', fontSize: 14,
                outline: 'none', boxSizing: 'border-box', marginBottom: 14, resize: 'vertical',
              }}
            />
            <button
              onClick={handleBroadcast}
              disabled={!bTitle || !bMsg || bLoading}
              style={{ padding: '11px 24px', background: 'linear-gradient(135deg,#6050ba,#9d8df1)', border: 'none', borderRadius: 11, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
            >{bLoading ? 'Отправляем...' : 'Отправить всем'}</button>
            {bResult && (
              <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 10, background: 'rgba(96,80,186,0.15)', border: '1px solid rgba(96,80,186,0.3)', color: '#c4b5fd', fontSize: 13 }}>
                {bResult}
              </div>
            )}
          </div>
        )}

        {/* IMPERSONATE TAB */}
        {activeTab === 'impersonate' && (
          <div style={{ padding: '24px 28px', borderRadius: 18, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 18 }}>
              Одноразовая ссылка для входа от имени любого пользователя
            </div>
            <input
              value={impEmail}
              onChange={e => setImpEmail(e.target.value)}
              placeholder="user@example.com"
              style={{
                width: '100%', background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
                padding: '11px 14px', color: '#fff', fontSize: 14,
                outline: 'none', boxSizing: 'border-box', marginBottom: 14,
              }}
            />
            <button
              onClick={handleImpersonate}
              disabled={!impEmail || impLoading}
              style={{ padding: '11px 24px', background: 'linear-gradient(135deg,#7c3aed,#6050ba)', border: 'none', borderRadius: 11, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
            >{impLoading ? '...' : 'Получить ссылку'}</button>
            {impLink && (
              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 8 }}>Ссылка (одноразовая):</div>
                <a
                  href={impLink}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'block', padding: '12px 14px', borderRadius: 10,
                    background: 'rgba(96,80,186,0.18)', border: '1px solid rgba(96,80,186,0.4)',
                    color: '#c4b5fd', fontSize: 12, wordBreak: 'break-all',
                  }}
                >{impLink}</a>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.22)', marginTop: 8 }}>
                  Открыть в новой вкладке. Ссылка одноразовая.
                </div>
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}