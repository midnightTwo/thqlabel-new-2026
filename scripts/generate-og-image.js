/**
 * Генерация OG-изображения 1200x630 для превью ссылок
 * Запуск: node scripts/generate-og-image.js
 * 
 * Если нет canvas — просто создайте PNG 1200x630 вручную
 * с логотипом и названием "THQ Label" и положите в public/og-image.png
 */

const fs = require('fs');
const path = require('path');

// Пробуем через canvas, если установлен
async function generateWithCanvas() {
  try {
    const { createCanvas, loadImage } = require('canvas');
    const canvas = createCanvas(1200, 630);
    const ctx = canvas.getContext('2d');

    // Фон — тёмный градиент в стиле сайта
    const gradient = ctx.createLinearGradient(0, 0, 1200, 630);
    gradient.addColorStop(0, '#08080a');
    gradient.addColorStop(0.5, '#1a1530');
    gradient.addColorStop(1, '#08080a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1200, 630);

    // Декоративные свечения
    ctx.beginPath();
    const glow1 = ctx.createRadialGradient(300, 200, 0, 300, 200, 300);
    glow1.addColorStop(0, 'rgba(96, 80, 186, 0.3)');
    glow1.addColorStop(1, 'transparent');
    ctx.fillStyle = glow1;
    ctx.fillRect(0, 0, 600, 500);

    ctx.beginPath();
    const glow2 = ctx.createRadialGradient(900, 430, 0, 900, 430, 300);
    glow2.addColorStop(0, 'rgba(157, 141, 241, 0.25)');
    glow2.addColorStop(1, 'transparent');
    ctx.fillStyle = glow2;
    ctx.fillRect(600, 130, 600, 500);

    // Загружаем логотип
    try {
      const logoPath = path.join(__dirname, '..', 'public', 'logo.png');
      const logo = await loadImage(logoPath);
      const logoSize = 120;
      const logoX = (1200 - logoSize) / 2;
      ctx.drawImage(logo, logoX, 150, logoSize, logoSize);
    } catch (e) {
      // Если логотип не загрузился, рисуем placeholder
      ctx.beginPath();
      ctx.arc(600, 210, 60, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(96, 80, 186, 0.5)';
      ctx.fill();
    }

    // Текст "THQ LABEL"
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 72px Arial, Helvetica, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('THQ LABEL', 600, 350);

    // Подпись
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '28px Arial, Helvetica, sans-serif';
    ctx.fillText('Современный музыкальный лейбл', 600, 410);

    // Линия-разделитель
    const lineGradient = ctx.createLinearGradient(350, 440, 850, 440);
    lineGradient.addColorStop(0, 'transparent');
    lineGradient.addColorStop(0.5, 'rgba(157, 141, 241, 0.6)');
    lineGradient.addColorStop(1, 'transparent');
    ctx.strokeStyle = lineGradient;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(350, 440);
    ctx.lineTo(850, 440);
    ctx.stroke();

    // URL
    ctx.fillStyle = 'rgba(157, 141, 241, 0.8)';
    ctx.font = '22px Arial, Helvetica, sans-serif';
    ctx.fillText('thqlabel.ru', 600, 480);

    // Сохраняем
    const outputPath = path.join(__dirname, '..', 'public', 'og-image.png');
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buffer);
    console.log('✅ OG-изображение создано:', outputPath);
    console.log('   Размер: 1200x630 px');
    return true;
  } catch (e) {
    return false;
  }
}

// Простой SVG-фолбэк без зависимостей
function generateSVGFallback() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#08080a"/>
      <stop offset="50%" style="stop-color:#1a1530"/>
      <stop offset="100%" style="stop-color:#08080a"/>
    </linearGradient>
    <radialGradient id="glow1" cx="25%" cy="32%" r="25%">
      <stop offset="0%" style="stop-color:rgba(96,80,186,0.4)"/>
      <stop offset="100%" style="stop-color:transparent"/>
    </radialGradient>
    <radialGradient id="glow2" cx="75%" cy="68%" r="25%">
      <stop offset="0%" style="stop-color:rgba(157,141,241,0.3)"/>
      <stop offset="100%" style="stop-color:transparent"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#glow1)"/>
  <rect width="1200" height="630" fill="url(#glow2)"/>
  <text x="600" y="280" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="72" font-weight="bold" fill="white">THQ LABEL</text>
  <text x="600" y="340" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="28" fill="rgba(255,255,255,0.6)">Современный музыкальный лейбл</text>
  <line x1="350" y1="370" x2="850" y2="370" stroke="rgba(157,141,241,0.6)" stroke-width="2"/>
  <text x="600" y="420" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="22" fill="rgba(157,141,241,0.8)">thqlabel.ru</text>
</svg>`;

  const outputPath = path.join(__dirname, '..', 'public', 'og-image.svg');
  fs.writeFileSync(outputPath, svg);
  console.log('⚠️  Canvas не установлен. Создан SVG-файл:', outputPath);
  console.log('');
  console.log('Варианты:');
  console.log('1. Установите canvas: npm install canvas');
  console.log('   И запустите скрипт повторно');
  console.log('2. Откройте SVG в браузере, сделайте скриншот 1200x630');
  console.log('   и сохраните как public/og-image.png');
  console.log('3. Создайте картинку в Figma/Canva размером 1200x630');
}

async function main() {
  const success = await generateWithCanvas();
  if (!success) {
    generateSVGFallback();
  }
}

main();
