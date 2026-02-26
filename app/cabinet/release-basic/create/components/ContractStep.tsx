import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '@/contexts/ThemeContext';
import SignaturePad from '@/components/SignaturePad';
import ContractTemplate from './ContractTemplate';
import CustomDatePicker from './CustomDatePicker';
import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';
import {
  ContractFormData,
  getEmptyContractData,
  validateContractField,
  formatPassportCode,
  formatCardNumber,
  formatBankAccount,
  formatBik,
  formatCorrAccount,
  generateContractNumber,
  toInstrumentalCase,
} from './contractUtils';

// Module-level cache для подписи Плотникова — конвертируем /rospis.png → base64 только один раз
let _plotnikovCache: string | null = null;
let _plotnikovLoading = false;
const _plotnikovCallbacks: Array<(url: string) => void> = [];

function loadPlotnikovSignature(cb: (url: string) => void) {
  if (_plotnikovCache) { cb(_plotnikovCache); return; }
  _plotnikovCallbacks.push(cb);
  if (_plotnikovLoading) return;
  _plotnikovLoading = true;
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(img, 0, 0);
      _plotnikovCache = canvas.toDataURL('image/png');
      _plotnikovCallbacks.forEach(fn => fn(_plotnikovCache!));
      _plotnikovCallbacks.length = 0;
    }
  };
  img.src = '/rospis.png';
}

interface ContractStepProps {
  agreedToContract: boolean;
  setAgreedToContract: (value: boolean) => void;
  onNext: () => void;
  onBack: () => void;
  signatureDataUrl?: string;
  setSignatureDataUrl?: (value: string) => void;
  contractData?: ContractFormData;
  setContractData?: (data: ContractFormData) => void;
  contractNumber?: string;
  setContractNumber?: (num: string) => void;
  userEmail?: string;
  nickname?: string;
  releaseId?: string;
  tracks?: Array<{ title: string; audioMetadata?: { duration?: number } | null; authors?: Array<{ role: string; fullName: string }> }>;
  releaseTitle?: string;
  artistName?: string;
  genre?: string;
  coverFile?: boolean;
  releaseDate?: string | null;
  tracksCount?: number;
  countriesCount?: number;
  onFullScreenChange?: (isFullScreen: boolean) => void;
}

