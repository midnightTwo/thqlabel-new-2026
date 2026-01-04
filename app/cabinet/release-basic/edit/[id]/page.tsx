"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import AnimatedBackground from '@/components/ui/AnimatedBackground';
import { supabase } from '../../../lib/supabase';
import {
  ReleaseInfoStep,
  TracklistStep,
  CountriesStep,
  ContractStep,
  PlatformsStep,
  PromoStep,
} from '../../create/components';
import PaymentStep from '../../../release-basic/create/components/PaymentStep';
import SendStep from '../../../release-basic/create/components/SendStep';

// Компонент для редактирования Basic релиза
export default function EditBasicReleasePage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const releaseId = params.id as string;
  const fromPage = searchParams.get('from') || 'cabinet'; // По умолчанию cabinet
  const isDraftMode = searchParams.get('draft') === 'true'; // Режим редактирования черновика

  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState('release');
  const [isAdmin, setIsAdmin] = useState(false);
  const [releaseStatus, setReleaseStatus] = useState('');
  
  // Release form state
  const [releaseTitle, setReleaseTitle] = useState('');
  const [artistName, setArtistName] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [existingCoverUrl, setExistingCoverUrl] = useState('');
  const [genre, setGenre] = useState('');
  const [subgenres, setSubgenres] = useState<string[]>([]);
  const [subgenreInput, setSubgenreInput] = useState('');
  const [releaseDate, setReleaseDate] = useState<string | null>(null);
  const [collaborators, setCollaborators] = useState<string[]>([]);
  const [collaboratorInput, setCollaboratorInput] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [upc, setUpc] = useState('');
  
  // Tracklist state
  const [tracks, setTracks] = useState<Array<{
    title: string;
    link: string;
    audioFile?: File | null;
    audioMetadata?: { format: string; duration?: number; bitrate?: string; sampleRate?: string; size: number } | null;
    hasDrugs: boolean;
    lyrics: string;
    language: string;
    version?: string;
    producers?: string[];
    featuring?: string[];
    isrc?: string;
  }>>([]);
  const [currentTrack, setCurrentTrack] = useState<number | null>(null);
  const [trackTitle, setTrackTitle] = useState('');
  const [trackLink, setTrackLink] = useState('');
  const [trackAudioFile, setTrackAudioFile] = useState<File | null>(null);
  const [trackAudioMetadata, setTrackAudioMetadata] = useState<{ format: string; duration?: number; bitrate?: string; sampleRate?: string; size: number } | null>(null);
  const [trackHasDrugs, setTrackHasDrugs] = useState(false);
  const [trackLyrics, setTrackLyrics] = useState('');
  const [trackLanguage, setTrackLanguage] = useState('');
  const [trackVersion, setTrackVersion] = useState('');
  const [trackProducers, setTrackProducers] = useState<string[]>([]);
  const [trackFeaturing, setTrackFeaturing] = useState<string[]>([]);
  const [trackIsrc, setTrackIsrc] = useState('');
  const [releaseType, setReleaseType] = useState<'single' | 'ep' | 'album' | null>(null);
  
  // Countries state
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  
  // Contract state
  const [agreedToContract, setAgreedToContract] = useState(false);
  
  // Platforms state
  const [selectedPlatforms, setSelectedPlatforms] = useState(0);
  const [selectedPlatformsList, setSelectedPlatformsList] = useState<string[]>([]);
  
  // Promo state
  const [focusTrack, setFocusTrack] = useState('');
  const [focusTrackPromo, setFocusTrackPromo] = useState('');
  const [albumDescription, setAlbumDescription] = useState('');
  const [promoPhotos, setPromoPhotos] = useState<string[]>([]);
  
  const [saving, setSaving] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [lastAutoSave, setLastAutoSave] = useState<string | null>(null);
  const [autoSaveMessage, setAutoSaveMessage] = useState('');
  
  // Payment state
  const [userId, setUserId] = useState<string | null>(null);
  const [paymentReceiptUrl, setPaymentReceiptUrl] = useState('');
  const [paymentComment, setPaymentComment] = useState('');

  useEffect(() => {
    loadRelease();
  }, [releaseId]);

  // Функция для получения текущего состояния завершённости шагов
  const getStepsCompletionState = useCallback(() => {
    return {
      release: !!(releaseTitle.trim() && genre && releaseDate && (coverFile || existingCoverUrl)),
      tracklist: tracks.length > 0,
      countries: selectedCountries.length > 0,
      contract: agreedToContract,
      platforms: selectedPlatforms > 0,
      promo: !!((focusTrack && focusTrackPromo) || albumDescription)
    };
  }, [releaseTitle, genre, releaseDate, coverFile, existingCoverUrl, tracks.length, selectedCountries.length, agreedToContract, selectedPlatforms, focusTrack, focusTrackPromo, albumDescription]);

  // Ref для хранения предыдущего состояния шагов
  const prevStepsRef = useRef<Record<string, boolean> | null>(null);
  const isInitialLoadRef = useRef(true);

  // Автосохранение при завершении шага
  useEffect(() => {
    if (!isDraftMode || releaseStatus !== 'draft' || loading || !userId || !releaseId) return;
    
    const currentSteps = getStepsCompletionState();
    
    // Пропускаем первую загрузку
    if (isInitialLoadRef.current) {
      prevStepsRef.current = currentSteps;
      isInitialLoadRef.current = false;
      return;
    }
    
    // Проверяем, был ли какой-то шаг только что завершён
    if (prevStepsRef.current) {
      const stepNames: Record<string, string> = {
        release: 'Релиз',
        tracklist: 'Треклист',
        countries: 'Страны',
        contract: 'Договор',
        platforms: 'Площадки',
        promo: 'Промо'
      };
      
      for (const [stepId, isComplete] of Object.entries(currentSteps)) {
        const wasComplete = prevStepsRef.current[stepId];
        // Если шаг был не завершён, а теперь завершён - сохраняем
        if (!wasComplete && isComplete) {
          console.log(`Шаг "${stepNames[stepId]}" завершён - автосохранение...`);
          handleAutoSave(stepNames[stepId]);
          break; // Сохраняем только один раз за изменение
        }
      }
    }
    
    prevStepsRef.current = currentSteps;
  }, [getStepsCompletionState, isDraftMode, releaseStatus, loading, userId, releaseId]);

  // Функция автосохранения (без редиректа)
  const handleAutoSave = async (stepName: string) => {
    if (!supabase || !releaseId || !userId || saving) return;
    
    try {
      // Загружаем обложку если есть новая
      let coverUrl = existingCoverUrl;
      if (coverFile) {
        const fileExt = coverFile.name.split('.').pop();
        const fileName = `${userId}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('release-covers')
          .upload(fileName, coverFile, { contentType: coverFile.type, upsert: true });
        
        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('release-covers')
            .getPublicUrl(fileName);
          coverUrl = publicUrl;
          setExistingCoverUrl(publicUrl);
          setCoverFile(null);
        }
      }
      
      const { error: updateError } = await supabase
        .from('releases_basic')
        .update({
          title: releaseTitle,
          artist_name: artistName,
          genre: genre,
          subgenres: subgenres,
          release_date: releaseDate,
          collaborators: collaborators,
          tracks: tracks,
          countries: selectedCountries,
          contract_agreed: agreedToContract,
          platforms: selectedPlatformsList,
          focus_track: focusTrack,
          focus_track_promo: focusTrackPromo,
          album_description: albumDescription,
          promo_photos: promoPhotos,
          cover_url: coverUrl,
          release_type: releaseType,
          updated_at: new Date().toISOString()
        })
        .eq('id', releaseId)
        .eq('user_id', userId);
      
      if (!updateError) {
        setAutoSaveMessage(`✓ Шаг "${stepName}" сохранён`);
        setLastAutoSave(new Date().toISOString());
        setTimeout(() => setAutoSaveMessage(''), 3000);
      }
    } catch (error) {
      console.error('Ошибка автосохранения:', error);
    }
  };

  const loadRelease = async () => {
    if (!supabase || !releaseId) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth');
        return;
      }
      
      // Сохраняем userId
      setUserId(user.id);

      // Получаем профиль для nickname и проверяем роль
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, role')
        .eq('id', user.id)
        .single();
      
      console.log('=== BASIC RELEASE EDIT DEBUG ===');
      console.log('User ID:', user.id);
      console.log('Profile:', profile);
      console.log('Role:', profile?.role);
      
      const userIsAdmin = profile?.role === 'admin' || profile?.role === 'super_admin' || profile?.role === 'owner';
      console.log('Is Admin:', userIsAdmin);
      setIsAdmin(userIsAdmin);

      // Загружаем релиз - админы могут загружать любые релизы
      console.log('Building query for release ID:', releaseId);
      let query = supabase
        .from('releases_basic')
        .select('*')
        .eq('id', releaseId);
      
      // Обычные пользователи могут загружать только свои релизы
      if (!userIsAdmin) {
        console.log('Not admin - filtering by user_id:', user.id);
        query = query.eq('user_id', user.id);
      } else {
        console.log('Admin access - loading any release');
      }
      
      const { data: release, error } = await query.single();
      
      console.log('Query result:', { release, error });
      console.log('Release user_id:', release?.user_id);
      console.log('Current user_id:', user.id);

      if (error || !release) {
        console.error('Ошибка загрузки релиза:', error);
        alert('Релиз не найден или у вас нет прав на его редактирование');
        router.push(userIsAdmin ? '/admin' : '/cabinet');
        return;
      }

      // Обычные пользователи могут редактировать только pending и draft релизы
      // Админы могут редактировать любые релизы
      if (!userIsAdmin && release.status !== 'pending' && release.status !== 'draft') {
        alert('Редактирование возможно только для релизов на модерации или черновиков');
        router.push('/cabinet');
        return;
      }

      // Заполняем форму данными релиза
      setReleaseTitle(release.title || '');
      setArtistName(release.artist_name || '');
      setExistingCoverUrl(release.cover_url || '');
      setGenre(release.genre || '');
      setSubgenres(release.subgenres || []);
      setReleaseDate(release.release_date || null);
      setCollaborators(release.collaborators || []);
      setTracks(release.tracks || []);
      setSelectedCountries(release.countries || []);
      setAgreedToContract(release.contract_agreed || false);
      setSelectedPlatformsList(release.platforms || []);
      setSelectedPlatforms((release.platforms || []).length);
      setFocusTrack(release.focus_track || '');
      setFocusTrackPromo(release.focus_track_promo || '');
      setAlbumDescription(release.album_description || '');
      setPromoPhotos(release.promo_photos || []);
      setReleaseStatus(release.status || '');
      setUpc(release.upc || '');
      
      // Загружаем тип релиза из БД (если есть)
      if (release.release_type) {
        setReleaseType(release.release_type as 'single' | 'ep' | 'album');
      } else {
        // Фолбэк: определяем тип релиза на основе количества треков
        const tracksCount = (release.tracks || []).length;
        if (tracksCount === 1) {
          setReleaseType('single');
        } else if (tracksCount >= 2 && tracksCount <= 7) {
          setReleaseType('ep');
        } else if (tracksCount >= 8) {
          setReleaseType('album');
        }
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Ошибка загрузки релиза:', error);
      alert('Ошибка загрузки релиза');
      router.push(isAdmin ? '/admin' : '/cabinet');
    }
  };

  const handleSave = async (submitToModeration = false) => {
    if (!supabase || !releaseId) return;
    
    console.log('=== НАЧАЛО СОХРАНЕНИЯ ЧЕРНОВИКА (BASIC) ===');
    console.log('Submit to moderation:', submitToModeration);
    console.log('Release Status:', releaseStatus);
    console.log('Release ID:', releaseId);
    console.log('Existing Cover URL:', existingCoverUrl);
    console.log('Cover File:', coverFile);
    
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('Нет пользователя!');
        return;
      }
      console.log('User ID:', user.id);

      // Если загружена новая обложка, загружаем её
      let coverUrl = existingCoverUrl; // Сохраняем существующую обложку
      if (coverFile) {
        const fileExt = coverFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('release-covers')
          .upload(fileName, coverFile, { contentType: coverFile.type, upsert: true });
        
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('release-covers')
          .getPublicUrl(fileName);
          
        coverUrl = publicUrl;
      }

      // Загрузка новых аудиофайлов треков
      console.log('📤 Проверяем и загружаем новые аудиофайлы...');
      const tracksWithUrls = await Promise.all(tracks.map(async (track: any, index: number) => {
        // Если есть новый audioFile, загружаем его
        if (track.audioFile && track.audioFile instanceof File) {
          try {
            const audioFileExt = track.audioFile.name.split('.').pop();
            const audioFileName = `${user.id}/${Date.now()}-track-${index}.${audioFileExt}`;
            
            const { data: audioUploadData, error: audioUploadError } = await supabase.storage
              .from('release-audio')
              .upload(audioFileName, track.audioFile, {
                contentType: track.audioFile.type,
                upsert: true
              });
            
            if (audioUploadError) {
              console.error(`Ошибка загрузки аудио для трека ${index}:`, audioUploadError);
              // Возвращаем трек с существующим link
              const { audioFile, ...trackWithoutFile } = track;
              return trackWithoutFile;
            }
            
            const { data: { publicUrl: audioUrl } } = supabase.storage
              .from('release-audio')
              .getPublicUrl(audioFileName);
            
            console.log(`✅ Аудио для трека ${index} загружено: ${audioUrl}`);
            
            // Возвращаем трек с новым URL (без audioFile)
            const { audioFile, ...trackWithoutFile } = track;
            return {
              ...trackWithoutFile,
              link: audioUrl,
              audio_url: audioUrl,
            };
          } catch (err) {
            console.error(`Ошибка при загрузке аудио для трека ${index}:`, err);
            const { audioFile, ...trackWithoutFile } = track;
            return trackWithoutFile;
          }
        }
        
        // Убираем audioFile из объекта (если есть) перед сохранением в БД
        if (track.audioFile) {
          const { audioFile, ...trackWithoutFile } = track;
          return trackWithoutFile;
        }
        
        return track;
      }));

      // Обновляем релиз
      const updateData: any = {
        title: releaseTitle,
        artist_name: artistName,
        genre: genre,
        subgenres: subgenres,
        release_date: releaseDate,
        collaborators: collaborators,
        release_type: releaseType,
        tracks: tracksWithUrls,
        countries: selectedCountries,
        contract_agreed: agreedToContract,
        contract_agreed_at: agreedToContract ? new Date().toISOString() : null,
        platforms: selectedPlatformsList,
        focus_track: focusTrack,
        focus_track_promo: focusTrackPromo,
        album_description: albumDescription,
        promo_photos: promoPhotos,
        upc: upc || null,
        updated_at: new Date().toISOString()
      };
      
      // ТОЛЬКО при отправке на модерацию меняем статус draft -> pending
      if (submitToModeration && releaseStatus === 'draft') {
        updateData.status = 'pending';
      }
      
      // Всегда сохраняем cover_url (или существующий, или новый)
      if (coverUrl) {
        updateData.cover_url = coverUrl;
      }
      
      // Отладка: проверяем данные треков и промо
      console.log('=== SAVING BASIC RELEASE ===');
      console.log('Треки для обновления:', JSON.stringify(tracksWithUrls, null, 2));
      console.log('Focus Track:', focusTrack);
      console.log('Focus Track Promo:', focusTrackPromo);
      console.log('Album Description:', albumDescription);
      console.log('Submit to moderation:', submitToModeration);
      console.log('Cover URL:', coverUrl);
      console.log('Full updateData:', JSON.stringify(updateData, null, 2));

      // Обновляем релиз - админы могут обновлять любые релизы
      let updateQuery: any = supabase
        .from('releases_basic')
        .update(updateData)
        .eq('id', releaseId);
      
      // Обычные пользователи могут обновлять только свои релизы
      if (!isAdmin) {
        updateQuery = updateQuery.eq('user_id', user.id);
      }
      
      // select() ДОЛЖЕН быть последним в цепочке
      updateQuery = updateQuery.select();
      
      const { error, data } = await updateQuery;

      if (error) {
        console.error('Ошибка UPDATE (BASIC):', error);
        console.error('Полная информация об ошибке:', JSON.stringify(error, null, 2));
        alert('Ошибка сохранения: ' + error.message);
        throw error;
      }
      
      console.log('=== УСПЕШНОЕ СОХРАНЕНИЕ (BASIC) ===');
      console.log('Updated data:', data);
      console.log('Количество обновленных строк:', data?.length || 0);
      
      if (!data || data.length === 0) {
        console.error('ПРЕДУПРЕЖДЕНИЕ: Ни одна строка не была обновлена!');
        console.error('Release ID:', releaseId);
        console.error('User ID:', user.id);
        console.error('Is Admin:', isAdmin);
      }

      setIsFadingOut(false);
      setShowSuccessToast(true);
      setTimeout(() => setIsFadingOut(true), 1000);
      setTimeout(() => {
        setShowSuccessToast(false);
        const redirectPath = fromPage === 'admin' ? '/admin' : '/cabinet';
        router.push(redirectPath);
      }, 1400);
    } catch (error: any) {
      console.error('Ошибка сохранения:', error);
      alert('Ошибка при сохранении релиза: ' + (error.message || 'Неизвестная ошибка'));
    } finally {
      setSaving(false);
    }
  };

  // Обработчик "Оплатить позже" - сохраняет релиз со статусом awaiting_payment
  const handlePayLater = async () => {
    if (!supabase || !releaseId || !userId) return;
    
    if (!canProceedToPayment) {
      alert('Заполните все обязательные поля');
      return;
    }
    
    setSaving(true);
    try {
      // Загружаем обложку если есть новая
      let coverUrl = existingCoverUrl;
      if (coverFile) {
        const fileExt = coverFile.name.split('.').pop();
        const fileName = `${userId}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('release-covers')
          .upload(fileName, coverFile, { contentType: coverFile.type, upsert: true });
        
        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('release-covers')
            .getPublicUrl(fileName);
          coverUrl = publicUrl;
        }
      }
      
      // Обновляем релиз со статусом awaiting_payment
      // Расчёт стоимости в зависимости от типа релиза
      const paymentAmount = releaseType === 'single' ? 500 : releaseType === 'ep' ? 1000 : releaseType === 'album' ? 1500 : 500;
      
      const { error: updateError } = await supabase
        .from('releases_basic')
        .update({
          title: releaseTitle,
          artist_name: artistName,
          genre: genre,
          subgenres: subgenres,
          release_date: releaseDate,
          collaborators: collaborators,
          tracks: tracks,
          countries: selectedCountries,
          contract_agreed: agreedToContract,
          platforms: selectedPlatformsList,
          focus_track: focusTrack,
          focus_track_promo: focusTrackPromo,
          album_description: albumDescription,
          promo_photos: promoPhotos,
          cover_url: coverUrl,
          release_type: releaseType,
          status: 'awaiting_payment',
          payment_status: 'pending',
          payment_amount: paymentAmount,
          updated_at: new Date().toISOString()
        })
        .eq('id', releaseId)
        .eq('user_id', userId);
      
      if (updateError) throw updateError;
      
      setIsFadingOut(false);
      setShowSuccessToast(true);
      setTimeout(() => setIsFadingOut(true), 1000);
      setTimeout(() => {
        setShowSuccessToast(false);
        router.push('/cabinet');
      }, 1400);
    } catch (error: any) {
      console.error('Ошибка сохранения:', error);
      alert('Ошибка: ' + (error.message || 'Неизвестная ошибка'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        <AnimatedBackground />
        <div className="text-zinc-600 animate-pulse relative z-10">Загрузка релиза...</div>
      </div>
    );
  }

  // Минимальное количество треков в зависимости от типа релиза
  const getMinTracks = (type: typeof releaseType): number => {
    if (type === 'ep') return 2;
    if (type === 'album') return 7;
    return 1; // single
  };

  // Проверка заполненности каждого шага
  const isStepComplete = (stepId: string): boolean => {
    switch(stepId) {
      case 'release':
        return !!(releaseTitle.trim() && genre && releaseDate && (coverFile || existingCoverUrl));
      case 'tracklist':
        return tracks.length >= getMinTracks(releaseType);
      case 'countries':
        return selectedCountries.length > 0;
      case 'contract':
        return agreedToContract;
      case 'platforms':
        return selectedPlatforms > 0;
      case 'promo':
        // Промо считается завершенным, если заполнены фокус-трек с описанием ИЛИ описание альбома
        return !!(
          (focusTrack && focusTrackPromo) || 
          albumDescription
        );
      case 'payment':
        return !!paymentReceiptUrl;
      case 'send':
        return false; // Финальный шаг
      default:
        return false;
    }
  };

  // Базовые шаги
  const baseSteps = [
    { id: 'release', label: 'Релиз', icon: '1' },
    { id: 'tracklist', label: 'Треклист', icon: '2' },
    { id: 'countries', label: 'Страны', icon: '3' },
    { id: 'contract', label: 'Договор', icon: '4' },
    { id: 'platforms', label: 'Площадки', icon: '5' },
    { id: 'promo', label: 'Промо', icon: '6' },
  ];
  
  // Для черновиков добавляем шаги оплаты и отправки
  const steps = isDraftMode && releaseStatus === 'draft' 
    ? [...baseSteps, { id: 'payment', label: 'Оплата', icon: '₽' }, { id: 'send', label: 'Отправка', icon: '✈' }]
    : baseSteps;

  // Подсчёт заполненных обязательных шагов (promo не обязателен, payment и send не считаем)
  const requiredStepIds = baseSteps.filter(s => s.id !== 'promo').map(s => s.id);
  const completedSteps = baseSteps.filter(step => requiredStepIds.includes(step.id) && isStepComplete(step.id)).length;
  const totalRequiredSteps = requiredStepIds.length;
  const progress = (completedSteps / totalRequiredSteps) * 100;

  // Плавный градиент от красного через оранжевый/желтый к зелёному
  const getProgressColor = () => {
    if (completedSteps === 0) return { from: '#ef4444', to: '#dc2626' }; // red
    if (completedSteps === 1) return { from: '#f97316', to: '#ea580c' }; // orange
    if (completedSteps === 2) return { from: '#fbbf24', to: '#f59e0b' }; // amber
    if (completedSteps === 3) return { from: '#a3e635', to: '#84cc16' }; // lime
    if (completedSteps === 4) return { from: '#4ade80', to: '#22c55e' }; // green-light
    return { from: '#10b981', to: '#059669' }; // emerald (5/5)
  };

  const progressColor = getProgressColor();
  
  // Проверка можно ли перейти к оплате (все обязательные шаги заполнены)
  const canProceedToPayment = !!(
    releaseTitle.trim() && 
    genre && 
    releaseDate &&
    (coverFile || existingCoverUrl) && 
    tracks.length >= getMinTracks(releaseType) && 
    selectedCountries.length > 0 &&
    agreedToContract && 
    selectedPlatforms > 0
  );

  return (
    <div className="min-h-screen pt-16 sm:pt-20 text-white relative z-10">
      <AnimatedBackground />
      <div className="max-w-[1600px] mx-auto p-3 sm:p-4 md:p-6 lg:p-8 flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8 items-stretch relative z-10">
        
        {/* Боковая панель с шагами - Glassmorphism (как в создании релиза) */}
        <aside className="lg:w-64 w-full backdrop-blur-xl border rounded-3xl p-6 pb-8 flex-col lg:self-start lg:sticky lg:top-24 shadow-2xl relative overflow-hidden hidden lg:flex bg-gradient-to-br from-white/[0.07] to-white/[0.02] border-white/10 shadow-black/20">
          {/* Декоративный градиент */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 pointer-events-none" />
          
          {/* Заголовок с кнопкой назад */}
          <div className="mb-4 relative z-10">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-lg bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent">
                {isDraftMode ? 'Черновик' : 'Редактирование'}
              </h3>
              <button
                onClick={() => router.push(fromPage === 'admin' ? '/admin' : '/cabinet')}
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 flex items-center justify-center transition-all group/back"
                title="В кабинет"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-400 group-hover/back:text-white transition-colors">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
              </button>
            </div>
            <p className="text-xs text-zinc-400">Basic Plan</p>
          </div>
          
          {/* Индикатор типа релиза */}
          {releaseType && (
            <div className="mb-3 p-3 backdrop-blur-lg bg-gradient-to-br from-purple-500/20 via-purple-500/10 to-blue-500/20 border border-white/20 rounded-xl relative overflow-hidden group hover:border-white/30 transition-all">
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide">Формат</span>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Иконка типа */}
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                    releaseType === 'single' ? 'bg-purple-500/20' :
                    releaseType === 'ep' ? 'bg-blue-500/20' :
                    'bg-emerald-500/20'
                  }`}>
                    {releaseType === 'single' && (
                      <svg className="w-3 h-3 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M9 18V5l12-2v13" />
                        <circle cx="6" cy="18" r="3" />
                        <circle cx="18" cy="16" r="3" />
                      </svg>
                    )}
                    {releaseType === 'ep' && (
                      <svg className="w-3 h-3 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="12" cy="12" r="10" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                    {releaseType === 'album' && (
                      <svg className="w-3 h-3 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                      </svg>
                    )}
                  </div>
                  
                  {/* Текст */}
                  <div className="flex-1">
                    <div className="font-bold text-sm text-white">
                      {releaseType === 'single' && 'Сингл'}
                      {releaseType === 'ep' && 'EP'}
                      {releaseType === 'album' && 'Альбом'}
                    </div>
                    <div className={`text-[10px] font-medium ${
                      releaseType === 'single' ? 'text-purple-400' :
                      releaseType === 'ep' ? 'text-blue-400' :
                      'text-emerald-400'
                    }`}>
                      {releaseType === 'single' && '1 трек'}
                      {releaseType === 'ep' && '2-7 треков'}
                      {releaseType === 'album' && '8-50 треков'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="space-y-2 relative z-10">
            {steps.map((step) => {
              const isComplete = isStepComplete(step.id);
              const isCurrent = currentStep === step.id;
              
              return (
                <button 
                  key={step.id} 
                  onClick={() => setCurrentStep(step.id)}
                  className={`w-full text-left py-3 px-4 rounded-xl flex items-center gap-3 transition-all relative overflow-hidden group/step ${
                    isCurrent 
                      ? 'backdrop-blur-md bg-gradient-to-r from-purple-500/40 to-purple-600/40 text-white shadow-lg shadow-purple-500/30 border border-white/20' 
                      : 'backdrop-blur-sm bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white border border-transparent hover:border-white/10'
                  }`}
                >
                  {/* Hover эффект */}
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/10 to-purple-500/0 opacity-0 group-hover/step:opacity-100 transition-opacity duration-300" />
                  <div className="relative z-10 flex items-center gap-3 w-full">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    isComplete && step.id !== 'send' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10'
                  }`}>
                    {isComplete && step.id !== 'send' ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <polyline points="20 6 9 17 4 12" strokeWidth="3"/>
                      </svg>
                    ) : step.id === 'send' ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M22 2L11 13" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M22 2L15 22L11 13L2 9L22 2Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : (
                      step.icon
                    )}
                  </span>
                  <span className="text-sm font-medium">{step.label}</span>
                  {isCurrent && (
                    <span className="ml-auto w-2 h-2 rounded-full bg-white animate-pulse shadow-lg shadow-white/50" />
                  )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Прогресс */}
          <div className="mt-auto pt-4 sm:pt-6 border-t border-white/10 px-1">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-zinc-400 font-medium">Прогресс</span>
              <div className="flex items-center font-mono text-sm leading-none">
                <span 
                  className="font-bold transition-colors duration-500 drop-shadow-sm" 
                  style={{ color: progressColor.from, textShadow: `0 0 8px ${progressColor.from}60` }}
                >
                  {completedSteps}
                </span>
                <span className="text-zinc-500 mx-0.5">/</span>
                <span className="text-zinc-400 font-bold">{totalRequiredSteps}</span>
              </div>
            </div>
            
            {/* Сегментированный прогресс-бар с красивым свечением */}
            <div className="relative">
              {/* Свечение под прогресс-баром */}
              {completedSteps > 0 && (
                <div 
                  className="absolute -inset-1 rounded-xl blur-md opacity-40 transition-all duration-700"
                  style={{ 
                    background: `linear-gradient(90deg, ${progressColor.from}, ${progressColor.to})`,
                    width: `${(completedSteps / totalRequiredSteps) * 100}%`
                  }}
                />
              )}
              
              {/* Фоновые сегменты */}
              <div className="flex gap-1.5 relative">
                {Array.from({ length: totalRequiredSteps }, (_, i) => (
                  <div 
                    key={i} 
                    className="flex-1 h-3 rounded-full bg-white/5 border border-white/10 overflow-hidden relative"
                  >
                    {/* Заполненный сегмент */}
                    <div 
                      className={`absolute inset-0 transition-all duration-500 ease-out ${
                        i < completedSteps ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                      }`}
                      style={{ 
                        background: `linear-gradient(135deg, ${progressColor.from}, ${progressColor.to})`,
                        boxShadow: i < completedSteps ? `0 0 12px ${progressColor.from}80, 0 0 4px ${progressColor.from}, inset 0 1px 0 rgba(255,255,255,0.4)` : 'none',
                        transitionDelay: `${i * 60}ms`
                      }}
                    >
                      {/* Верхний блик */}
                      <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/40 to-transparent rounded-t-full" />
                      {/* Анимированный блик на последнем заполненном */}
                      {i === completedSteps - 1 && completedSteps > 0 && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Статус */}
            <div className="flex items-center justify-center mt-3 gap-2">
              {completedSteps === totalRequiredSteps ? (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 shadow-lg shadow-emerald-500/20">
                  <svg className="w-3.5 h-3.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  <span className="text-[11px] font-semibold text-emerald-400">Готово к оплате</span>
                </div>
              ) : (
                <span className="text-[11px] text-zinc-500">
                  Осталось <span className="font-semibold" style={{ color: progressColor.from }}>{totalRequiredSteps - completedSteps}</span> {totalRequiredSteps - completedSteps === 1 ? 'шаг' : 'шагов'}
                </span>
              )}
            </div>
          </div>

          {/* Кнопки - скрываем на шагах payment и send */}
          {isDraftMode && releaseStatus === 'draft' && currentStep !== 'payment' && currentStep !== 'send' ? (
            <div className="space-y-2 sm:space-y-3 mt-3 sm:mt-4">
              {/* Статус автосохранения */}
              {autoSaveMessage && (
                <div className="text-xs text-emerald-400 text-center py-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20 animate-pulse">
                  {autoSaveMessage}
                </div>
              )}
              <button
                onClick={() => setCurrentStep('payment')}
                disabled={saving || !canProceedToPayment}
                className={`relative w-full py-3 sm:py-4 rounded-xl text-sm sm:text-base font-bold transition overflow-hidden group flex items-center justify-center gap-2 ${
                  saving || !canProceedToPayment
                    ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-500 to-purple-400 text-white shadow-lg shadow-purple-500/20'
                }`}
              >
                {!(saving || !canProceedToPayment) && (
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                )}
                <span className="relative flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                  </svg>
                  Перейти к оплате
                </span>
              </button>
              {!canProceedToPayment && (
                <p className="text-xs text-zinc-500 text-center">
                  Заполните все обязательные поля для перехода к оплате
                </p>
              )}
            </div>
          ) : currentStep !== 'payment' && currentStep !== 'send' && (
            <button
              onClick={() => handleSave(false)}
              disabled={saving}
              className={`relative w-full mt-3 sm:mt-4 py-3 sm:py-4 rounded-xl text-sm sm:text-base font-bold transition overflow-hidden group flex items-center justify-center gap-2 ${
                saving
                  ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-emerald-500 to-emerald-400 text-black shadow-lg shadow-emerald-500/20'
              }`}
            >
              {!saving && (
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              )}
              <span className="relative flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                {saving ? 'Сохранение...' : 'Сохранить изменения'}
              </span>
            </button>
          )}
        </aside>
        
        {/* Мобильная версия - горизонтальная прокручиваемая полоса */}
        <div className="lg:hidden w-full mb-4 order-first">
          {/* Заголовок */}
          <div className="backdrop-blur-xl border rounded-2xl p-4 mb-3 shadow-xl relative overflow-hidden bg-gradient-to-br from-white/[0.07] to-white/[0.02] border-white/10 shadow-black/10">
            {/* Декоративный градиент */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 pointer-events-none" />
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-base bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent">
                  {isDraftMode ? 'Черновик' : 'Редактирование'}
                </h3>
                <div className="flex items-center font-mono text-sm leading-none">
                  <span className="font-bold" style={{ color: progressColor.from }}>{completedSteps}</span>
                  <span className="text-zinc-500 mx-0.5">/</span>
                  <span className="text-zinc-400 font-bold">{totalRequiredSteps}</span>
                </div>
              </div>
              {/* Сегментированный прогресс-бар */}
              <div className="flex gap-1">
                {Array.from({ length: totalRequiredSteps }, (_, i) => (
                  <div 
                    key={i} 
                    className="flex-1 h-2 rounded-full bg-white/5 border border-white/10 overflow-hidden relative"
                  >
                    <div 
                      className={`absolute inset-0 transition-all duration-500 ${
                        i < completedSteps ? 'opacity-100' : 'opacity-0'
                      }`}
                      style={{ 
                        background: `linear-gradient(135deg, ${progressColor.from}, ${progressColor.to})`,
                        boxShadow: i < completedSteps ? `inset 0 1px 0 rgba(255,255,255,0.3)` : 'none',
                        transitionDelay: `${i * 50}ms`
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-transparent" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-[10px] text-zinc-400 mt-1.5 text-center">
                {completedSteps === totalRequiredSteps ? '✓ Готово к оплате' : `Осталось ${totalRequiredSteps - completedSteps}`}
              </div>
            </div>
          </div>
          
          {/* Горизонтальный скролл шагов */}
          <div className="overflow-x-auto -mx-4 px-4 pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <div className="flex gap-2 min-w-min">
              {steps.map((step) => {
                const isComplete = isStepComplete(step.id);
                const isCurrent = currentStep === step.id;
                
                return (
                  <button 
                    key={step.id} 
                    onClick={() => setCurrentStep(step.id)}
                    className={`flex-shrink-0 py-2.5 px-4 rounded-xl flex items-center gap-2 transition-all text-sm font-medium relative overflow-hidden group/step ${
                      isCurrent 
                        ? 'backdrop-blur-md bg-gradient-to-r from-purple-500/40 to-purple-600/40 text-white shadow-lg shadow-purple-500/30 border border-white/20' 
                        : 'backdrop-blur-sm bg-white/5 text-zinc-400 border border-white/10 hover:border-white/20 hover:bg-white/10'
                    }`}
                  >
                    {/* Hover эффект */}
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/10 to-purple-500/0 opacity-0 group-hover/step:opacity-100 transition-opacity duration-300" />
                    <div className="relative z-10 flex items-center gap-2">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isComplete && step.id !== 'send' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10'
                    }`}>
                      {isComplete && step.id !== 'send' ? (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <polyline points="20 6 9 17 4 12" strokeWidth="3"/>
                        </svg>
                      ) : step.id === 'send' ? (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="22" y1="2" x2="11" y2="13"/>
                          <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                        </svg>
                      ) : (
                        step.icon
                      )}
                    </span>
                    <span className="whitespace-nowrap">{step.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Основной контент - Glassmorphism */}
        <section className="flex-1 bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-10 min-h-[600px] shadow-2xl shadow-purple-500/5">
          {currentStep === 'release' && (
            <ReleaseInfoStep
              releaseTitle={releaseTitle}
              setReleaseTitle={setReleaseTitle}
              artistName={artistName}
              setArtistName={setArtistName}
              collaborators={collaborators}
              setCollaborators={setCollaborators}
              collaboratorInput={collaboratorInput}
              setCollaboratorInput={setCollaboratorInput}
              genre={genre}
              setGenre={setGenre}
              subgenres={subgenres}
              setSubgenres={setSubgenres}
              subgenreInput={subgenreInput}
              setSubgenreInput={setSubgenreInput}
              releaseDate={releaseDate}
              setReleaseDate={setReleaseDate}
              showCalendar={showCalendar}
              setShowCalendar={setShowCalendar}
              calendarMonth={calendarMonth}
              setCalendarMonth={setCalendarMonth}
              calendarYear={calendarYear}
              setCalendarYear={setCalendarYear}
              coverFile={coverFile}
              setCoverFile={setCoverFile}
              existingCoverUrl={existingCoverUrl}
              upc={upc}
              setUpc={setUpc}
              onNext={() => setCurrentStep('tracklist')}
            />
          )}

          {currentStep === 'tracklist' && (
            <TracklistStep
              releaseTitle={releaseTitle}
              releaseType={releaseType}
              coverFile={coverFile}
              existingCoverUrl={existingCoverUrl}
              tracks={tracks}
              setTracks={setTracks}
              currentTrack={currentTrack}
              setCurrentTrack={setCurrentTrack}
              trackTitle={trackTitle}
              setTrackTitle={setTrackTitle}
              trackLink={trackLink}
              setTrackLink={setTrackLink}
              trackAudioFile={trackAudioFile}
              setTrackAudioFile={setTrackAudioFile}
              trackAudioMetadata={trackAudioMetadata}
              setTrackAudioMetadata={setTrackAudioMetadata}
              trackHasDrugs={trackHasDrugs}
              setTrackHasDrugs={setTrackHasDrugs}
              trackLyrics={trackLyrics}
              setTrackLyrics={setTrackLyrics}
              trackLanguage={trackLanguage}
              setTrackLanguage={setTrackLanguage}
              trackVersion={trackVersion}
              setTrackVersion={setTrackVersion}
              trackProducers={trackProducers}
              setTrackProducers={setTrackProducers}
              trackFeaturing={trackFeaturing}
              setTrackFeaturing={setTrackFeaturing}
              trackIsrc={trackIsrc}
              setTrackIsrc={setTrackIsrc}
              onBack={() => setCurrentStep('release')}
              onNext={() => setCurrentStep('countries')}
            />
          )}

          {currentStep === 'countries' && (
            <CountriesStep
              selectedCountries={selectedCountries}
              setSelectedCountries={setSelectedCountries}
              onBack={() => setCurrentStep('tracklist')}
              onNext={() => setCurrentStep('contract')}
            />
          )}

          {currentStep === 'contract' && (
            <ContractStep
              agreedToContract={agreedToContract}
              setAgreedToContract={setAgreedToContract}
              onBack={() => setCurrentStep('countries')}
              onNext={() => setCurrentStep('platforms')}
            />
          )}

          {currentStep === 'platforms' && (
            <PlatformsStep
              selectedPlatforms={selectedPlatforms}
              setSelectedPlatforms={setSelectedPlatforms}
              selectedPlatformsList={selectedPlatformsList}
              setSelectedPlatformsList={setSelectedPlatformsList}
              onBack={() => setCurrentStep('contract')}
              onNext={() => setCurrentStep('promo')}
            />
          )}

          {currentStep === 'promo' && (
            <PromoStep
              focusTrack={focusTrack}
              setFocusTrack={setFocusTrack}
              focusTrackPromo={focusTrackPromo}
              setFocusTrackPromo={setFocusTrackPromo}
              albumDescription={albumDescription}
              setAlbumDescription={setAlbumDescription}
              promoPhotos={promoPhotos}
              setPromoPhotos={setPromoPhotos}
              tracks={tracks}
              onBack={() => setCurrentStep('platforms')}
              onNext={() => isDraftMode && releaseStatus === 'draft' ? setCurrentStep('payment') : setCurrentStep('release')}
            />
          )}

          {currentStep === 'payment' && isDraftMode && releaseStatus === 'draft' && (
            <PaymentStep
              onNext={() => setCurrentStep('send')}
              onBack={() => setCurrentStep('promo')}
              onPaymentSubmit={(receiptUrl, comment) => {
                setPaymentReceiptUrl(receiptUrl);
                setPaymentComment(comment || '');
              }}
              onPayLater={handlePayLater}
              canPayLater={canProceedToPayment}
              userId={userId}
              releaseType={releaseType}
            />
          )}

          {currentStep === 'send' && isDraftMode && releaseStatus === 'draft' && (
            <SendStep
              releaseTitle={releaseTitle}
              artistName={artistName}
              genre={genre}
              releaseType={releaseType}
              tracksCount={tracks.length}
              coverFile={coverFile}
              existingCoverUrl={existingCoverUrl}
              collaborators={collaborators}
              subgenres={subgenres}
              releaseDate={releaseDate}
              selectedPlatforms={selectedPlatforms}
              agreedToContract={agreedToContract}
              focusTrack={focusTrack}
              focusTrackPromo={focusTrackPromo}
              albumDescription={albumDescription}
              promoPhotos={promoPhotos}
              tracks={tracks}
              platforms={selectedPlatformsList}
              countries={selectedCountries}
              onBack={() => setCurrentStep('payment')}
              paymentReceiptUrl={paymentReceiptUrl}
              paymentComment={paymentComment}
              draftId={releaseId}
            />
          )}
        </section>
      </div>
      
      {/* Toast уведомление (центр экрана) */}
      {showSuccessToast && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className={`pointer-events-auto bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 min-w-[320px] max-w-[90%] ${isFadingOut ? 'animate-fade-out' : 'animate-fade-in'}`}>
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <div>
              <div className="font-bold text-lg">
                {releaseStatus === 'draft' && !saving ? 'Черновик сохранен!' : 'Успешно сохранено!'}
              </div>
              <div className="text-sm text-white/90">
                {releaseStatus === 'draft' && !saving ? 'Изменения сохранены' : 'Релиз обновлен'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
