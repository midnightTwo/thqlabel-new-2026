'use client';

import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';

interface ImageCropModalProps {
  imageSrc: string;
  onCropComplete: (croppedBlob: Blob) => void;
  onCancel: () => void;
}

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function ImageCropModal({ imageSrc, onCropComplete, onCancel }: ImageCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null);
  const [processing, setProcessing] = useState(false);

  const onCropChange = (location: { x: number; y: number }) => {
    setCrop(location);
  };

  const onZoomChange = (zoom: number) => {
    setZoom(zoom);
  };

  const onCropCompleteInternal = useCallback(
    (croppedArea: CropArea, croppedAreaPixels: CropArea) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const createCroppedImage = async () => {
    if (!croppedAreaPixels) return;
    
    setProcessing(true);
    try {
      const image = new Image();
      image.crossOrigin = 'anonymous'; // Решение CORS проблемы
      image.src = imageSrc;
      
      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = reject;
      });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Не удалось создать canvas context');
      }

      // Устанавливаем размер canvas равным размеру обрезанной области
      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;

      // Рисуем обрезанное изображение
      ctx.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        croppedAreaPixels.width,
        croppedAreaPixels.height
      );

      // Определяем желаемый mime по data URI если возможно
      let outputMime = 'image/jpeg';
      try {
        const m = imageSrc.match(/^data:(image\/[^;]+);/);
        if (m && m[1]) {
          const original = m[1].toLowerCase();
          if (original === 'image/png' || original === 'image/webp') {
            outputMime = original;
          } else if (original === 'image/gif') {
            // GIF при рисовании на canvas теряет анимацию — используем PNG
            outputMime = 'image/png';
          }
        }
      } catch (e) {
        // fallback
      }

      canvas.toBlob((blob) => {
        if (!blob) {
          setProcessing(false);
          return;
        }
        onCropComplete(blob);
        setProcessing(false);
      }, outputMime, outputMime.includes('png') ? 1 : 0.95);
      
    } catch (error) {
      console.error('Ошибка при обрезке изображения:', error);
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/80 backdrop-blur-sm p-4 pt-16 pb-8">
      <div className="admin-dark-modal bg-[#0a0a0f] border border-white/10 rounded-2xl w-full max-w-4xl flex flex-col shadow-2xl">
        {/* Заголовок */}
        <div className="px-6 py-3.5 border-b border-white/10 flex items-center justify-between flex-shrink-0">
          <h3 className="text-lg font-bold">Редактирование изображения</h3>
          <button
            onClick={onCancel}
            className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Область обрезки */}
        <div className="relative flex-1 bg-black/40 min-h-[300px]">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={16 / 9}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropCompleteInternal}
            style={{
              containerStyle: {
                background: '#000',
              },
            }}
          />
        </div>

        {/* Управление */}
        <div className="px-6 py-3.5 space-y-3 flex-shrink-0 border-t border-white/5">
          {/* Зум */}
          <div>
            <label className="block text-xs font-bold text-zinc-400 mb-2">
              МАСШТАБ
            </label>
            <div className="flex items-center gap-3">
              <svg className="w-4 h-4 text-zinc-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
              </svg>
              <input
                type="range"
                min="1"
                max="3"
                step="0.1"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="flex-1 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#6050ba] [&::-webkit-slider-thumb]:cursor-pointer"
              />
              <svg className="w-5 h-5 text-zinc-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
              </svg>
            </div>
            <p className="text-[10px] text-zinc-600 mt-2">
              Перетаскивайте изображение мышью для позиционирования
            </p>
          </div>

          {/* Кнопки */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              disabled={processing}
              className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Отмена
            </button>
            <button
              onClick={createCroppedImage}
              disabled={processing}
              className="flex-1 py-3 bg-gradient-to-r from-[#6050ba] to-[#7060ca] hover:from-[#7060ca] hover:to-[#6050ba] rounded-xl font-bold transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#6050ba]/20"
            >
              {processing ? 'Обработка...' : 'Применить'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
