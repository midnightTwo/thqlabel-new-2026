// Скрипт для проверки релизов в базе данных
const { createClient } = require('@supabase/supabase-js');

// Загружаем переменные окружения
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE env variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkReleases() {
  console.log('=== Проверка releases_basic ===\n');
  
  // Ищем все релизы КВЭЛИК
  const { data: kvelik, error: err1 } = await supabase
    .from('releases_basic')
    .select('id, artist_name, title, status, upc, tracks')
    .ilike('artist_name', '%КВЭЛИК%');
  
  if (err1) {
    console.error('Error:', err1);
    return;
  }
  
  console.log(`Найдено ${kvelik?.length || 0} релизов КВЭЛИК:\n`);
  
  for (const release of kvelik || []) {
    console.log(`Релиз: "${release.title}"`);
    console.log(`  ID: ${release.id}`);
    console.log(`  Артист: ${release.artist_name}`);
    console.log(`  Статус: ${release.status}`);
    console.log(`  UPC: ${release.upc}`);
    console.log(`  Треки:`);
    
    if (release.tracks && Array.isArray(release.tracks)) {
      release.tracks.forEach((track, idx) => {
        console.log(`    ${idx + 1}. "${track.title || track.name || 'NO TITLE'}" (ISRC: ${track.isrc || 'N/A'})`);
      });
    } else {
      console.log('    (нет треков)');
    }
    console.log('');
  }
  
  // Ищем релиз "А звезды тут?"
  console.log('\n=== Поиск релиза "А звезды тут?" ===\n');
  
  const { data: stars, error: err2 } = await supabase
    .from('releases_basic')
    .select('*')
    .ilike('title', '%звезд%');
  
  if (stars && stars.length > 0) {
    console.log('Найден релиз:');
    console.log(JSON.stringify(stars[0], null, 2));
  } else {
    console.log('Релиз не найден в releases_basic');
  }
  
  // Проверяем releases_exclusive
  console.log('\n=== Проверка releases_exclusive ===\n');
  
  const { data: exclusive, error: err3 } = await supabase
    .from('releases_exclusive')
    .select('id, artist_name, title, status, upc, tracks')
    .ilike('artist_name', '%КВЭЛИК%');
  
  console.log(`Найдено ${exclusive?.length || 0} exclusive релизов КВЭЛИК`);
  
  for (const release of exclusive || []) {
    console.log(`\nРелиз: "${release.title}"`);
    console.log(`  Статус: ${release.status}`);
    if (release.tracks && Array.isArray(release.tracks)) {
      release.tracks.forEach((track, idx) => {
        console.log(`    ${idx + 1}. "${track.title || track.name || 'NO TITLE'}"`);
      });
    }
  }
}

checkReleases().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
