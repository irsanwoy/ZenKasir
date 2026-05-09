-- 1. Buat Tabel Licenses
CREATE TABLE licenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  license_key TEXT UNIQUE NOT NULL,
  device_id TEXT,
  activated_at TIMESTAMPTZ,
  toko_name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Aktifkan Row Level Security (RLS)
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;

-- 3. Buat Policy agar aplikasi bisa membaca data (untuk cek lisensi)
CREATE POLICY "Allow anon read" 
ON licenses 
FOR SELECT 
USING (true);

-- 4. Buat Policy agar aplikasi bisa mengupdate data (hanya untuk mengisi device_id saat aktivasi)
CREATE POLICY "Allow anon update" 
ON licenses 
FOR UPDATE 
USING (true);
