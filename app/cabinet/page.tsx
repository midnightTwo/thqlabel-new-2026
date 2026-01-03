"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AnimatedBackground from '@/components/ui/AnimatedBackground';
import { useTheme } from '@/contexts/ThemeContext';

// Локальные модули
import { supabase } from './lib/supabase';
import { fetchWithAuth } from './lib/fetchWithAuth';
import { UserRole, ROLE_CONFIG } from './lib/types';
import { useSupportWidget } from '@/lib/hooks/useSupportWidget';

// Компоненты экранов
import { LoadingScreen, UnauthorizedScreen } from './components/screens';

// Компоненты модалок
import { 
  CopyToast,
  NotificationModal,
  ConfirmDialog,
  AvatarCropModal 
} from './components/modals';

// Компоненты вкладок
import UserReleases from './components/reports/UserReleases';
import { FinanceTab } from './components/finance';
import { SettingsTab } from './components/settings';
import { GamesTab, CasesGame } from './components/games';
import AdminRoleHUD from './components/settings/AdminRoleHUD';

// Компоненты сайдбара
import ProfileSidebar from './components/sidebar/ProfileSidebar';
import CreateReleaseSidebar from './components/sidebar/CreateReleaseSidebar';

// Хуки
import { useNotifications } from './hooks/useNotifications';

