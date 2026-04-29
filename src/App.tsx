import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { initDb } from '@/db/db';

// Layout & Auth
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';

// Pages
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Kasir from '@/pages/Kasir';
import Produk from '@/pages/master/Produk';
import Kategori from '@/pages/master/Kategori';
import Pelanggan from '@/pages/master/Pelanggan';
import Laporan from '@/pages/Laporan';
import Setting from '@/pages/Setting';
import BiayaOperasional from '@/pages/BiayaOperasional';
import Karyawan from '@/pages/master/Karyawan';
import LaporanGaji from '@/pages/LaporanGaji';
import MenuPublic from '@/pages/MenuPublic';

function App() {
  useEffect(() => {
    // Initialize DB & Seed data
    initDb().catch(console.error);
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/menu" element={<MenuPublic />} />
        
        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            {/* Dashboard: Owner & Admin only */}
            <Route element={<ProtectedRoute allowedRoles={['Owner', 'Admin']} />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/produk" element={<Produk />} />
              <Route path="/kategori" element={<Kategori />} />
            </Route>
            
            {/* Owner only */}
            <Route element={<ProtectedRoute allowedRoles={['Owner']} />}>
              <Route path="/karyawan" element={<Karyawan />} />
              <Route path="/laporan-gaji" element={<LaporanGaji />} />
              <Route path="/laporan" element={<Laporan />} />
              <Route path="/setting" element={<Setting />} />
            </Route>

            {/* All roles (Owner, Admin, Kasir) */}
            <Route path="/kasir" element={<Kasir />} />
            <Route path="/pelanggan" element={<Pelanggan />} />
            <Route path="/biaya-operasional" element={<BiayaOperasional />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
