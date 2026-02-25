"use client";

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

interface SignaturePadProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (signatureDataUrl: string) => void;
}

export default function SignaturePad({ isOpen, onClose, onConfirm }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const pointsRef = useRef<{ x: number; y: number }[]>([]);
  const { themeName } = useTheme();
  const isLight = themeName === 'light';

  // Always draw in dark color — CSS filter inverts for dark mode display
  const STROKE_COLOR = '#1a1a2e';

  // Set up canvas size based on container
  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const width = rect.width;
    const height = Math.min(rect.width * 0.55, 300);

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = STROKE_COLOR;
      ctx.lineWidth = 2.5;
    }

    setCanvasSize({ width, height });
  }, []);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(setupCanvas, 50);
      window.addEventListener('resize', setupCanvas);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', setupCanvas);
      };
    }
  }, [isOpen, setupCanvas]);

  // 🔒 Lock body scroll when signature modal is open
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      return () => {
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  const getPointerPoint = (e: React.PointerEvent): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const point = getPointerPoint(e);
    if (!point) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Capture pointer — guarantees ALL events route here even outside canvas
    canvas.setPointerCapture(e.pointerId);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setHasSignature(true);
    lastPointRef.current = point;
    pointsRef.current = [point];

    ctx.lineWidth = 2.5;
    ctx.strokeStyle = STROKE_COLOR;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
    // Draw a tiny dot so single taps are visible
    ctx.arc(point.x, point.y, 0.5, 0, Math.PI * 2);
    ctx.fill();
  };

  const draw = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Process coalesced events for smooth high-frequency strokes (prevents gaps)
    const events = (e.nativeEvent as PointerEvent).getCoalescedEvents?.() || [e.nativeEvent];

    for (const ce of events) {
      const rect = canvas.getBoundingClientRect();
      const point = { x: ce.clientX - rect.left, y: ce.clientY - rect.top };

      const lastPoint = lastPointRef.current;
      if (!lastPoint) {
        lastPointRef.current = point;
        continue;
      }

      const dist = Math.hypot(point.x - lastPoint.x, point.y - lastPoint.y);
      if (dist < 0.5) continue; // skip sub-pixel moves

      // Variable width: thinner on fast strokes, thicker on slow
      const newWidth = Math.max(1.2, Math.min(3.5, 3 - dist * 0.025));
      ctx.lineWidth = newWidth;
      ctx.strokeStyle = STROKE_COLOR;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(lastPoint.x, lastPoint.y);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();

      lastPointRef.current = point;
    }
  };

  const stopDrawing = (e: React.PointerEvent) => {
    e.preventDefault();
    if (canvasRef.current) {
      try { canvasRef.current.releasePointerCapture(e.pointerId); } catch {}
    }
    setIsDrawing(false);
    lastPointRef.current = null;
    pointsRef.current = [];
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    ctx.strokeStyle = STROKE_COLOR;
    ctx.lineWidth = 2.5;
    setHasSignature(false);
  };

  const handleConfirm = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasSignature) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width;
    const h = canvas.height;

    // 1. Get raw pixel data to find bounding box of the signature
    const rawCtx = canvas.getContext('2d');
    if (!rawCtx) return;
    const imageData = rawCtx.getImageData(0, 0, w, h);
    const pixels = imageData.data;

    let minX = w, minY = h, maxX = 0, maxY = 0;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const alpha = pixels[(y * w + x) * 4 + 3];
        if (alpha > 10) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    // Add padding (10px in logical pixels)
    const pad = 10 * dpr;
    minX = Math.max(0, minX - pad);
    minY = Math.max(0, minY - pad);
    maxX = Math.min(w, maxX + pad);
    maxY = Math.min(h, maxY + pad);

    const cropW = maxX - minX;
    const cropH = maxY - minY;

    if (cropW <= 0 || cropH <= 0) return;

    // 2. Create cropped canvas with white background + dark strokes
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = cropW;
    tempCanvas.height = cropH;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    tempCtx.fillStyle = '#ffffff';
    tempCtx.fillRect(0, 0, cropW, cropH);
    tempCtx.drawImage(canvas, minX, minY, cropW, cropH, 0, 0, cropW, cropH);

    const dataUrl = tempCanvas.toDataURL('image/png');
    onConfirm(dataUrl);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center animate-fade-in" onClick={onClose} style={{ touchAction: 'none', overscrollBehavior: 'none' }}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      
      <div 
        className={`relative w-full sm:max-w-lg mx-0 sm:mx-4 rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl animate-slide-up sm:animate-scale-up ${
          isLight 
            ? 'bg-white border-gray-200' 
            : 'bg-[#111113] border-white/10'
        } border`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-4 border-b ${isLight ? 'border-gray-100' : 'border-white/5'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
              isLight ? 'bg-violet-100' : 'bg-violet-500/20'
            }`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={isLight ? 'text-violet-600' : 'text-violet-400'}>
                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
              </svg>
            </div>
            <div>
              <h3 className={`text-base font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                Ваша подпись
              </h3>
              <p className={`text-xs ${isLight ? 'text-gray-500' : 'text-zinc-500'}`}>
                Нарисуйте подпись пальцем или мышкой
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
              isLight ? 'bg-gray-100 hover:bg-gray-200 text-gray-500' : 'bg-white/5 hover:bg-white/10 text-zinc-400'
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Canvas area */}
        <div className="px-5 py-4" ref={containerRef}>
          <div className={`relative rounded-2xl overflow-hidden border-2 border-dashed ${
            isLight 
              ? 'border-gray-200 bg-gray-50' 
              : 'border-white/10 bg-white/[0.02]'
          }`}>
            <canvas
              ref={canvasRef}
              className="w-full touch-none cursor-crosshair"
              style={{ filter: isLight ? 'none' : 'invert(1)' }}
              onPointerDown={startDrawing}
              onPointerMove={draw}
              onPointerUp={stopDrawing}
              onPointerCancel={stopDrawing}
            />

            {/* Baseline guide */}
            <div 
              className={`absolute left-6 right-6 border-b border-dashed pointer-events-none ${
                isLight ? 'border-gray-300/60' : 'border-white/10'
              }`}
              style={{ bottom: '30%' }}
            />

            {/* Placeholder text */}
            {!hasSignature && (
              <div className={`absolute inset-0 flex flex-col items-center justify-center pointer-events-none ${
                isLight ? 'text-gray-300' : 'text-zinc-600'
              }`}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mb-2 opacity-50">
                  <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                </svg>
                <span className="text-sm font-medium">Распишитесь здесь</span>
              </div>
            )}

            {/* X marker */}
            <div className={`absolute left-4 font-serif text-2xl pointer-events-none ${
              isLight ? 'text-gray-300' : 'text-zinc-600'
            }`} style={{ bottom: 'calc(30% + 4px)' }}>
              ✕
            </div>
          </div>

          {/* Clear button */}
          <div className="flex justify-end mt-2">
            <button
              onClick={clearCanvas}
              disabled={!hasSignature}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                hasSignature
                  ? isLight 
                    ? 'text-red-600 hover:bg-red-50 hover:text-red-700' 
                    : 'text-red-400 hover:bg-red-500/10 hover:text-red-300'
                  : isLight
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-zinc-700 cursor-not-allowed'
              }`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="1 4 1 10 7 10"/>
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
              </svg>
              Очистить
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className={`px-5 py-4 border-t ${isLight ? 'border-gray-100 bg-gray-50/50' : 'border-white/5 bg-white/[0.02]'}`}>
          <div className={`flex items-start gap-2 mb-4 text-[11px] ${isLight ? 'text-gray-500' : 'text-zinc-500'}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0 mt-0.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <span>Подписывая, вы подтверждаете согласие с условиями публичной оферты. Подпись будет сохранена и привязана к вашему релизу.</span>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className={`flex-1 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${
                isLight 
                  ? 'bg-gray-100 hover:bg-gray-200 text-gray-700' 
                  : 'bg-white/5 hover:bg-white/10 text-zinc-300'
              }`}
            >
              Отмена
            </button>
            <button
              onClick={handleConfirm}
              disabled={!hasSignature}
              className={`flex-1 px-4 py-3 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                hasSignature
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg shadow-green-500/25'
                  : isLight 
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-white/10 text-zinc-600 cursor-not-allowed'
              }`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Подтвердить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
