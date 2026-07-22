import { useState, useEffect } from 'react';
import { useSettingStore } from '@/store/useSettingStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, Upload, Trash2, Smartphone, Database } from 'lucide-react';
import { exportDB, importInto } from 'dexie-export-import';
import { db } from '@/db/db';
import { useAuthStore } from '@/store/useAuthStore';
import bcrypt from 'bcryptjs';
import { Info, Lock, User as UserIcon } from 'lucide-react';
import { seedDummyData } from '@/utils/seedData';


export default function Setting() {
  const { settings, updateSettings } = useSettingStore();
  const { user, login } = useAuthStore();
  const [formData, setFormData] = useState(settings);
  const [isSaved, setIsSaved] = useState(false);
  const [installable, setInstallable] = useState(!!(window as any).deferredPrompt);

  // State untuk Ganti Akun
  const [accountForm, setAccountForm] = useState({
    username: user?.username || '',
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [accountStatus, setAccountStatus] = useState({ type: '', message: '' });

  const [isSeeding, setIsSeeding] = useState(false);

  const handleSeedData = async () => {
    if (window.confirm('Aplikasi akan mengisi database dengan data demo (Pelanggan, Transaksi acak 2 tahun, Biaya). Lanjutkan?')) {
      setIsSeeding(true);
      const success = await seedDummyData();
      setIsSeeding(false);
      if (success) {
        alert('Berhasil generate data demo! Silakan cek Dashboard dan Laporan.');
        window.location.reload();
      } else {
        alert('Gagal generate data. Pastikan Anda sudah login dan memiliki produk.');
      }
    }
  };

  useEffect(() => {
    const handleInstallAvailable = () => setInstallable(true);
    window.addEventListener('pwa-install-available', handleInstallAvailable);
    return () => window.removeEventListener('pwa-install-available', handleInstallAvailable);
  }, []);

  const handleInstallApp = async () => {
    const promptEvent = (window as any).deferredPrompt;
    if (!promptEvent) return;
    promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    if (outcome === 'accepted') {
      setInstallable(false);
      (window as any).deferredPrompt = null;
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleQrisUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, qris_image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBackup = async () => {
    try {
      const blob = await exportDB(db);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-posai-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert('Gagal melakukan backup data.');
    }
  };

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (window.confirm('PERHATIAN: Restore akan MENGHAPUS dan MENIMPA semua data saat ini dengan data dari file backup. Anda yakin ingin melanjutkan?')) {
      try {
        await importInto(db, file, { clearTablesBeforeImport: true });
        alert('Restore berhasil! Aplikasi akan dimuat ulang.');
        window.location.reload();
      } catch (err) {
        console.error(err);
        alert('Gagal melakukan restore data. Pastikan file backup valid.');
      }
    }
    // reset input
    e.target.value = '';
  };

  const handleDeleteAllData = async () => {
    if (window.confirm('PERINGATAN KERAS: Anda akan MENGHAPUS SEMUA DATA (Produk, Transaksi, Pelanggan, User, dll). Data yang terhapus tidak dapat dikembalikan. Apakah Anda yakin?')) {
      const confirmWord = window.prompt('Ketik "HAPUS" (huruf besar semua) untuk konfirmasi:');
      if (confirmWord === 'HAPUS') {
        try {
          await db.delete();
          alert('Semua data berhasil dihapus. Aplikasi akan dimuat ulang.');
          window.location.reload();
        } catch (e) {
          console.error(e);
          alert('Terjadi kesalahan saat menghapus data.');
        }
      } else {
        alert('Konfirmasi dibatalkan atau kata yang diketik salah.');
      }
    }
  };

  const handleUpdateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setAccountStatus({ type: '', message: '' });

    if (!user) return;

    try {
      // 1. Ambil data user dari DB
      const dbUser = await db.users.get(user.id);
      if (!dbUser) throw new Error('User tidak ditemukan');

      // 2. Validasi Password Lama
      const isMatch = bcrypt.compareSync(accountForm.oldPassword, dbUser.password || '');
      if (!isMatch) {
        setAccountStatus({ type: 'error', message: 'Password lama salah!' });
        return;
      }

      // 3. Validasi Password Baru
      if (accountForm.newPassword && accountForm.newPassword !== accountForm.confirmPassword) {
        setAccountStatus({ type: 'error', message: 'Konfirmasi password baru tidak cocok!' });
        return;
      }

      // 4. Update data
      const updateData: any = { username: accountForm.username };
      if (accountForm.newPassword) {
        const salt = bcrypt.genSaltSync(10);
        updateData.password = bcrypt.hashSync(accountForm.newPassword, salt);
      }

      await db.users.update(user.id, updateData);

      // Update Session Store
      login({ ...user, username: accountForm.username });

      setAccountStatus({ type: 'success', message: 'Akun berhasil diperbarui!' });
      setAccountForm({ ...accountForm, oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      console.error(err);
      setAccountStatus({ type: 'error', message: 'Terjadi kesalahan saat memperbarui akun.' });
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Pengaturan Toko</h1>
      
      <Card>
        <form onSubmit={handleSave}>
          <CardHeader>
            <CardTitle>Informasi Toko</CardTitle>
            <CardDescription>Data ini akan digunakan untuk cetak struk kasir.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nama_toko">Nama Toko</Label>
              <Input 
                id="nama_toko" 
                value={formData.nama_toko} 
                onChange={(e) => setFormData({...formData, nama_toko: e.target.value})} 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="alamat">Alamat</Label>
              <Input 
                id="alamat" 
                value={formData.alamat} 
                onChange={(e) => setFormData({...formData, alamat: e.target.value})} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="no_hp">No. Handphone / WA</Label>
              <Input 
                id="no_hp" 
                value={formData.no_hp} 
                onChange={(e) => setFormData({...formData, no_hp: e.target.value})} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="footer_struk">Footer Struk</Label>
              <Input 
                id="footer_struk" 
                value={formData.footer_struk} 
                onChange={(e) => setFormData({...formData, footer_struk: e.target.value})} 
                placeholder="Terima kasih atas kunjungan Anda!"
              />
            </div>
            <div className="space-y-2 pt-2 border-t mt-4">
              <Label htmlFor="qris_image">Gambar QRIS (Opsional)</Label>
              <div className="flex flex-col gap-2">
                {formData.qris_image && (
                  <img src={formData.qris_image} alt="QRIS" className="w-32 h-32 object-contain border rounded-md" />
                )}
                <Input 
                  id="qris_image" 
                  type="file" 
                  accept="image/*"
                  onChange={handleQrisUpload} 
                />
                <p className="text-xs text-muted-foreground">Upload gambar QRIS statis untuk ditampilkan saat pembayaran dengan metode QRIS.</p>
              </div>
            </div>
            
            <div className="space-y-2 pt-2 border-t mt-4">
              <Label>Tampilan Aplikasi</Label>
              <div className="flex items-center justify-between mt-2 bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                <div className="space-y-0.5 pr-4">
                  <Label className="text-base font-semibold cursor-pointer" onClick={() => {
                    const newVal = !formData.is_dark_mode;
                    setFormData({...formData, is_dark_mode: newVal});
                    updateSettings({ is_dark_mode: newVal });
                  }}>Dark Mode</Label>
                  <p className="text-sm text-muted-foreground">Ubah tampilan menjadi gelap dengan aksen modern.</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={formData.is_dark_mode}
                  onClick={() => {
                    const newVal = !formData.is_dark_mode;
                    setFormData({...formData, is_dark_mode: newVal});
                    updateSettings({ is_dark_mode: newVal });
                  }}
                  className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    formData.is_dark_mode ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span className="sr-only">Toggle Dark Mode</span>
                  <span
                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      formData.is_dark_mode ? 'translate-x-7' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

          </CardContent>
          <CardFooter className="border-t px-6 py-4 flex items-center justify-between">
            {isSaved ? <span className="text-sm text-green-600 font-medium">Berhasil disimpan!</span> : <span />}
            <Button type="submit">Simpan Pengaturan</Button>
          </CardFooter>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Database Management</CardTitle>
          <CardDescription>Backup data Anda secara berkala untuk mencegah kehilangan data, atau gunakan untuk memindahkan data ke perangkat lain.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 space-y-2 p-4 border rounded-lg bg-blue-50/50">
              <h3 className="font-semibold text-blue-900">Backup Data</h3>
              <p className="text-sm text-blue-700 pb-2">Simpan semua data (produk, transaksi, pelanggan) ke dalam file JSON.</p>
              <Button onClick={handleBackup} className="w-full bg-blue-600 hover:bg-blue-700">
                <Download className="w-4 h-4 mr-2" /> Download Backup
              </Button>
            </div>
            
            <div className="flex-1 space-y-2 p-4 border rounded-lg bg-orange-50/50">
              <h3 className="font-semibold text-orange-900">Restore Data</h3>
              <p className="text-sm text-orange-700 pb-2">Kembalikan data dari file backup. <span className="font-bold">Hati-hati: Data saat ini akan tertimpa!</span></p>
              <div className="relative">
                <Input 
                  type="file" 
                  accept=".json,application/json,text/plain,*/*"
                  onChange={handleRestore}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  title="Pilih file backup json"
                />
                <Button variant="outline" className="w-full border-orange-200 text-orange-700 hover:bg-orange-100 hover:text-orange-800">
                  <Upload className="w-4 h-4 mr-2" /> Pilih File Backup
                </Button>
              </div>
            </div>

            <div className="flex-1 space-y-2 p-4 border rounded-lg bg-purple-50/50">
              <h3 className="font-semibold text-purple-900">Data Demo (Testing)</h3>
              <p className="text-sm text-purple-700 pb-2">Generate otomatis 60+ transaksi, pelanggan, & biaya untuk uji coba fitur.</p>
              <Button 
                onClick={handleSeedData} 
                disabled={isSeeding}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                <Database className="w-4 h-4 mr-2" /> {isSeeding ? 'Generating...' : 'Generate Data Uji'}
              </Button>
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-red-100">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50/50">
              <div className="space-y-1">
                <h3 className="font-semibold text-red-900">Danger Zone (Hapus Semua Data)</h3>
                <p className="text-sm text-red-700">Tindakan ini akan menghapus seluruh database aplikasi (Produk, Transaksi, dsb). Pastikan Anda sudah membackup data jika diperlukan.</p>
              </div>
              <Button onClick={handleDeleteAllData} variant="destructive" className="shrink-0 w-full md:w-auto">
                <Trash2 className="w-4 h-4 mr-2" /> Hapus Semua Data
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" />
            Keamanan Akun
          </CardTitle>
          <CardDescription>Perbarui username atau password login Anda.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateAccount} className="space-y-4">
            {accountStatus.message && (
              <div className={`p-3 text-sm rounded-md border ${
                accountStatus.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
              }`}>
                {accountStatus.message}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="acc_username">Username Baru</Label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input 
                    id="acc_username" 
                    className="pl-9"
                    value={accountForm.username} 
                    onChange={(e) => setAccountForm({...accountForm, username: e.target.value})} 
                    required 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="old_pass">Password Lama (Konfirmasi)</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input 
                    id="old_pass" 
                    type="password"
                    className="pl-9"
                    placeholder="Masukkan password saat ini"
                    value={accountForm.oldPassword} 
                    onChange={(e) => setAccountForm({...accountForm, oldPassword: e.target.value})} 
                    required 
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t">
              <div className="space-y-2">
                <Label htmlFor="new_pass">Password Baru (Opsional)</Label>
                <Input 
                  id="new_pass" 
                  type="password"
                  placeholder="Kosongkan jika tidak ganti"
                  value={accountForm.newPassword} 
                  onChange={(e) => setAccountForm({...accountForm, newPassword: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm_pass">Konfirmasi Password Baru</Label>
                <Input 
                  id="confirm_pass" 
                  type="password"
                  placeholder="Ulangi password baru"
                  value={accountForm.confirmPassword} 
                  onChange={(e) => setAccountForm({...accountForm, confirmPassword: e.target.value})} 
                />
              </div>
            </div>
            <Button type="submit" className="w-full md:w-auto">Update Akun</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-primary" />
            Install Aplikasi
          </CardTitle>
          <CardDescription>Install ZenKasir ke layar utama HP atau desktop Anda agar bisa diakses langsung seperti aplikasi bawaan tanpa perlu buka browser berulang kali.</CardDescription>
        </CardHeader>
        <CardContent>
          {installable ? (
            <Button onClick={handleInstallApp} className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white">
              <Smartphone className="w-4 h-4 mr-2" /> Install Aplikasi Sekarang
            </Button>
          ) : (
            <div className="p-4 bg-gray-50 dark:bg-gray-800 border rounded-lg text-sm text-gray-600 dark:text-gray-400">
              Aplikasi sudah terinstall atau browser Anda saat ini tidak mendukung fitur instalasi. Jika belum terinstall, coba buka kembali web ini melalui Google Chrome.
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5 text-primary" />
            Tentang ZenKasir
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            <strong className="text-foreground">ZenKasir</strong> adalah sistem Point of Sale (POS) modern yang dirancang untuk memberikan pengalaman mengelola bisnis dengan tenang dan efisien. 
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <div className="p-3 bg-white dark:bg-gray-900 rounded-lg border">
              <h4 className="font-bold text-foreground mb-1">Offline First</h4>
              <p>Tetap berjualan meski internet mati. Data tersimpan aman di perangkat Anda dan otomatis sinkron saat dibutuhkan.</p>
            </div>
            <div className="p-3 bg-white dark:bg-gray-900 rounded-lg border">
              <h4 className="font-bold text-foreground mb-1">Smart Analytics</h4>
              <p>Analisis produk terlaris dan laporan keuntungan yang mendalam untuk membantu keputusan bisnis Anda.</p>
            </div>
          </div>
          <p className="pt-2">
            Dibuat dengan teknologi PWA (Progressive Web App), ZenKasir dapat diinstal di Android, iOS, maupun Windows tanpa membebani memori perangkat.
          </p>
        </CardContent>
        <CardFooter className="text-[10px] text-center justify-center opacity-50">
          ZenKasir Engine v1.0.4 - Built for Stability
        </CardFooter>
      </Card>

    </div>
  );
}
