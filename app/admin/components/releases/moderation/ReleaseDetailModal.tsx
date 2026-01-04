'use client';

import React, { useState, useCallback } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { Release } from '../types';
import { showSuccessToast, showErrorToast } from '@/lib/utils/showToast';

// ============================================================================
// SVG ICONS
// ============================================================================
const Icons = {
  close: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  download: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  ),
  downloadZip: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
      <rect x="14" y="2" width="4" height="5" rx="1" fill="currentColor" opacity="0.3"/>
    </svg>
  ),
  edit: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  ),
  excel: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <path d="M8 8l8 8M16 8l-8 8"/>
    </svg>
  ),
  trash: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
      <line x1="10" y1="11" x2="10" y2="17"/>
      <line x1="14" y1="11" x2="14" y2="17"/>
    </svg>
  ),
  check: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  checkCircle: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  music: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13"/>
      <circle cx="6" cy="18" r="3"/>
      <circle cx="18" cy="16" r="3"/>
    </svg>
  ),
  calendar: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  disc: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  tag: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
      <line x1="7" y1="7" x2="7.01" y2="7"/>
    </svg>
  ),
  barcode: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 5v14"/>
      <path d="M8 5v14"/>
      <path d="M12 5v14"/>
      <path d="M17 5v14"/>
      <path d="M21 5v14"/>
    </svg>
  ),
  warning: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  zap: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  chevron: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  ),
  plus: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
};

interface ReleaseDetailModalProps {
  release: Release;
  supabase: SupabaseClient;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  onDelete: () => void;
  rejectionReason: string;
  setRejectionReason: (reason: string) => void;
  onRefresh: () => void;
}

// Глобальный event для остановки всех треков в админке
const ADMIN_STOP_ALL_AUDIO_EVENT = 'thq-admin-stop-all-audio';
const stopAllAdminAudio = () => window.dispatchEvent(new CustomEvent(ADMIN_STOP_ALL_AUDIO_EVENT));

