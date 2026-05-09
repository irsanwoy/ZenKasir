import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { initDb } from '@/db/db';
import { useSettingStore } from '@/store/useSettingStore';

// Layout & Auth
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { LicenseGuard } from '@/components/LicenseGuard';

// Pages
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Kasir from '@/pages/Kasir';
import Produk from '@/pages/master/Produk';
import Pelanggan from '@/pages/master/Pelanggan';
import Laporan from '@/pages/Laporan';
import Setting from '@/pages/Setting';
import BiayaOperasional from '@/pages/BiayaOperasional';
import Aktivasi from '@/pages/Aktivasi';

function App() {
  const { settings } = useSettingStore();

  useEffect(() => {
    // Sync Dark Mode
    if (settings.is_dark_mode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.is_dark_mode]);

  useEffect(() => {
    // Initialize DB & Seed data
    initDb().catch(console.error);

    // Tangkap event PWA install
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      (window as any).deferredPrompt = e;
      window.dispatchEvent(new Event('pwa-install-available'));
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/aktivasi" element={<Aktivasi />} />
        
        {/* Protected by License */}
        <Route element={<LicenseGuard />}>
          <Route path="/login" element={<Login />} />
          
          {/* Protected Routes (Auth) */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              {/* Dashboard: Owner & Admin only */}
              <Route element={<ProtectedRoute allowedRoles={['Owner', 'Admin']} />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/produk" element={<Produk />} />
              </Route>
              
              {/* Owner only */}
              <Route element={<ProtectedRoute allowedRoles={['Owner']} />}>
                <Route path="/laporan" element={<Laporan />} />
                <Route path="/setting" element={<Setting />} />
              </Route>

              {/* All roles (Owner, Admin, Kasir) */}
              <Route path="/kasir" element={<Kasir />} />
              <Route path="/pelanggan" element={<Pelanggan />} />
              <Route path="/biaya-operasional" element={<BiayaOperasional />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
