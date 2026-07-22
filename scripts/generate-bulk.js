import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
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
  const licensesToGenerate = 100;
  const insertData = [];
  
  for (let i = 0; i < licensesToGenerate; i++) {
    insertData.push({
      license_key: generateRandomKey(),
      toko_name: 'Lisensi Cadangan'
    });
  }

  console.log(`Menginjeksi ${licensesToGenerate} lisensi ke Supabase...`);

  const { data, error } = await supabase
    .from('licenses')
    .insert(insertData)
    .select();

  if (error) {
    console.error('Error inserting licenses:', error.message);
    return;
  }

  const fileContent = data.map(d => `${d.license_key}`).join('\n');
  const filePath = path.resolve(__dirname, '../100_lisensi_siap_pakai.txt');
  fs.writeFileSync(filePath, fileContent);

  console.log('✅ Berhasil membuat 100 lisensi!');
  console.log(`Semua kunci lisensi telah disimpan ke dalam file: ${filePath}`);
}

main();
