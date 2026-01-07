import React, { useState, useRef, useEffect } from 'react';
import { showErrorToast } from '@/lib/utils/showToast';
import { useTheme } from '@/contexts/ThemeContext';

interface CoverUploaderProps {
  coverFile: File | null;
  setCoverFile: (file: File | null) => void;
  previewUrl?: string;
}

// Функция для извлечения доминантного цвета из изображения
function getDominantColor(imageUrl: string): Promise<{ r: number; g: number; b: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve({ r: 139, g: 92, b: 246 }); // фиолетовый по умолчанию
        return;
      }
      
      // Уменьшаем для производительности
      const size = 50;
      canvas.width = size;
      canvas.height = size;
      ctx.drawImage(img, 0, 0, size, size);
      
      const imageData = ctx.getImageData(0, 0, size, size).data;
      let r = 0, g = 0, b = 0, count = 0;
      
      // Выбираем пиксели из центральной части (более репрезентативно)
      for (let i = 0; i < imageData.length; i += 16) { // каждый 4-й пиксель
        const red = imageData[i];
        const green = imageData[i + 1];
        const blue = imageData[i + 2];
        const alpha = imageData[i + 3];
        
        // Пропускаем слишком тёмные или слишком светлые
        if (alpha > 200 && (red + green + blue) > 60 && (red + green + blue) < 700) {
          r += red;
          g += green;
          b += blue;
          count++;
        }
      }
      
      if (count > 0) {
        resolve({ r: Math.round(r / count), g: Math.round(g / count), b: Math.round(b / count) });
      } else {
        resolve({ r: 139, g: 92, b: 246 }); // фиолетовый по умолчанию
      }
    };
    img.onerror = () => {
      resolve({ r: 139, g: 92, b: 246 });
    };
    img.src = imageUrl;
  });
}

