"use client";
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface CopyToastProps {
  show: boolean;
  message?: string;
}

export default function CopyToast({ show, message = 'UPC код скопирован' }: CopyToastProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!show || !mounted) return null;

  return createPortal(
    <div 
      className="fixed top-0 left-0 w-screen h-screen flex items-center justify-center z-[99999] pointer-events-none"
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <div 
        className="relative bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 border border-white/20 rounded-2xl px-8 py-5 shadow-2xl pointer-events-auto backdrop-blur-xl animate-scale-in"
        style={{ boxShadow: '0 0 80px rgba(255, 255, 255, 0.15), 0 0 40px rgba(147, 51, 234, 0.3)' }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-blue-500/10 rounded-2xl" />
        <div className="relative flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-purple-500/30 blur-md rounded-full animate-pulse" />
            <svg className="w-5 h-5 text-purple-400 relative animate-checkmark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="font-bold text-white text-base tracking-wide">{message}</p>
        </div>
      </div>
    </div>,
    document.body
  );
}
