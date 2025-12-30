'use client';
import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { ROLE_CONFIG, UserRole } from '../../lib/types';

type Area = {
  width: number;
  height: number;
  x: number;
  y: number;
};

interface AvatarCropModalProps {
  show: boolean;
  onClose: () => void;
  avatar: string;
  nickname: string;
  role: UserRole;
  uploadingAvatar: boolean;
  onSaveImage: (croppedImageBlob: Blob) => void;
  onDelete: () => void;
  showNotification: (message: string, type: 'success' | 'error') => void;
}

/**
 * Создает canvas из области кадрирования
 */
const createCroppedImage = async (
  imageSrc: string,
  pixelCrop: Area
): Promise<Blob> => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No 2d context');
  }

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Canvas is empty'));
      }
    }, 'image/jpeg', 0.95);
  });
};

const createImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.src = url;
  });
};

export default function AvatarCropModal({
  show,
  onClose,
  avatar,
  nickname,
  role,
  uploadingAvatar,
  onSaveImage,
  onDelete,
  showNotification,
}: AvatarCropModalProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isCropping, setIsCropping] = useState(false);

  const config = ROLE_CONFIG[role];

  // Сброс zoom при открытии/закрытии и блокировка скролла страницы
  React.useEffect(() => {
    if (show) {
      // Блокируем скролл страницы
      document.body.style.overflow = 'hidden';
    } else {
      // Разблокируем скролл страницы
      document.body.style.overflow = '';
      setZoom(1);
      setImageSrc(null);
      setIsCropping(false);
      setCrop({ x: 0, y: 0 });
    }
    
    return () => {
      // Очищаем при размонтировании
      document.body.style.overflow = '';
    };
  }, [show]);

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showNotification('Можно загружать только изображения', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showNotification('Файл слишком большой. Максимум 5MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.addEventListener('load', () => {
      setImageSrc(reader.result as string);
      setIsCropping(true);
    });
    reader.readAsDataURL(file);
  };

  const handleSaveCroppedImage = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    try {
      const croppedImageBlob = await createCroppedImage(imageSrc, croppedAreaPixels);
      onSaveImage(croppedImageBlob);
      setImageSrc(null);
      setIsCropping(false);
      setZoom(1);
      setCrop({ x: 0, y: 0 });
    } catch (error) {
      console.error('Error cropping image:', error);
      showNotification('Ошибка при обработке изображения', 'error');
    }
  };

  const handleCancelCrop = () => {
    setImageSrc(null);
    setIsCropping(false);
    setZoom(1);
    setCrop({ x: 0, y: 0 });
  };

  if (!show) return null;

  return (
    <>
      {/* Полноэкранная загрузка */}
      {uploadingAvatar && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[200] flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-[#6050ba] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white text-lg font-bold">Загрузка аватара...</p>
          </div>
        </div>
      )}
      
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
      <div 
        className="bg-[#1a1a1f] border border-white/10 rounded-2xl p-5 max-w-sm w-full animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
      >
        <div className={`flex justify-between items-center ${isCropping ? 'mb-2' : 'mb-3'}`}>
          <h3 className="text-lg font-bold">
            {isCropping ? 'Настройте изображение' : 'Аватар профиля'}
          </h3>
          <button
            onClick={() => {
              setImageSrc(null);
              setIsCropping(false);
              setZoom(1);
              setCrop({ x: 0, y: 0 });
              onClose();
            }}
            className="p-2 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-all group"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {isCropping && imageSrc ? (
          <>
            {/* Область кадрирования */}
            <div 
              className="relative w-full h-[280px] bg-black/50 rounded-xl overflow-hidden mb-4"
              onWheel={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const delta = e.deltaY * -0.001;
                const newZoom = Math.min(Math.max(zoom + delta, 1), 3);
                setZoom(newZoom);
              }}
            >
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
                cropShape="rect"
                showGrid={false}
                zoomWithScroll={false}
                style={{
                  containerStyle: {
                    borderRadius: '0.75rem',
                  },
                  cropAreaStyle: {
                    borderRadius: '1rem',
                    border: '2px solid rgba(255, 255, 255, 0.5)',
                  },
                }}
              />
            </div>

            {/* Зум контрол */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-zinc-400">Масштаб</span>
                <span className="text-sm text-zinc-300">{Math.round(zoom * 100)}%</span>
              </div>
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.01}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, ${config.glowColor} 0%, ${config.glowColor} ${(zoom - 1) * 50}%, rgba(255,255,255,0.1) ${(zoom - 1) * 50}%, rgba(255,255,255,0.1) 100%)`,
                }}
              />
            </div>

            {/* Подсказка */}
            <div className="mb-4 p-2.5 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs text-blue-300">
                  Перетащите и масштабируйте
                </p>
              </div>
            </div>

            {/* Кнопки */}
            <div className="flex gap-3">
              <button
                onClick={handleCancelCrop}
                className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold text-sm transition"
              >
                Отмена
              </button>
              <button
                onClick={handleSaveCroppedImage}
                disabled={uploadingAvatar}
                className={`flex-1 py-3 ${
                  uploadingAvatar ? 'bg-zinc-700 cursor-wait' : 'bg-[#6050ba] hover:bg-[#7060ca]'
                } rounded-xl font-bold text-sm transition`}
              >
                {uploadingAvatar ? 'Загрузка...' : 'Применить'}
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Предпросмотр */}
            <div className="flex justify-center mb-6">
              <div
                className={`w-32 h-32 rounded-2xl ${
                  avatar ? 'bg-cover bg-center' : `bg-gradient-to-br ${config.color}`
                } flex items-center justify-center text-5xl font-black border-2 ${
                  config.borderColor
                } overflow-hidden`}
                style={{
                  boxShadow: `0 0 30px ${config.glowColor}`,
                  backgroundImage: avatar ? `url(${avatar})` : 'none',
                }}
              >
                {!avatar && nickname.charAt(0).toUpperCase()}
              </div>
            </div>

            {/* Выбор файла */}
            <div className="space-y-4">
              <label className="block w-full py-4 bg-white/5 hover:bg-white/10 border border-dashed border-white/20 rounded-xl cursor-pointer transition text-center">
                <div className="flex flex-col items-center gap-2">
                  <svg className="w-8 h-8 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm text-zinc-400">Выбрать изображение</span>
                  <span className="text-xs text-zinc-500">До 5 MB</span>
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </label>

              {/* Кнопка удаления */}
              {avatar && (
                <button
                  onClick={onDelete}
                  className="w-full py-3 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-xl font-bold text-sm transition"
                >
                  Удалить аватар
                </button>
              )}
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          box-shadow: 0 0 10px rgba(96, 80, 186, 0.5);
        }

        .slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          border: none;
          box-shadow: 0 0 10px rgba(96, 80, 186, 0.5);
        }
      `}</style>
    </div>
    </>
  );
}
