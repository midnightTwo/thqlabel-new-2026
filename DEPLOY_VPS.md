# Деплой THQ Label на VPS

## Данные сервера
- **IP:** 5.9.178.39
- **Пользователь:** root
- **ОС:** Ubuntu 24.04

---

## Шаг 1: Подключение к серверу

```bash
ssh root@5.9.178.39
```
Пароль: `1bxZfYeViolow6N`

---

## Шаг 2: Установка необходимого ПО

```bash
# Обновление системы
apt update && apt upgrade -y

# Установка Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Проверка версий
node --version
npm --version

# Установка PM2 для управления процессом
npm install -g pm2

# Установка nginx
apt install -y nginx

# Установка Git
apt install -y git
```

---

## Шаг 3: Настройка Nginx

```bash
# Создаём конфиг для сайта
nano /etc/nginx/sites-available/thqlabel
```

Вставить этот конфиг:

```nginx
server {
    listen 80;
    server_name thqlabel.ru www.thqlabel.ru;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
        
        # Увеличиваем лимиты для загрузки файлов
        client_max_body_size 100M;
    }
}
```

```bash
# Активируем сайт
ln -s /etc/nginx/sites-available/thqlabel /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default

# Проверяем конфиг
nginx -t

# Перезапускаем nginx
systemctl restart nginx
systemctl enable nginx
```

---

## Шаг 4: Загрузка проекта

### Вариант A: Через Git (рекомендуется)

```bash
# Создаём папку
mkdir -p /var/www
cd /var/www

# Клонируем репозиторий (если есть)
git clone https://github.com/YOUR_REPO/thq-label3.git
cd thq-label3
```

### Вариант B: Через SCP (с локальной машины)

На **локальной машине** (Windows PowerShell):

```powershell
# Создаём архив без node_modules
cd C:\Users\Asus\Desktop\zxc\thq-label3
tar -czvf ../thq-label3.tar.gz --exclude=node_modules --exclude=.next --exclude=.git .

# Загружаем на сервер
scp ../thq-label3.tar.gz root@5.9.178.39:/var/www/
```

На **сервере**:

```bash
cd /var/www
mkdir thq-label3
cd thq-label3
tar -xzvf ../thq-label3.tar.gz
rm ../thq-label3.tar.gz
```

---

## Шаг 5: Настройка переменных окружения

```bash
cd /var/www/thq-label3

# Создаём .env.local
nano .env.local
```

Вставить переменные окружения (скопировать из локального .env.local):

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
# ... остальные переменные
```

---

## Шаг 6: Сборка и запуск

```bash
cd /var/www/thq-label3

# Установка зависимостей
npm install

# Сборка production
npm run build

# Запуск через PM2
pm2 start npm --name "thqlabel" -- start

# Сохраняем конфиг PM2 для автозапуска
pm2 save
pm2 startup
```

---

## Шаг 7: Настройка SSL (Let's Encrypt)

```bash
# Установка certbot
apt install -y certbot python3-certbot-nginx

# Получение сертификата
certbot --nginx -d thqlabel.ru -d www.thqlabel.ru

# Автообновление сертификата (добавляется автоматически)
certbot renew --dry-run
```

---

## Полезные команды

```bash
# Логи приложения
pm2 logs thqlabel

# Перезапуск
pm2 restart thqlabel

# Статус
pm2 status

# Обновление кода
cd /var/www/thq-label3
git pull
npm install
npm run build
pm2 restart thqlabel

# Логи nginx
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log
```

---

## Быстрый деплой (одной командой)

После первоначальной настройки, для обновления:

```bash
cd /var/www/thq-label3 && git pull && npm install && npm run build && pm2 restart thqlabel
```

---

## Firewall (опционально)

```bash
# Разрешаем только нужные порты
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 443   # HTTPS
ufw enable
```
