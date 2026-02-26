"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { toInstrumentalCase, formatContractDate } from '@/app/cabinet/release-basic/create/components/contractUtils';

interface ContractRelease {
  id: string;
  title: string;
  artist_name: string;
  user_email: string;
  user_name: string;
  status: string;
  contract_agreed: boolean;
  contract_agreed_at: string | null;
  contract_signature: string | null;
  created_at: string;
  release_type: 'basic' | 'exclusive';
  cover_url?: string;
  contract_number?: string;
  contract_full_name?: string;
  contract_country?: string;
  contract_passport?: string;
  contract_passport_issued_by?: string;
  contract_passport_code?: string;
  contract_passport_date?: string;
  contract_email?: string;
  contract_bank_account?: string;
  contract_bank_bik?: string;
  contract_bank_corr?: string;
  contract_card_number?: string;
  contract_data?: Record<string, string> | null;
  contract_signed_at?: string;
  tracks?: any[];
}

interface ContractsTabProps {
  supabase?: any;
}

export default function ContractsTab({ supabase }: ContractsTabProps) {
  const { themeName } = useTheme();
  const isLight = themeName === 'light';
  const [contracts, setContracts] = useState<ContractRelease[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSignature, setSelectedSignature] = useState<ContractRelease | null>(null);
  const [filter, setFilter] = useState<'all' | 'signed' | 'unsigned'>('all');
  const [downloadingDoc, setDownloadingDoc] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const loadContracts = useCallback(async () => {
    if (!supabase) { setLoading(false); return; }
    setLoading(true);
    try {
      const contractFields = 'id, title, artist_name, user_id, status, contract_agreed, contract_agreed_at, contract_signature, created_at, cover_url, contract_number, contract_full_name, contract_country, contract_passport, contract_passport_issued_by, contract_passport_code, contract_passport_date, contract_email, contract_bank_account, contract_bank_bik, contract_bank_corr, contract_card_number, contract_data, contract_signed_at, tracks';
      const [basicRes, exclusiveRes] = await Promise.all([
        supabase
          .from('releases_basic')
          .select(contractFields)
          .neq('status', 'draft')
          .order('created_at', { ascending: false }),
        supabase
          .from('releases_exclusive')
          .select(contractFields)
          .neq('status', 'draft')
          .order('created_at', { ascending: false }),
      ]);

      const allReleases = [
        ...(basicRes.data || []).map((r: any) => ({ ...r, release_type: 'basic' as const })),
        ...(exclusiveRes.data || []).map((r: any) => ({ ...r, release_type: 'exclusive' as const })),
      ];

      const userIds = [...new Set(allReleases.map(r => r.user_id))];
      let profileMap = new Map();
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, email, display_name, nickname')
          .in('id', userIds);
        profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));
      }

      const contractsList: ContractRelease[] = allReleases.map(r => {
        const profile = profileMap.get(r.user_id) || {};
        return {
          ...r,
          user_email: (profile as any).email || 'Unknown',
          user_name: (profile as any).display_name || (profile as any).nickname || (profile as any).email || 'Unknown',
        };
      });

      contractsList.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setContracts(contractsList);
    } catch (err) {
      console.error('Error loading contracts:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadContracts();
  }, [loadContracts]);

  const filteredContracts = contracts.filter(c => {
    if (filter === 'signed') return !!c.contract_signature;
    if (filter === 'unsigned') return !c.contract_signature;
    return true;
  });

  const signedCount = contracts.filter(c => !!c.contract_signature).length;

  // Helper: format seconds to M:SS
  const fmtDur = (sec?: number) => {
    if (!sec || sec <= 0) return '-';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  // Download contract via /api/contracts/generate (new PDF renderer)
  const downloadContractViaApi = useCallback(async (contract: ContractRelease, format: 'pdf' | 'docx') => {
    const cd = contract.contract_data as Record<string, string> | null;
    const fio = contract.contract_full_name || cd?.fullName || '';
    if (!fio) throw new Error('Данные договора отсутствуют');

    let plotnikovSignatureBase64 = '';
    try {
      const resp = await fetch('/rospis.png');
      const blob = await resp.blob();
      plotnikovSignatureBase64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    } catch { /* fallback */ }

    const dateStr = contract.contract_signed_at || contract.contract_agreed_at
      ? formatContractDate(new Date(contract.contract_signed_at || contract.contract_agreed_at || ''))
      : formatContractDate(new Date());

    const tracks = (contract.tracks || []).map((t: any) => ({
      title: t.title || '-',
      duration: fmtDur(t.audioMetadata?.duration),
      composer: (t.authors || []).filter((a: any) => a.role === 'composer').map((a: any) => a.fullName).join(', ') || '-',
      lyricist: (t.authors || []).filter((a: any) => a.role === 'lyricist').map((a: any) => a.fullName).join(', ') || '-',
    }));

    const data = {
      orderId: contract.contract_number || contract.id,
      date: dateStr,
      country: contract.contract_country || cd?.country || '',
      fio,
      fio_tvor: toInstrumentalCase(fio),
      nickname: contract.artist_name || contract.title || '',
      releaseTitle: contract.title || '',
      tracks,
      passport_number: contract.contract_passport || cd?.passport || '',
      passport_issued_by: contract.contract_passport_issued_by || cd?.passportIssuedBy || '',
      passport_code: contract.contract_passport_code || cd?.passportCode || '',
      passport_date: contract.contract_passport_date || cd?.passportDate || '',
      email: contract.contract_email || cd?.email || contract.user_email || '',
      bank_account: contract.contract_bank_account || cd?.bankAccount || '',
      bik: contract.contract_bank_bik || cd?.bankBik || '',
      corr_account: contract.contract_bank_corr || cd?.bankCorr || '',
      card_number: contract.contract_card_number || cd?.cardNumber || '',
    };

    const apiResp = await fetch('/api/contracts/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data, signatureBase64: contract.contract_signature || null, plotnikovSignatureBase64, format }),
    });
    if (!apiResp.ok) throw new Error(`API error: ${apiResp.status}`);

    const blob = await apiResp.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeName = fio.replace(/\s+/g, '_');
    a.download = `Договор_${contract.contract_number || 'thqlabel'}_${safeName}.${format === 'pdf' ? 'pdf' : 'docx'}`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleDownloadDoc = useCallback(async (contract: ContractRelease) => {
    setDownloadingDoc(true);
    try {
      await downloadContractViaApi(contract, 'docx');
    } catch (err) {
      console.error('DOC generation error:', err);
      alert('Ошибка при генерации DOCX');
    } finally {
      setDownloadingDoc(false);
    }
  }, [downloadContractViaApi]);

  const handleDownloadPdf = useCallback(async (contract: ContractRelease) => {
    setDownloadingPdf(true);
    try {
      await downloadContractViaApi(contract, 'pdf');
    } catch (err) {
      console.error('PDF generation error:', err);
      alert('Ошибка при генерации PDF');
    } finally {
      setDownloadingPdf(false);
    }
  }, [downloadContractViaApi]);

  const hasContractData = (contract: ContractRelease): boolean => {
    const cd = contract.contract_data as Record<string, string> | null;
    return !!(contract.contract_full_name || cd?.fullName);
  };

  const statusLabels: Record<string, string> = {
    pending: 'На модерации',
    approved: 'Одобрен',
    rejected: 'Отклонён',
    published: 'Опубликован',
    distributed: 'На дистрибуции',
    awaiting_payment: 'Ожидает оплаты',
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-400',
    approved: 'bg-green-500/20 text-green-400',
    rejected: 'bg-red-500/20 text-red-400',
    published: 'bg-purple-500/20 text-purple-400',
    distributed: 'bg-blue-500/20 text-blue-400',
    awaiting_payment: 'bg-orange-500/20 text-orange-400',
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 mb-4 sm:mb-6">
        <div>
          <p className={`text-xs sm:text-sm ${isLight ? 'text-gray-500' : 'text-zinc-500'}`}>
            Договоры артистов
          </p>
          <div className="flex items-center gap-3 mt-1">
            <span className={`text-xs ${isLight ? 'text-gray-400' : 'text-zinc-600'}`}>
              Всего: {contracts.length}
            </span>
            <span className="text-xs text-green-400">
              С договором: {signedCount}
            </span>
            <span className={`text-xs ${isLight ? 'text-gray-400' : 'text-zinc-600'}`}>
              Без договора: {contracts.length - signedCount}
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-1.5">
          {(['all', 'signed', 'unsigned'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filter === f
                  ? 'bg-violet-500/20 text-violet-400 ring-1 ring-violet-500/30'
                  : isLight 
                    ? 'bg-gray-100 text-gray-500 hover:bg-gray-200' 
                    : 'bg-white/5 text-zinc-500 hover:bg-white/10'
              }`}
            >
              {f === 'all' ? 'Все' : f === 'signed' ? 'С договором' : 'Без договора'}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
        </div>
      )}

      {/* Empty state */}
      {!loading && filteredContracts.length === 0 && (
        <div className={`text-center py-12 sm:py-20 ${isLight ? 'text-gray-500' : 'text-zinc-600'}`}>
          <div className="flex justify-center mb-4">
            <svg className={`w-16 h-16 sm:w-20 sm:h-20 ${isLight ? 'text-gray-300' : 'text-zinc-700'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-sm sm:text-base">Нет контрактов по выбранному фильтру</p>
        </div>
      )}

      {/* Contracts list */}
      {!loading && filteredContracts.length > 0 && (
        <div className="grid gap-3">
          {filteredContracts.map((contract) => (
            <div
              key={`${contract.release_type}-${contract.id}`}
              className={`rounded-2xl border p-4 transition-all hover:scale-[1.005] ${
                isLight 
                  ? 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md' 
                  : 'bg-white/[0.02] border-white/5 hover:border-white/10 hover:bg-white/[0.04]'
              }`}
            >
              <div className="flex items-start gap-3 sm:gap-4">
                {/* Cover */}
                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex-shrink-0 overflow-hidden border ${
                  isLight ? 'border-gray-200 bg-gray-100' : 'border-white/10 bg-white/5'
                }`}>
                  {contract.cover_url ? (
                    <img src={contract.cover_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={isLight ? 'text-gray-300' : 'text-zinc-600'}>
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <polyline points="21 15 16 10 5 21"/>
                      </svg>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className={`font-bold text-sm truncate ${isLight ? 'text-gray-900' : 'text-white'}`}>
                      {contract.title}
                    </h4>
                    <span className={`flex-shrink-0 text-[10px] px-2 py-0.5 rounded-full font-bold ${statusColors[contract.status] || 'bg-zinc-500/20 text-zinc-400'}`}>
                      {statusLabels[contract.status] || contract.status}
                    </span>
                  </div>
                  <div className={`text-xs ${isLight ? 'text-gray-500' : 'text-zinc-500'} space-y-0.5`}>
                    <div className="flex items-center gap-2">
                      <span>{contract.artist_name}</span>
                      <span className={isLight ? 'text-gray-300' : 'text-zinc-700'}>•</span>
                      <span>{contract.user_email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        contract.release_type === 'basic' 
                          ? 'bg-blue-500/10 text-blue-400' 
                          : 'bg-violet-500/10 text-violet-400'
                      }`}>
                        {contract.release_type === 'basic' ? 'BASIC' : 'EXCLUSIVE'}
                      </span>
                      <span className={isLight ? 'text-gray-300' : 'text-zinc-700'}>•</span>
                      <span>{new Date(contract.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                  </div>
                </div>

                {/* Signature indicator */}
                <div className="flex-shrink-0 flex items-center gap-2">
                  {contract.contract_signature ? (
                    <button
                      onClick={() => setSelectedSignature(contract)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${
                        isLight 
                          ? 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 hover:border-green-300 hover:shadow-sm' 
                          : 'bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 hover:border-green-500/40'
                      }`}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-green-600">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/>
                      </svg>
                      <span className={`text-xs font-semibold ${isLight ? 'text-green-700' : 'text-green-400'}`}>Договор</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-500">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </button>
                  ) : (
                    <div className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium ${
                      isLight ? 'bg-gray-50 text-gray-400 border border-gray-200' : 'bg-white/[0.03] text-zinc-600 border border-white/5'
                    }`}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="opacity-50">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                      Нет договора
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Signature preview modal */}
      {selectedSignature && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setSelectedSignature(null)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div 
            className={`relative max-w-lg w-full rounded-3xl overflow-hidden shadow-2xl ${
              isLight ? 'bg-white' : 'bg-[#111113] border border-white/10'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className={`flex items-center justify-between px-5 py-4 border-b ${isLight ? 'border-gray-100' : 'border-white/5'}`}>
              <div>
                <h3 className={`font-bold text-base ${isLight ? 'text-gray-900' : 'text-white'}`}>
                  Договор
                </h3>
                <p className={`text-xs mt-0.5 ${isLight ? 'text-gray-500' : 'text-zinc-500'}`}>
                  {selectedSignature.title} — {selectedSignature.artist_name}
                </p>
              </div>
              <button
                onClick={() => setSelectedSignature(null)}
                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                  isLight ? 'bg-gray-100 hover:bg-gray-200' : 'bg-white/5 hover:bg-white/10'
                }`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Contract info */}
            <div className="p-6">
              <div className={`rounded-2xl overflow-hidden border-2 p-6 flex flex-col items-center gap-3 ${
                isLight ? 'border-gray-200 bg-gray-50' : 'border-white/10 bg-zinc-900'
              }`}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={isLight ? 'text-violet-500' : 'text-violet-400'}>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10 9 9 9 8 9"/>
                </svg>
                <span className={`text-sm font-bold ${isLight ? 'text-gray-700' : 'text-white'}`}>Лицензионный договор</span>
                <span className={`text-xs ${isLight ? 'text-green-600' : 'text-green-400'} font-semibold flex items-center gap-1`}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                  Подписан
                </span>
              </div>

              {/* Meta info */}
              <div className={`mt-4 space-y-2 text-xs ${isLight ? 'text-gray-500' : 'text-zinc-500'}`}>
                <div className="flex justify-between">
                  <span>Пользователь:</span>
                  <span className={`font-medium ${isLight ? 'text-gray-700' : 'text-zinc-300'}`}>{selectedSignature.user_email}</span>
                </div>
                <div className="flex justify-between">
                  <span>Релиз:</span>
                  <span className={`font-medium ${isLight ? 'text-gray-700' : 'text-zinc-300'}`}>{selectedSignature.title}</span>
                </div>
                <div className="flex justify-between">
                  <span>Тип:</span>
                  <span className={`font-medium ${isLight ? 'text-gray-700' : 'text-zinc-300'}`}>
                    {selectedSignature.release_type === 'basic' ? 'Basic' : 'Exclusive'}
                  </span>
                </div>
                {selectedSignature.contract_agreed_at && (
                  <div className="flex justify-between">
                    <span>Дата подписания:</span>
                    <span className={`font-medium ${isLight ? 'text-gray-700' : 'text-zinc-300'}`}>
                      {new Date(selectedSignature.contract_agreed_at).toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className={`px-5 py-4 border-t ${isLight ? 'border-gray-100' : 'border-white/5'} space-y-3`}>
              {/* Contract download buttons */}
              {hasContractData(selectedSignature) && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDownloadDoc(selectedSignature)}
                    disabled={downloadingDoc}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
                      downloadingDoc ? 'opacity-50 cursor-wait' :
                      isLight 
                        ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                        : 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30'
                    }`}
                  >
                    {downloadingDoc ? (
                      <div className="w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                    )}
                    Скачать DOC
                  </button>
                  <button
                    onClick={() => handleDownloadPdf(selectedSignature)}
                    disabled={downloadingPdf}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
                      downloadingPdf ? 'opacity-50 cursor-wait' :
                      isLight 
                        ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                        : 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
                    }`}
                  >
                    {downloadingPdf ? (
                      <div className="w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                    )}
                    Скачать PDF
                  </button>
                </div>
              )}
              {/* Close row */}
              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedSignature(null)}
                  className={`flex-1 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
                    isLight 
                      ? 'bg-gray-100 hover:bg-gray-200 text-gray-700' 
                      : 'bg-white/5 hover:bg-white/10 text-zinc-300'
                  }`}
                >
                  Закрыть
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
