/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

function loadDotEnvLocal() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return {};
  const raw = fs.readFileSync(envPath, 'utf8');
  const out = {};
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    out[key] = value;
  }
  return out;
}

const fileEnv = loadDotEnvLocal();

function getEnv(key) {
  return process.env[key] ?? fileEnv[key] ?? '';
}

const required = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_APP_URL',
  'YOOKASSA_SHOP_ID',
  'YOOKASSA_SECRET_KEY',
];

const missing = required.filter((k) => !getEnv(k));

console.log('Env check (.env.local + process.env)');
for (const k of required) {
  const v = getEnv(k);
  if (!v) {
    console.log(`- ${k}: MISSING`);
  } else if (k.includes('SECRET') || k.includes('KEY')) {
    const preview = v.length <= 6 ? '***' : `${v.slice(0, 3)}***${v.slice(-3)}`;
    console.log(`- ${k}: set (${preview})`);
  } else {
    console.log(`- ${k}: ${v}`);
  }
}

if (missing.length) {
  console.log('\nMissing vars:');
  for (const k of missing) console.log(`- ${k}`);
  console.log('\nFix: create .env.local in project root and add these keys.');
  process.exitCode = 2;
} else {
  console.log('\nAll required vars are present.');
}
