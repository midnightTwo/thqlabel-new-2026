'use client';

import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import dynamic from 'next/dynamic';

// Ленивая загрузка тяжёлого компонента модального окна
const ImageCropModal = dynamic(() => import('../ui/ImageCropModal'), {
  ssr: false,
  loading: () => <div className="fixed inset-0 bg-black/50 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div></div>
});

export default function NewsTab({ supabase }: { supabase: any }) {
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Новость');
  const [image, setImage] = useState('');
  const [scheduledFor, setScheduledFor] = useState('');
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [autoSaved, setAutoSaved] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkText, setLinkText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  
  // Состояния для черновиков
  const [drafts, setDrafts] = useState<any[]>([]);
  const [showDraftsModal, setShowDraftsModal] = useState(false);
  const [currentDraftId, setCurrentDraftId] = useState<number | null>(null);
  
  // Состояния для crop редактора
  const [showCropModal, setShowCropModal] = useState(false);
  const [imageToCrop, setImageToCrop] = useState('');
  const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null);
  const [isEditingExistingImage, setIsEditingExistingImage] = useState(false);
  
  // Система уведомлений
  const [notification, setNotification] = useState<{show: boolean; message: string; type: 'success' | 'error'}>({show: false, message: '', type: 'success'});
  const [confirmDialog, setConfirmDialog] = useState<{show: boolean; message: string; onConfirm: () => void}>({show: false, message: '', onConfirm: () => {}});
  
  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({show: true, message, type});
    setTimeout(() => setNotification(prev => ({...prev, show: false})), 3000);
  };
  
  const showConfirm = (message: string, onConfirm: () => void) => {
    setConfirmDialog({show: true, message, onConfirm});
  };

  // Загрузка черновиков из БД
  const loadDrafts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data, error } = await supabase
        .from('news_drafts')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      setDrafts(data || []);
    } catch (e) {
      console.error('Ошибка загрузки черновиков:', e);
    }
  };

  // Автосохранение черновика в БД
  useEffect(() => {
    if (!title && !content) return;
    
    const timer = setTimeout(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        const payload = { 
          user_id: user.id,
          title: title.trim(),
          content: content.trim(),
          category,
          image: image.trim() || null,
          scheduled_for: scheduledFor ? new Date(scheduledFor).toISOString() : null
        };
        
        if (currentDraftId) {
          // Обновляем существующий черновик
          await supabase
            .from('news_drafts')
            .update(payload)
            .eq('id', currentDraftId);
        } else {
          // Создаём новый черновик
          const { data } = await supabase
            .from('news_drafts')
            .insert([payload])
            .select()
            .single();
          
          if (data) setCurrentDraftId(data.id);
        }
        
        setAutoSaved(true);
        setTimeout(() => setAutoSaved(false), 2000);
        await loadDrafts();
      } catch (e) {
        console.error('Ошибка автосохранения:', e);
      }
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [title, content, category, image, scheduledFor]);

  // Загрузка черновика
  const handleLoadDraft = (draft: any) => {
    setTitle(draft.title || '');
    setContent(draft.content || '');
    setCategory(draft.category || 'Новость');
    setImage(draft.image || '');
    setScheduledFor(draft.scheduled_for ? new Date(draft.scheduled_for).toISOString().slice(0, 16) : '');
    setCurrentDraftId(draft.id);
    setShowDraftsModal(false);
    showNotification('Черновик загружен', 'success');
  };

  // Удаление черновика
  const handleDeleteDraft = async (draftId: number) => {
    showConfirm('Удалить этот черновик?', async () => {
      try {
        const { error } = await supabase
          .from('news_drafts')
          .delete()
          .eq('id', draftId);
        
        if (error) throw error;
        
        if (currentDraftId === draftId) {
          setTitle('');
          setContent('');
          setCategory('Новость');
          setImage('');
          setScheduledFor('');
          setCurrentDraftId(null);
        }
        
        await loadDrafts();
        showNotification('Черновик удалён', 'success');
      } catch (e: any) {
        showNotification('Ошибка удаления: ' + e.message, 'error');
      }
    });
  };

  // Очистка формы и черновика
  const clearForm = () => {
    setTitle('');
    setContent('');
    setCategory('Новость');
    setImage('');
    setScheduledFor('');
    setEditingId(null);
    setCurrentDraftId(null);
  };

  const loadNews = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('news').select('*').order('created_at', { ascending: false });
      setNews(data || []);
    } catch (e) {
      console.warn('Ошибка загрузки новостей:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    loadNews(); 
    loadDrafts();
  }, []);

  const handleSave = async () => {
    if (!title.trim()) {
      showNotification('Введите заголовок', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload = { 
        title: title.trim(), 
        content: content.trim() || '', 
        category: category || 'Новость', 
        image: image.trim() || null,
        scheduled_for: scheduledFor ? new Date(scheduledFor).toISOString() : null
      };
      
      console.log('Сохранение новости:', payload);
      
      if (editingId) {
        const { data, error } = await supabase.from('news').update(payload).eq('id', editingId);
        if (error) {
          console.error('Ошибка обновления:', error);
          showNotification('Ошибка обновления: ' + error.message, 'error');
          return;
        }
        console.log('Новость обновлена:', data);
        showNotification('Новость обновлена!', 'success');
      } else {
        const { data, error } = await supabase.from('news').insert([payload]);
        if (error) {
          console.error('Ошибка создания:', error);
          showNotification('Ошибка создания: ' + error.message, 'error');
          return;
        }
        console.log('Новость создана:', data);
        showNotification('Новость опубликована!', 'success');
      }
      
      // Удаляем черновик если он был
      if (currentDraftId) {
        await supabase.from('news_drafts').delete().eq('id', currentDraftId);
        await loadDrafts();
      }
      
      // Очищаем форму
      clearForm();
      
      // Перезагружаем список
      await loadNews();
    } catch (e: any) {
      console.error('Исключение при сохранении:', e);
      showNotification('Ошибка: ' + e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setTitle(item.title);
    setContent(item.content || '');
    setCategory(item.category || 'Новость');
    setImage(item.image || '');
    setScheduledFor(item.scheduled_for ? new Date(item.scheduled_for).toISOString().slice(0, 16) : '');
  };

  const handleDelete = async (id: number) => {
    showConfirm('Точно удалить эту новость?', async () => {
      try {
        console.log('Удаление новости:', id);
        const { error } = await supabase.from('news').delete().eq('id', id);
        if (error) {
          console.error('Ошибка удаления:', error);
          showNotification('Ошибка удаления: ' + error.message, 'error');
          return;
        }
        console.log('Новость удалена');
        await loadNews();
        showNotification('Новость удалена!', 'success');
      } catch (e: any) {
        console.error('Исключение при удалении:', e);
        showNotification('Ошибка: ' + e.message, 'error');
      }
    });
  };

  const handleCancel = () => {
    clearForm();
  };

  // Вставка форматирования
  const insertFormat = (prefix: string, suffix: string = '') => {
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = content;
    const before = text.substring(0, start);
    const selected = text.substring(start, end);
    const after = text.substring(end);
    const newContent = before + prefix + selected + suffix + after;
    setContent(newContent);
    
    // Возвращаем фокус на textarea
    setTimeout(() => {
      textarea.focus();
      const newPos = start + prefix.length + selected.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  };

  // Рендер предпросмотра с форматированием
  const renderPreview = () => {
    return content.split('\n').map((paragraph: string, i: number) => {
      if (paragraph.trim() === '---') return <hr key={i} className="border-t border-white/20 my-8" />;
      if (paragraph.startsWith('# ')) return <h1 key={i} className="text-3xl font-black uppercase tracking-tight text-white mt-10 mb-6">{paragraph.replace('# ', '')}</h1>;
      if (paragraph.startsWith('## ')) return <h2 key={i} className="text-xl font-black uppercase tracking-tight text-[#9d8df1] mt-8 mb-4">{paragraph.replace('## ', '')}</h2>;
      if (paragraph.startsWith('> ')) return <blockquote key={i} className="border-l-4 border-[#6050ba] pl-4 py-2 my-4 text-white/70 italic bg-white/5 rounded-r-lg">{paragraph.replace('> ', '')}</blockquote>;
      if (paragraph.startsWith('- ')) return <li key={i} className="text-white/90 ml-4">{paragraph.replace('- ', '')}</li>;
      if (paragraph.trim()) {
        // Обработка форматирования
        let processed = paragraph;
        // Жирный **текст**
        processed = processed.replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-white">$1</strong>');
        // Курсив *текст*
        processed = processed.replace(/\*(.+?)\*/g, '<em class="italic text-zinc-300">$1</em>');
        // Код `текст`
        processed = processed.replace(/`(.+?)`/g, '<code class="bg-black/40 px-2 py-1 rounded text-[#9d8df1] text-sm font-mono">$1</code>');
        // Ссылки [текст](url)
        processed = processed.replace(/\[(.+?)\]\((.+?)\)/g, (match, text, url) => {
          const href = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
          return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="text-[#9d8df1] underline hover:text-[#b8a8ff]">${text}</a>`;
        });
        return <p key={i} className="text-white/80 mb-4" dangerouslySetInnerHTML={{ __html: processed }} />;
      }
      return null;
    });
  };

  // Вставка ссылки через диалог
  const handleInsertLink = () => {
    if (!linkText.trim() || !linkUrl.trim()) {
      alert('Заполни оба поля');
      return;
    }
    const linkMarkdown = `[${linkText}](${linkUrl})`;
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const before = content.substring(0, start);
      const after = content.substring(end);
      setContent(before + linkMarkdown + after);
      
      // Возвращаем фокус
      setTimeout(() => {
        textarea.focus();
        const newPos = start + linkMarkdown.length;
        textarea.setSelectionRange(newPos, newPos);
      }, 0);
    }
    
    // Закрываем диалог и очищаем поля
    setShowLinkDialog(false);
    setLinkText('');
    setLinkUrl('');
  };

  // Открытие диалога ссылки
  const openLinkDialog = () => {
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    if (textarea) {
      const selected = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);
      if (selected) setLinkText(selected);
    }
    setShowLinkDialog(true);
  };

  // Загрузка картинки в Supabase Storage
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Проверка типа файла
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      showNotification('Неподдерживаемый формат. Используйте JPG, PNG или WEBP', 'error');
      // Очистка input
      const fileInput = document.getElementById('news-image-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      return;
    }
    
    // Проверка размера (макс 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB в байтах
    if (file.size > maxSize) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      showNotification(`Файл слишком большой (${sizeMB}MB). Максимум 5MB`, 'error');
      // Очистка input
      const fileInput = document.getElementById('news-image-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      return;
    }
    
    // Создаём временный URL для предпросмотра и открываем crop редактор
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageToCrop(reader.result as string);
      setIsEditingExistingImage(false); // Это новая загрузка
      setShowCropModal(true);
    };
    reader.onerror = () => {
      showNotification('Ошибка чтения файла', 'error');
    };
    reader.readAsDataURL(file);
  };
  
  // Обработка обрезанного изображения
  const handleCropComplete = async (blob: Blob) => {
    setShowCropModal(false);
    setUploading(true);
    
    try {
      // Создаём уникальное имя файла
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(7);
      const fileName = `news_${timestamp}_${randomStr}.jpg`;
      
      // Загружаем в Supabase Storage в bucket avatars (где есть публичный доступ)
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, blob, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'image/jpeg'
        });
      
      if (error) {
        console.error('Ошибка загрузки в Supabase:', error);
        throw new Error(error.message);
      }
      
      // Получаем публичный URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);
      
      setImage(publicUrl);
      showNotification('Картинка успешно загружена', 'success');
      
      // Сбрасываем file input
      const fileInput = document.getElementById('news-image-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error: any) {
      console.error('Ошибка загрузки:', error);
      showNotification('Ошибка загрузки: ' + (error.message || 'Неизвестная ошибка'), 'error');
    } finally {
      setUploading(false);
    }
  };
  
  // Редактирование существующего изображения
  const handleEditImage = () => {
    if (!image) {
      showNotification('Нет изображения для редактирования', 'error');
      return;
    }
    setImageToCrop(image);
    setIsEditingExistingImage(true); // Это редактирование существующего
    setShowCropModal(true);
  };
  
  // Отмена crop-редактора
  const handleCropCancel = () => {
    setShowCropModal(false);
    setImageToCrop('');
    setIsEditingExistingImage(false);
    // Очищаем file input если он был использован
    const fileInput = document.getElementById('news-image-input') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Уведомление */}
      {notification.show && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[150] animate-in fade-in slide-in-from-top-4 duration-300">
          <div className={`px-6 py-3 rounded-xl shadow-2xl border backdrop-blur-sm ${
            notification.type === 'success' 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
              : 'bg-red-500/10 border-red-500/30 text-red-300'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${notification.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`} />
              <span className="font-medium">{notification.message}</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Диалог подтверждения */}
      {confirmDialog.show && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200] flex items-start justify-center overflow-y-auto p-4 pt-16 pb-8">
          <div className="bg-[#1a1a1f] border border-white/10 rounded-2xl p-6 max-w-sm w-full animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold mb-4">Подтверждение</h3>
            <p className="text-zinc-400 mb-6">{confirmDialog.message}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDialog(prev => ({...prev, show: false}))}
                className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold transition"
              >
                Нет
              </button>
              <button
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog(prev => ({...prev, show: false}));
                }}
                className="flex-1 py-3 bg-[#6050ba] hover:bg-[#7060ca] rounded-xl font-bold transition"
              >
                Да
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Диалог вставки ссылки */}
      {showLinkDialog && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-start justify-center overflow-y-auto p-4 pt-16 pb-8">
          <div className="bg-[#1a1a1f] border border-white/10 rounded-2xl p-6 max-w-md w-full animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold mb-4">Вставить ссылку</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-2">ТЕКСТ ССЫЛКИ</label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="Например: Подробнее"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#6050ba]"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-2">URL АДРЕС</label>
                <input
                  type="text"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#6050ba]"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowLinkDialog(false);
                  setLinkText('');
                  setLinkUrl('');
                }}
                className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold transition"
              >
                Отмена
              </button>
              <button
                onClick={handleInsertLink}
                className="flex-1 py-3 bg-[#6050ba] hover:bg-[#7060ca] rounded-xl font-bold transition"
              >
                Вставить
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Модальное окно черновиков */}
      {showDraftsModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-start justify-center overflow-y-auto p-4 pt-16 pb-8">
          <div className="bg-[#1a1a1f] border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 max-w-3xl w-full overflow-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">Мои черновики</h3>
              <button
                onClick={() => setShowDraftsModal(false)}
                className="w-8 h-8 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-lg transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {drafts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-zinc-500">Черновиков пока нет</p>
              </div>
            ) : (
              <div className="space-y-3">
                {drafts.map((draft) => (
                  <div
                    key={draft.id}
                    className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 hover:border-purple-500/50 transition-all cursor-pointer"
                  >
                    <div className="flex gap-4">
                      {/* Иконка новости */}
                      <div className="flex-shrink-0">
                        <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-amber-600 to-orange-600 flex items-center justify-center">
                          <svg className="w-8 h-8 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                          </svg>
                        </div>
                      </div>

                      {/* Информация */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="font-bold text-white truncate">
                            {draft.title || 'Без заголовка'}
                          </h4>
                          <span className="flex-shrink-0 text-[10px] px-2 py-0.5 rounded-full border bg-amber-500/20 text-amber-400 border-amber-500/30 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                            <span>ЧЕРНОВИК</span>
                          </span>
                        </div>
                        
                        <p className="text-sm text-zinc-400 line-clamp-2 mb-2">
                          {draft.content || 'Пустой черновик'}
                        </p>
                        
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Категория */}
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
                            {draft.category || 'Новость'}
                          </span>
                          
                          {/* Дата обновления */}
                          <span className="text-[10px] text-zinc-500">
                            Изменено: {new Date(draft.updated_at).toLocaleString('ru-RU', { 
                              day: 'numeric', 
                              month: 'short', 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                        </div>

                        {/* Кнопки действий */}
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLoadDraft(draft);
                            }}
                            className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/40 text-purple-300 rounded-lg text-xs font-bold transition"
                          >
                            Загрузить
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteDraft(draft.id);
                            }}
                            className="px-4 py-2 bg-red-500/10 hover:bg-red-500/30 text-red-400 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                            title="Удалить черновик"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Удалить
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Crop Modal для редактирования изображений */}
      {showCropModal && (
        <ImageCropModal
          imageSrc={imageToCrop}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}
      
      {/* Шапка */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-black mb-1">Управление новостями</h2>
          <p className="text-zinc-500 text-sm">Создавай новости - они появятся у всех на странице /news</p>
        </div>
        <div className="flex gap-2">
          {autoSaved && (
            <div className="px-4 py-2 bg-emerald-500/20 text-emerald-300 rounded-lg text-xs font-bold flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Автосохранено
            </div>
          )}
          {drafts.length > 0 && (
            <button 
              onClick={() => setShowDraftsModal(true)}
              className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg text-xs font-bold transition flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Черновики ({drafts.length})
            </button>
          )}
          <a href="/news" target="_blank" className="px-4 py-2 bg-[#6050ba]/20 hover:bg-[#6050ba]/30 rounded-lg text-xs font-bold transition">
            Посмотреть новости
          </a>
        </div>
      </div>

      {/* Форма создания/редактирования */}
      <div className="p-6 bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/10 rounded-2xl">
        <h3 className="font-black mb-2">{editingId ? 'Редактируешь новость' : 'Создать новость'}</h3>
        <p className="text-xs text-zinc-500 mb-6">Заполни форму ниже и нажми кнопку "Опубликовать"</p>
        
        <div className="space-y-5">
          {/* Заголовок и категория */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-2">
                ЗАГОЛОВОК <span className="text-red-400">*</span>
              </label>
              <input 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="Например: Новый релиз от thqlabel" 
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#6050ba] focus:bg-black/60 transition" 
              />
              <div className="flex justify-between items-center mt-1">
                <p className="text-[10px] text-zinc-600">Главный заголовок - обязательное поле</p>
                <p className="text-[10px] text-zinc-500">{title.length} символов</p>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-2">
                КАТЕГОРИЯ
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#6050ba] focus:bg-black/60 transition cursor-pointer"
              >
                <option value="Новость">Новость - обычная новость лейбла</option>
                <option value="Обновление">Обновление - изменения на платформе</option>
              </select>
              <p className="text-[10px] text-zinc-600 mt-1">Тип новости - влияет на иконку</p>
            </div>

            {/* Планирование публикации */}
            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-2 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                ЗАПЛАНИРОВАТЬ ПУБЛИКАЦИЮ
              </label>
              <div className="relative">
                <input
                  type="datetime-local"
                  value={scheduledFor}
                  onChange={(e) => setScheduledFor(e.target.value)}
                  className="w-full bg-gradient-to-r from-black/40 to-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#6050ba] focus:from-black/60 focus:to-black/50 transition [color-scheme:dark] hover:border-[#6050ba]/50"
                />
                {scheduledFor && (
                  <button
                    type="button"
                    onClick={() => setScheduledFor('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-red-500/20 hover:bg-red-500/30 rounded-lg flex items-center justify-center transition"
                    title="Очистить дату"
                  >
                    <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              <p className="text-[10px] text-zinc-600 mt-1.5 flex items-center gap-1.5">
                {scheduledFor ? (
                  <>
                    <svg className="w-3 h-3 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-emerald-500">Запланировано на {new Date(scheduledFor).toLocaleString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Оставьте пустым для немедленной публикации
                  </>
                )}
              </p>
            </div>
          </div>
          
          {/* Картинка */}
          <div>
            <label className="block text-xs font-bold text-zinc-400 mb-2">
              ИЗОБРАЖЕНИЕ
            </label>
            
            {/* Превью изображения */}
            {image ? (
              <div className="mb-3 relative group">
                <div className="relative overflow-hidden rounded-xl border border-white/10">
                  <img 
                    src={image} 
                    alt="Превью новости" 
                    className="w-full h-64 object-cover"
                  />
                  <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={handleEditImage}
                      className="flex items-center gap-2 px-3 py-2 bg-[#6050ba] hover:bg-[#7060ca] rounded-lg text-xs font-bold transition shadow-lg"
                      title="Редактировать изображение"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Редактировать
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        showConfirm('Удалить изображение?', () => {
                          setImage('');
                          showNotification('Изображение удалено', 'success');
                        });
                      }}
                      className="flex items-center gap-2 px-3 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-xs font-bold transition shadow-lg"
                      title="Удалить изображение"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Удалить
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-zinc-600 mt-2">
                  Наведите на изображение для редактирования или удаления
                </p>
              </div>
            ) : (
              <div className="mb-3">
                {/* Поле URL */}
                <div className="mb-3">
                  <input 
                    value={image} 
                    onChange={(e) => setImage(e.target.value)} 
                    placeholder="Вставьте URL изображения..." 
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#6050ba] transition" 
                  />
                  <p className="text-[10px] text-zinc-600 mt-1.5">
                    Или загрузите файл с компьютера
                  </p>
                </div>
                
                {/* Кнопка загрузки файла */}
                <label className="block cursor-pointer">
                  <input
                    id="news-image-input"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <div className="relative overflow-hidden rounded-xl border-2 border-dashed border-white/10 hover:border-[#6050ba]/50 transition-all">
                    <div className="bg-gradient-to-br from-[#6050ba]/5 to-[#7060ca]/5 hover:from-[#6050ba]/10 hover:to-[#7060ca]/10 transition-all">
                      {uploading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                          <svg className="w-10 h-10 text-[#6050ba] animate-spin mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          <p className="text-sm font-bold text-zinc-400">Загрузка изображения...</p>
                          <p className="text-xs text-zinc-600 mt-1">Подождите немного</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-12">
                          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#6050ba] to-[#7060ca] flex items-center justify-center mb-4 shadow-lg shadow-[#6050ba]/20">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <p className="text-sm font-bold text-white mb-1">Загрузить изображение</p>
                          <p className="text-xs text-zinc-500">Нажмите для выбора файла</p>
                          <div className="flex items-center gap-2 mt-4 px-4 py-2 bg-black/20 rounded-lg">
                            <svg className="w-4 h-4 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-[10px] text-zinc-600">JPG, PNG, WEBP до 5MB</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </label>
              </div>
            )}
          </div>
          
          {/* Текст новости */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-bold text-zinc-400">
                ТЕКСТ НОВОСТИ
              </label>
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="text-[10px] px-3 py-1 bg-[#6050ba]/20 hover:bg-[#6050ba]/30 rounded-lg font-bold transition"
              >
                {showPreview ? 'Редактор' : 'Предпросмотр'}
              </button>
            </div>
            
            {!showPreview ? (
              <>
                {/* Панель инструментов форматирования */}
                <div className="mb-2 p-2 bg-black/20 border border-white/5 rounded-xl flex flex-wrap gap-1">
                  <button
                    type="button"
                    onClick={() => insertFormat('# ', '')}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[11px] font-bold transition"
                    title="Заголовок H1"
                  >
                    H1
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormat('## ', '')}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[11px] font-bold transition"
                    title="Заголовок H2"
                  >
                    H2
                  </button>
                  <div className="w-px bg-white/10 mx-1" />
                  <button
                    type="button"
                    onClick={() => insertFormat('**', '**')}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[11px] font-bold transition"
                    title="Жирный текст"
                  >
                    <strong>B</strong>
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormat('*', '*')}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[11px] italic transition"
                    title="Курсив"
                  >
                    <em>I</em>
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormat('`', '`')}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[11px] font-mono transition"
                    title="Код"
                  >
                    {'</>'}
                  </button>
                  <div className="w-px bg-white/10 mx-1" />
                  <button
                    type="button"
                    onClick={openLinkDialog}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[11px] font-bold transition flex items-center gap-1"
                    title="Вставить ссылку"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormat('- ', '')}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[11px] font-bold transition"
                    title="Список"
                  >
                    •
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormat('> ', '')}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[11px] font-bold transition"
                    title="Цитата"
                  >
                    " "
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormat('\n---\n', '')}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[11px] font-bold transition"
                    title="Разделитель"
                  >
                    ─
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormat('\n\n', '')}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[11px] font-bold transition"
                    title="Новый абзац"
                  >
                    ↵
                  </button>
                </div>
                
                <textarea 
                  value={content} 
                  onChange={(e) => setContent(e.target.value)} 
                  placeholder="Основной текст новости..." 
                  rows={10}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none resize-none focus:border-[#6050ba] focus:bg-black/60 font-mono transition" 
                />
                <p className="text-[10px] text-zinc-600 mt-1">{content.length} символов</p>
              </>
            ) : (
              <div className="bg-[#0d0d0f] rounded-3xl border border-white/10 overflow-hidden">
                {/* Точная копия из /news/page.tsx */}
                <div className="relative h-[250px] md:h-[350px]">
                  {image ? (
                    <img src={image} alt={title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#6050ba]/30 to-[#0a0a0c]" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0f] via-transparent to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
                    {category && (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#6050ba] flex items-center justify-center">
                          {category === 'Обновление' ? (
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                          )}
                        </div>
                        <span className="px-4 py-2 bg-[#6050ba] rounded-full text-[11px] font-bold uppercase tracking-widest">{category}</span>
                      </div>
                    )}
                    <span className="text-[11px] text-zinc-400 uppercase tracking-widest">
                      {scheduledFor 
                        ? new Date(scheduledFor).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
                        : new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
                      }
                    </span>
                  </div>
                </div>
                <div className="p-8 md:p-12">
                  <h1 className="text-2xl md:text-4xl font-black uppercase tracking-tight mb-8 text-white">
                    {title || 'Заголовок не указан'}
                  </h1>
                  <div className="prose prose-invert prose-lg max-w-none">
                    {content ? renderPreview() : <p className="text-zinc-600 text-center py-8">Введите текст для предпросмотра</p>}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Кнопки действий */}
          <div className="flex gap-3 pt-4 border-t border-white/5">
            <button 
              onClick={handleSave} 
              disabled={saving}
              className="px-8 py-3 bg-gradient-to-r from-[#6050ba] to-[#7060ca] rounded-xl text-sm font-bold hover:from-[#7060ca] hover:to-[#8070da] transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#6050ba]/20"
            >
              {saving ? 'Сохранение...' : editingId ? 'Сохранить изменения' : 'Опубликовать новость'}
            </button>
            {editingId && (
              <button 
                onClick={handleCancel}
                className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-bold transition"
              >
                Отмена
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Список всех новостей */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="font-black text-lg">Опубликованные новости ({news.length})</h3>
          <p className="text-xs text-zinc-500">Нажмите на новость для редактирования или удаления</p>
        </div>
        
        {loading ? (
          <div className="text-center py-12">
            <div className="text-zinc-600 animate-pulse">Загрузка новостей...</div>
          </div>
        ) : news.length === 0 ? (
          <div className="text-center py-12 bg-white/[0.02] border border-white/5 rounded-2xl">
            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-white/5 flex items-center justify-center"><svg className="w-6 h-6 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg></div>
            <p className="text-zinc-500 font-bold">Новостей пока нет</p>
            <p className="text-xs text-zinc-600 mt-1">Создай первую новость используя форму выше</p>
          </div>
        ) : (
          news.map(item => (
            <div key={item.id} className="bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/10 rounded-2xl p-5 hover:border-[#6050ba]/50 transition-all group">
              <div className="flex gap-4">
                {item.image && (
                  <img src={item.image} alt="" className="w-24 h-24 rounded-xl object-cover flex-shrink-0 border border-white/5" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    {item.category && (
                      <span className="text-[10px] px-2.5 py-1 bg-[#6050ba]/20 text-[#9d8df1] rounded-full font-bold">{item.category}</span>
                    )}
                    <span className="text-[9px] text-zinc-600">
                      ID: {item.id}
                    </span>
                  </div>
                  <h4 className="font-bold text-white mb-2 line-clamp-1 text-base">{item.title}</h4>
                  <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">{item.content || 'Без текста'}</p>
                  <div className="flex items-center gap-3 mt-3">
                    <p className="text-[10px] text-zinc-600">
                      {new Date(item.created_at).toLocaleString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {item.updated_at !== item.created_at && (
                      <p className="text-[10px] text-zinc-600">
                        Изменено: {new Date(item.updated_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <button 
                    onClick={() => handleEdit(item)}
                    className="px-4 py-2 bg-[#6050ba]/20 hover:bg-[#6050ba]/40 rounded-lg text-xs font-bold transition group-hover:scale-105"
                    title="Редактировать новость"
                  >
                    Изменить
                  </button>
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="px-4 py-2 bg-red-500/10 hover:bg-red-500/30 text-red-400 rounded-lg text-xs font-bold transition group-hover:scale-105"
                    title="Удалить новость"
                  >
                    Удалить
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
