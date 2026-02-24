"use client";
import { useTheme } from '@/contexts/ThemeContext';

export default function AboutPage() {
  const { themeName } = useTheme();
  const isLight = themeName === 'light';
  
  return (
    <div className="min-h-screen pt-24 sm:pt-32 md:pt-40">
      <div className="max-w-[1000px] mx-auto px-4 sm:px-6 md:px-8">
        <h1 className={`text-3xl sm:text-4xl font-black mb-4 sm:mb-6 ${isLight ? 'text-gray-800' : 'text-white'}`}>О нас</h1>
        <p className={`text-sm sm:text-base ${isLight ? 'text-gray-600' : 'text-zinc-400'}`}>Коротко о thqlabel — миссия, команда и контакты.</p>
      </div>
    </div>
  );
}
