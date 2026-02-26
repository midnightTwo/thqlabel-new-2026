"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useTheme } from '@/contexts/ThemeContext';
import { SilverStarsGroup } from '@/components/ui/SilverStars';
import { supabase } from '@/lib/supabase/client';
import { Turnstile } from '@marsidev/react-turnstile';

// Летающие светящиеся частицы
const FloatingParticles = () => {
  const [particles, setParticles] = useState<any[]>([]);
  
  useEffect(() => {
    setParticles(Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 2 + Math.random() * 4,
      duration: 20 + Math.random() * 30,
      delay: Math.random() * -20,
      opacity: 0.3 + Math.random() * 0.5,
    })));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute rounded-full bg-[#9d8df1]"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            opacity: p.opacity,
            boxShadow: '0 0 10px #9d8df1, 0 0 20px #6050ba',
            animation: `particle-fly ${p.duration}s ease-in-out infinite`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes particle-fly {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.3; }
          25% { transform: translate(60px, -80px) scale(1.2); opacity: 0.8; }
          50% { transform: translate(-40px, 60px) scale(0.8); opacity: 0.5; }
          75% { transform: translate(80px, 40px) scale(1.1); opacity: 0.7; }
        }
      `}</style>
    </div>
  );
};

function AuthPage() {
  const { themeName } = useTheme();
  const isLight = themeName === 'light';
  const logoSrc = '/logo.png?v=' + (process.env.NEXT_PUBLIC_BUILD_TIME || '');
  const [mode, setMode] = useState<'login' | 'signup' | 'waiting-confirmation' | 'enter-code' | 'forgot-password'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [telegram, setTelegram] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [otpLoading, setOtpLoading] = useState(false);
  const [savedPassword, setSavedPassword] = useState('');
  const otpRefs = React.useRef<(HTMLInputElement | null)[]>([]);
  const [notification, setNotification] = useState<{show: boolean; message: string; type: 'success' | 'error'}>({show: false, message: '', type: 'success'});
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({show: true, message, type});
    setTimeout(() => setNotification(prev => ({...prev, show: false})), 4000);
  };

  // Проверка URL параметров при загрузке (verified, error)
  useEffect(() => {
    const verified = searchParams.get('verified');
    const error = searchParams.get('error');
    
    if (verified === 'true') {
      showNotification('🎉 Email успешно подтверждён! Теперь вы можете войти в аккаунт.', 'success');
      // Убираем параметр из URL
      window.history.replaceState({}, '', '/auth');
    } else if (error) {
      const errorMessages: { [key: string]: string } = {
        'token_expired': 'Ссылка для подтверждения истекла. Зарегистрируйтесь снова.',
        'invalid_token': 'Недействительная ссылка. Зарегистрируйтесь снова.',
        'registration_failed': 'Ошибка при создании аккаунта. Попробуйте снова.',
        'verification_failed': 'Ошибка подтверждения. Попробуйте снова.'
      };
      showNotification(errorMessages[error] || 'Произошла ошибка', 'error');
      window.history.replaceState({}, '', '/auth');
    }
  }, [searchParams]);

  // Очистка невалидных сессий при загрузке страницы авторизации
  useEffect(() => {
    setMounted(true);
    
    // Проверяем и очищаем проблемные сессии
    const checkSession = async () => {
      if (!supabase) return;
      
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        // Если есть ошибка с refresh token - очищаем всё
        if (error?.message?.includes('Refresh Token') || error?.message?.includes('Invalid')) {
          console.log('Очистка невалидной сессии при загрузке...');
          await supabase.auth.signOut();
          // Очистка localStorage
          const keys = Object.keys(localStorage);
          keys.forEach(key => {
            if (key.includes('supabase') || key.includes('sb-')) {
              localStorage.removeItem(key);
            }
          });
        }
        
        // Если пользователь уже авторизован и email подтверждён - редирект в кабинет
        if (session?.user?.email_confirmed_at) {
          router.push('/cabinet');
        }
      } catch (e) {
        console.error('Ошибка проверки сессии:', e);
        // При любой ошибке очищаем сессию
        try {
          await supabase.auth.signOut();
        } catch (signOutError) {
          console.error('Ошибка выхода:', signOutError);
        }
      }
    };
    
    checkSession();
  }, [router]);

  // Таймер для повторной отправки
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleForgotPassword = async () => {
    if (!supabase || !email) {
      showNotification('Введите email или никнейм', 'error');
      return;
    }
    setLoading(true);
    try {
      // Проверяем является ли это email или никнейм
      let userEmail = email;
      if (!email.includes('@')) {
        // Это никнейм - ищем email по нику
        const { data: profile } = await supabase
          .from('profiles')
          .select('email')
          .eq('nickname', email)
          .single();
        
        if (!profile) {
          throw new Error('Пользователь с таким никнеймом не найден');
        }
        userEmail = (profile && typeof profile === 'object' && 'email' in profile) ? (profile as any).email : null;
      }

      // Отправляем через наш серверный API
      const response = await fetch('/api/send-password-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: userEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Не удалось отправить письмо');
      }

      showNotification('Письмо со ссылкой для сброса пароля отправлено на почту', 'success');
      setMode('login');
      setEmail('');
    } catch (err: any) {
      console.error('Ошибка сброса пароля:', err);
      showNotification(err.message || 'Не удалось отправить письмо', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resendConfirmation = async () => {
    if (!email || resendTimer > 0) return;
    setResendLoading(true);
    try {
      const response = await fetch('/api/send-verification-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password: savedPassword,
          nickname: nickname || email.split('@')[0],
          telegram: telegram || null
        })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Ошибка отправки');
      showNotification('Новый код отправлен на ' + email, 'success');
      setOtpDigits(['', '', '', '', '', '']);
      setResendTimer(60);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err: any) {
      console.error('Ошибка повторной отправки:', err);
      showNotification(err.message || 'Не удалось отправить код', 'error');
    } finally {
      setResendLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = digit;
    setOtpDigits(newDigits);
    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
    // Автосабмит при заполнении последней цифры
    if (digit && index === 5) {
      const fullCode = [...newDigits.slice(0, 5), digit].join('');
      if (fullCode.length === 6) submitOtp(fullCode);
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        otpRefs.current[index - 1]?.focus();
      }
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (text.length > 0) {
      const newDigits = ['', '', '', '', '', ''];
      text.split('').forEach((d, i) => { newDigits[i] = d; });
      setOtpDigits(newDigits);
      const nextEmpty = Math.min(text.length, 5);
      otpRefs.current[nextEmpty]?.focus();
      if (text.length === 6) submitOtp(text);
    }
  };

  const submitOtp = async (code?: string) => {
    const finalCode = code || otpDigits.join('');
    if (finalCode.length !== 6) {
      showNotification('Введите все 6 цифр кода', 'error');
      return;
    }
    setOtpLoading(true);
    try {
      const response = await fetch('/api/verify-otp-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: finalCode })
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Неверный код');
      }
      showNotification('🎉 Аккаунт создан! Выполняем вход...', 'success');
      // Входим с паролем
      if (supabase && result.password) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: result.email,
          password: result.password,
        });
        if (signInError) throw signInError;
      }
      router.push('/cabinet');
    } catch (err: any) {
      console.error('Ошибка OTP:', err);
      showNotification(err.message || 'Неверный код', 'error');
      setOtpDigits(['', '', '', '', '', '']);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) { alert('Supabase не настроен'); return; }
    
    // Проверка капчи
    if (!captchaToken) {
      showNotification('Пожалуйста, пройдите проверку капчи', 'error');
      return;
    }
    
    setLoading(true);
    try {
      // Верификация капчи на сервере
      const captchaRes = await fetch('/api/verify-captcha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: captchaToken })
      });
      const captchaData = await captchaRes.json();
      if (!captchaData.success) {
        showNotification('Проверка капчи не пройдена. Попробуйте снова.', 'error');
        setCaptchaToken(null);
        return;
      }
      
      if (mode === 'signup') {
        // РЕГИСТРАЦИЯ через наш API с SMTP (Brevo)
        const response = await fetch('/api/send-verification-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            email, 
            password,
            nickname: nickname || email.split('@')[0],
            telegram: telegram || null
          })
        });
        
        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.error || 'Ошибка регистрации');
        }
        
        // Успешно отправлен OTP код
        showNotification('Код подтверждения отправлен на ' + email, 'success');
        setSavedPassword(password);
        setMode('enter-code');
        setPassword('');
        setOtpDigits(['', '', '', '', '', '']);
        setResendTimer(60);
        
      } else if (mode === 'login') {
        // ВХОД - проверяем подтверждение email
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        
        if (error) {
          // Если ошибка про неподтверждённый email
          if (error.message?.includes('Email not confirmed')) {
            await supabase.auth.signOut();
            setMode('waiting-confirmation');
            return;
          }
          throw error;
        }
        
        // Дополнительная проверка подтверждения email
        if (data.user && !data.user.email_confirmed_at && !data.user.confirmed_at) {
          // Email НЕ подтверждён - блокируем вход!
          await supabase.auth.signOut();
          setMode('waiting-confirmation');
          return;
        }
        
        // Email подтверждён - пускаем в систему
        router.push('/cabinet');
      }
    } catch (err: any) {
      console.error('Ошибка авторизации:', err);
      
      // Функция перевода английских ошибок Supabase
      const translateError = (message: string): string => {
        const errorTranslations: { [key: string]: string } = {
          'A user with this email address has already been registered': 'Пользователь с этим email уже зарегистрирован',
          'User already registered': 'Пользователь уже зарегистрирован. Войдите или восстановите пароль.',
          'Email not confirmed': 'Email не подтверждён. Проверьте почту!',
          'Invalid login credentials': 'Неверный email или пароль. Проверьте данные и попробуйте снова.',
          'Email rate limit exceeded': 'Слишком много запросов. Подождите немного',
          'Password should be at least 6 characters': 'Пароль должен быть не менее 6 символов',
          'Unable to validate email address: invalid format': 'Неверный формат email',
          'Refresh Token': 'Сессия устарела. Пожалуйста, войдите снова.',
          'Invalid Refresh Token': 'Сессия устарела. Пожалуйста, войдите снова.',
          'For security purposes, you can only request this once every 60 seconds': 'Можно запрашивать только раз в 60 секунд',
          'Signups not allowed for this instance': 'Регистрация временно недоступна',
        };
        
        for (const [eng, rus] of Object.entries(errorTranslations)) {
          if (message.toLowerCase().includes(eng.toLowerCase())) {
            return rus;
          }
        }
        return message;
      };
      
      // Обработка ошибки невалидного refresh token - очищаем сессию
      if (err.message?.includes('Refresh Token') || err.message?.includes('Invalid Refresh Token')) {
        console.log('Очистка невалидной сессии...');
        try {
          await supabase.auth.signOut();
          localStorage.removeItem('supabase.auth.token');
          localStorage.removeItem('sb-' + process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0] + '-auth-token');
        } catch (e) {
          console.error('Ошибка очистки сессии:', e);
        }
        showNotification('Сессия устарела. Пожалуйста, войдите снова.', 'error');
      } else if (err.message?.includes('Email not confirmed')) {
        showNotification('Email не подтверждён. Проверьте почту!', 'error');
        setMode('waiting-confirmation');
      } else {
        // Используем универсальный перевод для остальных ошибок
        showNotification(translateError(err.message) || 'Произошла ошибка. Попробуйте позже.', 'error');
        
        // Дополнительная логика для waiting-confirmation режима
        if (err.message?.includes('User already registered')) {
          // Пользователь мог уже зарегистрироваться, но не подтвердить email
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Анимированный фон с градиентами */}
      <div 
        className="fixed inset-0"
        style={{
          background: `
            radial-gradient(ellipse 100% 80% at 50% -20%, rgba(96, 80, 186, 0.5) 0%, transparent 50%),
            radial-gradient(ellipse 80% 60% at 100% 100%, rgba(157, 141, 241, 0.3) 0%, transparent 50%),
            radial-gradient(ellipse 80% 60% at 0% 100%, rgba(96, 80, 186, 0.25) 0%, transparent 50%),
            #08080a
          `,
          zIndex: 0
        }}
      />

      {/* Летающие частицы */}
      <FloatingParticles />
      
      {/* Серебряные 3D звёзды */}
      <SilverStarsGroup variant="auth" />

      {/* Уведомление */}
      {notification.show && (
        <div className="fixed top-6 right-6 z-[9999] animate-[slideIn_0.4s_cubic-bezier(0.68,-0.55,0.265,1.55)]">
          <div className={`px-5 py-3.5 rounded-2xl backdrop-blur-2xl border-2 shadow-2xl max-w-[380px] ${
            notification.type === 'success' 
              ? 'bg-gradient-to-br from-emerald-500/20 to-green-600/20 border-emerald-400/50 shadow-emerald-500/20' 
              : 'bg-gradient-to-br from-red-500/20 to-rose-600/20 border-red-400/50 shadow-red-500/20'
          }`}>
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                notification.type === 'success' 
                  ? 'bg-emerald-500/30 text-emerald-300' 
                  : 'bg-red-500/30 text-red-300'
              }`}>
                {notification.type === 'success' ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm text-white font-medium leading-relaxed">{notification.message}</p>
              </div>
            </div>
          </div>
        </div>
      )}
      <style jsx>{`
        @keyframes slideIn {
          from { 
            transform: translateX(400px) scale(0.8); 
            opacity: 0; 
          }
          to { 
            transform: translateX(0) scale(1); 
            opacity: 1; 
          }
        }
      `}</style>

      {/* Кнопка "На главную" - фиксированная в верхнем левом углу */}
      <div className="fixed top-6 left-6 z-50">
        <Link 
          href="/feed" 
          className="inline-flex items-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/15 backdrop-blur-xl border border-white/20 rounded-xl text-sm font-bold uppercase tracking-widest transition-all hover:scale-105 shadow-lg text-white hover:text-white"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          На главную
        </Link>
      </div>

      {/* Контейнер: лого СБОКУ слева, форма справа */}
      <div className={`relative z-10 w-full transition-all duration-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
        <div className="min-h-screen flex flex-col lg:flex-row items-center">
          
          {/* Мобильное лого вверху */}
          <div className="lg:hidden w-full pt-24 pb-10 flex items-center justify-center">
            <img 
              src={logoSrc} 
              alt="thqlabel" 
              className={`h-24 w-auto object-contain drop-shadow-[0_0_50px_rgba(96,80,186,0.7)] ${isLight ? 'invert brightness-0' : ''}`}
            />
          </div>

          {/* Левая часть: большое лого фиксированной ширины (только desktop) */}
          <div className="hidden lg:block w-[500px] flex-shrink-0 pl-8">
            <div className="flex items-center justify-start">
              <img 
                src={logoSrc} 
                alt="thqlabel" 
                className={`h-40 w-auto object-contain drop-shadow-[0_0_80px_rgba(96,80,186,0.8)] ${isLight ? 'invert brightness-0' : ''}`}
                style={{ transform: 'scale(4)', transformOrigin: 'left center' }}
              />
            </div>
          </div>

          {/* Правая часть: форма нормального размера */}
          <div className="flex-1 flex items-center justify-center px-8 lg:px-12 w-full">
            <div className="w-full max-w-md lg:ml-auto lg:mr-12">
              {/* Форма авторизации/регистрации */}
              <div 
                className="bg-[#0c0c0e]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8"
                style={{ boxShadow: '0 0 80px rgba(96, 80, 186, 0.15)' }}
              >
                {mode === 'enter-code' ? (
                  /* Экран ввода OTP кода */
                  <div className="text-center space-y-6">
                    <div className="w-20 h-20 mx-auto rounded-full bg-[#6050ba]/10 flex items-center justify-center">
                      <svg className="w-10 h-10 text-[#6050ba]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>

                    <div>
                      <h3 className="text-2xl font-black text-white mb-2">Введите код</h3>
                      <p className="text-sm text-zinc-400 leading-relaxed">
                        Мы отправили 6-значный код на<br/>
                        <span className="text-white font-bold">{email}</span>
                      </p>
                    </div>

                    {/* 6 инпутов для цифр */}
                    <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
                      {otpDigits.map((digit, i) => (
                        <input
                          key={i}
                          ref={el => { otpRefs.current[i] = el; }}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={e => handleOtpChange(i, e.target.value)}
                          onKeyDown={e => handleOtpKeyDown(i, e)}
                          disabled={otpLoading}
                          className="w-11 h-14 text-center text-2xl font-black bg-white/5 border-2 rounded-xl text-white outline-none transition-all focus:border-[#6050ba] focus:bg-[#6050ba]/10 border-white/10 disabled:opacity-50"
                          style={{ caretColor: 'transparent' }}
                          autoFocus={i === 0}
                        />
                      ))}
                    </div>

                    <button
                      onClick={() => submitOtp()}
                      disabled={otpLoading || otpDigits.join('').length !== 6}
                      className={`w-full py-4 rounded-xl text-[12px] font-black uppercase tracking-widest transition-all text-white ${
                        otpLoading || otpDigits.join('').length !== 6
                          ? 'bg-[#6050ba]/30 cursor-not-allowed'
                          : 'bg-gradient-to-r from-[#6050ba] to-[#7060ca] hover:shadow-lg hover:shadow-[#6050ba]/40'
                      }`}
                    >
                      {otpLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Проверка...
                        </span>
                      ) : 'Подтвердить'}
                    </button>

                    <button
                      onClick={resendConfirmation}
                      disabled={resendLoading || resendTimer > 0}
                      className={`w-full py-3 rounded-xl text-sm font-medium transition-all ${
                        resendLoading || resendTimer > 0
                          ? 'bg-white/5 text-zinc-500 cursor-not-allowed'
                          : 'bg-white/10 hover:bg-white/15 text-white border border-white/20'
                      }`}
                    >
                      {resendLoading ? 'Отправка...' : resendTimer > 0 ? `Новый код через ${resendTimer} сек.` : 'Отправить новый код'}
                    </button>

                    <button
                      onClick={() => { setMode('signup'); setOtpDigits(['','','','','','']); }}
                      className="w-full py-3 rounded-xl text-sm font-medium transition-all bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-zinc-400 hover:text-white flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                      </svg>
                      Назад
                    </button>
                  </div>
                ) : mode === 'waiting-confirmation' ? (
                  /* Экран ожидания подтверждения email */
                  <div className="text-center space-y-6">
                    <div className="w-20 h-20 mx-auto rounded-full bg-[#6050ba]/10 flex items-center justify-center">
                      <svg className="w-10 h-10 text-[#6050ba]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    
                    <div>
                      <h3 className="text-2xl font-black text-white mb-2">Проверьте почту</h3>
                      <p className="text-sm text-zinc-400 leading-relaxed">
                        Мы отправили письмо с подтверждением на<br/>
                        <span className="text-white font-bold">{email}</span>
                      </p>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-left space-y-2">
                      <p className="text-xs text-zinc-400">• Откройте письмо и нажмите на ссылку подтверждения</p>
                      <p className="text-xs text-zinc-400">• Проверьте папку "Спам", если письмо не пришло</p>
                      <p className="text-xs text-zinc-400">• Письмо может прийти в течение 1-2 минут</p>
                    </div>

                    <button
                      onClick={resendConfirmation}
                      disabled={resendLoading || resendTimer > 0}
                      className={`w-full py-4 rounded-xl text-sm font-bold transition-all ${
                        resendLoading || resendTimer > 0
                          ? 'bg-white/5 text-zinc-500 cursor-not-allowed' 
                          : 'bg-white/10 hover:bg-white/15 text-white border border-white/20'
                      }`}
                    >
                      {resendLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Отправка...
                        </span>
                      ) : resendTimer > 0 ? (
                        `Повторная отправка через ${resendTimer} сек.`
                      ) : (
                        'Отправить письмо повторно'
                      )}
                    </button>

                    <button
                      onClick={() => {
                        setMode('login');
                        setPassword('');
                      }}
                      className="w-full py-3 rounded-xl text-sm font-medium transition-all bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-zinc-400 hover:text-white flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                      </svg>
                      Вернуться к входу
                    </button>
                  </div>
                ) : mode === 'forgot-password' ? (
                  <form onSubmit={(e) => { e.preventDefault(); handleForgotPassword(); }} className="space-y-6 animate-[fadeIn_0.3s_ease-in-out]">
                    <div className="flex items-center gap-4 mb-8">
                      <button
                        type="button"
                        onClick={() => setMode('login')}
                        className="text-zinc-400 hover:text-white transition"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                      </button>
                      <h2 className="text-xl font-bold text-white">Восстановление пароля</h2>
                    </div>

                    <p className="text-sm text-zinc-400 leading-relaxed">
                      Введите email или никнейм от вашего аккаунта. Мы отправим письмо со ссылкой для сброса пароля.
                    </p>

                    <div>
                      <label className="text-[10px] text-zinc-400 uppercase tracking-widest block mb-2">Email или никнейм</label>
                      <input 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        placeholder="email@example.com или ваш никнейм" 
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white outline-none focus:border-[#6050ba] focus:bg-white/10 transition placeholder-zinc-500"
                      />
                    </div>

                    <button 
                      type="submit"
                      disabled={loading || !email}
                      className={`w-full py-4 rounded-xl text-[12px] font-black uppercase tracking-widest transition-all text-white ${
                        loading || !email
                          ? 'bg-[#6050ba]/30 cursor-wait' 
                          : 'bg-gradient-to-r from-[#6050ba] to-[#7060ca] hover:shadow-lg hover:shadow-[#6050ba]/40'
                      }`}
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Отправка...
                        </span>
                      ) : 'Отправить письмо'}
                    </button>
                  </form>
                ) : (
                  <>
                {/* Табы */}
                <div className="flex gap-2 mb-5 bg-white/[0.03] p-1 rounded-full">
                  <button 
                    type="button"
                    onClick={() => setMode('login')} 
                    className={`flex-1 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all ${
                      mode === 'login' 
                        ? 'bg-[#6050ba] text-white shadow-lg shadow-[#6050ba]/30' 
                        : 'text-zinc-500 hover:text-white'
                    }`}
                  >
                    Войти
                  </button>
                  <button 
                    type="button"
                    onClick={() => setMode('signup')} 
                    className={`flex-1 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all ${
                      mode === 'signup' 
                        ? 'bg-[#6050ba] text-white shadow-lg shadow-[#6050ba]/30' 
                        : 'text-zinc-500 hover:text-white'
                    }`}
                  >
                    Регистрация
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3">
                  {mode === 'signup' && (
                    <>
                    <div className="animate-[fadeIn_0.3s_ease-in-out] group/nick">
                      <div className="flex items-center gap-2 mb-1">
                        <label className="text-[10px] text-zinc-400 uppercase tracking-widest">Никнейм</label>
                        {/* Иконка с подсказкой */}
                        <div className="relative">
                          <svg className="w-3.5 h-3.5 text-amber-400 cursor-help animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                          {/* Тултип при наведении на иконку ИЛИ при фокусе на инпуте */}
                          <div className="absolute left-0 bottom-full mb-2 w-64 p-2.5 bg-zinc-900 border border-amber-500/30 rounded-lg shadow-xl opacity-0 invisible hover:opacity-100 hover:visible group-focus-within/nick:opacity-100 group-focus-within/nick:visible transition-all duration-200 z-50">
                            <p className="text-[11px] text-zinc-300 leading-relaxed">
                              <span className="text-amber-400 font-semibold">Важно!</span> Укажите настоящий артистический никнейм — он будет использоваться для выплат и релизов.
                            </p>
                            <div className="absolute left-3 -bottom-1.5 w-2.5 h-2.5 bg-zinc-900 border-r border-b border-amber-500/30 rotate-45"></div>
                          </div>
                        </div>
                      </div>
                      <input 
                        value={nickname} 
                        onChange={(e) => setNickname(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') {
                            e.currentTarget.blur();
                          }
                        }}
                        placeholder="Твой псевдоним" 
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-[#6050ba] focus:bg-white/10 transition placeholder-zinc-500 peer"
                      />
                    </div>
                    
                    {/* Telegram поле - сразу после никнейма */}
                    <div className="animate-[fadeIn_0.3s_ease-in-out]">
                      <div className="flex items-center gap-2 mb-1">
                        <label className="text-[10px] text-zinc-400 uppercase tracking-widest">Telegram</label>
                        <span className="text-[9px] text-zinc-500">(необязательно)</span>
                      </div>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">@</span>
                        <input 
                          value={telegram} 
                          onChange={(e) => setTelegram(e.target.value.replace('@', ''))}
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') {
                              e.currentTarget.blur();
                            }
                          }}
                          placeholder="username" 
                          className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-4 py-2.5 text-sm text-white outline-none focus:border-[#6050ba] focus:bg-white/10 transition placeholder-zinc-500"
                        />
                      </div>
                      <p className="mt-1 text-[10px] text-zinc-500">Для связи по вопросам выплат и релизов</p>
                    </div>
                    </>
                  )}
                  
                  <div>
                    <label className="text-[10px] text-zinc-400 uppercase tracking-widest block mb-1">Email</label>
                    <input 
                      required 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          e.currentTarget.blur();
                        }
                      }}
                      placeholder="email@example.com" 
                      type="email" 
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-[#6050ba] focus:bg-white/10 transition placeholder-zinc-500"
                    />
                  </div>
                  
                  <div>
                    <label className="text-[10px] text-zinc-400 uppercase tracking-widest block mb-1">Пароль</label>
                    <input 
                      required 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !loading) {
                          e.preventDefault();
                          handleSubmit(e as unknown as React.FormEvent);
                        } else if (e.key === 'Escape') {
                          e.currentTarget.blur();
                        }
                      }}
                      placeholder="••••••••" 
                      type="password" 
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-[#6050ba] focus:bg-white/10 transition placeholder-zinc-500"
                    />
                  </div>
                  
                  {/* Чекбокс согласия на обработку персональных данных (только для регистрации) */}
                  {mode === 'signup' && (
                    <div className="flex items-start gap-2.5 mt-1 animate-[fadeIn_0.3s_ease-in-out]">
                      <input
                        type="checkbox"
                        id="consent-checkbox"
                        checked={consentAccepted}
                        onChange={(e) => setConsentAccepted(e.target.checked)}
                        className="mt-0.5 w-3.5 h-3.5 rounded border-white/20 bg-white/5 text-[#6050ba] focus:ring-[#6050ba] focus:ring-offset-0 cursor-pointer flex-shrink-0"
                      />
                      <span className="text-[11px] text-zinc-400 leading-snug">
                        <span className="cursor-pointer" onClick={() => setConsentAccepted(!consentAccepted)}>Я даю </span>
                        <a
                          href="/consent"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline hover:opacity-80 text-[#9d8df1]"
                        >
                          согласие на обработку персональных данных
                        </a>
                        <span className="cursor-pointer" onClick={() => setConsentAccepted(!consentAccepted)}> и принимаю условия </span>
                        <a
                          href="/offer"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline hover:opacity-80 text-[#9d8df1]"
                        >
                          публичной оферты
                        </a>
                      </span>
                    </div>
                  )}

                  {/* Cloudflare Turnstile капча */}
                  <div className="flex justify-center mt-2">
                    <Turnstile
                      siteKey={
                        typeof window !== 'undefined' && window.location.hostname === 'localhost'
                          ? '1x00000000000000000000AA'
                          : (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA')
                      }
                      onSuccess={(token) => setCaptchaToken(token)}
                      onExpire={() => setCaptchaToken(null)}
                      onError={() => setCaptchaToken(null)}
                      options={{
                        theme: 'dark',
                        size: 'flexible',
                      }}
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={loading || !captchaToken || (mode === 'signup' && !consentAccepted)} 
                    className={`w-full py-3 rounded-xl text-[12px] font-black uppercase tracking-widest transition-all mt-2 text-white ${
                      loading || !captchaToken || (mode === 'signup' && !consentAccepted)
                        ? 'bg-[#6050ba]/30 cursor-wait' 
                        : 'bg-[#6050ba] hover:bg-[#7060ca] hover:scale-[1.02] shadow-lg shadow-[#6050ba]/30'
                    }`}
                  >
                    {loading ? 'Загрузка...' : (mode === 'login' ? 'Войти в аккаунт' : 'Создать аккаунт')}
                  </button>

                  {mode === 'login' && (
                    <div className="text-center mt-4">
                      <button
                        type="button"
                        onClick={() => setMode('forgot-password')}
                        className="text-sm text-zinc-500 hover:text-[#6050ba] transition"
                      >
                        Забыли пароль?
                      </button>
                    </div>
                  )}
                </form>
                </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Экспорт с Suspense для useSearchParams
export default function AuthPageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0c0c0e] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#6050ba] border-t-transparent"></div>
      </div>
    }>
      <AuthPage />
    </Suspense>
  );
}