export default function CabinetPage() {
  const router = useRouter();
  const { theme, themeName } = useTheme();
  const isLight = themeName === 'light';
  
  // Состояние скролла для эффекта слияния с хедером
  const [scrolled, setScrolled] = useState(false);
  const [animationTriggers, setAnimationTriggers] = useState<Set<string>>(new Set());
  
  // Основные состояния (перемещено наверх, чтобы showArchive был доступен в useEffect)
  const [tab, setTab] = useState<'releases' | 'cases' | 'games' | 'finance' | 'settings'>('releases');
  const [creatingRelease, setCreatingRelease] = useState(false);
  const [createTab, setCreateTab] = useState<'release'|'tracklist'|'countries'|'contract'|'platforms'|'localization'|'send'|'events'|'promo'>('release');
  const [showArchive, setShowArchive] = useState(false);
  
  // Обработчик скролла с улучшенными эффектами и дебаунсингом
  useEffect(() => {
    let ticking = false;
    let lastScrollY = 0;
    let lastUpdateTime = 0;
    const scrollThreshold = 10;
    const minUpdateInterval = 50; // Ограничиваем обновления до 20fps для плавности
    
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const now = Date.now();
          const scrollY = window.scrollY;
          
          // Проверяем, прошло ли достаточно времени с последнего обновления
          if (now - lastUpdateTime < minUpdateInterval) {
            ticking = false;
            return;
          }
          
          // Проверяем изменение больше порога, чтобы избежать частых обновлений
          if (Math.abs(scrollY - lastScrollY) < 10) {
            ticking = false;
            return;
          }
          
          lastScrollY = scrollY;
          lastUpdateTime = now;
          
          // В архиве черновиков скролл не должен разделять панели
          const isScrolled = showArchive ? false : scrollY > scrollThreshold;
          
          if (isScrolled !== scrolled) {
            setScrolled(isScrolled);
          }
          
          // Триггеры для анимаций при скролле
          const sections = document.querySelectorAll('[data-animate]');
          sections.forEach((section) => {
            const rect = section.getBoundingClientRect();
            const id = section.getAttribute('data-animate');
            
            if (rect.top < window.innerHeight * 0.8 && rect.bottom > 0) {
              if (id && !animationTriggers.has(id)) {
                setAnimationTriggers(prev => new Set([...prev, id]));
              }
            }
          });
          
          ticking = false;
        });
        ticking = true;
      }
    };

    // Вызываем сразу при монтировании
    handleScroll();
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [animationTriggers, scrolled, showArchive]);
  
  // Данные пользователя
  const [user, setUser] = useState<any>(null);
  const [nickname, setNickname] = useState('');
  const [memberId, setMemberId] = useState('');
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<UserRole>('basic');
  const [originalRole, setOriginalRole] = useState<string | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [avatar, setAvatar] = useState<string>('');
  
  // Финансовые данные
  const [withdrawalRequests, setWithdrawalRequests] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  
  // UI состояние
  const [showToast, setShowToast] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [deletingAvatar, setDeletingAvatar] = useState(false);
  
  // Уведомления
  const { 
    notification, 
    confirmDialog, 
    showNotification,
    hideNotification,
    confirm,
    handleConfirm,
    handleCancel
  } = useNotifications();
  
  // Виджет поддержки
  const supportWidget = useSupportWidget();
  const [unreadTicketsCount, setUnreadTicketsCount] = useState(0);

  const config = ROLE_CONFIG[role];

  // Загрузка заявок на вывод
  const loadWithdrawalRequests = useCallback(async () => {
    if (!supabase || !user?.id) return;
    
    try {
      const { data: requestsData } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (requestsData && requestsData.length > 0) {
        const requestsWithTx = await Promise.all(
          requestsData.map(async (request) => {
            if (!supabase) return { ...request, transaction_id: null };
            const { data: tx } = await supabase
              .from('transactions')
              .select('id')
              .eq('reference_table', 'withdrawal_requests')
              .eq('reference_id', request.id)
              .maybeSingle();
            return { ...request, transaction_id: tx?.id || null };
          })
        );
        setWithdrawalRequests(requestsWithTx);
      } else {
        setWithdrawalRequests([]);
      }
    } catch (e) {
      console.warn('Не удалось загрузить заявки на вывод:', e);
    }
  }, [user?.id]);

  // Загрузка данных пользователя
  useEffect(() => {
    const getUser = async () => {
      if (!supabase) { setLoading(false); return; }
      
      const { data: { user } } = await supabase.auth.getUser();
    
      if (!user) {
        setLoading(false);
        setUser(null);
        return;
      }
    
      setUser(user);
      const displayName = user.user_metadata?.display_name || user.email?.split('@')[0] || 'Artist';
      setNickname(displayName);
      
      // Загружаем профиль
      try {
        const { data: existingProfile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (!existingProfile) {
          // Для новых профилей member_id будет сгенерирован триггером в БД
          const newProfileData = {
            id: user.id,
            email: user.email,
            nickname: displayName,
            balance: 0,
            created_at: user.created_at
          };
          
          const { data: insertedProfile } = await supabase.from('profiles').insert(newProfileData).select().single();
          setRole((insertedProfile?.role as UserRole) || 'basic');
          // Устанавливаем member_id из созданного профиля (сгенерирован триггером с правильным форматом THQ-)
          if (insertedProfile?.member_id) {
            setMemberId(insertedProfile.member_id);
          }
        } else {
          // Загружаем данные из существующего профиля
          console.log('🔍 Загружен профиль из БД:', existingProfile);
          console.log('🔍 member_id из БД:', existingProfile.member_id);
          
          setBalance(Number(existingProfile.balance) || 0);
          if (existingProfile.nickname) setNickname(existingProfile.nickname);
          
          // КРИТИЧНО: Устанавливаем member_id из БД (правильный формат THQ-)
          if (existingProfile.member_id) {
            console.log('✅ Устанавливаем member_id:', existingProfile.member_id);
            setMemberId(existingProfile.member_id);
          } else {
            console.error('❌ member_id отсутствует в профиле БД!');
          }
          
          if (existingProfile.avatar) setAvatar(existingProfile.avatar);
          
          // Загружаем original_role
          if (existingProfile.original_role) {
            console.log('✅ Загружена original_role:', existingProfile.original_role);
            setOriginalRole(existingProfile.original_role);
          } else {
            console.log('⚠️ original_role отсутствует в БД');
          }
          
          const dbRole = existingProfile.role as UserRole;
          if (!dbRole) {
            const { data: recheckProfile } = await supabase.from('profiles').select('role').eq('email', user.email).single();
            setRole((recheckProfile?.role as UserRole) || 'basic');
          } else {
            setRole(dbRole);
          }
        }
      } catch (e) {
        console.warn('Не удалось загрузить/создать профиль:', e);
        setRole('basic');
      }
      
      // Загружаем заявки на вывод
      try {
        const { data: requestsData } = await supabase
          .from('withdrawal_requests')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (requestsData && requestsData.length > 0) {
          const requestsWithTx = await Promise.all(
            requestsData.map(async (request) => {
              if (!supabase) return { ...request, transaction_id: null };
              const { data: tx } = await supabase
                .from('transactions')
                .select('id')
                .eq('reference_table', 'withdrawal_requests')
                .eq('reference_id', request.id)
                .maybeSingle();
              return { ...request, transaction_id: tx?.id || null };
            })
          );
          setWithdrawalRequests(requestsWithTx);
        }
      } catch (e) {
        console.warn('Не удалось загрузить заявки на вывод:', e);
      }
      
      // Загружаем историю начислений
      try {
        const { data: payoutsData } = await supabase
          .from('payouts')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (payoutsData && payoutsData.length > 0) {
          const payoutsWithTx = await Promise.all(
            payoutsData.map(async (payout) => {
              if (!supabase) return { ...payout, transaction_id: null };
              const { data: tx } = await supabase
                .from('transactions')
                .select('id')
                .eq('reference_table', 'payouts')
                .eq('reference_id', payout.id)
                .maybeSingle();
              return { ...payout, transaction_id: tx?.id || null };
            })
          );
          setPayouts(payoutsWithTx);
        }
      } catch (e) {
        console.warn('Не удалось загрузить историю начислений:', e);
      }
      
      setLoading(false);
    };
    
    getUser();
    
    return () => {
      if ((window as any).__cleanupSubscriptions) {
        (window as any).__cleanupSubscriptions();
      }
    };
  }, [router]);

  // Polling для непрочитанных тикетов
  useEffect(() => {
    if (!user) return;

    const loadUnreadCount = async () => {
      try {
        const response = await fetchWithAuth('/api/support/unread-count');
        if (response.ok) {
          const data = await response.json();
          setUnreadTicketsCount(data.count || 0);
        }
      } catch (err) {
        console.error('Error loading unread count:', err);
      }
    };

    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 10000);
    return () => clearInterval(interval);
  }, [user]);

  // Слушаем изменения auth состояния
  useEffect(() => {
    if (!supabase) return;
    
    const handleAuthChange = async (event: string, session: any) => {
      if (event === 'USER_UPDATED' && session?.user && supabase) {
        await supabase
          .from('profiles')
          .update({ email: session.user.email })
          .eq('id', session.user.id);
        
        window.location.reload();
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthChange);
    return () => { subscription.unsubscribe(); };
  }, []);

  // Обработчики
  const handleSignOut = async () => {
    if (supabase) await supabase.auth.signOut();
    router.push('/auth');
  };

  const handleShowToast = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  // Сохранение обрезанного изображения аватара
  const handleAvatarSave = async (croppedImageBlob: Blob) => {
    if (!supabase || !user) return;
    
    setUploadingAvatar(true);
    try {
      // Удаляем старый аватар если есть
      if (avatar && avatar.includes('avatars/')) {
        const oldPath = avatar.split('/avatars/')[1];
        await supabase.storage.from('avatars').remove([oldPath]);
      }
      
      // Определяем MIME и расширение исходного Blob (если возможно), чтобы не принудительно конвертировать в JPG
      const mimeType = (croppedImageBlob as any)?.type || 'image/jpeg';
      const ext = mimeType.split('/')[1] ? mimeType.split('/')[1].replace('jpeg', 'jpg') : 'jpg';
      const fileName = `${user.id}/${Date.now()}.${ext}`;

      // Загружаем новый аватар с корректным contentType (например image/gif для GIF)
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, croppedImageBlob, {
          contentType: mimeType,
          upsert: true
        });
      
      if (uploadError) throw uploadError;
      
      // Получаем публичный URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);
      
      // Обновляем профиль
      await supabase.from('profiles').update({ avatar: publicUrl }).eq('email', user.email);
      
      setAvatar(publicUrl);
      setShowAvatarModal(false);
      showNotification('Аватар успешно обновлён!', 'success');
    } catch (error: any) {
      console.error('Ошибка загрузки аватара:', error);
      showNotification('Ошибка загрузки: ' + error.message, 'error');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Удаление аватара
  const handleAvatarDelete = async () => {
    if (!supabase || !user) return;
    
    setDeletingAvatar(true);
    try {
      // Удаляем файл из storage
      if (avatar && avatar.includes('avatars/')) {
        const filePath = avatar.split('/avatars/')[1];
        await supabase.storage.from('avatars').remove([filePath]);
      }
      
      // Обновляем профиль
      await supabase.from('profiles').update({ avatar: null }).eq('email', user.email);
      
      setAvatar('');
      setShowAvatarModal(false);
      showNotification('Аватар удалён', 'success');
    } catch (error: any) {
      console.error('Ошибка удаления аватара:', error);
      showNotification('Ошибка удаления: ' + error.message, 'error');
    } finally {
      setDeletingAvatar(false);
    }
  };

  const handleCloseAvatarModal = () => {
    setShowAvatarModal(false);
  };

  // Экран загрузки
  if (loading) {
    return <LoadingScreen />;
  }

  // Экран для неавторизованных
  if (!user) {
    return <UnauthorizedScreen />;
  }

  return (
    <div className={`min-h-screen relative z-10 text-white`} style={{ paddingTop: '70px' }}>
      <AnimatedBackground />
      
      {/* Spotlight эффект следующий за мышью */}
      <div 
        className="cabinet-spotlight hidden lg:block"
        style={{ 
          left: '50%', 
          top: '50%',
        }}
      />
      
      {/* Улучшенные декоративные элементы */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Большие градиентные орбы */}
        <div 
          className={`absolute w-[500px] h-[500px] rounded-full blur-3xl floating-element ${isLight ? 'bg-gradient-to-r from-purple-300/20 via-pink-300/15 to-violet-300/20' : 'bg-gradient-to-r from-purple-500/10 via-pink-500/5 to-violet-500/10'}`}
          style={{ top: '-10%', left: '-10%', animation: 'float-orb 20s ease-in-out infinite' }}
        />
        <div 
          className={`absolute w-[400px] h-[400px] rounded-full blur-3xl floating-element ${isLight ? 'bg-gradient-to-r from-blue-300/15 via-cyan-300/20 to-teal-300/15' : 'bg-gradient-to-r from-blue-500/8 via-cyan-500/10 to-teal-500/8'}`}
          style={{ top: '60%', right: '-5%', animation: 'float-orb 25s ease-in-out infinite reverse', animationDelay: '-5s' }}
        />
        <div 
          className={`absolute w-[300px] h-[300px] rounded-full blur-2xl floating-element ${isLight ? 'bg-gradient-to-r from-indigo-300/15 to-purple-300/20' : 'bg-gradient-to-r from-indigo-500/8 to-purple-500/10'}`}
          style={{ bottom: '10%', left: '20%', animation: 'float-orb 18s ease-in-out infinite', animationDelay: '-10s' }}
        />
        
        {/* Анимированные линии */}
        <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="lineGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={isLight ? '#8a63d2' : '#6050ba'} stopOpacity="0" />
              <stop offset="50%" stopColor={isLight ? '#8a63d2' : '#6050ba'} stopOpacity="0.5" />
              <stop offset="100%" stopColor={isLight ? '#8a63d2' : '#6050ba'} stopOpacity="0" />
            </linearGradient>
          </defs>
          <line x1="0" y1="30%" x2="100%" y2="70%" stroke="url(#lineGrad1)" strokeWidth="1" className="animate-pulse" />
          <line x1="100%" y1="20%" x2="0" y2="80%" stroke="url(#lineGrad1)" strokeWidth="1" className="animate-pulse" style={{ animationDelay: '1s' }} />
        </svg>
      </div>
      
      {/* Плавающие частицы */}
      <div className="cabinet-particles">
        {[...Array(8)].map((_, i) => (
          <div 
            key={i}
            className="cabinet-particle"
            style={{
              left: `${10 + i * 12}%`,
              animationDelay: `${i * 2}s`,
              animationDuration: `${12 + i * 3}s`,
            }}
          />
        ))}
      </div>
      
      <div 
        className="max-w-[1600px] mx-auto flex flex-col lg:flex-row items-start relative z-10"
        style={{ 
          padding: scrolled ? '20px 24px 32px' : '0px 24px 32px',
          marginTop: '0',
          gap: scrolled ? '20px' : '0px',
          maxWidth: scrolled ? '2200px' : '1600px',
          transition: 'gap 0.5s ease, max-width 0.5s ease, padding 0.5s ease',
        }}
      >
        
        {/* Сайдбар */}
        <aside 
          className={`lg:w-64 w-full glass-card-hover interactive-glass flex flex-col lg:sticky ${isLight ? 'cabinet-sidebar-light' : 'glass-morphism-sidebar'}`}
          style={{
            borderRadius: scrolled ? '24px' : '16px 0 0 0',
            top: '70px',
            padding: '24px',
            marginTop: '0px',
            height: 'calc(100vh - 70px)',
            minHeight: 'calc(100vh - 70px)',
            maxHeight: 'calc(100vh - 70px)',
            borderTop: scrolled 
              ? `1px solid ${isLight ? 'rgba(100,80,140,0.2)' : 'rgba(157, 141, 241, 0.15)'}` 
              : '1px solid transparent',
            borderRight: scrolled 
              ? `1px solid ${isLight ? 'rgba(100,80,140,0.1)' : 'rgba(157, 141, 241, 0.08)'}` 
              : '1px solid transparent',
            borderBottom: scrolled 
              ? `1px solid ${isLight ? 'rgba(255,255,255,0.1)' : 'rgba(157, 141, 241, 0.08)'}` 
              : '1px solid transparent',
            boxSizing: 'border-box',
            transition: 'border-radius 0.3s ease, border-color 0.3s ease',
            willChange: 'transform',
            overflow: 'auto',
            overscrollBehavior: 'contain',
          }}
          data-animate="sidebar"
        >
          {creatingRelease ? (
            <CreateReleaseSidebar
              createTab={createTab}
              onCreateTabChange={setCreateTab}
              onBack={() => { setCreatingRelease(false); setCreateTab('release'); }}
            />
          ) : (
            <ProfileSidebar
              user={user}
              nickname={nickname}
              memberId={memberId}
              role={role}
              avatar={avatar}
              activeTab={tab}
              unreadTicketsCount={unreadTicketsCount}
              onTabChange={setTab}
              onShowAvatarModal={() => setShowAvatarModal(true)}
              onSupportToggle={() => supportWidget.toggle()}
              showToast={handleShowToast}
              isLight={isLight}
            />
          )}
        </aside>

        {/* Красивый визуальный разделитель с эффектами */}
        <div 
          className="hidden lg:flex items-center justify-center relative transition-all duration-500" 
          style={{ 
            width: scrolled ? '50px' : '0px',
            opacity: scrolled ? 1 : 0,
            marginTop: scrolled ? '0' : '0',
            overflow: 'hidden',
          }}
        >
          {/* Основная линия с градиентом */}
          <div 
            className="absolute inset-y-0 flex items-center justify-center transition-all duration-500"
            style={{
              width: '2px',
              background: isLight 
                ? 'linear-gradient(to bottom, transparent 0%, rgba(138,99,210,0.6) 15%, rgba(167,139,250,0.8) 50%, rgba(138,99,210,0.6) 85%, transparent 100%)'
                : 'linear-gradient(to bottom, transparent 0%, rgba(96,80,186,0.5) 15%, rgba(157,141,241,0.8) 50%, rgba(96,80,186,0.5) 85%, transparent 100%)',
              boxShadow: isLight 
                ? '0 0 30px rgba(138,99,210,0.5), 0 0 60px rgba(138,99,210,0.3)'
                : '0 0 30px rgba(157,141,241,0.5), 0 0 60px rgba(157,141,241,0.3)',
              filter: 'blur(0.5px)',
            }}
          />
          
          {/* Анимированные точки на линии */}
          {[20, 35, 50, 65, 80].map((pos, idx) => (
            <div 
              key={idx}
              className="absolute w-3 h-3 rounded-full"
              style={{
                top: `${pos}%`,
                background: isLight 
                  ? 'radial-gradient(circle, rgba(138,99,210,1) 0%, rgba(167,139,250,0.8) 40%, transparent 70%)'
                  : 'radial-gradient(circle, rgba(157,141,241,1) 0%, rgba(96,80,186,0.8) 40%, transparent 70%)',
                boxShadow: isLight 
                  ? '0 0 15px rgba(138,99,210,0.8), 0 0 30px rgba(138,99,210,0.4)'
                  : '0 0 15px rgba(157,141,241,0.8), 0 0 30px rgba(157,141,241,0.4)',
                animation: `pulse 3s ease-in-out infinite ${idx * 0.6}s`,
              }}
            />
          ))}
          
          {/* Блик движущийся по линии */}
          <div 
            className="absolute w-1 h-20 rounded-full"
            style={{
              background: isLight 
                ? 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.9), transparent)'
                : 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.6), transparent)',
              animation: 'divider-glow-move 4s ease-in-out infinite',
            }}
          />
        </div>

        {/* Контент */}
        <section 
          className={`flex-1 glass-card-hover interactive-glass ${isLight ? 'cabinet-content-light' : 'glass-morphism-card'}`}
          style={{
            borderRadius: scrolled ? '24px' : '0 16px 0 0',
            padding: '40px',
            minHeight: 'calc(100vh - 70px)',
            marginTop: '0px',
            borderTop: scrolled 
              ? `1px solid ${isLight ? 'rgba(100,80,140,0.2)' : 'rgba(157, 141, 241, 0.15)'}` 
              : '1px solid transparent',
            borderLeft: scrolled 
              ? `1px solid ${isLight ? 'rgba(100,80,140,0.1)' : 'rgba(157, 141, 241, 0.08)'}` 
              : '1px solid transparent',
            borderBottom: scrolled 
              ? `1px solid ${isLight ? 'rgba(255,255,255,0.1)' : 'rgba(157, 141, 241, 0.08)'}` 
              : '1px solid transparent',
            boxSizing: 'border-box',
            transition: 'border-radius 0.3s ease, border-color 0.3s ease',
          }}
        >
          
          {tab === 'releases' && (
            <div className="transition-all duration-300 ease-out" style={{ opacity: 1 }}>
              <UserReleases 
                userId={user?.id} 
                nickname={nickname} 
                onOpenUpload={() => {
                  // Basic пользователи идут на release-basic/create, остальные на release/create
                  const createPath = role === 'basic' 
                    ? '/cabinet/release-basic/create' 
                    : '/cabinet/release/create';
                  router.push(createPath);
                }} 
                userRole={role}
                showNotification={showNotification}
                onShowArchiveChange={setShowArchive}
              />
            </div>
          )}

          {tab === 'cases' && (
            <div className="transition-all duration-300 ease-out" style={{ opacity: 1 }}>
              <CasesGame
                userId={user?.id}
                balance={balance}
                onBalanceChange={setBalance}
                showNotification={showNotification}
                isLight={isLight}
              />
            </div>
          )}
          
          {tab === 'finance' && (
            <div className="transition-all duration-300 ease-out" style={{ opacity: 1 }}>
              <FinanceTab
                userId={user?.id}
                balance={balance}
                setBalance={setBalance}
                payouts={payouts}
                withdrawalRequests={withdrawalRequests}
                showNotification={showNotification}
                reloadRequests={loadWithdrawalRequests}
              />
            </div>
          )}
          
          {tab === 'settings' && (
            <div className="transition-all duration-300 ease-out" style={{ opacity: 1 }}>
              <SettingsTab
                user={user}
                nickname={nickname}
                memberId={memberId}
                role={role}
                originalRole={originalRole}
                avatar={avatar}
                onSignOut={handleSignOut}
                onShowAvatarModal={() => setShowAvatarModal(true)}
                showToast={handleShowToast}
              />
            </div>
          )}
        </section>
      </div>

      {/* Плавающие декоративные частицы - улучшенные */}
      <div className="fixed inset-0 pointer-events-none z-5 overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <div 
            key={i}
            className={`absolute rounded-full ${i % 3 === 0 ? 'w-3 h-3' : i % 2 === 0 ? 'w-2 h-2' : 'w-1.5 h-1.5'} ${
              isLight 
                ? 'bg-gradient-to-r from-purple-400/40 to-pink-400/40' 
                : 'bg-gradient-to-r from-purple-400/30 to-pink-400/30'
            } glow-element`}
            style={{
              left: `${5 + i * 8}%`,
              top: `${20 + (i % 5) * 15}%`,
              animationDelay: `${i * 0.8}s`,
              animationDuration: `${4 + i * 0.5}s`,
              boxShadow: isLight 
                ? '0 0 15px rgba(138, 99, 210, 0.4)' 
                : '0 0 15px rgba(157, 141, 241, 0.4)',
            }}
          />
        ))}
      </div>

      {/* Toast уведомление о копировании */}
      <CopyToast show={showToast} />
      
      {/* Уведомление сверху */}
      <NotificationModal 
        show={notification.show} 
        message={notification.message} 
        type={notification.type}
        onClose={hideNotification}
      />
      
      {/* Диалог подтверждения */}
      <ConfirmDialog
        show={confirmDialog.show}
        message={confirmDialog.message}
        description={confirmDialog.description}
        type={confirmDialog.type}
        confirmText={confirmDialog.confirmText}
        cancelText={confirmDialog.cancelText}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
      
      {/* Модалка аватара с кадрированием */}
      <AvatarCropModal
        show={showAvatarModal}
        onClose={handleCloseAvatarModal}
        avatar={avatar}
        nickname={nickname}
        role={role}
        uploadingAvatar={uploadingAvatar}
        deletingAvatar={deletingAvatar}
        onSaveImage={handleAvatarSave}
        onDelete={handleAvatarDelete}
        showNotification={showNotification}
      />

      {/* Режим тестирования ролей - только на вкладке настроек для owner/admin */}
      {tab === 'settings' && (originalRole === 'admin' || originalRole === 'owner' || role === 'admin' || role === 'owner') && (
        <AdminRoleHUD
          currentRole={role}
          originalRole={originalRole || role}
          userId={user?.id}
        />
      )}
    </div>
  );
}
