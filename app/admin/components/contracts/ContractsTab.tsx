"use client";
import React from 'react';

export default function ContractsTab() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <p className="text-zinc-500 text-sm">Управление контрактами артистов</p>
        <span className="text-[10px] bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full font-bold">В разработке</span>
      </div>
      <div className="text-center py-20 text-zinc-600">
        <div className="flex justify-center mb-4">
          <svg className="w-24 h-24 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p>Раздел контрактов в разработке</p>
      </div>
    </div>
  );
}
