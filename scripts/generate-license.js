import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!process.env.SUPABASE_SERVICE_KEY) {
  console.warn('⚠️ WARNING: Anda menggunakan ANON_KEY. Pembuatan lisensi mungkin akan diblokir oleh RLS Supabase.');
  console.warn('Silakan tambahkan SUPABASE_SERVICE_KEY=... di file .env Anda (dapatkan di Supabase Settings -> API -> service_role secret).');
  console.warn('--------------------------------------------------');
}

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Kredensial Supabase tidak lengkap di file .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function generateRandomKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'POSAI-';
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 4; j++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    if (i < 2) result += '-';
  }
  return result;
}

async function main() {
  const key = generateRandomKey();
  const tokoName = process.argv[2] || 'Toko Baru';

  console.log(`Generating license key for: ${tokoName}...`);

  const { data, error } = await supabase
    .from('licenses')
    .insert([
      { license_key: key, toko_name: tokoName }
    ])
    .select();

  if (error) {
    console.error('Error inserting license:', error.message);
    return;
  }

  console.log('✅ License successfully created!');
  console.log('-----------------------------------');
  console.log(`License Key : ${key}`);
  console.log(`Toko Name   : ${tokoName}`);
  console.log('-----------------------------------');
  console.log('Berikan Kode Lisensi ini kepada pembeli.');
}

main();