export default function ContractStep({
  agreedToContract,
  setAgreedToContract,
  onNext,
  onBack,
  signatureDataUrl,
  setSignatureDataUrl,
  contractData: externalData,
  setContractData: setExternalData,
  contractNumber: externalNumber,
  setContractNumber: setExternalNumber,
  userEmail = '',
  nickname = '',
  releaseId = '',
  tracks = [],
  releaseTitle = '',
  artistName = '',
  genre = '',
  coverFile = false,
  releaseDate = null,
  tracksCount,
  countriesCount,
  onFullScreenChange,
}: ContractStepProps) {
  const { themeName } = useTheme();
  const isLight = themeName === 'light';
  const [mounted, setMounted] = useState(false);

  const [showFullScreen, setShowFullScreenRaw] = useState(false);
  const setShowFullScreen = (val: boolean) => {
    setShowFullScreenRaw(val);
    onFullScreenChange?.(val);
    // Напрямую скрываем/показываем кнопку "Назад в кабинет"
    const btn = document.getElementById('mobile-back-to-cabinet');
    if (btn) btn.style.display = val ? 'none' : '';
  };
  const [currentPage, setCurrentPage] = useState<'form' | 'preview' | 'sign'>('form');
  const [showSignatureModal, setShowSignatureModal] = useState(false);

  const [formData, setFormData] = useState<ContractFormData>(() => externalData || getEmptyContractData());
  const [contractNum, setContractNum] = useState(() => externalNumber || '');
  const [errors, setErrors] = useState<Partial<Record<keyof ContractFormData, string | null>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof ContractFormData, boolean>>>({});
  const [paymentMethod, setPaymentMethod] = useState<'bank' | 'card'>('bank');

  const formRef = useRef<HTMLDivElement>(null);
  const contractPdfRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isGeneratingDocx, setIsGeneratingDocx] = useState(false);

  // Convert /rospis.png to base64 data URL once — needed for DOCX/PDF exports (cached globally)
  const [plotnikovDataUrl, setPlotnikovDataUrl] = useState<string>(() => _plotnikovCache || '');
  useEffect(() => {
    if (!plotnikovDataUrl) {
      loadPlotnikovSignature(setPlotnikovDataUrl);
    }
  }, []);

  useEffect(() => { setMounted(true); }, []);

  // 🔒 Lock body scroll when fullscreen modal is open to prevent scroll conflicts
  useEffect(() => {
    if (showFullScreen) {
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
  }, [showFullScreen]);

  useEffect(() => {
    if (userEmail && !formData.email) {
      setFormData(prev => ({ ...prev, email: userEmail }));
    }
  }, [userEmail]);

  useEffect(() => {
    if (externalData) {
      setFormData(externalData);
      if (externalData.cardNumber && !externalData.bankAccount) {
        setPaymentMethod('card');
      }
    }
  }, []);

  /* ---------- steps-ready check ---------- */
  const realTracksCount = tracksCount ?? tracks.length;
  const realCountriesCount = countriesCount ?? 1;
  const stepsReady = !!(releaseTitle && artistName && genre && coverFile && releaseDate && realTracksCount > 0 && realCountriesCount > 0);

  const missingSteps: string[] = [];
  if (!releaseTitle || !artistName || !genre || !coverFile || !releaseDate) missingSteps.push('Информация о релизе (шаг 1)');
  if (realTracksCount < 1) missingSteps.push('Треклист (шаг 2)');
  if (realCountriesCount < 1) missingSteps.push('Страны (шаг 3)');

  /* ---------- form helpers ---------- */
  const updateField = useCallback((field: keyof ContractFormData, value: string) => {
    let v = value;
    switch (field) {
      case 'fullName': case 'country': v = value.replace(/[0-9]/g, ''); break;
      case 'passport': v = value.replace(/[^\d\s]/g, ''); break;
      case 'passportCode': v = formatPassportCode(value); break;
      case 'bankAccount': v = formatBankAccount(value); break;
      case 'bankBik': v = formatBik(value); break;
      case 'bankCorr': v = formatCorrAccount(value); break;
      case 'cardNumber': v = formatCardNumber(value); break;
    }
    setFormData(prev => ({ ...prev, [field]: v }));
    setTouched(prev => {
      if (prev[field]) setErrors(e => ({ ...e, [field]: validateContractField(field, v) }));
      return prev;
    });
  }, []);

  const handleBlur = useCallback((field: keyof ContractFormData) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    setFormData(cur => {
      setErrors(prev => ({ ...prev, [field]: validateContractField(field, cur[field]) }));
      return cur;
    });
  }, []);

  const validateAll = (): boolean => {
    const fields: (keyof ContractFormData)[] = [
      'fullName','country','passport','passportIssuedBy','passportCode','passportDate','email',
    ];
    if (paymentMethod === 'bank') fields.push('bankAccount','bankBik');
    else fields.push('cardNumber');
    const at: typeof touched = {};
    const ae: typeof errors = {};
    let bad = false;
    for (const f of fields) {
      at[f] = true;
      const e = validateContractField(f, formData[f]);
      ae[f] = e;
      if (f === 'bankAccount' && paymentMethod === 'bank' && !formData.bankAccount.trim()) { ae[f] = 'Введите номер счёта'; bad = true; }
      if (f === 'bankBik' && paymentMethod === 'bank' && !formData.bankBik.trim()) { ae[f] = 'Введите БИК'; bad = true; }
      if (f === 'cardNumber' && paymentMethod === 'card' && !formData.cardNumber.trim()) { ae[f] = 'Введите номер карты'; bad = true; }
      if (e) bad = true;
    }
    setTouched(at); setErrors(ae);
    return !bad;
  };

  const handleGeneratePreview = () => {
    if (!validateAll()) {
      const el = formRef.current?.querySelector('[data-error="true"]') as HTMLElement;
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    const num = contractNum || generateContractNumber(releaseId || Date.now().toString());
    setContractNum(num);
    if (setExternalNumber) setExternalNumber(num);
    if (setExternalData) setExternalData(formData);
    setCurrentPage('preview');
  };

  const handleSignContract = () => setShowSignatureModal(true);

  const handleSignatureConfirm = (dataUrl: string) => {
    if (setSignatureDataUrl) setSignatureDataUrl(dataUrl);
    setAgreedToContract(true);
    setShowSignatureModal(false);
    if (setExternalData) setExternalData(formData);
    if (setExternalNumber) setExternalNumber(contractNum);
    setCurrentPage('preview');
  };

  const handleReopenContract = () => {
    setShowFullScreen(true);
    setCurrentPage('preview');
  };

  const handleResetContract = () => {
    setAgreedToContract(false);
    if (setSignatureDataUrl) setSignatureDataUrl('');
    setCurrentPage('form');
    setShowFullScreen(true);
  };

  const waitForImagesInElement = useCallback(async (root: HTMLElement, timeoutMs = 5000) => {
    const images = Array.from(root.querySelectorAll('img')) as HTMLImageElement[];
    if (images.length === 0) return;

    await Promise.all(
      images.map((img) => new Promise<void>((resolve) => {
        if (img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
          resolve();
          return;
        }

        let settled = false;
        const done = () => {
          if (settled) return;
          settled = true;
          img.removeEventListener('load', onDone);
          img.removeEventListener('error', onDone);
          clearTimeout(timer);
          resolve();
        };

        const onDone = () => done();
        const timer = window.setTimeout(done, timeoutMs);

        img.addEventListener('load', onDone, { once: true });
        img.addEventListener('error', onDone, { once: true });
      }))
    );
  }, []);

    /* ---------- DOCX download via API ---------- */
  const handleDownloadDocx = async () => {
    setIsGeneratingDocx(true);

    try {
      const response = await fetch('/api/contracts/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          format: 'docx',
          data: {
            orderId: contractNum || 'thqlabel',
            date: new Date().toLocaleDateString('ru-RU'),
            country: formData.country || '',
            fio: formData.fullName || '',
            fio_tvor: toInstrumentalCase(formData.fullName) || formData.fullName || '',
            nickname: nickname || '',
            releaseTitle: releaseTitle || '',
            tracks: buildContractTracks(),
            passport_number: formData.passport || '',
            passport_issued_by: formData.passportIssuedBy || '',
            passport_code: formData.passportCode || '',
            passport_date: formData.passportDate || '',
            email: formData.email || '',
            bank_account: formData.bankAccount || '',
            bik: formData.bankBik || '',
            corr_account: formData.bankCorr || '',
            card_number: formData.cardNumber || '',
          },
          signatureBase64: signatureDataUrl,
          plotnikovSignatureBase64: plotnikovDataUrl,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate DOCX');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Договор_${contractNum || 'thqlabel'}_${(formData.fullName || 'artist').replace(/\s+/g, '_')}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (err) {
      console.error('DOCX generation error:', err);
      alert('Не удалось сгенерировать DOCX. Попробуйте ещё раз.');
    } finally {
      setIsGeneratingDocx(false);
    }
  };

// Seconds → "M:SS" string
  const fmtDur = (sec?: number): string => {
    if (!sec || sec <= 0) return '-';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const buildContractTracks = () =>
    (tracks || []).map(t => ({
      title: t.title || '-',
      duration: fmtDur(t.audioMetadata?.duration),
      composer: (t.authors || []).filter(a => a.role === 'composer').map(a => a.fullName).join(', ') || '-',
      lyricist: (t.authors || []).filter(a => a.role === 'lyricist').map(a => a.fullName).join(', ') || '-',
    }));

/* ---------- PDF download via API ---------- */
  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);

    try {
      const response = await fetch('/api/contracts/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: {
            orderId: contractNum || 'thqlabel',
            date: new Date().toLocaleDateString('ru-RU'),
            country: formData.country || '',
            fio: formData.fullName || '',
            fio_tvor: toInstrumentalCase(formData.fullName) || formData.fullName || '',
            nickname: nickname || '',
            releaseTitle: releaseTitle || '',
            tracks: buildContractTracks(),
            passport_number: formData.passport || '',
            passport_issued_by: formData.passportIssuedBy || '',
            passport_code: formData.passportCode || '',
            passport_date: formData.passportDate || '',
            email: formData.email || '',
            bank_account: formData.bankAccount || '',
            bik: formData.bankBik || '',
            corr_account: formData.bankCorr || '',
            card_number: formData.cardNumber || '',
          },
          signatureBase64: signatureDataUrl,
          plotnikovSignatureBase64: plotnikovDataUrl,
        }),
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        throw new Error(`Failed to generate PDF: ${errText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      const isDocx = response.headers.get('X-Conversion-Error') === 'true';
      const extension = isDocx ? 'docx' : 'pdf';
      
      a.download = `Договор_${contractNum || 'thqlabel'}_${(formData.fullName || 'artist').replace(/\s+/g, '_')}.${extension}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      if (isDocx) {
        alert('Внимание: LibreOffice не установлен на сервере. Скачан формат DOCX вместо PDF.');
      }

    } catch (err) {
      console.error('PDF generation error:', err);
      alert('Не удалось сгенерировать PDF. Попробуйте ещё раз.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

/* ---------- renderField ---------- */
  const renderField = (
    field: keyof ContractFormData,
    label: string,
    placeholder: string,
    opts?: { type?: string; icon?: React.ReactNode; hint?: string; inputMode?: 'text'|'numeric'|'email'|'tel'; autoComplete?: string; maxLength?: number; disabled?: boolean }
  ) => {
    const error = touched[field] ? errors[field] : null;
    const value = formData[field];
    const isDateType = opts?.type === 'date';
    
    // Используем кастомный DatePicker для полей с датой
    if (isDateType) {
      return (
        <div className="space-y-1.5" data-error={!!error}>
          <label className={`text-sm font-semibold flex items-center gap-2 ${isLight ? 'text-gray-700' : 'text-zinc-300'}`}>
            {opts?.icon}{label}<span className="text-red-500">*</span>
          </label>
          <CustomDatePicker
            value={value}
            onChange={(val) => updateField(field, val)}
            isLight={isLight}
            placeholder={placeholder}
            error={error}
            hasValue={!!value.trim()}
          />
          {opts?.hint && !error && <p className={`text-xs ${isLight ? 'text-gray-400' : 'text-zinc-500'}`}>{opts.hint}</p>}
          {error && (
            <p className="text-xs text-red-400 font-medium flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}
            </p>
          )}
        </div>
      );
    }
    
    return (
      <div className="space-y-1.5" data-error={!!error}>
        <label className={`text-sm font-semibold flex items-center gap-2 ${isLight ? 'text-gray-700' : 'text-zinc-300'}`}>
          {opts?.icon}{label}<span className="text-red-500">*</span>
        </label>
        <input
          type={opts?.type || 'text'}
          inputMode={opts?.inputMode}
          autoComplete={opts?.autoComplete || 'off'}
          maxLength={opts?.maxLength}
          disabled={opts?.disabled}
          value={value}
          onChange={e => updateField(field, e.target.value)}
          onBlur={() => handleBlur(field)}
          placeholder={placeholder}
          className={`w-full px-4 py-3.5 rounded-2xl text-base font-medium transition-all outline-none border-2 ${
            error ? 'border-red-500/60 bg-red-500/5 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
            : value.trim()
              ? isLight ? 'border-emerald-400/60 bg-emerald-50/50 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                        : 'border-emerald-500/40 bg-emerald-500/5 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20'
              : isLight ? 'border-gray-200 bg-white focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20'
                        : 'border-white/10 bg-white/5 focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20'
          } ${isLight ? 'text-gray-900 placeholder-gray-400' : 'text-white placeholder-zinc-500'} ${opts?.disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
        />
        {opts?.hint && !error && <p className={`text-xs ${isLight ? 'text-gray-400' : 'text-zinc-500'}`}>{opts.hint}</p>}
        {error && (
          <p className="text-xs text-red-400 font-medium flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {error}
          </p>
        )}
      </div>
    );
  };

  /* ==================== RENDER ==================== */
  return (
    <div className="animate-fade-up">
      <div className="mb-5 sm:mb-8">
        <div className="flex items-center gap-2.5 sm:gap-3 mb-3">
          <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center ring-1 ${isLight ? 'ring-green-500/20' : 'ring-white/10'}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`${isLight ? 'text-green-600' : 'text-green-300'} sm:w-7 sm:h-7`}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          </div>
          <div>
            <h2 className={`text-xl sm:text-3xl font-black bg-gradient-to-r ${isLight ? 'from-gray-900 to-gray-600' : 'from-white to-zinc-400'} bg-clip-text text-transparent`}>Лицензионный договор</h2>
            <p className={`text-xs sm:text-sm ${isLight ? 'text-gray-500' : 'text-zinc-500'} mt-0.5 sm:mt-1`}>Заполните данные и подпишите договор онлайн</p>
          </div>
        </div>
      </div>

      {/* ---------- Status card ---------- */}
      <div className={`relative p-5 sm:p-8 ${isLight ? 'bg-white border-gray-200' : 'bg-white/[0.02] border-white/10'} border rounded-2xl sm:rounded-3xl overflow-hidden`}>

        <div className="relative">
          {!agreedToContract ? (
            <>
              <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center ring-1 ring-green-400/30">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" className={`${isLight ? 'text-green-600' : 'text-green-300'}`} strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
              </div>
              <h3 className={`text-center text-lg font-bold mb-2 ${isLight ? 'text-gray-900' : 'text-white'}`}>Заполните и подпишите договор</h3>
              <p className={`text-center text-sm mb-6 ${isLight ? 'text-gray-600' : 'text-zinc-400'}`}>Для отправки релиза необходимо заполнить ваши данные и подписать лицензионный договор. Все поля обязательны.</p>

              {/* 3 mini-steps */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 max-w-lg mx-auto">
                {[{n:'1',l:'Заполните данные',d:'ФИО, паспорт, реквизиты'},{n:'2',l:'Проверьте договор',d:'Предпросмотр с данными'},{n:'3',l:'Подпишите',d:'Электронная подпись (ПЭП)'}].map(s=>(
                  <div key={s.n} className={`p-3 rounded-xl text-center ${isLight ? 'bg-white/80' : 'bg-white/5'} border ${isLight ? 'border-green-200/50' : 'border-white/10'}`}>
                    <div className={`w-8 h-8 mx-auto mb-2 rounded-full flex items-center justify-center text-sm font-bold ${isLight ? 'bg-green-100 text-green-700' : 'bg-green-500/20 text-green-400'}`}>{s.n}</div>
                    <p className={`text-xs font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>{s.l}</p>
                    <p className={`text-[10px] mt-0.5 ${isLight ? 'text-gray-500' : 'text-zinc-500'}`}>{s.d}</p>
                  </div>
                ))}
              </div>

              {/* Warning if steps 1-3 not done */}
              {!stepsReady && (
                <div className={`mb-4 p-4 rounded-xl border ${isLight ? 'bg-amber-50 border-amber-200' : 'bg-amber-500/10 border-amber-500/20'}`}>
                  <div className="flex items-start gap-3">
                    <svg className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isLight ? 'text-amber-600' : 'text-amber-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                    <div>
                      <p className={`text-sm font-semibold ${isLight ? 'text-amber-800' : 'text-amber-300'}`}>Сначала заполните предыдущие шаги:</p>
                      <ul className={`text-xs mt-1 space-y-0.5 ${isLight ? 'text-amber-700' : 'text-amber-400/80'}`}>{missingSteps.map(s=><li key={s}> {s}</li>)}</ul>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="button"
                disabled={!stepsReady}
                onClick={() => { setShowFullScreen(true); setCurrentPage('form'); }}
                className={`w-full max-w-md mx-auto block py-4 rounded-2xl font-bold text-base transition-all active:scale-[0.98] ${stepsReady ? 'bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white shadow-xl shadow-emerald-500/25' : isLight ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'}`}
              >
                <span className="flex items-center justify-center gap-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  {stepsReady ? 'Заполнить договор' : 'Заполните шаги 13'}
                </span>
              </button>
            </>
          ) : (
            <div className="text-center">
              <div className={`w-20 h-20 mx-auto mb-4 rounded-3xl flex items-center justify-center ${isLight ? 'bg-green-100' : 'bg-green-500/20'}`}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={isLight ? 'text-green-600' : 'text-green-400'}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              </div>
              <h3 className={`text-lg font-bold mb-1 ${isLight ? 'text-green-700' : 'text-green-400'}`}>Договор подписан </h3>
              {contractNum && <p className={`text-sm mb-2 ${isLight ? 'text-gray-600' : 'text-zinc-400'}`}>Договор № <span className={`font-mono font-bold ${isLight ? 'text-green-700' : 'text-green-400'}`}>{contractNum}</span></p>}

              {signatureDataUrl && (
                <div className="mt-3 mb-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: isLight ? 'rgba(34,197,94,0.08)' : 'rgba(34,197,94,0.1)' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={isLight ? 'text-green-600' : 'text-green-400'}>
                    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
                    <path d="M9 12l2 2 4-4"/>
                  </svg>
                  <span className={`text-sm font-semibold ${isLight ? 'text-green-700' : 'text-green-400'}`}>Подпись поставлена</span>
                </div>
              )}

              <div className="flex flex-wrap gap-2 sm:gap-3 justify-center mt-4">
                <button type="button" onClick={handleReopenContract} className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${isLight ? 'bg-green-100 hover:bg-green-200 text-green-700' : 'bg-green-500/10 hover:bg-green-500/20 text-green-400'}`}>Просмотр договора</button>
                <button type="button" onClick={() => { handleReopenContract(); setTimeout(() => handleDownloadPdf(), 600); }} className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 ${isLight ? 'bg-blue-100 hover:bg-blue-200 text-blue-700' : 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-400'}`}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Скачать PDF
                </button>
                <button type="button" onClick={handleResetContract} className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${isLight ? 'bg-red-50 hover:bg-red-100 text-red-600' : 'bg-red-500/10 hover:bg-red-500/20 text-red-400'}`}>Переподписать</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ---------- Navigation ---------- */}
      <div className={`mt-6 sm:mt-8 pt-4 sm:pt-6 border-t ${isLight ? 'border-gray-200' : 'border-white/10'} flex justify-between`}>
        <button onClick={onBack} className={`px-4 sm:px-6 py-2.5 sm:py-3 ${isLight ? 'bg-gray-100 hover:bg-gray-200 text-gray-700' : 'bg-white/5 hover:bg-white/10'} rounded-xl font-bold transition flex items-center gap-2 text-sm sm:text-base touch-manipulation`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4"><polyline points="15 18 9 12 15 6" strokeWidth="2"/></svg>
          Назад
        </button>
        <button onClick={onNext} disabled={!agreedToContract} className="px-6 sm:px-8 py-2.5 sm:py-3 bg-[#6050ba] hover:bg-[#7060ca] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold transition flex items-center gap-2 text-sm sm:text-base touch-manipulation" style={{ color: 'white' }}>
          Далее
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" className="w-4 h-4"><polyline points="9 18 15 12 9 6" strokeWidth="2"/></svg>
        </button>
      </div>

      {/* ========== FULLSCREEN PORTAL  INLINE JSX (NOT a sub-component!) ========== */}
      {mounted && showFullScreen && createPortal(
        <div className={`fixed inset-0 z-[99999] flex flex-col ${isLight ? 'bg-gray-50' : 'bg-[#0a0a0c]'}`} style={{ position:'fixed',top:0,left:0,right:0,bottom:0,width:'100vw',height:'100vh', touchAction: 'pan-y', overscrollBehavior: 'none' }}>

          {/* header */}
          <div className={`sticky top-0 z-50 px-4 py-3 flex items-center justify-between border-b ${isLight ? 'bg-white border-gray-200' : 'bg-[#0d0d0f] border-white/10'}`}>
            <button onClick={() => setShowFullScreen(false)} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isLight ? 'bg-gray-100 hover:bg-gray-200 text-gray-600' : 'bg-white/5 hover:bg-white/10 text-zinc-400'}`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
            <div className="text-center">
              <h2 className={`text-base font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                {currentPage === 'form' ? 'Заполнение договора' : agreedToContract ? 'Подписанный договор' : 'Предпросмотр договора'}
              </h2>
              <p className={`text-xs ${isLight ? 'text-gray-500' : 'text-zinc-500'}`}>Лицензионный договор thqlabel</p>
            </div>
            <div className="w-10"/>
          </div>

          {/* progress */}
          <div className={`px-4 py-3 ${isLight ? 'bg-white border-b border-gray-100' : 'bg-white/[0.02] border-b border-white/5'}`}>
            <div className="flex items-center justify-center gap-2 max-w-md mx-auto">
              {(['form','preview','sign'] as const).map((step,idx)=>{
                const labels = ['Данные','Просмотр','Подпись'];
                const isActive = currentPage === step;
                const isPast = (currentPage === 'preview' && idx === 0) || (currentPage === 'sign' && idx < 2) || (agreedToContract && idx <= 2);
                return (
                  <React.Fragment key={step}>
                    {idx > 0 && <div className={`h-0.5 w-8 rounded-full ${isPast || isActive ? 'bg-emerald-500' : isLight ? 'bg-gray-200' : 'bg-white/10'}`}/>}
                    <div className="flex items-center gap-1.5">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${isActive ? 'bg-gradient-to-br from-emerald-500 to-green-500 text-white shadow-lg shadow-emerald-500/30' : isPast ? 'bg-emerald-500/20 text-emerald-500' : isLight ? 'bg-gray-100 text-gray-400' : 'bg-white/5 text-zinc-500'}`}>
                        {isPast && !isActive ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg> : idx+1}
                      </div>
                      <span className={`text-xs font-medium hidden sm:block ${isActive ? (isLight ? 'text-emerald-700' : 'text-emerald-400') : isLight ? 'text-gray-400' : 'text-zinc-500'}`}>{labels[idx]}</span>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* content */}
          <div className="flex-1 overflow-y-auto" style={{ overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' }}>
            <div className="max-w-2xl mx-auto px-2 sm:px-4 py-4 sm:py-6">

              {/* ===== FORM PAGE ===== */}
              {currentPage === 'form' && (
                <div ref={formRef} className="space-y-6">
                  {/* Section 1: Personal */}
                  <div className={`p-5 rounded-2xl border ${isLight ? 'bg-white border-gray-100 shadow-sm' : 'bg-white/[0.03] border-white/10'}`}>
                    <div className="flex items-center gap-3 mb-5">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isLight ? 'bg-blue-100' : 'bg-blue-500/20'}`}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={isLight ? 'text-blue-600' : 'text-blue-400'}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      </div>
                      <div>
                        <h3 className={`font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>Персональные данные</h3>
                        <p className={`text-xs ${isLight ? 'text-gray-500' : 'text-zinc-500'}`}>Ваши данные для договора (Лицензиар)</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      {renderField('fullName','ФИО (полностью)','Иванов Иван Иванович',{hint:'Фамилия Имя Отчество  как в паспорте',inputMode:'text'})}
                      {renderField('country','Страна (гражданство)','Россия',{hint:'Для России  просто Россия или РФ',inputMode:'text'})}
                      {renderField('email','E-mail','artist@example.com',{type:'email',inputMode:'email'})}
                    </div>
                  </div>

                  {/* Section 2: Passport */}
                  <div className={`p-5 rounded-2xl border ${isLight ? 'bg-white border-gray-100 shadow-sm' : 'bg-white/[0.03] border-white/10'}`}>
                    <div className="flex items-center gap-3 mb-5">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isLight ? 'bg-amber-100' : 'bg-amber-500/20'}`}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={isLight ? 'text-amber-600' : 'text-amber-400'}><rect x="2" y="3" width="20" height="18" rx="2"/><line x1="2" y1="9" x2="22" y2="9"/><line x1="9" y1="3" x2="9" y2="9"/></svg>
                      </div>
                      <div>
                        <h3 className={`font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>Паспортные данные</h3>
                        <p className={`text-xs ${isLight ? 'text-gray-500' : 'text-zinc-500'}`}>Серия, номер и данные выдачи паспорта</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      {renderField('passport','Серия и номер паспорта','1234 567890',{hint:'Только цифры  серию и номер через пробел',inputMode:'numeric',maxLength:12})}
                      {renderField('passportIssuedBy','Кем выдан','ГУ МВД РОССИИ ПО ...',{hint:'Как указано в паспорте'})}
                      <div className="grid grid-cols-2 gap-4">
                        {renderField('passportCode','Код подразделения','000-000',{inputMode:'numeric',maxLength:7})}
                        {renderField('passportDate','Дата выдачи','Выберите дату',{type:'date'})}
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Bank */}
                  <div className={`p-5 rounded-2xl border ${isLight ? 'bg-white border-gray-100 shadow-sm' : 'bg-white/[0.03] border-white/10'}`}>
                    <div className="flex items-center gap-3 mb-5">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isLight ? 'bg-green-100' : 'bg-green-500/20'}`}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={isLight ? 'text-green-600' : 'text-green-400'}><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                      </div>
                      <div>
                        <h3 className={`font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>Банковские реквизиты</h3>
                        <p className={`text-xs ${isLight ? 'text-gray-500' : 'text-zinc-500'}`}>Для получения вознаграждения</p>
                      </div>
                    </div>
                    <div className={`flex p-1 rounded-xl mb-5 ${isLight ? 'bg-gray-100' : 'bg-white/5'}`}>
                      <button type="button" onClick={() => setPaymentMethod('bank')} className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${paymentMethod === 'bank' ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg shadow-emerald-500/20' : isLight ? 'text-gray-500 hover:text-gray-700' : 'text-zinc-400 hover:text-white'}`}>Банковский счёт</button>
                      <button type="button" onClick={() => setPaymentMethod('card')} className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${paymentMethod === 'card' ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg shadow-emerald-500/20' : isLight ? 'text-gray-500 hover:text-gray-700' : 'text-zinc-400 hover:text-white'}`}>Номер карты</button>
                    </div>
                    <div className="space-y-4">
                      {paymentMethod === 'bank' ? (
                        <>
                          {renderField('bankAccount','Номер счёта','40817810000000000000',{inputMode:'numeric',hint:'20 цифр  найдите в приложении банка',maxLength:20})}
                          {renderField('bankBik','БИК банка','044525000',{inputMode:'numeric',hint:'9 цифр',maxLength:9})}
                          {renderField('bankCorr','Корр. счёт (необязательно)','30101810000000000000',{inputMode:'numeric',hint:'20 цифр (необязательно)',maxLength:20})}
                        </>
                      ) : renderField('cardNumber','Номер карты','0000 0000 0000 0000',{inputMode:'numeric',hint:'16 цифр',maxLength:19})}
                    </div>
                  </div>

                  <button type="button" onClick={handleGeneratePreview} className="w-full py-4 rounded-2xl font-bold text-lg bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white shadow-xl shadow-emerald-500/25 transition-all active:scale-[0.98] flex items-center justify-center gap-3">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                    Сгенерировать договор
                  </button>
                </div>
              )}

              {/* ===== PREVIEW PAGE ===== */}
              {currentPage === 'preview' && (
                <div>
                  <div ref={contractPdfRef} className="p-4 sm:p-10 mb-4 bg-white text-black border border-gray-300 shadow overflow-x-auto" style={{ fontFamily: "'Times New Roman', Georgia, serif" }}>
                    <ContractTemplate data={formData} contractNumber={contractNum} nickname={nickname} tracks={tracks} isLight={isLight} signatureDataUrl={agreedToContract ? signatureDataUrl : undefined} plotnikovSignatureUrl={plotnikovDataUrl || undefined} />
                  </div>

                  {/* Buttons */}
                  <div className={`flex flex-wrap gap-3 sticky bottom-0 pb-6 pt-4 px-1 ${isLight ? 'bg-gray-50' : 'bg-[#0a0a0c]'}`} style={{ zIndex: 10 }}>
                    {!agreedToContract ? (
                      <>
                        <button type="button" onClick={() => setCurrentPage('form')} className={`hidden sm:block flex-1 min-w-[120px] py-4 rounded-2xl font-bold text-sm sm:text-base transition-all border-2 ${isLight ? 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200' : 'bg-white/5 hover:bg-white/10 text-zinc-300 border-white/10'}`}>← Изменить</button>
                        <button type="button" onClick={handleSignContract} className="w-full sm:flex-1 min-w-[180px] py-4 rounded-2xl font-bold text-sm sm:text-base bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white shadow-xl shadow-emerald-500/25 transition-all active:scale-[0.98] flex items-center justify-center gap-2 border-2 border-emerald-400/50">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                          Подписать договор
                        </button>
                      </>
                    ) : (
                      <>
                        <button type="button" onClick={handleResetContract} className={`py-3 sm:py-4 px-4 sm:px-5 rounded-2xl font-bold text-xs sm:text-sm transition-all border-2 ${isLight ? 'bg-red-50 hover:bg-red-100 text-red-600 border-red-200' : 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/30'}`}>Переподписать</button>
                        <button type="button" disabled={isGeneratingPdf} onClick={handleDownloadPdf} className={`py-3 sm:py-4 px-4 sm:px-5 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 border-2 ${isLight ? 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200' : 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border-blue-500/30'} ${isGeneratingPdf ? 'opacity-60 cursor-wait' : ''}`}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                          {isGeneratingPdf ? 'Генерация...' : 'Скачать PDF'}
                        </button>
                        <button type="button" onClick={() => setShowFullScreen(false)} className="flex-1 min-w-[120px] py-3 sm:py-4 px-5 rounded-2xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white shadow-xl shadow-emerald-500/25 transition-all active:scale-[0.98] flex items-center justify-center gap-2 border-2 border-emerald-400/50">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                          Закрыть
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Signature modal */}
          <SignaturePad isOpen={showSignatureModal} onClose={() => setShowSignatureModal(false)} onConfirm={handleSignatureConfirm} />
        </div>,
        document.body
      )}
    </div>
  );
}
