import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // Map CSS variables to Tailwind utilities
      colors: {
        // Page backgrounds
        'background': 'var(--bg-page)',
        
        // Surface colors
        'surface': 'var(--bg-surface)',
        'surface-elevated': 'var(--bg-surface-elevated)',
        'surface-sunken': 'var(--bg-surface-sunken)',
        
        // Glass effects
        'glass': 'var(--bg-glass)',
        'glass-hover': 'var(--bg-glass-hover)',
        'glass-active': 'var(--bg-glass-active)',
        
        // Card backgrounds
        'card': 'var(--bg-card)',
        'card-hover': 'var(--bg-card-hover)',
        
        // Text colors
        'foreground': 'var(--text-primary)',
        'foreground-secondary': 'var(--text-secondary)',
        'foreground-tertiary': 'var(--text-tertiary)',
        'foreground-muted': 'var(--text-muted)',
        'foreground-disabled': 'var(--text-disabled)',
        
        // Border colors
        'border-subtle': 'var(--border-subtle)',
        'border': 'var(--border-default)',
        'border-prominent': 'var(--border-prominent)',
        'border-focus': 'var(--border-focus)',
        
        // Accent colors
        'accent': 'var(--accent-primary)',
        'accent-secondary': 'var(--accent-secondary)',
        'accent-tertiary': 'var(--accent-tertiary)',
        'accent-bg': 'var(--accent-bg)',
        'accent-bg-hover': 'var(--accent-bg-hover)',
        
        // Semantic colors
        'success': 'var(--success)',
        'success-bg': 'var(--success-bg)',
        'error': 'var(--error)',
        'error-bg': 'var(--error-bg)',
        'warning': 'var(--warning)',
        'warning-bg': 'var(--warning-bg)',
        'info': 'var(--info)',
        'info-bg': 'var(--info-bg)',
        
        // Legacy colors
        'neon-blue': 'var(--neon-blue)',
        
        // Brand colors
        'brand': {
          'main': '#6050ba',
          'light': '#9d8df1',
        },
      },
      
      // Box shadows mapped to CSS variables
      boxShadow: {
        'sm': 'var(--shadow-sm)',
        'md': 'var(--shadow-md)',
        'lg': 'var(--shadow-lg)',
        'xl': 'var(--shadow-xl)',
        'glow': 'var(--shadow-glow)',
        'glow-intense': 'var(--shadow-glow-intense)',
        'colored': 'var(--shadow-colored)',
        'card': 'var(--shadow-card)',
        'levitate': 'var(--shadow-levitate)',
        'neon-blue': 'var(--neon-blue-glow)',
      },
      
      // Backdrop blur using CSS variable
      backdropBlur: {
        'glass': '24px',
      },
      
      // Border radius
      borderRadius: {
        'glass': '16px',
        'glass-lg': '20px',
        'glass-xl': '24px',
      },
      
      // Keyframes for animations
      keyframes: {
        slideInDown: {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        confetti: {
          '0%': { transform: 'translateY(0) rotate(0deg) scale(1)', opacity: '1' },
          '100%': { transform: 'translateY(150vh) rotate(720deg) scale(0.5)', opacity: '0' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0) rotate(0deg)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-10px) rotate(-2deg)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(10px) rotate(2deg)' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.5)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        pulse: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.05)' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        floatShape: {
          '0%, 100%': { transform: 'translate3d(0, 0, 0)' },
          '25%': { transform: 'translate3d(25px, -30px, 0)' },
          '50%': { transform: 'translate3d(-15px, 25px, 0)' },
          '75%': { transform: 'translate3d(30px, 15px, 0)' },
        },
        floatCard: {
          '0%': { transform: 'translate3d(0, 0, 0)' },
          '25%': { transform: 'translate3d(5px, -8px, 0)' },
          '50%': { transform: 'translate3d(0, -15px, 0)' },
          '75%': { transform: 'translate3d(-5px, -8px, 0)' },
          '100%': { transform: 'translate3d(0, 0, 0)' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.3)' },
        },
        twinkle: {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.3)' },
        },
        meshFloat: {
          '0%, 100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
          '25%': { opacity: '0.9', transform: 'scale(1.02) translateY(-10px)' },
          '50%': { opacity: '0.95', transform: 'scale(0.98) translateY(5px)' },
          '75%': { opacity: '0.85', transform: 'scale(1.01) translateY(-5px)' },
        },
        levitate: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      
      // Animations
      animation: {
        'slideInDown': 'slideInDown 0.4s ease-out',
        'confetti': 'confetti 3s ease-out forwards',
        'shake': 'shake 0.5s ease-in-out',
        'scaleIn': 'scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'shimmer': 'shimmer 2s linear infinite',
        'pulse': 'pulse 2s ease-in-out infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'fade-up': 'fadeUp 0.4s ease-out forwards',
        'float-shape': 'floatShape 20s ease-in-out infinite',
        'float-card': 'floatCard 6s ease-in-out infinite',
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
        'twinkle': 'twinkle 2.5s ease-in-out infinite',
        'mesh-float': 'meshFloat 25s ease-in-out infinite',
        'levitate': 'levitate 3s ease-in-out infinite',
      },
      
      // Background size for gradients
      backgroundSize: {
        '200%': '200% auto',
        '300%': '300% 300%',
      },
      
      // Transition timing functions
      transitionTimingFunction: {
        'bounce-soft': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'ease-smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [
    function ({ addUtilities }: any) {
      addUtilities({
        // Scrollbar utilities
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        },
        
        // Glass panel utility
        '.glass-panel': {
          'background': 'var(--bg-glass)',
          'backdrop-filter': 'var(--glass-blur) var(--glass-saturate)',
          '-webkit-backdrop-filter': 'var(--glass-blur) var(--glass-saturate)',
          'border': '1px solid var(--border-default)',
          'box-shadow': 'var(--shadow-card)',
          'border-radius': '16px',
          'transition': 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          'transform': 'translateZ(0)',
          'backface-visibility': 'hidden',
        },
        
        // Card utility
        '.card': {
          'background': 'var(--bg-card)',
          'border': '1px solid var(--border-subtle)',
          'border-radius': '16px',
          'box-shadow': 'var(--shadow-sm)',
          'transition': 'all 0.3s ease',
        },
        
        // Input glass utility
        '.input-glass': {
          'background': 'var(--bg-glass)',
          'border': '1px solid var(--border-default)',
          'border-radius': '12px',
          'color': 'var(--text-primary)',
          'transition': 'all 0.2s ease',
          '&:focus': {
            'border-color': 'var(--border-focus)',
            'box-shadow': '0 0 0 3px var(--accent-bg)',
            'outline': 'none',
          },
          '&::placeholder': {
            'color': 'var(--text-muted)',
          },
        },
        
        // Button primary utility
        '.btn-primary': {
          'background': 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
          'color': '#ffffff',
          'border': 'none',
          'border-radius': '12px',
          'font-weight': '600',
          'box-shadow': '0 8px 24px rgba(96, 80, 186, 0.3)',
          'transition': 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            'transform': 'translateY(-2px)',
            'box-shadow': '0 12px 32px rgba(96, 80, 186, 0.4)',
          },
        },
        
        // Button glass utility
        '.btn-glass': {
          'background': 'var(--bg-glass)',
          'backdrop-filter': 'var(--glass-blur)',
          'border': '1px solid var(--border-default)',
          'color': 'var(--text-primary)',
          'border-radius': '12px',
          'transition': 'all 0.3s ease',
          '&:hover': {
            'background': 'var(--bg-glass-hover)',
            'border-color': 'var(--border-prominent)',
          },
        },
        
        // Sidebar glass utility
        '.sidebar-glass': {
          'background': 'var(--bg-surface)',
          'backdrop-filter': 'var(--glass-blur) var(--glass-saturate)',
          '-webkit-backdrop-filter': 'var(--glass-blur) var(--glass-saturate)',
          'border-right': '1px solid var(--border-subtle)',
          'box-shadow': '4px 0 20px rgba(0, 0, 0, 0.1)',
        },
        
        // Text utilities
        '.text-heading': { 'color': 'var(--text-primary)' },
        '.text-body': { 'color': 'var(--text-secondary)' },
        '.text-caption': { 'color': 'var(--text-tertiary)' },
        '.text-hint': { 'color': 'var(--text-muted)' },
        '.text-accent': { 'color': 'var(--accent-primary)' },
        
        // Transform GPU
        '.transform-gpu': {
          'transform': 'translateZ(0)',
          'backface-visibility': 'hidden',
          'will-change': 'transform',
        },
      });
    },
  ],
};

export default config;
