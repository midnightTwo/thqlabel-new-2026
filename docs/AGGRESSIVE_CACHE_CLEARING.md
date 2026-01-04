# АГРЕССИВНАЯ СИСТЕМА ОЧИСТКИ КЭША

## ✅ ВНЕДРЕНО - ПОЛНОЕ ОТКЛЮЧЕНИЕ КЭШИРОВАНИЯ

### 🔥 Скорость очистки: **МАКСИМАЛЬНАЯ**

Реализована система сверх-агрессивной очистки кэша на всех уровнях приложения.

---

## 📋 Изменения

### 1️⃣ **Next.js Configuration** ([next.config.ts](../next.config.ts))

- ✅ **Build ID**: Генерируется каждую миллисекунду (`Date.now()`)
- ✅ **Stale Times**: Установлены в `0` секунд (моментальное обновление)
- ✅ **onDemandEntries**: 
  - `maxInactiveAge: 0` (0 секунд)
  - `pagesBufferLength: 0` (без буферизации)

### 2️⃣ **Middleware** ([middleware.ts](../middleware.ts))

**Добавлены заголовки для ПОЛНОГО отключения кэша:**
- `Cache-Control: no-cache, no-store, must-revalidate, max-age=0`
- `Pragma: no-cache`
- `Expires: 0`
- `Surrogate-Control: no-store`
- `CDN-Cache-Control: no-store`
- `Vercel-CDN-Cache-Control: no-store, must-revalidate`
- `X-Accel-Expires: 0`
- `Vary: *`
- **Уникальный ETag**: Генерируется для каждого запроса с timestamp + random ID
- **Last-Modified**: Текущее время для каждого запроса

### 3️⃣ **Layout** ([app/layout.tsx](../app/layout.tsx))

**Meta-теги в HEAD:**
```html
<meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
<meta httpEquiv="Pragma" content="no-cache" />
<meta httpEquiv="Expires" content="0" />
```

**Добавлен компонент:** `<CacheBuster />`

### 4️⃣ **CacheBuster Component** ([components/CacheBuster.tsx](../components/CacheBuster.tsx))

**Активные механизмы очистки:**

#### 🧹 Service Worker & Cache API
- Удаляет все кэши через `caches.delete()`
- Отменяет регистрацию всех Service Workers

#### 💾 Storage Clearing
- Очищает `localStorage` каждые **30 секунд**
- Очищает `sessionStorage` каждые **30 секунд**
- Сохраняет только критичные данные:
  - Тему (`thqlabel_theme`)
  - Auth токен (Supabase)

#### 🔄 Auto-Refresh
- Принудительная перезагрузка при навигации

### 5️⃣ **API Routes**

#### Audio Streaming ([app/api/stream-audio/route.ts](../app/api/stream-audio/route.ts))
```typescript
'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0'
'Pragma': 'no-cache'
'Expires': '0'
```

#### File Uploads
- **Support Images** ([app/api/support/upload/route.ts](../app/api/support/upload/route.ts)): `cacheControl: '0'`
- **News Images** ([app/admin/components/news/NewsTab.tsx](../app/admin/components/news/NewsTab.tsx)): `cacheControl: '0'`

---

## 🚀 Результат

### Частота очистки кэша:

| Уровень | Частота очистки |
|---------|----------------|
| **Build ID** | Каждая миллисекунда |
| **HTTP Headers** | Каждый запрос (уникальный ETag) |
| **Service Worker** | При каждой загрузке страницы |
| **localStorage/sessionStorage** | Каждые 30 секунд |
| **Page Buffer** | 0 секунд (моментально) |
| **Static/Dynamic Cache** | 0 секунд (отключено) |

### Охват:

- ✅ Next.js build cache
- ✅ Browser cache
- ✅ CDN cache (Vercel)
- ✅ Service Worker cache
- ✅ localStorage/sessionStorage
- ✅ API responses
- ✅ Static assets
- ✅ Audio files
- ✅ Uploaded images

---

## 🎯 Как это работает

1. **При каждой сборке**: Новый Build ID
2. **При каждом HTTP запросе**: Уникальные заголовки + ETag
3. **При каждой загрузке страницы**: Очистка Service Worker кэша
4. **Каждые 30 секунд**: Очистка localStorage/sessionStorage
5. **При навигации**: Обновление meta-тегов кэша

---

## ⚡ Важно

**Сохраняются только критичные данные:**
- Тема сайта
- Токены авторизации Supabase

**Всё остальное очищается агрессивно!**

---

## 🔧 Для разработки

Если нужно временно отключить очистку кэша:

1. Закомментируйте `<CacheBuster />` в [layout.tsx](../app/layout.tsx)
2. Измените `maxInactiveAge` в [next.config.ts](../next.config.ts) на большее значение

---

**Статус:** ✅ АКТИВНО  
**Последнее обновление:** 3 января 2026  
**Производительность:** МАКСИМАЛЬНАЯ ОЧИСТКА