export default function ReleaseDetailModal({
  release,
  supabase,
  onClose,
  onApprove,
  onReject,
  onDelete,
  rejectionReason,
  setRejectionReason,
  onRefresh
}: ReleaseDetailModalProps) {
  const router = useRouter();
  
  // Состояния для редактирования
  const [editingTrackISRC, setEditingTrackISRC] = useState<{trackIndex: number, isrc: string} | null>(null);
  const [savingISRC, setSavingISRC] = useState(false);
  const [editingReleaseUPC, setEditingReleaseUPC] = useState(false);
  const [releaseUPCInput, setReleaseUPCInput] = useState('');
  const [savingReleaseUPC, setSavingReleaseUPC] = useState(false);
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showUnpublishConfirm, setShowUnpublishConfirm] = useState(false);
  const [showReceiptLightbox, setShowReceiptLightbox] = useState(false);

  // Остановка всех аудио при закрытии модалки
  const handleClose = useCallback(() => {
    stopAllAdminAudio();
    onClose();
  }, [onClose]);

  // Сохранение ISRC кода трека
  const handleSaveTrackISRC = useCallback(async (trackIndex: number, isrc: string) => {
    if (!supabase || !release) return;
    
    setSavingISRC(true);
    try {
      const updatedTracks = [...(release.tracks || [])];
      updatedTracks[trackIndex] = { ...updatedTracks[trackIndex], isrc };
      
      const tableName = release.release_type === 'basic' ? 'releases_basic' : 'releases_exclusive';
      
      const { error } = await supabase
        .from(tableName)
        .update({ tracks: updatedTracks })
        .eq('id', release.id);
      
      if (error) throw error;
      
      showSuccessToast('ISRC код сохранен');
      setEditingTrackISRC(null);
      onRefresh(); // Обновляем список
    } catch (error) {
      console.error('Ошибка сохранения ISRC:', error);
      showErrorToast('Ошибка при сохранении ISRC кода');
    } finally {
      setSavingISRC(false);
    }
  }, [supabase, release, onRefresh]);

  // Сохранение UPC кода релиза
  const handleSaveReleaseUPC = useCallback(async () => {
    if (!supabase || !release || !releaseUPCInput.trim()) return;
    
    setSavingReleaseUPC(true);
    try {
      const tableName = release.release_type === 'basic' ? 'releases_basic' : 'releases_exclusive';
      
      const { error } = await supabase
        .from(tableName)
        .update({ upc: releaseUPCInput.trim() })
        .eq('id', release.id);
      
      if (error) throw error;
      
      showSuccessToast('UPC код сохранен');
      setEditingReleaseUPC(false);
      onRefresh(); // Обновляем список
    } catch (error) {
      console.error('Ошибка сохранения UPC:', error);
      showErrorToast('Ошибка при сохранении UPC кода');
    } finally {
      setSavingReleaseUPC(false);
    }
  }, [supabase, release, releaseUPCInput, onRefresh]);

  // Скачивание файла
  const handleDownloadFile = useCallback(async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Ошибка загрузки');
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(downloadUrl);
      showSuccessToast('Файл скачан');
    } catch (error) {
      console.error('Ошибка скачивания:', error);
      showErrorToast('Ошибка при скачивании');
    }
  }, []);

  // Скачивание трека
  const handleDownloadTrack = useCallback(async (trackIndex: number, trackTitle: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      const url = `/api/stream-audio?releaseId=${release.id}&releaseType=${release.release_type}&trackIndex=${trackIndex}`;
      
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const response = await fetch(url, { headers });
      if (!response.ok) throw new Error('Ошибка загрузки');
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      
      const safeTitle = (trackTitle || `track_${trackIndex + 1}`).replace(/[\\/:*?"<>|]+/g, '_');
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${safeTitle}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(downloadUrl);
      showSuccessToast('Трек скачан');
    } catch (error) {
      console.error('Ошибка скачивания:', error);
      showErrorToast('Ошибка при скачивании трека');
    }
  }, [supabase, release]);

  // Проверка платежа
  const handleVerifyPayment = useCallback(async (isVerified: boolean) => {
    if (!supabase || release.release_type !== 'basic') return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const functionName = isVerified ? 'verify_basic_payment' : 'reject_basic_payment';
      const params: any = { release_id: release.id, admin_id: user.id };
      if (!isVerified) params.reason = rejectionReason || '';

      const { error } = await supabase.rpc(functionName, params);
      if (error) throw error;
      
      showSuccessToast(isVerified ? 'Платеж подтвержден' : 'Платеж отклонен');
      onRefresh();
    } catch (error) {
      console.error('Ошибка проверки платежа:', error);
      showErrorToast('Ошибка при проверке платежа');
    }
  }, [supabase, release, rejectionReason, onRefresh]);

  // Скачивание релиза в ZIP (обложка + треки)
  const handleDownloadAllTracks = useCallback(async () => {
    if (!release.tracks || release.tracks.length === 0) return;
    
    setDownloadingZip(true);
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      // 1. Скачиваем обложку
      if (release.cover_url) {
        try {
          const coverResponse = await fetch(release.cover_url);
          if (coverResponse.ok) {
            const coverBlob = await coverResponse.blob();
            const coverExt = release.cover_url.split('.').pop()?.split('?')[0] || 'jpg';
            zip.file(`cover.${coverExt}`, coverBlob);
          }
        } catch (e) {
          console.warn('Не удалось добавить обложку в архив');
        }
      }
      
      // 2. Скачиваем все треки
      for (let i = 0; i < release.tracks.length; i++) {
        const track = release.tracks[i];
        const url = `/api/stream-audio?releaseId=${release.id}&releaseType=${release.release_type}&trackIndex=${i}`;
        
        const headers: HeadersInit = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        
        const response = await fetch(url, { headers });
        if (response.ok) {
          const blob = await response.blob();
          const safeTitle = (track.title || `track_${i + 1}`).replace(/[\\/:*?"<>|]+/g, '_');
          // Определяем расширение по типу файла
          const ext = blob.type.includes('wav') ? 'wav' : blob.type.includes('flac') ? 'flac' : 'wav';
          zip.file(`${String(i + 1).padStart(2, '0')} - ${safeTitle}.${ext}`, blob);
        }
      }
      
      // Генерируем архив
      const content = await zip.generateAsync({ type: 'blob' });
      const safeArtist = release.artist_name.replace(/[\\/:*?"<>|]+/g, '_');
      const safeTitle = release.title.replace(/[\\/:*?"<>|]+/g, '_');
      const downloadUrl = window.URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${safeArtist} - ${safeTitle}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      showSuccessToast('Архив скачан');
    } catch (error) {
      console.error('Ошибка создания архива:', error);
      showErrorToast('Ошибка при создании архива');
    } finally {
      setDownloadingZip(false);
    }
  }, [supabase, release]);

  // Скачивание метаданных в Excel (красивый формат)
  const handleDownloadMetadata = useCallback(async () => {
    try {
      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'thqlabel';
      workbook.created = new Date();
      
      const sheet = workbook.addWorksheet('Metadata', {
        properties: { tabColor: { argb: '8B5CF6' } }
      });
      
      // Установка ширины колонок
      sheet.columns = [
        { width: 20 },
        { width: 40 },
        { width: 25 },
        { width: 18 },
        { width: 15 },
        { width: 20 },
        { width: 25 }
      ];
      
      // Стили
      const headerStyle: Partial<ExcelJS.Style> = {
        font: { bold: true, color: { argb: 'FFFFFF' }, size: 11 },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: '8B5CF6' } },
        alignment: { horizontal: 'center', vertical: 'middle' },
        border: { bottom: { style: 'thin', color: { argb: '6D28D9' } } }
      };
      
      const labelStyle: Partial<ExcelJS.Style> = {
        font: { bold: true, color: { argb: '71717A' }, size: 10 },
        alignment: { horizontal: 'left', vertical: 'middle' }
      };
      
      const valueStyle: Partial<ExcelJS.Style> = {
        font: { color: { argb: '18181B' }, size: 11 },
        alignment: { horizontal: 'left', vertical: 'middle' }
      };
      
      // === ЗАГОЛОВОК ===
      sheet.mergeCells('A1:G1');
      const titleCell = sheet.getCell('A1');
      titleCell.value = 'thqlabel — Release Metadata';
      titleCell.font = { bold: true, size: 16, color: { argb: '8B5CF6' } };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      sheet.getRow(1).height = 30;
      
      // === ИНФОРМАЦИЯ О РЕЛИЗЕ ===
      sheet.mergeCells('A3:G3');
      const sectionCell = sheet.getCell('A3');
      sectionCell.value = 'RELEASE INFO';
      Object.assign(sectionCell, headerStyle);
      sheet.getRow(3).height = 25;
      
      const releaseInfo = [
        ['Title', release.title],
        ['Artist', release.artist_name],
        ['Genre', release.genre || '—'],
        ['Subgenres', (release.subgenres || []).join(', ') || '—'],
        ['Release Date', release.release_date ? new Date(release.release_date).toLocaleDateString('ru-RU') : '—'],
        ['UPC', release.upc || '—'],
        ['Release Code', release.custom_id || '—'],
        ['Type', release.release_type === 'basic' ? 'Basic' : 'Exclusive'],
        ['Status', release.status],
        ['Platforms', (release.platforms || []).slice(0, 5).join(', ') + ((release.platforms || []).length > 5 ? '...' : '')],
      ];
      
      releaseInfo.forEach((row, idx) => {
        const rowNum = 4 + idx;
        const labelCell = sheet.getCell(`A${rowNum}`);
        labelCell.value = row[0];
        Object.assign(labelCell, labelStyle);
        
        sheet.mergeCells(`B${rowNum}:G${rowNum}`);
        const valCell = sheet.getCell(`B${rowNum}`);
        valCell.value = row[1];
        Object.assign(valCell, valueStyle);
      });
      
      // === ТРЕКЛИСТ ===
      const trackStartRow = 4 + releaseInfo.length + 2;
      sheet.mergeCells(`A${trackStartRow}:G${trackStartRow}`);
      const trackHeaderCell = sheet.getCell(`A${trackStartRow}`);
      trackHeaderCell.value = 'TRACKLIST';
      Object.assign(trackHeaderCell, headerStyle);
      sheet.getRow(trackStartRow).height = 25;
      
      // Заголовки колонок треков
      const trackColHeaders = ['#', 'Title', 'Version', 'ISRC', 'Language', 'Featuring', 'Producers'];
      const colHeaderRow = trackStartRow + 1;
      trackColHeaders.forEach((h, i) => {
        const cell = sheet.getCell(colHeaderRow, i + 1);
        cell.value = h;
        cell.font = { bold: true, size: 10, color: { argb: '52525B' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F4F4F5' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = { bottom: { style: 'thin', color: { argb: 'E4E4E7' } } };
      });
      sheet.getRow(colHeaderRow).height = 22;
      
      // Данные треков
      const tracks = release.tracks || [];
      tracks.forEach((track: any, idx: number) => {
        const rowNum = colHeaderRow + 1 + idx;
        const rowData = [
          idx + 1,
          track.title || '—',
          track.version || '—',
          track.isrc || '—',
          track.language || '—',
          Array.isArray(track.featuring) ? track.featuring.join(', ') : (track.featuring || '—'),
          Array.isArray(track.producers) ? track.producers.join(', ') : (track.producers || '—'),
        ];
        
        rowData.forEach((val, colIdx) => {
          const cell = sheet.getCell(rowNum, colIdx + 1);
          cell.value = val;
          cell.font = { size: 10, color: { argb: '3F3F46' } };
          cell.alignment = { horizontal: colIdx === 0 ? 'center' : 'left', vertical: 'middle' };
          if (idx % 2 === 1) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FAFAFA' } };
          }
        });
        sheet.getRow(rowNum).height = 20;
      });
      
      // === FOOTER ===
      const footerRow = colHeaderRow + 2 + tracks.length;
      sheet.mergeCells(`A${footerRow}:G${footerRow}`);
      const footerCell = sheet.getCell(`A${footerRow}`);
      footerCell.value = `Generated by thqlabel • ${new Date().toLocaleDateString('ru-RU')} ${new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
      footerCell.font = { italic: true, size: 9, color: { argb: 'A1A1AA' } };
      footerCell.alignment = { horizontal: 'center' };
      
      // Генерируем файл
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const safeArtist = release.artist_name.replace(/[\\/:*?"<>|]+/g, '_');
      const safeTitle = release.title.replace(/[\\/:*?"<>|]+/g, '_');
      const link = document.createElement('a');
      link.href = url;
      link.download = `${safeArtist} - ${safeTitle} - metadata.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      showSuccessToast('Метаданные скачаны');
    } catch (error) {
      console.error('Ошибка скачивания метаданных:', error);
      showErrorToast('Ошибка');
    }
  }, [release]);

  // Переключение статуса публикации
  const handleTogglePublished = useCallback(async (confirmed = false) => {
    // Если релиз опубликован и подтверждение не получено - показать модалку
    if (release.status === 'published' && !confirmed) {
      setShowUnpublishConfirm(true);
      return;
    }
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        showErrorToast('Не авторизован');
        return;
      }

      const tableName = release.release_type === 'basic' ? 'releases_basic' : 'releases_exclusive';
      // Переключаем между published и approved
      const newStatus = release.status === 'published' ? 'approved' : 'published';
      
      console.log('Меняем статус:', { tableName, releaseId: release.id, newStatus, userId: user.id });
      
      const { data, error } = await supabase
        .from(tableName)
        .update({ status: newStatus })
        .eq('id', release.id)
        .select();
      
      if (error) {
        console.error('Supabase error:', error);
        throw new Error(error.message || 'Ошибка базы данных');
      }
      
      if (!data || data.length === 0) {
        throw new Error('Нет прав для изменения статуса. Проверьте роль пользователя.');
      }
      
      setShowUnpublishConfirm(false);
      showSuccessToast(newStatus === 'published' ? 'Релиз выложен' : 'Релиз снят с публикации');
      onRefresh();
    } catch (error: any) {
      console.error('Ошибка изменения статуса:', error);
      showErrorToast(error.message || 'Ошибка при изменении статуса');
    }
  }, [supabase, release, onRefresh]);

  // Удаление релиза
  const handleDeleteRelease = useCallback(async () => {
    setIsDeleting(true);
    try {
      const tableName = release.release_type === 'basic' ? 'releases_basic' : 'releases_exclusive';
      
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', release.id);
      
      if (error) throw error;
      
      showSuccessToast('Релиз удалён');
      setShowDeleteConfirm(false);
      handleClose();
      onRefresh();
    } catch (error) {
      console.error('Ошибка удаления:', error);
      showErrorToast('Ошибка при удалении');
    } finally {
      setIsDeleting(false);
    }
  }, [supabase, release, handleClose, onRefresh]);

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-2xl p-2 sm:p-4 md:p-6" 
    >
      {/* Модалка подтверждения удаления */}
      {showDeleteConfirm && (
        <div 
          className="fixed inset-0 z-[10001] flex items-start justify-center pt-[15vh] bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(false); }}
        >
          <div 
            className="bg-gradient-to-br from-[#0d0d0f] to-[#1a1a1f] border-2 border-red-500/30 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl shadow-red-500/20 animate-in zoom-in-95 slide-in-from-top-4 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-xl bg-red-500/20 border-2 border-red-500/40 flex items-center justify-center">
                <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-black uppercase text-white">Удалить релиз?</h3>
                <p className="text-sm text-red-300">Это действие нельзя отменить</p>
              </div>
            </div>
            
            <div className="mb-4 p-3 bg-white/5 rounded-xl border border-white/10">
              <div className="text-sm text-zinc-400">Релиз:</div>
              <div className="text-white font-semibold truncate">{release.artist_name} — {release.title}</div>
            </div>
            
            <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
              Вы уверены, что хотите удалить этот релиз? Все связанные данные (треки, обложка) будут потеряны безвозвратно.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 border-2 border-white/10 hover:border-white/20 rounded-xl font-bold text-white transition-all"
              >
                Отмена
              </button>
              <button
                onClick={handleDeleteRelease}
                disabled={isDeleting}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 disabled:from-zinc-600 disabled:to-zinc-700 text-white rounded-xl font-black transition-all shadow-lg shadow-red-500/30 flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Удаление...
                  </>
                ) : (
                  'Удалить'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модалка подтверждения снятия с публикации */}
      {showUnpublishConfirm && (
        <div 
          className="fixed inset-0 z-[10001] flex items-start justify-center pt-[15vh] bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={(e) => { e.stopPropagation(); setShowUnpublishConfirm(false); }}
        >
          <div 
            className="bg-gradient-to-br from-[#0d0d0f] to-[#1a1a1f] border-2 border-amber-500/30 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl shadow-amber-500/20 animate-in zoom-in-95 slide-in-from-top-4 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-xl bg-amber-500/20 border-2 border-amber-500/40 flex items-center justify-center">
                <svg className="w-7 h-7 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-black uppercase text-white">Снять с публикации?</h3>
                <p className="text-sm text-amber-300">Релиз станет недоступен</p>
              </div>
            </div>
            
            <div className="mb-4 p-3 bg-white/5 rounded-xl border border-white/10">
              <div className="text-sm text-zinc-400">Релиз:</div>
              <div className="text-white font-semibold truncate">{release.artist_name} — {release.title}</div>
            </div>
            
            <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
              Вы уверены, что хотите снять релиз с публикации? Он будет переведён в статус &quot;Одобрен&quot; и станет недоступен для публичного просмотра.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowUnpublishConfirm(false)}
                className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 border-2 border-white/10 hover:border-white/20 rounded-xl font-bold text-white transition-all"
              >
                Отмена
              </button>
              <button
                onClick={() => handleTogglePublished(true)}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white rounded-xl font-black transition-all shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2"
              >
                Подтвердить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox для просмотра чека оплаты */}
      {showReceiptLightbox && (release as any).payment_receipt_url && (
        <div 
          className="fixed inset-0 z-[10002] flex items-center justify-center bg-black/95 backdrop-blur-xl animate-in fade-in duration-200 p-4"
          onClick={() => setShowReceiptLightbox(false)}
        >
          <div className="relative max-w-3xl max-h-[90vh] w-full" onClick={(e) => e.stopPropagation()}>
            {/* Заголовок с крестиком */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/30 to-orange-500/20 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-400">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-bold">Чек оплаты</h3>
                  <p className="text-zinc-500 text-sm">Сумма: {(release as any).payment_amount} ₽</p>
                </div>
              </div>
              <button 
                onClick={() => setShowReceiptLightbox(false)}
                className="w-10 h-10 rounded-xl bg-white/10 hover:bg-red-500/30 border border-white/10 hover:border-red-500/50 flex items-center justify-center text-zinc-400 hover:text-white transition-all group"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="group-hover:rotate-90 transition-transform duration-200">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            
            {/* Receipt image */}
            <div className="bg-zinc-900/50 rounded-2xl border border-white/10 overflow-hidden">
              <img 
                src={(release as any).payment_receipt_url} 
                alt="Чек оплаты" 
                className="w-full h-auto max-h-[65vh] object-contain"
              />
            </div>
            
            {/* Actions */}
            <div className="flex justify-center gap-3 mt-4">
              <a 
                href={(release as any).payment_receipt_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl font-medium text-white transition-all flex items-center gap-2 text-sm"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                  <polyline points="15 3 21 3 21 9"/>
                  <line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
                Открыть в новой вкладке
              </a>
              <a 
                href={(release as any).payment_receipt_url} 
                download
                className="px-5 py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-xl font-medium text-emerald-400 transition-all flex items-center gap-2 text-sm"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Скачать
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Контейнер для модалки и крестика */}
      <div className="relative w-full max-w-[95vw] sm:max-w-[90vw] md:max-w-[85vw] lg:max-w-[1000px] xl:max-w-[1100px]">
        {/* Кнопка закрытия - сбоку на десктопе, внутри на мобилке */}
        <button 
          onClick={handleClose} 
          className="hidden sm:flex absolute -right-14 top-4 z-50 w-10 h-10 rounded-full bg-white/10 hover:bg-red-500/30 backdrop-blur-md border border-white/20 hover:border-red-500/50 items-center justify-center transition-all duration-300 group shadow-xl"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-white/80 group-hover:text-white group-hover:rotate-90 transition-all duration-300">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        {/* Единое окно */}
        <div 
          className="relative w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden rounded-2xl sm:rounded-3xl bg-[#0a0a0c] border border-white/5 shadow-[0_0_100px_rgba(139,92,246,0.15)]" 
          onClick={(e) => e.stopPropagation()}
        >
        {/* Кнопка закрытия - внутри на мобилке */}
        <button 
          onClick={handleClose} 
          className="sm:hidden absolute top-3 right-3 z-50 w-9 h-9 rounded-full bg-white/10 hover:bg-red-500/30 backdrop-blur-md border border-white/20 flex items-center justify-center transition-all"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-white/80">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        {/* Фоновые блюры */}
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />
        
        {/* Overlay загрузки */}
        {(savingISRC || savingReleaseUPC) && (
          <div className="absolute inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center rounded-3xl">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-white/80">Сохранение...</span>
            </div>
          </div>
        )}

        {/* Контент со скроллом */}
        <div className="overflow-y-auto max-h-[95vh] sm:max-h-[90vh] scrollbar-hide">
          {/* Sticky шапка внутри скролла */}
          <div className="sticky top-0 left-0 right-0 z-30 h-1 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500" />
          
          {/* Шапка с обложкой */}
          <div className="relative p-4 sm:p-6 pb-0">
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
              {/* Обложка */}
              {release.cover_url && (
                <div className="relative group flex-shrink-0 mx-auto sm:mx-0">
                  <div className="w-[140px] h-[140px] sm:w-[180px] sm:h-[180px] rounded-2xl overflow-hidden ring-2 ring-white/10 shadow-2xl shadow-black/50">
                    <img 
                      src={release.cover_url} 
                      alt={release.title} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                    />
                  </div>
                  <button
                    onClick={() => handleDownloadFile(release.cover_url, `${release.title}_cover.jpg`)}
                    className="absolute bottom-2 right-2 w-8 h-8 bg-black/70 hover:bg-black/90 rounded-lg flex items-center justify-center border border-white/10 hover:border-white/30 transition-all duration-200 group/dl"
                    title="Скачать обложку"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/60 group-hover/dl:text-white transition-colors">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="7 10 12 15 17 10"/>
                      <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                  </button>
                </div>
              )}

              {/* Информация */}
              <div className="flex-1 min-w-0 pt-1 text-center sm:text-left">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white truncate mb-1">{release.title}</h1>
                <p className="text-base sm:text-lg text-zinc-400 mb-3 sm:mb-4">{release.artist_name}</p>
                
                {/* Бейджи */}
                <div className="flex flex-wrap gap-2 mb-3 sm:mb-4 justify-center sm:justify-start">
                  <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase ${
                    release.user_role === 'basic' 
                      ? 'bg-sky-500/20 text-sky-400 ring-1 ring-sky-500/30' 
                      : 'bg-violet-500/20 text-violet-400 ring-1 ring-violet-500/30'
                  }`}>
                    {release.user_role === 'basic' ? 'BASIC' : 'EXCLUSIVE'}
                  </span>
                  <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase ${
                    release.status === 'published' ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30' :
                    release.status === 'approved' ? 'bg-violet-500/20 text-violet-400 ring-1 ring-violet-500/30' :
                    release.status === 'pending' ? 'bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/30' :
                    release.status === 'rejected' ? 'bg-red-500/20 text-red-400 ring-1 ring-red-500/30' :
                    release.status === 'draft' ? 'bg-zinc-500/20 text-zinc-400 ring-1 ring-zinc-500/30' :
                    'bg-zinc-500/20 text-zinc-400 ring-1 ring-zinc-500/30'
                  }`}>
                    {release.status === 'published' ? 'ВЫЛОЖЕН' :
                     release.status === 'approved' ? 'ОДОБРЕН' :
                     release.status === 'pending' ? 'НА МОДЕРАЦИИ' :
                     release.status === 'rejected' ? 'ОТКЛОНЁН' :
                     release.status === 'draft' ? 'ЧЕРНОВИК' : release.status?.toUpperCase()}
                  </span>
                </div>

                {/* Мета инфо */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="bg-white/5 rounded-xl px-3 py-2">
                    <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Код</div>
                    <div className={`text-sm font-semibold truncate ${release.custom_id ? 'text-violet-400 font-mono' : 'text-zinc-500'}`}>
                      {release.custom_id || '—'}
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-xl px-3 py-2">
                    <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Жанр</div>
                    <div className="text-sm font-semibold text-white truncate">{release.genre}</div>
                  </div>
                  <div className="bg-white/5 rounded-xl px-3 py-2">
                    <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Дата</div>
                    <div className="text-sm font-semibold text-white">{release.release_date ? new Date(release.release_date).toLocaleDateString('ru-RU') : '—'}</div>
                  </div>
                  <div className="bg-white/5 rounded-xl px-3 py-2 relative">
                    <div className="text-[10px] text-zinc-500 uppercase tracking-wider">UPC</div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-semibold truncate ${release.upc ? 'text-emerald-400 font-mono' : 'text-zinc-500'}`}>
                        {release.upc || 'Не указан'}
                      </span>
                      {(release.status === 'approved' || release.status === 'published') && (
                        <button 
                          onClick={() => { setEditingReleaseUPC(true); setReleaseUPCInput(release.upc || ''); }}
                          className="ml-auto px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-violet-500/50 text-zinc-400 hover:text-violet-400 rounded-lg transition-all flex items-center gap-1.5"
                          title="Редактировать UPC"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                          <span className="text-xs font-bold hidden sm:inline">Изменить</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Фокус-трек и промо информация - вынесено за пределы основного flex */}
            {((release as any).focus_track || (release as any).album_description) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                {(release as any).focus_track && (
                  <div className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 rounded-xl px-3 py-2 border border-violet-500/20">
                    <div className="text-[10px] text-violet-400 uppercase tracking-wider flex items-center gap-1">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                      </svg>
                      Фокус-трек
                    </div>
                    <div className="text-sm font-semibold text-white truncate">{(release as any).focus_track}</div>
                    {(release as any).focus_track_promo && (
                      <div className="text-[10px] text-zinc-400 truncate mt-0.5">{(release as any).focus_track_promo}</div>
                    )}
                  </div>
                )}
                {(release as any).album_description && (
                  <div className="bg-white/5 rounded-xl px-3 py-2">
                    <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Описание</div>
                    <div className="text-xs text-zinc-300 line-clamp-2">{(release as any).album_description}</div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* UPC Editor Modal */}
          {editingReleaseUPC && (
            <div className="mx-4 sm:mx-6 mt-4 p-4 bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/30 rounded-2xl backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M3 5h18M3 5v14a2 2 0 002 2h14a2 2 0 002-2V5M3 5l3-3h12l3 3M7 8v8M12 8v8M17 8v8"/>
                  </svg>
                </div>
                <div>
                  <h4 className="text-white font-bold">Редактировать UPC</h4>
                  <p className="text-zinc-400 text-xs">Введите 13-значный код</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <input
                  type="text"
                  value={releaseUPCInput}
                  onChange={(e) => setReleaseUPCInput(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="0000000000000"
                  maxLength={13}
                  className="flex-1 px-4 py-3 bg-black/50 border-2 border-white/10 rounded-xl text-white font-mono text-lg tracking-wider focus:outline-none focus:border-violet-500 transition-colors text-center sm:text-left"
                  disabled={savingReleaseUPC}
                  autoFocus
                />
                <div className="flex gap-2">
                  <button 
                    onClick={handleSaveReleaseUPC} 
                    disabled={savingReleaseUPC || !releaseUPCInput.trim()}
                    className="flex-1 sm:flex-none px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 disabled:from-zinc-700 disabled:to-zinc-700 text-black font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/30 disabled:shadow-none flex items-center justify-center gap-2"
                  >
                    {savingReleaseUPC ? (
                      <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    ) : (
                      <>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        <span>Сохранить</span>
                      </>
                    )}
                  </button>
                  <button 
                    onClick={() => setEditingReleaseUPC(false)}
                    className="px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-white font-medium"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Кнопки действий */}
          <div className="p-4 sm:p-6 pt-4 sm:pt-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
              {/* Скачать ZIP (обложка + треки) */}
              {release.tracks && release.tracks.length > 0 && (
                <button
                  onClick={handleDownloadAllTracks}
                  disabled={downloadingZip}
                  className="flex flex-col items-center gap-1.5 sm:gap-2 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 hover:border-violet-500/40 text-violet-400 transition-all hover:scale-[1.02] disabled:opacity-50"
                >
                  <svg width="20" height="20" className="sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  <span className="text-[10px] sm:text-xs font-bold">{downloadingZip ? 'Загрузка...' : 'Скачать ZIP'}</span>
                </button>
              )}

              {/* Редактировать */}
              <button
                onClick={() => {
                  const path = release.release_type === 'basic'
                    ? `/cabinet/release-basic/edit/${release.id}?from=admin`
                    : `/cabinet/release/edit/${release.id}?from=admin`;
                  router.push(path);
                }}
                className="flex flex-col items-center gap-1.5 sm:gap-2 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-violet-500/30 text-white transition-all hover:scale-[1.02]"
              >
                <svg width="20" height="20" className="sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                <span className="text-[10px] sm:text-xs font-bold">Редактировать</span>
              </button>

              {/* Метаданные */}
              <button
                onClick={handleDownloadMetadata}
                className="flex flex-col items-center gap-1.5 sm:gap-2 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/40 text-emerald-400 transition-all hover:scale-[1.02]"
              >
                <svg width="20" height="20" className="sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <path d="M9 3v18M3 9h18M3 15h18"/>
                </svg>
                <span className="text-[10px] sm:text-xs font-bold">Метаданные</span>
              </button>

              {/* Удалить */}
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex flex-col items-center gap-1.5 sm:gap-2 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 text-red-400 transition-all hover:scale-[1.02]"
              >
                <svg width="20" height="20" className="sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
                <span className="text-[10px] sm:text-xs font-bold">Удалить</span>
              </button>
            </div>

            {/* Дополнительные кнопки по статусу */}
            {release.status === 'pending' && (
              <div className="mt-3 sm:mt-4 flex flex-col gap-2 sm:gap-3">
                {/* Предупреждение о неверифицированной оплате */}
                {release.user_role === 'basic' && (release as any).payment_status !== 'verified' && (
                  <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 text-sm">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                      <line x1="12" y1="9" x2="12" y2="13"/>
                      <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                    <span>Оплата не верифицирована. Утвердите оплату перед одобрением релиза.</span>
                  </div>
                )}
                <button
                  onClick={onApprove}
                  disabled={release.user_role === 'basic' && (release as any).payment_status !== 'verified'}
                  className="flex-1 flex items-center justify-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 disabled:from-zinc-700 disabled:to-zinc-600 disabled:cursor-not-allowed text-white text-sm sm:text-base font-bold transition-all shadow-lg shadow-emerald-600/25 disabled:shadow-none"
                  title={release.user_role === 'basic' && (release as any).payment_status !== 'verified' ? 'Сначала верифицируйте оплату' : 'Утвердить релиз'}
                >
                  <svg width="20" height="20" className="sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  УТВЕРДИТЬ
                </button>
              </div>
            )}

            {release.status === 'pending' && (
              <div className="mt-2 sm:mt-3 p-3 sm:p-4 bg-white/5 rounded-xl sm:rounded-2xl border border-white/5">
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Причина отклонения..."
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-black/50 border border-white/10 rounded-lg sm:rounded-xl text-sm sm:text-base text-white placeholder:text-zinc-600 focus:outline-none focus:border-red-500/50 resize-none"
                  rows={2}
                />
                <button
                  onClick={onReject}
                  disabled={!rejectionReason.trim()}
                  className="mt-2 w-full flex items-center justify-center gap-2 p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-red-500/20 hover:bg-red-500/30 disabled:opacity-30 text-red-400 text-sm sm:text-base font-bold transition-all border border-red-500/20"
                >
                  <svg width="16" height="16" className="sm:w-[18px] sm:h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                  ОТКЛОНИТЬ
                </button>
              </div>
            )}

            {/* Переключатель публикации */}
            {(release.status === 'approved' || release.status === 'published' || release.status === 'distributed') && (
              <div className="mt-3 sm:mt-4">
                <button
                  onClick={() => handleTogglePublished()}
                  className={`w-full flex items-center justify-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl sm:rounded-2xl text-sm sm:text-base font-bold transition-all ${
                    release.status === 'published'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30'
                      : 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white border-0 shadow-lg shadow-emerald-500/20'
                  }`}
                >
                  {release.status === 'published' ? (
                    <svg width="18" height="18" className="sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" className="sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                      <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                  )}
                  {release.status === 'published' ? 'СНЯТЬ С ПУБЛИКАЦИИ' : 'ВЫЛОЖИТЬ'}
                </button>
              </div>
            )}

            {/* Проверка платежа */}
            {release.user_role === 'basic' && (release as any).payment_status === 'pending' && (
              <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20 rounded-xl sm:rounded-2xl">
                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-500/30 to-orange-500/20 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/20">
                    <svg width="18" height="18" className="sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                      <line x1="12" y1="9" x2="12" y2="13"/>
                      <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                  </div>
                  <div>
                    <div className="font-bold text-amber-300 text-sm sm:text-base">Проверка платежа</div>
                    <div className="text-xs sm:text-sm text-amber-400/80 font-medium">Сумма: {(release as any).payment_amount} ₽</div>
                  </div>
                </div>
                {(release as any).payment_receipt_url && (
                  <button 
                    onClick={() => setShowReceiptLightbox(true)} 
                    className="w-full mb-3 p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-500/30 rounded-xl transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      {/* Иконка чека */}
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-zinc-700 to-zinc-800 border border-white/10 flex items-center justify-center flex-shrink-0 group-hover:border-amber-500/30 transition-colors">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-400 group-hover:text-amber-400 transition-colors">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14 2 14 8 20 8"/>
                          <line x1="16" y1="13" x2="8" y2="13"/>
                          <line x1="16" y1="17" x2="8" y2="17"/>
                          <polyline points="10 9 9 9 8 9"/>
                        </svg>
                      </div>
                      {/* Текст */}
                      <div className="flex-1 text-left">
                        <div className="text-white font-semibold text-sm mb-0.5">Чек оплаты</div>
                        <div className="text-zinc-500 text-xs">Нажмите, чтобы просмотреть</div>
                      </div>
                      {/* Стрелка */}
                      <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 group-hover:bg-amber-500/30 transition-colors">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <circle cx="11" cy="11" r="8"/>
                          <path d="M21 21l-4.35-4.35"/>
                          <path d="M11 8v6M8 11h6"/>
                        </svg>
                      </div>
                    </div>
                  </button>
                )}
                <div className="flex gap-2">
                  <button onClick={() => handleVerifyPayment(true)} className="flex-1 p-3 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20">
                    ✓ Подтвердить
                  </button>
                  <button onClick={() => handleVerifyPayment(false)} className="flex-1 p-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-bold rounded-xl transition-colors border border-red-500/20">
                    ✕ Отклонить
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Треклист */}
          {release.tracks && release.tracks.length > 0 && (
            <div className="px-4 sm:px-6 pb-4 sm:pb-6">
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-violet-500/20 flex items-center justify-center text-violet-400">
                  <svg width="14" height="14" className="sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18V5l12-2v13"/>
                    <circle cx="6" cy="18" r="3"/>
                    <circle cx="18" cy="16" r="3"/>
                  </svg>
                </div>
                <h3 className="font-bold text-white text-sm sm:text-base">Треклист ({release.tracks.length})</h3>
              </div>
              
              <div className="space-y-2">
                {release.tracks.map((track: any, idx: number) => (
                  <TrackItem
                    key={idx}
                    track={track}
                    index={idx}
                    releaseId={release.id}
                    releaseType={release.release_type}
                    releaseStatus={release.status}
                    coverUrl={release.cover_url}
                    supabase={supabase}
                    editingISRC={editingTrackISRC}
                    setEditingISRC={setEditingTrackISRC}
                    savingISRC={savingISRC}
                    onSaveISRC={handleSaveTrackISRC}
                    onDownload={() => handleDownloadTrack(idx, track.title)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Страны и Платформы - сворачиваемые секции */}
          <div className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-2 sm:space-y-3">
            {/* Платформы */}
            {release.platforms && release.platforms.length > 0 && (
              <details className="group/platforms">
                <summary className="flex items-center gap-2 sm:gap-3 cursor-pointer list-none p-2.5 sm:p-3 bg-white/5 hover:bg-white/[0.07] rounded-lg sm:rounded-xl border border-white/5 transition-colors">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
                    <svg width="14" height="14" className="sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="3" width="20" height="14" rx="2"/>
                      <line x1="8" y1="21" x2="16" y2="21"/>
                      <line x1="12" y1="17" x2="12" y2="21"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <span className="font-medium text-white text-xs sm:text-sm">Платформы</span>
                    <span className="ml-1.5 sm:ml-2 text-[10px] sm:text-xs text-zinc-500">({release.platforms.length})</span>
                  </div>
                  <svg width="14" height="14" className="sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-500 group-open/platforms:rotate-180 transition-transform">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </summary>
                <div className="mt-1.5 sm:mt-2 p-2.5 sm:p-3 bg-black/30 rounded-lg sm:rounded-xl border border-white/5">
                  <div className="flex flex-wrap gap-1 sm:gap-1.5">
                    {release.platforms.map((platform: string, idx: number) => (
                      <span key={idx} className="px-2 sm:px-2.5 py-0.5 sm:py-1 bg-emerald-500/10 border border-emerald-500/20 rounded text-[10px] sm:text-xs text-emerald-400">
                        {platform}
                      </span>
                    ))}
                  </div>
                </div>
              </details>
            )}

            {/* Страны */}
            {release.countries && release.countries.length > 0 && (
              <details className="group/countries">
                <summary className="flex items-center gap-2 sm:gap-3 cursor-pointer list-none p-2.5 sm:p-3 bg-white/5 hover:bg-white/[0.07] rounded-lg sm:rounded-xl border border-white/5 transition-colors">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-sky-500/20 flex items-center justify-center text-sky-400 flex-shrink-0">
                    <svg width="14" height="14" className="sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="2" y1="12" x2="22" y2="12"/>
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <span className="font-medium text-white text-xs sm:text-sm">Страны</span>
                    <span className="ml-1.5 sm:ml-2 text-[10px] sm:text-xs text-zinc-500">({release.countries.length})</span>
                  </div>
                  <svg width="14" height="14" className="sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-500 group-open/countries:rotate-180 transition-transform">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </summary>
                <div className="mt-1.5 sm:mt-2 p-2.5 sm:p-3 bg-black/30 rounded-lg sm:rounded-xl border border-white/5">
                  <div className="flex flex-wrap gap-1 sm:gap-1.5 max-h-[150px] sm:max-h-[200px] overflow-y-auto scrollbar-hide">
                    {release.countries.map((country: string, idx: number) => (
                      <span key={idx} className="px-2 sm:px-2.5 py-0.5 sm:py-1 bg-sky-500/10 border border-sky-500/20 rounded text-[10px] sm:text-xs text-sky-400">
                        {country}
                      </span>
                    ))}
                  </div>
                </div>
              </details>
            )}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

// ============================================================================
// КОМПАКТНЫЙ ПЛЕЕР ТРЕКА
// ============================================================================
function TrackItem({ track, index, releaseId, releaseType, releaseStatus, coverUrl, supabase, editingISRC, setEditingISRC, savingISRC, onSaveISRC, onDownload }: any) {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [audioUrl, setAudioUrl] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [downloading, setDownloading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [isDragging, setIsDragging] = React.useState(false);
  const [volume, setVolume] = React.useState(0.15);
  const [isMuted, setIsMuted] = React.useState(false);
  const maxVolume = 0.5; // Ограничение максимальной громкости
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const progressRef = React.useRef<HTMLDivElement | null>(null);
  const animationRef = React.useRef<number | null>(null);

  const formatTime = (sec: number) => {
    if (!sec || !isFinite(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Плавное обновление прогресса через requestAnimationFrame
  const updateProgress = React.useCallback(() => {
    if (audioRef.current && isPlaying) {
      setCurrentTime(audioRef.current.currentTime);
      animationRef.current = requestAnimationFrame(updateProgress);
    }
  }, [isPlaying]);

  React.useEffect(() => {
    if (isPlaying) {
      animationRef.current = requestAnimationFrame(updateProgress);
    }
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, updateProgress]);

  // Volume handlers
  const handleVolumeChange = (newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolume(clampedVolume);
    // Применяем масштабирование для комфортной громкости
    if (audioRef.current) audioRef.current.volume = clampedVolume * maxVolume;
    if (clampedVolume > 0 && isMuted) setIsMuted(false);
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      if (audioRef.current) audioRef.current.volume = volume * maxVolume;
    } else {
      setIsMuted(true);
      if (audioRef.current) audioRef.current.volume = 0;
    }
  };

  const loadAudio = async () => {
    if (audioRef.current && audioUrl) return audioRef.current;
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`/api/stream-audio?releaseId=${releaseId}&releaseType=${releaseType}&trackIndex=${index}`, {
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}
      });
      if (!res.ok) throw new Error('Ошибка загрузки');
      const blob = await res.blob();
      if (!blob.size) throw new Error('Пустой файл');
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      const audio = new Audio(url);
      audio.volume = isMuted ? 0 : volume * maxVolume;
      audioRef.current = audio;
      audio.onloadedmetadata = () => setDuration(audio.duration);
      audio.onended = () => { setIsPlaying(false); setCurrentTime(0); };
      audio.onerror = () => setError('Ошибка');
      audio.addEventListener('pause', () => setIsPlaying(false));
      audio.addEventListener('play', () => setIsPlaying(true));
      await new Promise<void>((resolve) => {
        audio.oncanplaythrough = () => resolve();
        setTimeout(resolve, 2000);
      });
      return audio;
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Слушаем глобальный event для остановки всех треков (НЕ сбрасываем позицию)
  React.useEffect(() => {
    const handleStopAll = () => {
      if (audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
        setIsPlaying(false);
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
      }
    };
    window.addEventListener(ADMIN_STOP_ALL_AUDIO_EVENT, handleStopAll);
    return () => window.removeEventListener(ADMIN_STOP_ALL_AUDIO_EVENT, handleStopAll);
  }, []);

  // Остановка аудио при переключении вкладки браузера
  React.useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
        setIsPlaying(false);
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const handlePlayPause = async () => {
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }
    
    // Сначала останавливаем СВОЙ трек если есть
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
    }
    
    // Останавливаем ВСЕ треки через глобальный event
    stopAllAdminAudio();
    await new Promise(r => setTimeout(r, 100));
    
    let audio = audioRef.current || await loadAudio();
    if (!audio) return;
    
    // Еще раз останавливаем всех перед воспроизведением
    stopAllAdminAudio();
    await new Promise(r => setTimeout(r, 50));
    
    try {
      await audio.play();
      setIsPlaying(true);
    } catch (e: any) {
      if (e.name !== 'AbortError') setError('Ошибка');
    }
  };

  // Seek by position
  const seekToPosition = (clientX: number) => {
    if (!progressRef.current || !duration) return;
    const rect = progressRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const newTime = pct * duration;
    setCurrentTime(newTime);
    if (audioRef.current) audioRef.current.currentTime = newTime;
  };

  // Click to seek
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    seekToPosition(e.clientX);
  };

  // Drag start
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    seekToPosition(e.clientX);
  };

  // Drag handlers
  React.useEffect(() => {
    if (!isDragging) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      seekToPosition(e.clientX);
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, duration]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`/api/stream-audio?releaseId=${releaseId}&releaseType=${releaseType}&trackIndex=${index}`, {
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}
      });
      if (!res.ok) throw new Error('Ошибка');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const name = (track.title || `track_${index + 1}`).replace(/[\\/:*?"<>|]+/g, '_');
      const ext = blob.type.includes('wav') ? 'wav' : blob.type.includes('flac') ? 'flac' : 'audio';
      const a = document.createElement('a');
      a.href = url;
      a.download = `${name}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { setError('Ошибка скачивания'); }
    finally { setDownloading(false); }
  };

  React.useEffect(() => () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
  }, [audioUrl]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="group bg-white/[0.02] hover:bg-white/[0.04] rounded-xl p-3 transition-all ring-1 ring-white/5 hover:ring-white/10">
      <div className="flex items-center gap-3">
        {/* Обложка с кнопкой Play/Pause */}
        <button
          onClick={handlePlayPause}
          disabled={loading}
          className={`relative flex-shrink-0 w-11 h-11 rounded-lg overflow-hidden transition-all ${
            isPlaying ? 'ring-2 ring-violet-500 shadow-lg shadow-violet-500/30' : 'ring-1 ring-white/10 hover:ring-violet-500/50'
          }`}
        >
          {coverUrl ? (
            <img src={coverUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-violet-600 to-purple-700" />
          )}
          {/* Overlay */}
          <div className={`absolute inset-0 flex items-center justify-center transition-all ${
            loading ? 'bg-black/70' : error ? 'bg-red-500/30' : isPlaying ? 'bg-black/50' : 'bg-black/40 hover:bg-black/60'
          }`}>
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : error ? (
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24" className="text-red-400">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
              </svg>
            ) : isPlaying ? (
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24" className="text-white">
                <path d="M6 4h4v16H6zm8 0h4v16h-4z"/>
              </svg>
            ) : (
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24" className="text-white ml-0.5">
                <path d="M8 5v14l11-7z"/>
              </svg>
            )}
          </div>
        </button>

        {/* Инфо и прогресс */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-1.5 mb-1">
            <span className="text-zinc-500 text-xs font-mono flex-shrink-0 w-5 text-right">{index + 1}.</span>
            <h4 className="text-white text-sm font-medium truncate max-w-[200px] sm:max-w-[300px] md:max-w-none">{track.title}</h4>
            {track.hasDrugs && (
              <span className="px-1 py-0.5 bg-red-500/20 text-red-400 rounded text-[9px] font-bold leading-none flex-shrink-0">E</span>
            )}
            {track.version && <span className="text-violet-400 text-[10px] leading-none flex-shrink-0 hidden sm:inline">{track.version}</span>}
          </div>
          
          {/* Прогресс бар */}
          <div className="flex items-center gap-2">
            <div 
              ref={progressRef}
              onClick={handleClick}
              onMouseDown={handleMouseDown}
              className={`flex-1 h-1 bg-white/10 rounded-full cursor-pointer relative group/bar select-none ${isDragging ? 'cursor-grabbing' : ''}`}
            >
              <div 
                className="absolute inset-y-0 left-0 bg-violet-500 rounded-full"
                style={{ width: `${progress}%`, transition: isDragging || isPlaying ? 'none' : 'width 0.1s' }}
              />
              <div 
                className={`absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full shadow-md shadow-black/50 transition-opacity pointer-events-none ${isDragging ? 'opacity-100 scale-110' : 'opacity-0 group-hover/bar:opacity-100'}`}
                style={{ left: `calc(${progress}% - 5px)` }}
              />
            </div>
            <span className="text-[10px] text-zinc-500 font-mono w-[70px] text-right select-none flex-shrink-0">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Volume Control - inline horizontal */}
        <div className="flex items-center gap-1.5 flex-shrink-0 group/volume">
          <button
            onClick={toggleMute}
            className="w-7 h-7 rounded-lg bg-white/5 hover:bg-violet-500/20 text-zinc-400 hover:text-violet-400 flex items-center justify-center transition-all"
            title={isMuted ? 'Включить звук' : 'Выключить звук'}
          >
            {isMuted || volume === 0 ? (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <line x1="23" y1="9" x2="17" y2="15"/>
                <line x1="17" y1="9" x2="23" y2="15"/>
              </svg>
            ) : volume < 0.5 ? (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
              </svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
              </svg>
            )}
          </button>
          {/* Horizontal volume slider */}
          <div className="relative w-14 h-1.5 bg-white/10 rounded-full cursor-pointer group-hover/volume:bg-white/15">
            <div 
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-violet-500 to-purple-500 rounded-full"
              style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
            />
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div 
              className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full shadow-md opacity-0 group-hover/volume:opacity-100 pointer-events-none"
              style={{ left: `calc(${(isMuted ? 0 : volume) * 100}% - 5px)` }}
            />
          </div>
        </div>

        {/* Скачать */}
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/5 hover:bg-emerald-500/20 text-zinc-400 hover:text-emerald-400 flex items-center justify-center transition-all"
          title="Скачать оригинал"
        >
          {downloading ? (
            <div className="w-3 h-3 border border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
          ) : (
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
            </svg>
          )}
        </button>
      </div>

      {/* ISRC для опубликованных */}
      {(releaseStatus === 'approved' || releaseStatus === 'published' || releaseStatus === 'distributed') && (
        <div className="mt-3 pt-3 border-t border-white/5">
          {editingISRC?.trackIndex === index ? (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2 bg-violet-500/10 rounded-xl border border-violet-500/20">
              <div className="flex items-center gap-2 flex-1">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M3 5h18M3 5v14a2 2 0 002 2h14a2 2 0 002-2V5M7 8v8M12 8v8M17 8v8"/>
                  </svg>
                </div>
                <input
                  type="text"
                  value={editingISRC.isrc}
                  onChange={(e) => setEditingISRC({ trackIndex: index, isrc: e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase() })}
                  maxLength={12}
                  placeholder="XXCC0000000"
                  className="flex-1 px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-violet-500 tracking-wider"
                  disabled={savingISRC}
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => onSaveISRC(index, editingISRC.isrc)} 
                  disabled={savingISRC} 
                  className="flex-1 sm:flex-none px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 disabled:from-zinc-700 disabled:to-zinc-700 text-black rounded-lg font-bold transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5"
                >
                  {savingISRC ? (
                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      <span className="text-xs">Сохранить</span>
                    </>
                  )}
                </button>
                <button 
                  onClick={() => setEditingISRC(null)} 
                  className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors text-xs font-medium"
                >
                  Отмена
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-zinc-500 text-[10px] uppercase tracking-wider">ISRC</span>
                <span className={`text-sm font-mono ${track.isrc ? 'text-emerald-400 font-semibold tracking-wider' : 'text-zinc-600 italic'}`}>
                  {track.isrc || '—'}
                </span>
              </div>
              <button 
                onClick={() => setEditingISRC({ trackIndex: index, isrc: track.isrc || '' })} 
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 ${
                  track.isrc 
                    ? 'bg-white/5 hover:bg-violet-500/20 text-zinc-400 hover:text-violet-400 border border-white/5 hover:border-violet-500/30' 
                    : 'bg-violet-500/20 hover:bg-violet-500/30 text-violet-400 hover:text-violet-300 border border-violet-500/30 hover:border-violet-500/50'
                }`}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {track.isrc ? (
                    <>
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </>
                  ) : (
                    <>
                      <line x1="12" y1="5" x2="12" y2="19"/>
                      <line x1="5" y1="12" x2="19" y2="12"/>
                    </>
                  )}
                </svg>
                <span className="hidden sm:inline">{track.isrc ? 'Изменить' : 'Добавить ISRC'}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {error && <div className="mt-2 text-[10px] text-red-400">{error}</div>}
    </div>
  );
}

