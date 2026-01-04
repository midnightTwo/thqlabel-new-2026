'use server';

import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const releaseId = searchParams.get('releaseId');
  const releaseType = searchParams.get('releaseType') as 'basic' | 'exclusive';

  if (!releaseId || !releaseType) {
    return NextResponse.json({ error: 'Missing releaseId or releaseType' }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    
    // Проверяем авторизацию
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Получаем данные релиза
    const tableName = releaseType === 'basic' ? 'releases_basic' : 'releases_exclusive';
    const { data: release, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', releaseId)
      .single();

    if (error || !release) {
      return NextResponse.json({ error: 'Release not found' }, { status: 404 });
    }

    // Создаем Excel файл
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'THQ Label';
    workbook.created = new Date();

    // Лист с основной информацией о релизе
    const infoSheet = workbook.addWorksheet('Информация о релизе');
    
    // Стили заголовков
    const headerStyle: Partial<ExcelJS.Style> = {
      font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6050BA' } },
      alignment: { horizontal: 'center', vertical: 'middle' },
      border: {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' }
      }
    };

    const dataStyle: Partial<ExcelJS.Style> = {
      alignment: { horizontal: 'left', vertical: 'middle' },
      border: {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' }
      }
    };

    // Заголовок информации
    infoSheet.columns = [
      { header: 'Поле', key: 'field', width: 25 },
      { header: 'Значение', key: 'value', width: 50 }
    ];

    // Применяем стиль к заголовку
    infoSheet.getRow(1).eachCell((cell) => {
      Object.assign(cell, { style: headerStyle });
    });

    // Основная информация о релизе
    const releaseInfo = [
      { field: 'Название', value: release.title || '' },
      { field: 'Исполнитель', value: release.artist_name || '' },
      { field: 'Жанр', value: release.genre || '' },
      { field: 'Дата релиза', value: release.release_date ? new Date(release.release_date).toLocaleDateString('ru-RU') : '' },
      { field: 'UPC', value: release.upc || '' },
      { field: 'Тип релиза', value: releaseType === 'basic' ? 'Basic' : 'Exclusive' },
      { field: 'Статус', value: getStatusLabel(release.status) },
      { field: 'Лейбл', value: release.label || 'THQ Label' },
      { field: 'Количество треков', value: release.tracks?.length || 0 },
      { field: 'Платформы', value: release.platforms?.join(', ') || '' },
      { field: 'Дата создания', value: release.created_at ? new Date(release.created_at).toLocaleDateString('ru-RU') : '' },
    ];

    releaseInfo.forEach((info) => {
      const row = infoSheet.addRow(info);
      row.eachCell((cell) => {
        Object.assign(cell, { style: dataStyle });
      });
    });

    // Лист с треками
    if (release.tracks && release.tracks.length > 0) {
      const tracksSheet = workbook.addWorksheet('Треки');
      
      tracksSheet.columns = [
        { header: '№', key: 'number', width: 5 },
        { header: 'Название', key: 'title', width: 35 },
        { header: 'Исполнители', key: 'artists', width: 30 },
        { header: 'ISRC', key: 'isrc', width: 18 },
        { header: 'Explicit', key: 'explicit', width: 10 },
        { header: 'Длительность', key: 'duration', width: 12 },
      ];

      // Применяем стиль к заголовкам
      tracksSheet.getRow(1).eachCell((cell) => {
        Object.assign(cell, { style: headerStyle });
      });

      // Добавляем треки
      release.tracks.forEach((track: any, index: number) => {
        const row = tracksSheet.addRow({
          number: index + 1,
          title: track.title || '',
          artists: track.artists || '',
          isrc: track.isrc || '',
          explicit: track.explicit ? 'Да' : 'Нет',
          duration: track.duration ? formatDuration(track.duration) : '',
        });
        row.eachCell((cell) => {
          Object.assign(cell, { style: dataStyle });
        });
      });
    }

    // Генерируем буфер
    const buffer = await workbook.xlsx.writeBuffer();

    // Безопасное имя файла
    const safeTitle = (release.title || 'release').replace(/[\\/:*?"<>|]+/g, '_');
    const safeArtist = (release.artist_name || 'artist').replace(/[\\/:*?"<>|]+/g, '_');
    const filename = `${safeArtist} - ${safeTitle}_metadata.xlsx`;

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
      },
    });
  } catch (error) {
    console.error('Error generating Excel:', error);
    return NextResponse.json({ error: 'Failed to generate Excel' }, { status: 500 });
  }
}

function getStatusLabel(status: string): string {
  const statusMap: Record<string, string> = {
    pending: 'На модерации',
    distributed: 'На дистрибуции',
    published: 'Опубликован',
    rejected: 'Отклонен',
    draft: 'Черновик',
  };
  return statusMap[status] || status;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
