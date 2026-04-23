import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { initDb } from '@/db/db';

// Layout & Auth
import { Layout } from '@/components/Layout';
import { ProtectedRoute } from '@/components/ProtectedRoute';

// Pages
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Kasir from '@/pages/Kasir';
import { Produk, Kategori, Pelanggan, Stok, Laporan, Setting } from '@/pages/Placeholders';

function App() {
  useEffect(() => {
    // Initialize DB & Seed data
    initDb().catch(console.error);
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            {/* Dashboard: Owner & Admin only */}
            <Route element={<ProtectedRoute allowedRoles={['Owner', 'Admin']} />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/produk" element={<Produk />} />
              <Route path="/kategori" element={<Kategori />} />
              <Route path="/stok" element={<Stok />} />
            </Route>
            
            {/* Owner only */}
            <Route element={<ProtectedRoute allowedRoles={['Owner']} />}>
              <Route path="/laporan" element={<Laporan />} />
              <Route path="/setting" element={<Setting />} />
            </Route>

            {/* All roles (Owner, Admin, Kasir) */}
            <Route path="/kasir" element={<Kasir />} />
            <Route path="/pelanggan" element={<Pelanggan />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