export default function CoverUploader({ coverFile, setCoverFile, previewUrl }: CoverUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageInfo, setImageInfo] = useState<{ width: number; height: number } | null>(null);
  const [dominantColor, setDominantColor] = useState<{ r: number; g: number; b: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { themeName } = useTheme();
  const isLight = themeName === 'light';

  // Извлекаем доминантный цвет при загрузке обложки
  useEffect(() => {
    const extractColor = async () => {
      if (coverFile && !error) {
        const url = URL.createObjectURL(coverFile);
        const color = await getDominantColor(url);
        setDominantColor(color);
        URL.revokeObjectURL(url);
      } else if (previewUrl && !coverFile && !error) {
        const color = await getDominantColor(previewUrl);
        setDominantColor(color);
      } else {
        setDominantColor(null);
      }
    };
    extractColor();
  }, [coverFile, previewUrl, error]);

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
            error: `Не квадратная`,
            width,
            height
          });
          return;
        }

        // СТРОГАЯ проверка: минимум 3000x3000px (квадрат)
        if (width < 3000) {
          resolve({ 
            valid: false, 
            error: `Слишком маленькая`,
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
      const errorMessage = validation.error || 'Ошибка валидации';
      setError(errorMessage);
      setCoverFile(null);
      setImageInfo(validation.width && validation.height ? { width: validation.width, height: validation.height } : null);
      
      // Показываем toast-уведомление с размерами
      let toastMessage = 'Обложка не принята';
      if (validation.width && validation.height) {
        toastMessage = `Обложка не принята, ваш файл ${validation.width}×${validation.height}px, нужно 3000×3000px`;
      }
      showErrorToast(toastMessage);
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

  // Генерируем стиль свечения на основе доминантного цвета
  const glowStyle = dominantColor && coverFile && !error ? {
    boxShadow: `0 0 30px rgba(${dominantColor.r}, ${dominantColor.g}, ${dominantColor.b}, 0.4), 0 0 60px rgba(${dominantColor.r}, ${dominantColor.g}, ${dominantColor.b}, 0.2)`,
    border: `2px solid rgba(${dominantColor.r}, ${dominantColor.g}, ${dominantColor.b}, 0.6)`
  } : {};

  return (
    <div className="space-y-4">
      <div
        className={`relative rounded-2xl overflow-hidden transition-all duration-500 ${
          coverFile && !error
            ? 'border-0'
            : 'border-2 border-dashed'
        } ${
          dragActive
            ? 'border-purple-500 bg-purple-500/10'
            : error
            ? 'border-red-500/50 bg-red-500/5'
            : coverFile
            ? ''
            : isLight 
              ? 'border-gray-300 bg-gray-50 hover:border-gray-400' 
              : 'border-white/10 bg-white/[0.02] hover:border-white/20'
        }`}
        style={glowStyle}
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
              <div className={`absolute inset-0 ${isLight ? 'bg-white/95' : 'bg-black/90'} backdrop-blur-sm flex items-center justify-center p-4 sm:p-6`}>
                {/* Кнопки управления в правом верхнем углу */}
                <div className="absolute top-3 right-3 sm:top-4 sm:right-4 flex items-center gap-1.5 sm:gap-2">
                  <label
                    htmlFor="cover-upload"
                    className={`group flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 ${isLight ? 'bg-white/90 hover:bg-white border-gray-300 hover:border-gray-400 text-gray-700' : 'bg-black/80 hover:bg-black/90 border-white/40 hover:border-white/60 text-white'} backdrop-blur-md border rounded-xl font-semibold text-xs sm:text-sm cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-xl touch-manipulation`}
                    title="Заменить обложку"
                  >
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:rotate-180 transition-transform duration-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                    </svg>
                    <span className="hidden sm:inline">Заменить</span>
                  </label>
                  <button
                    onClick={handleRemove}
                    className="group flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 backdrop-blur-md border border-red-400/50 hover:border-red-300 rounded-xl font-semibold text-xs sm:text-sm text-white transition-all hover:scale-105 active:scale-95 shadow-xl touch-manipulation"
                    title="Удалить обложку"
                  >
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                    <span className="hidden sm:inline">Удалить</span>
                  </button>
                </div>

                <div className="text-center max-w-md">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-2 sm:mb-3 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center animate-pulse">
                    <svg className="w-6 h-6 sm:w-7 sm:h-7 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                  </div>
                  
                  <p className={`text-base sm:text-lg font-bold ${isLight ? 'text-red-600' : 'text-red-400'} mb-2 sm:mb-3`}>Обложка не подходит</p>
                  
                  {/* Информация о загруженном файле */}
                  {coverFile && (
                    <div className={`mb-3 sm:mb-4 p-2.5 sm:p-3 ${isLight ? 'bg-gray-100 border-gray-300' : 'bg-zinc-800/80 border-zinc-600'} border rounded-xl text-left`}>
                      <div className={`text-[10px] sm:text-xs ${isLight ? 'text-gray-500' : 'text-zinc-400'} mb-1`}>Загруженный файл:</div>
                      <div className={`text-xs sm:text-sm ${isLight ? 'text-gray-900' : 'text-white'} font-medium truncate`}>{coverFile.name}</div>
                      <div className="flex items-center gap-2 sm:gap-3 mt-1.5 sm:mt-2 text-[10px] sm:text-xs">
                        <span className={isLight ? 'text-gray-500' : 'text-zinc-400'}>Формат: <span className={`${isLight ? 'text-gray-900' : 'text-white'} font-medium`}>{coverFile.type.split('/')[1]?.toUpperCase() || 'Неизвестно'}</span></span>
                        <span className={isLight ? 'text-gray-500' : 'text-zinc-400'}>Размер: <span className={`${isLight ? 'text-gray-900' : 'text-white'} font-medium`}>{(coverFile.size / 1024 / 1024).toFixed(2)} МБ</span></span>
                      </div>
                    </div>
                  )}
                  
                  {/* Проблема */}
                  {imageInfo && (
                    <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-red-500/10 border-2 border-red-500/50 rounded-xl">
                      <div className={`text-xl sm:text-2xl font-black ${isLight ? 'text-gray-900' : 'text-white'} mb-1.5 sm:mb-2`}>
                        {imageInfo.width} × {imageInfo.height} px
                      </div>
                      <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                        {imageInfo.width !== imageInfo.height && (
                          <div className={`flex items-center gap-2 ${isLight ? 'text-red-600' : 'text-red-400'}`}>
                            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                            <span>Не квадратная (ширина ≠ высота)</span>
                          </div>
                        )}
                        {imageInfo.width < 3000 && (
                          <div className={`flex items-center gap-2 ${isLight ? 'text-red-600' : 'text-red-400'}`}>
                            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                            <span>Минимум 3000×3000px</span>
                          </div>
                        )}
                        {imageInfo.width === imageInfo.height && imageInfo.width >= 3000 && (
                          <div className={`flex items-center gap-2 ${isLight ? 'text-green-600' : 'text-green-400'}`}>
                            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                            <span>Размер подходит</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Требования */}
                  <div className={`p-2.5 sm:p-3 ${isLight ? 'bg-emerald-50 border-emerald-300' : 'bg-emerald-500/10 border-emerald-500/30'} border rounded-xl`}>
                    <div className={`text-[10px] sm:text-xs ${isLight ? 'text-emerald-600' : 'text-emerald-400'} font-bold mb-1.5 sm:mb-2`}>✓ Требования к обложке:</div>
                    <div className={`text-[10px] sm:text-xs ${isLight ? 'text-emerald-700' : 'text-emerald-300/80'} space-y-0.5 sm:space-y-1`}>
                      <div>• Формат: JPG или PNG</div>
                      <div>• Размер: 3000×3000 пикселей (квадрат)</div>
                      <div>• Максимум: 50 МБ</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Кнопки управления - показываются только при наведении если нет ошибки */}
            {!error && (
              <div className={`absolute inset-0 flex items-center justify-center gap-2 sm:gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${isLight ? 'bg-white/60' : 'bg-black/40'}`}>
                <label
                  htmlFor="cover-upload"
                  className={`group/btn flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 ${isLight ? 'bg-white/90 hover:bg-white border-gray-300 hover:border-gray-400 text-gray-700' : 'bg-black/80 hover:bg-black/90 border-white/40 hover:border-white/60 text-white'} backdrop-blur-md border rounded-xl cursor-pointer transition-all duration-300 hover:scale-110 active:scale-95 shadow-xl hover:shadow-2xl hover:rotate-3 touch-manipulation`}
                  title="Заменить обложку"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-500 group-hover/btn:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                  </svg>
                </label>
                <button
                  onClick={handleRemove}
                  className="group/btn flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 backdrop-blur-md border border-red-400/50 hover:border-red-300 rounded-xl text-white transition-all duration-300 hover:scale-110 active:scale-95 shadow-xl hover:shadow-2xl hover:shadow-red-500/30 hover:-rotate-3 touch-manipulation"
                  title="Удалить обложку"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 group-hover/btn:rotate-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        ) : (
          <label
            htmlFor="cover-upload"
            className="flex flex-col items-center justify-center p-8 sm:p-12 cursor-pointer aspect-square touch-manipulation"
          >
            <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4 transition-all ${
              dragActive ? 'bg-purple-500/20 scale-110' : isLight ? 'bg-gray-100' : 'bg-white/5'
            }`}>
              <svg
                className={`w-8 h-8 sm:w-10 sm:h-10 transition-colors ${
                  dragActive ? 'text-purple-400' : error ? 'text-red-400' : isLight ? 'text-gray-400' : 'text-zinc-500'
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

            <p className={`text-base sm:text-lg font-bold mb-1 ${isLight ? 'text-gray-900' : 'text-white'}`}>
              {dragActive ? 'Отпустите файл' : 'Загрузите обложку'}
            </p>
            <p className={`text-xs sm:text-sm ${isLight ? 'text-gray-500' : 'text-zinc-500'} mb-3 sm:mb-4 text-center px-2`}>
              Перетащите файл или нажмите для выбора
            </p>

            <div className={`flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs ${isLight ? 'text-gray-500' : 'text-zinc-600'}`}>
              <div className={`px-2.5 sm:px-3 py-1 sm:py-1.5 ${isLight ? 'bg-gray-100' : 'bg-white/5'} rounded-lg`}>JPG, PNG</div>
              <div className={`px-2.5 sm:px-3 py-1 sm:py-1.5 ${isLight ? 'bg-gray-100' : 'bg-white/5'} rounded-lg`}>Квадрат 1:1</div>
              <div className={`px-2.5 sm:px-3 py-1 sm:py-1.5 ${isLight ? 'bg-gray-100' : 'bg-white/5'} rounded-lg`}>Мин. 3000x3000px</div>
            </div>
          </label>
        )}
      </div>
    </div>
  );
}
