# Настройка Supabase Storage для Release Wizard

## Необходимые бакеты (Storage Buckets)

Для работы Release Wizard необходимо создать следующие бакеты в Supabase Storage:

### 1. `release-covers` - Обложки релизов
- **Назначение**: Хранение обложек альбомов/синглов/EP
- **Публичный доступ**: Да (Public bucket)
- **Допустимые форматы**: JPG, PNG
- **Максимальный размер файла**: 10 MB
- **Путь**: `{userId}/{releaseId}/cover.{ext}`

### 2. `release-audio` - Аудиофайлы треков
- **Назначение**: Хранение аудио треков (WAV/FLAC)
- **Публичный доступ**: Нет (Private bucket)
- **Допустимые форматы**: WAV, FLAC
- **Максимальный размер файла**: Без ограничений
- **Путь**: `{userId}/{releaseId}/{trackId}-{timestamp}.{ext}`

### 3. `release-promo` - Промо-фотографии
- **Назначение**: Хранение промо-фото релиза
- **Публичный доступ**: Да (Public bucket)
- **Допустимые форматы**: JPG, PNG
- **Максимальный размер файла**: 10 MB на файл, до 5 файлов
- **Путь**: `{userId}/{releaseId}/promo-{timestamp}-{random}.{ext}`

### 4. `payment-receipts` - Чеки оплаты (только для Basic)
- **Назначение**: Хранение скриншотов чеков оплаты
- **Публичный доступ**: Нет (Private bucket)
- **Допустимые форматы**: JPG, PNG, PDF
- **Максимальный размер файла**: 10 MB
- **Путь**: `{userId}/{releaseId}/receipt-{timestamp}.{ext}`

---

## Инструкция по созданию бакетов

### Шаг 1: Перейти в Supabase Dashboard
1. Откройте ваш проект в [Supabase Dashboard](https://app.supabase.com)
2. Перейдите в раздел **Storage** в левом меню

### Шаг 2: Создать бакеты

Для каждого бакета выполните следующие действия:

1. Нажмите **New Bucket**
2. Введите название бакета (например, `release-covers`)
3. Установите флаг **Public bucket** для публичных бакетов:
   - ✅ Public: `release-covers`, `release-promo`
   - ❌ Private: `release-audio`, `payment-receipts`
4. Нажмите **Create bucket**

### Шаг 3: Настроить политики доступа (RLS Policies)

#### Для всех бакетов - Политика INSERT
```sql
-- Политика: Пользователи могут загружать файлы только в свою папку
CREATE POLICY "Users can upload to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'bucket_name_here' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

#### Для всех бакетов - Политика SELECT
```sql
-- Политика: Пользователи могут читать свои файлы
CREATE POLICY "Users can read own files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'bucket_name_here'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

#### Для всех бакетов - Политика UPDATE
```sql
-- Политика: Пользователи могут обновлять свои файлы
CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'bucket_name_here'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

#### Для всех бакетов - Политика DELETE
```sql
-- Политика: Пользователи могут удалять свои файлы
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'bucket_name_here'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

**Замените `bucket_name_here` на соответствующее имя бакета для каждой политики.**

---

## Проверка настроек

После создания всех бакетов убедитесь, что:

1. ✅ Созданы все 4 бакета
2. ✅ Публичные бакеты помечены как Public
3. ✅ Настроены политики RLS для каждого бакета
4. ✅ Переменная окружения `SUPABASE_SERVICE_ROLE_KEY` установлена в `.env.local`

---

## Структура файлов

```
release-covers/
  └── {userId}/
      └── {releaseId}/
          └── cover.jpg

release-audio/
  └── {userId}/
      └── {releaseId}/
          ├── track-1234567890.wav
          ├── track-1234567891.flac
          └── ...

release-promo/
  └── {userId}/
      └── {releaseId}/
          ├── promo-1234567890-abc123.jpg
          ├── promo-1234567891-def456.png
          └── ...

payment-receipts/
  └── {userId}/
      └── {releaseId}/
          └── receipt-1234567890.jpg
```

---

## API Endpoints

### 1. Загрузка обложки
- **Endpoint**: `POST /api/releases/upload-cover`
- **Бакет**: `release-covers`
- **FormData**: `file`, `releaseId`

### 2. Загрузка аудио
- **Endpoint**: `POST /api/releases/upload-audio`
- **Бакет**: `release-audio`
- **FormData**: `file`, `releaseId`, `trackId`

### 3. Загрузка промо
- **Endpoint**: `POST /api/releases/upload-promo`
- **Бакет**: `release-promo`
- **FormData**: `files[]`, `releaseId`

### 4. Загрузка чека (только Basic)
- **Endpoint**: `POST /api/releases/upload-receipt`
- **Бакет**: `payment-receipts`
- **FormData**: `file`, `releaseId`

---

## Примечания

- Все загрузки требуют аутентификации (Bearer token)
- Файлы автоматически перезаписываются при повторной загрузке с тем же именем (upsert: true)
- Для private бакетов используйте signed URLs для доступа к файлам
- Регулярно очищайте неиспользуемые файлы для экономии места
