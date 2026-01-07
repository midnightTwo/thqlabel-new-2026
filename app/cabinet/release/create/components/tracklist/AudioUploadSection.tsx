import React, { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

interface AudioMetadata {
  format: string;
  duration?: number;
  bitrate?: string;
  sampleRate?: string;
  size: number;
}

interface AudioUploadSectionProps {
  trackAudioFile?: File | null;
  setTrackAudioFile?: (file: File | null) => void;
  trackAudioMetadata?: AudioMetadata | null;
  setTrackAudioMetadata?: (metadata: AudioMetadata | null) => void;
  existingAudioUrl?: string;
  originalFileName?: string;
}

export function AudioUploadSection({
  trackAudioFile,
  setTrackAudioFile,
  trackAudioMetadata,
  setTrackAudioMetadata,
  existingAudioUrl,
  originalFileName
}: AudioUploadSectionProps) {
  const { themeName } = useTheme();
  const isLight = themeName === 'light';
  
  const [uploadError, setUploadError] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const analyzeAudioFile = async (file: File): Promise<AudioMetadata | null> => {
    try {
      setIsAnalyzing(true);
      setUploadError('');

      const fileName = file.name.toLowerCase();
      const isWav = fileName.endsWith('.wav');
      const isFlac = fileName.endsWith('.flac');
      
      if (!isWav && !isFlac) {
        setUploadError('❌ MP3 не принимается. Загрузите WAV или FLAC');
        return null;
      }

      const metadata: AudioMetadata = {
        format: isWav ? 'WAV' : 'FLAC',
        size: file.size,
      };

      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const arrayBuffer = await file.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        metadata.duration = audioBuffer.duration;
        metadata.sampleRate = `${audioBuffer.sampleRate / 1000} kHz`;
        
        if (audioBuffer.sampleRate < 44100) {
          setUploadError(`⚠️ Частота дискретизации слишком низкая: ${audioBuffer.sampleRate / 1000} kHz. Минимум: 44.1 kHz`);
          return null;
        }
        
        audioContext.close();
      } catch (e) {
        console.warn('Не удалось получить метаданные через Web Audio API:', e);
      }

      return metadata;
    } catch (error) {
      console.error('Ошибка анализа файла:', error);
      setUploadError('Ошибка анализа файла');
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAudioFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const metadata = await analyzeAudioFile(file);
    if (metadata && setTrackAudioFile && setTrackAudioMetadata) {
      setTrackAudioFile(file);
      setTrackAudioMetadata(metadata);
    } else if (!metadata) {
      e.target.value = '';
      if (setTrackAudioFile) setTrackAudioFile(null);
      if (setTrackAudioMetadata) setTrackAudioMetadata(null);
    }
  };

  return (
    <div>
      <label className={`text-xs font-bold uppercase tracking-wider mb-2 block flex items-center gap-2 ${isLight ? 'text-gray-600' : 'text-zinc-400'}`}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={isLight ? 'text-sky-500' : 'text-sky-400/70'}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <path d="M12 18v-6"/>
          <path d="M9 15l3-3 3 3"/>
        </svg>
        Аудиофайл
        <span className="text-red-400 text-[10px]">*</span>
      </label>
      
      {uploadError && (
        <div className={`mb-3 p-4 border rounded-xl flex items-start gap-3 animate-fade-in ${isLight ? 'bg-red-50 border-red-200' : 'bg-gradient-to-r from-red-500/10 to-orange-500/10 border-red-500/30'}`}>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isLight ? 'bg-red-100' : 'bg-red-500/20'}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={isLight ? 'text-red-500' : 'text-red-400'}>
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          </div>
          <div>
            <div className={`font-bold text-sm ${isLight ? 'text-red-700' : 'text-red-300'}`}>Ошибка загрузки</div>
            <div className={`text-xs mt-0.5 ${isLight ? 'text-red-600' : 'text-red-400/80'}`}>{uploadError.replace(/^[❌⚠️]\s*/, '')}</div>
          </div>
        </div>
      )}

      {trackAudioFile && trackAudioMetadata ? (
        <div className={`rounded-2xl p-4 ${isLight ? 'bg-emerald-50 border border-emerald-200' : 'bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/30'}`}>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${isLight ? 'bg-emerald-100' : 'bg-emerald-500/20'}`}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={isLight ? 'text-emerald-600' : 'text-emerald-400'}>
                <path d="M9 18V5l12-2v13"/>
                <circle cx="6" cy="18" r="3"/>
                <circle cx="18" cy="16" r="3"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className={`font-bold truncate ${isLight ? 'text-gray-900' : 'text-white'}`}>{trackAudioFile.name}</div>
              <div className={`flex flex-wrap items-center gap-3 mt-2 text-xs ${isLight ? 'text-gray-500' : 'text-zinc-400'}`}>
                <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg ${isLight ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-500/20 text-emerald-400'}`}>
                  {trackAudioMetadata.format}
                </span>
                {trackAudioMetadata.duration && (
                  <span className="inline-flex items-center gap-1.5">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12 6 12 12 16 14"/>
                    </svg>
                    {formatDuration(trackAudioMetadata.duration)}
                  </span>
                )}
                {trackAudioMetadata.sampleRate && (
                  <span className="inline-flex items-center gap-1.5">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                    </svg>
                    {trackAudioMetadata.sampleRate}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5">
                  {formatFileSize(trackAudioMetadata.size)}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                if (setTrackAudioFile) setTrackAudioFile(null);
                if (setTrackAudioMetadata) setTrackAudioMetadata(null);
              }}
              className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all border ${isLight ? 'bg-red-50 hover:bg-red-100 border-red-200 hover:border-red-300 text-red-500' : 'bg-red-500/10 hover:bg-red-500/20 border-red-500/20 hover:border-red-500/40 text-red-400'}`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>
      ) : (existingAudioUrl || originalFileName) ? (
        /* Показываем существующий файл когда нет нового файла */
        <div className={`rounded-2xl p-4 ${isLight ? 'bg-blue-50 border border-blue-200' : 'bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30'}`}>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${isLight ? 'bg-blue-100' : 'bg-blue-500/20'}`}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={isLight ? 'text-blue-600' : 'text-blue-400'}>
                <path d="M9 18V5l12-2v13"/>
                <circle cx="6" cy="18" r="3"/>
                <circle cx="18" cy="16" r="3"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className={`font-bold flex items-center gap-2 ${isLight ? 'text-gray-900' : 'text-white'}`}>
                <span className={isLight ? 'text-emerald-600' : 'text-emerald-400'}>✓</span> Аудио загружено
              </div>
              <div className={`text-xs mt-1 truncate max-w-full ${isLight ? 'text-gray-500' : 'text-zinc-400'}`}>
                {originalFileName || existingAudioUrl?.split('/').pop()?.split('?')[0] || 'audio.wav'}
              </div>
              <div className={`text-[10px] mt-1 ${isLight ? 'text-gray-400' : 'text-zinc-500'}`}>
                Файл уже в системе — загружать заново не нужно
              </div>
            </div>
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".wav,.flac"
                onChange={handleAudioFileChange}
                className="hidden"
              />
              <div className={`px-3 py-2 rounded-lg text-xs transition border ${isLight ? 'bg-gray-100 hover:bg-gray-200 border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-900' : 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20 text-zinc-400 hover:text-white'}`}>
                Заменить
              </div>
            </label>
          </div>
        </div>
      ) : (
        <label className="block cursor-pointer group">
          <input
            type="file"
            accept=".wav,.flac"
            onChange={handleAudioFileChange}
            className="hidden"
          />
          <div className={`relative overflow-hidden border-2 border-dashed rounded-2xl p-6 transition-all ${isLight ? 'border-gray-300 bg-gray-50 hover:border-purple-400 hover:bg-purple-50/50' : 'border-white/10 hover:border-purple-500/40 bg-gradient-to-br from-white/[0.02] to-transparent hover:from-purple-500/5 hover:to-blue-500/5'}`}>
            <div className="text-center">
              {isAnalyzing ? (
                <>
                  <div className={`w-12 h-12 mx-auto mb-4 rounded-xl flex items-center justify-center ${isLight ? 'bg-purple-100' : 'bg-purple-500/20'}`}>
                    <svg className={`animate-spin w-6 h-6 ${isLight ? 'text-purple-600' : 'text-purple-400'}`} fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                  </div>
                  <span className={`text-sm font-semibold ${isLight ? 'text-purple-600' : 'text-purple-400'}`}>Анализ файла...</span>
                </>
              ) : (
                <>
                  <div className={`w-12 h-12 mx-auto mb-4 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${isLight ? 'bg-gradient-to-br from-purple-100 to-blue-100' : 'bg-gradient-to-br from-purple-500/20 to-blue-500/20'}`}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={isLight ? 'text-purple-600' : 'text-purple-400'}>
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                  </div>
                  <span className={`text-sm ${isLight ? 'text-gray-500' : 'text-zinc-400'}`}>Нажмите для загрузки или перетащите файл</span>
                  <div className="flex flex-wrap justify-center gap-2 mt-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold ${isLight ? 'bg-purple-100 text-purple-700' : 'bg-purple-500/20 text-purple-400'}`}>WAV</span>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold ${isLight ? 'bg-blue-100 text-blue-700' : 'bg-blue-500/20 text-blue-400'}`}>FLAC</span>
                  </div>
                  <p className={`text-[10px] mt-2 ${isLight ? 'text-gray-400' : 'text-zinc-500'}`}>Минимальная частота: 44.1 kHz</p>
                </>
              )}
            </div>
          </div>
        </label>
      )}
    </div>
  );
}
