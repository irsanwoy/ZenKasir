import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';

interface LicenseState {
  isActivated: boolean;
  deviceId: string | null;
  licenseKey: string | null;
  tokoName: string | null;
  
  activate: (key: string) => Promise<{ success: boolean; message: string }>;
  checkLicense: () => boolean;
  generateDeviceId: () => string;
}

export const useLicenseStore = create<LicenseState>()(
  persist(
    (set, get) => ({
      isActivated: false,
      deviceId: null,
      licenseKey: null,
      tokoName: null,

      generateDeviceId: () => {
        // Generate UUID v4
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      },

      activate: async (key: string) => {
        try {
          const state = get();
          let currentDeviceId = state.deviceId;
          
          if (!currentDeviceId) {
            currentDeviceId = state.generateDeviceId();
            set({ deviceId: currentDeviceId });
          }

          // Cek lisensi di Supabase
          const { data: license, error } = await supabase
            .from('licenses')
            .select('*')
            .eq('license_key', key)
            .single();

          if (error || !license) {
            return { success: false, message: 'Kode lisensi tidak valid atau tidak ditemukan.' };
          }

          if (!license.is_active) {
            return { success: false, message: 'Lisensi ini sudah dinonaktifkan oleh admin.' };
          }

          // Jika lisensi belum di-bind ke device mana pun
          if (!license.device_id) {
            const { error: updateError } = await supabase
              .from('licenses')
              .update({ 
                device_id: currentDeviceId,
                activated_at: new Date().toISOString()
              })
              .eq('id', license.id);

            if (updateError) {
              return { success: false, message: 'Gagal mengaktivasi lisensi. Coba lagi.' };
            }

            set({ 
              isActivated: true, 
              licenseKey: key,
              tokoName: license.toko_name 
            });
            
            return { success: true, message: 'Aktivasi berhasil! Selamat menggunakan ZenKasir.' };
          }

          // Jika lisensi sudah terpakai
          if (license.device_id !== currentDeviceId) {
            return { success: false, message: 'Lisensi ini sudah digunakan di perangkat lain.' };
          }

          // Jika lisensi sudah terpakai dan cocok dengan device ini
          set({ 
            isActivated: true, 
            licenseKey: key,
            tokoName: license.toko_name 
          });
          
          return { success: true, message: 'Lisensi valid untuk perangkat ini.' };

        } catch (err) {
          console.error('Activation error:', err);
          return { success: false, message: 'Terjadi kesalahan jaringan. Pastikan Anda terhubung ke internet.' };
        }
      },

      checkLicense: () => {
        return get().isActivated;
      }
    }),
    {
      name: 'posai-license-storage',
    }
  )
);
