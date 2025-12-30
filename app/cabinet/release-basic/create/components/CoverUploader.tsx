import React, { useState, useRef } from 'react';

interface CoverUploaderProps {
  coverFile: File | null;
  setCoverFile: (file: File | null) => void;
  previewUrl?: string;
}

export default function CoverUploader({ coverFile, setCoverFile, previewUrl }: CoverUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageInfo, setImageInfo] = useState<{ width: number; height: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateImage = (file: File): Promise<{ valid: boolean; error?: string; width?: number; height?: number }> => {
    return new Promise((resolve) => {
      // Проверка формата
      if (!file.type.match(/^image\/(jpeg|jpg|png)$/)) {
        resolve({ valid: false, error: 'Формат должен быть JPG или PNG' });
        return;
      }

      // Проверка размера файла (макс 50 МБ)
      if (file.size > 50 * 1024 * 1024) {
        resolve({ valid: false, error: 'Размер файла не должен превышать 50 МБ' });
        return;
      }

      // Проверка разрешения и соотношения сторон
      const img = new Image();
      img.onload = () => {
        const width = img.width;
        const height = img.height;

        // СТРОГАЯ проверка: ТОЛЬКО квадрат
        if (width !== height) {
          resolve({ 
            valid: false, 
            error: `❌ Обложка должна быть строго квадратной!\nВаш размер: ${width}x${height}px\nТребуется: квадрат (например, 3000x3000px)`,
            width,
            height
          });
          return;
        }

        // СТРОГАЯ проверка: минимум 3000x3000px (квадрат)
        if (width < 3000) {
          resolve({ 
            valid: false, 
            error: `❌ Слишком маленькое разрешение!\nВаш размер: ${width}x${height}px\nМинимум: 3000x3000px (квадрат)`,
            width,
            height
          });
          return;
        }

        // Всё ок - квадратная обложка 3000x3000 или больше
        resolve({ valid: true, width, height });
      };

      img.onerror = () => {
        resolve({ valid: false, error: 'Ошибка загрузки изображения' });
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const handleFile = async (file: File) => {
    setError(null);
    setImageInfo(null);

    const validation = await validateImage(file);

    if (!validation.valid) {
      setError(validation.error || 'Ошибка валидации');
      setCoverFile(null);
      setImageInfo(validation.width && validation.height ? { width: validation.width, height: validation.height } : null);
      return;
    }

    setImageInfo({ width: validation.width!, height: validation.height! });
    setCoverFile(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleRemove = () => {
    setCoverFile(null);
    setError(null);
    setImageInfo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <div
        className={`relative border-2 border-dashed rounded-2xl overflow-hidden transition-all ${
          dragActive
            ? 'border-purple-500 bg-purple-500/10'
            : error
            ? 'border-red-500/50 bg-red-500/5'
            : coverFile
            ? 'border-transparent bg-green-500/10 shadow-[0_0_40px_rgba(34,197,94,0.4)]'
            : 'border-white/10 bg-white/[0.02] hover:border-white/20'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png"
          onChange={handleChange}
          className="hidden"
          id="cover-upload"
        />

        {coverFile || previewUrl ? (
          <div className="relative aspect-square group">
            <img
              src={coverFile ? URL.createObjectURL(coverFile) : previewUrl}
              alt="Cover preview"
              className="w-full h-full object-cover"
            />
            
            {/* Сообщение об ошибке - показывается поверх изображения */}
            {error && (
              <div className="absolute inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-6">
                {/* Кнопки управления в правом верхнем углу */}
                <div className="absolute top-4 right-4 flex items-center gap-2">
                  <label
                    htmlFor="cover-upload"
                    className="group flex items-center gap-2 px-4 py-2.5 bg-black/80 hover:bg-black/90 backdrop-blur-md border border-white/40 hover:border-white/60 rounded-xl font-semibold text-sm cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-xl"
                    title="Заменить обложку"
                  >
                    <svg className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                    </svg>
                    <span className="hidden sm:inline">Заменить</span>
                  </label>
                  <button
                    onClick={handleRemove}
                    className="group flex items-center gap-2 px-4 py-2.5 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 backdrop-blur-md border border-red-400/50 hover:border-red-300 rounded-xl font-semibold text-sm text-white transition-all hover:scale-105 active:scale-95 shadow-xl"
                    title="Удалить обложку"
                  >
                    <svg className="w-4 h-4 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                    <span className="hidden sm:inline">Удалить</span>
                  </button>
                </div>

                <div className="text-center max-w-md">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center">
                    <svg className="w-8 h-8 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                  </div>
                  
                  <p className="text-xl font-black text-red-400 mb-4">Обложка не принята</p>
                  
                  {/* ТЕКСТ ОШИБКИ - МАКСИМАЛЬНО ВИДИМЫЙ */}
                  <div className="mb-6 p-6 bg-gradient-to-br from-red-600 to-red-700 border-4 border-red-400 rounded-2xl shadow-2xl">
                    <p className="text-3xl font-black text-white leading-tight mb-1">{error}</p>
                  </div>
                  
                  {imageInfo && (
                    <div className="mb-4 p-4 bg-black/60 border-2 border-yellow-400 rounded-xl">
                      <div className="text-sm text-yellow-300 mb-3 uppercase tracking-wider font-bold">⚠️ ВАШ РАЗМЕР</div>
                      <div className="text-4xl font-black text-white mb-3">
                        {imageInfo.width} × {imageInfo.height} px
                      </div>
                      <div className="text-sm text-gray-300 mb-3 pb-3 border-b border-gray-600">
                        {imageInfo.width === imageInfo.height ? (
                          <span className="text-green-400 font-bold">✓ Квадратная</span>
                        ) : (
                          <span className="text-red-400 font-bold">✗ НЕ КВАДРАТНАЯ! (ширина ≠ высота)</span>
                        )}
                      </div>
                      <div className="text-base font-bold">
                        {imageInfo.width >= 3000 ? (
                          <span className="text-green-400">✓ Размер достаточный</span>
                        ) : (
                          <span className="text-red-400">✗ МАЛЕНЬКИЙ РАЗМЕР! Нужно минимум 3000×3000px</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Кнопки управления - показываются только если нет ошибки */}
            {!error && (
              <div className="absolute top-4 right-4 flex items-center gap-2">
                <label
                  htmlFor="cover-upload"
                  className="group flex items-center gap-2 px-4 py-2.5 bg-black/80 hover:bg-black/90 backdrop-blur-md border border-white/40 hover:border-white/60 rounded-xl font-semibold text-sm cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-xl"
                  title="Заменить обложку"
                >
                  <svg className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                  </svg>
                  <span className="hidden sm:inline">Заменить</span>
                </label>
                <button
                  onClick={handleRemove}
                  className="group flex items-center gap-2 px-4 py-2.5 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 backdrop-blur-md border border-red-400/50 hover:border-red-300 rounded-xl font-semibold text-sm text-white transition-all hover:scale-105 active:scale-95 shadow-xl"
                  title="Удалить обложку"
                >
                  <svg className="w-4 h-4 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                  <span className="hidden sm:inline">Удалить</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <label
            htmlFor="cover-upload"
            className="flex flex-col items-center justify-center p-12 cursor-pointer"
          >
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-4 transition-all ${
              dragActive ? 'bg-purple-500/20 scale-110' : 'bg-white/5'
            }`}>
              <svg
                className={`w-10 h-10 transition-colors ${
                  dragActive ? 'text-purple-400' : error ? 'text-red-400' : 'text-zinc-500'
                }`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </div>

            <p className="text-lg font-bold mb-1">
              {dragActive ? 'Отпустите файл' : 'Загрузите обложку'}
            </p>
            <p className="text-sm text-zinc-500 mb-4">
              Перетащите файл или нажмите для выбора
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-zinc-600">
              <div className="px-3 py-1.5 bg-white/5 rounded-lg">JPG, PNG</div>
              <div className="px-3 py-1.5 bg-white/5 rounded-lg">Квадрат 1:1</div>
              <div className="px-3 py-1.5 bg-white/5 rounded-lg">Мин. 3000x3000px</div>
            </div>
          </label>
        )}
      </div>
    </div>
  );
}
 