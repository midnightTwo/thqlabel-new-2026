"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/feed');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="text-center">
        <div className="text-4xl font-black italic">
          <span className="text-white">thq</span>
          <span className="text-[#6050ba]"> label</span>
        </div>
        <p className="text-sm mt-4 uppercase tracking-widest text-zinc-600">Загрузка...</p>
      </div>
    </div>
  );
}
