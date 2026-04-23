import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface TokoSettings {
  nama_toko: string;
  alamat: string;
  no_hp: string;
  footer_struk: string;
}

interface SettingState {
  settings: TokoSettings;
  updateSettings: (newSettings: Partial<TokoSettings>) => void;
}

export const useSettingStore = create<SettingState>()(
  persist(
    (set) => ({
      settings: {
        nama_toko: 'Toko POSKu',
        alamat: 'Jl. Merdeka No. 123, Jakarta',
        no_hp: '081234567890',
        footer_struk: 'Terima kasih atas kunjungan Anda!',
      },
      updateSettings: (newSettings) => set((state) => ({
        settings: { ...state.settings, ...newSettings }
      })),
    }),
    {
      name: 'pos-setting-storage',
    }
  )
);
