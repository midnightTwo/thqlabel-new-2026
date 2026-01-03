"use client";

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastOptions {
  message: string;
  type: ToastType;
  duration?: number;
}

// Конфигурация иконок и цветов
const toastConfig = {
  success: {
    icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>`,
    bgClass: 'from-emerald-500/20 to-emerald-600/10',
    borderClass: 'border-emerald-500/40',
    iconBg: 'bg-emerald-500',
    textClass: 'text-emerald-100',
    glowClass: 'shadow-emerald-500/20',
  },
  error: {
    icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>`,
    bgClass: 'from-red-500/20 to-red-600/10',
    borderClass: 'border-red-500/40',
    iconBg: 'bg-red-500',
    textClass: 'text-red-100',
    glowClass: 'shadow-red-500/20',
  },
  info: {
    icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
    bgClass: 'from-blue-500/20 to-blue-600/10',
    borderClass: 'border-blue-500/40',
    iconBg: 'bg-blue-500',
    textClass: 'text-blue-100',
    glowClass: 'shadow-blue-500/20',
  },
  warning: {
    icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>`,
    bgClass: 'from-amber-500/20 to-amber-600/10',
    borderClass: 'border-amber-500/40',
    iconBg: 'bg-amber-500',
    textClass: 'text-amber-100',
    glowClass: 'shadow-amber-500/20',
  },
};

/**
 * Показать красивое toast-уведомление
 */
export function showToast({ message, type, duration = 4000 }: ToastOptions): void {
  if (typeof window === 'undefined') return;
  
  const config = toastConfig[type];
  
  // Удаляем предыдущие toast
  const existingToasts = document.querySelectorAll('.thq-toast');
  existingToasts.forEach(t => t.remove());
  
  // Создаём контейнер
  const toast = document.createElement('div');
  toast.className = 'thq-toast fixed top-6 right-6 z-[99999]';
  
  toast.innerHTML = `
    <div class="flex items-center gap-3 px-5 py-4 rounded-2xl border backdrop-blur-2xl bg-gradient-to-r ${config.bgClass} ${config.borderClass} shadow-2xl ${config.glowClass} min-w-[300px] max-w-[450px]"
         style="animation: toastSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);">
      <div class="w-10 h-10 rounded-xl ${config.iconBg} flex items-center justify-center text-white shrink-0 shadow-lg"
           style="animation: toastIconPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s backwards;">
        ${config.icon}
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-semibold ${config.textClass} leading-relaxed">${message}</p>
      </div>
      <button class="shrink-0 w-8 h-8 rounded-xl hover:bg-white/10 transition-all flex items-center justify-center text-white/40 hover:text-white/80 hover:scale-110"
              onclick="this.closest('.thq-toast').remove()">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>
    <div class="absolute bottom-0 left-5 right-5 h-1 rounded-full overflow-hidden bg-white/10">
      <div class="h-full ${config.iconBg} rounded-full" style="animation: toastProgress ${duration}ms linear forwards;"></div>
    </div>
  `;
  
  // Добавляем стили анимации если их ещё нет
  if (!document.getElementById('thq-toast-styles')) {
    const style = document.createElement('style');
    style.id = 'thq-toast-styles';
    style.textContent = `
      @keyframes toastSlideIn {
        from {
          opacity: 0;
          transform: translateX(100%) scale(0.8);
        }
        to {
          opacity: 1;
          transform: translateX(0) scale(1);
        }
      }
      @keyframes toastSlideOut {
        from {
          opacity: 1;
          transform: translateX(0) scale(1);
        }
        to {
          opacity: 0;
          transform: translateX(100%) scale(0.8);
        }
      }
      @keyframes toastIconPop {
        from {
          opacity: 0;
          transform: scale(0);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }
      @keyframes toastProgress {
        from {
          width: 100%;
        }
        to {
          width: 0%;
        }
      }
    `;
    document.head.appendChild(style);
  }
  
  document.body.appendChild(toast);
  
  // Автоматическое удаление
  setTimeout(() => {
    const inner = toast.querySelector('div');
    if (inner) {
      inner.style.animation = 'toastSlideOut 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards';
    }
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// Быстрые хелперы
export const showSuccessToast = (message: string, duration?: number) => 
  showToast({ message, type: 'success', duration });

export const showErrorToast = (message: string, duration?: number) => 
  showToast({ message, type: 'error', duration });

export const showInfoToast = (message: string, duration?: number) => 
  showToast({ message, type: 'info', duration });

export const showWarningToast = (message: string, duration?: number) => 
  showToast({ message, type: 'warning', duration });
