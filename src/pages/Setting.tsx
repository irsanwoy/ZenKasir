import { useState } from 'react';
import { useSettingStore } from '@/store/useSettingStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, Upload, QrCode, Trash2 } from 'lucide-react';
import { exportDB, importInto } from 'dexie-export-import';
import { db } from '@/db/db';
import { QRCodeSVG } from 'qrcode.react';

export default function Setting() {
  const { settings, updateSettings } = useSettingStore();
  
  const [formData, setFormData] = useState(settings);
  const [isSaved, setIsSaved] = useState(false);

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
                  accept=".json"
                  onChange={handleRestore}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  title="Pilih file backup json"
                />
                <Button variant="outline" className="w-full border-orange-200 text-orange-700 hover:bg-orange-100 hover:text-orange-800">
                  <Upload className="w-4 h-4 mr-2" /> Pilih File Backup
                </Button>
              </div>
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
          <CardTitle>QR Menu Pelanggan</CardTitle>
          <CardDescription>Cetak QR Code ini agar pelanggan bisa melihat menu dari HP mereka.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center space-y-4 py-6">
          <div className="p-4 bg-white border-2 border-dashed rounded-xl">
            <QRCodeSVG 
              value={`${window.location.origin}/menu`} 
              size={200}
              level="H"
              includeMargin={true}
            />
          </div>
          <p className="text-sm text-center text-muted-foreground max-w-sm">
            Catatan: Karena sistem ini Offline, pelanggan harus terhubung ke WiFi yang sama dengan kasir agar bisa membuka menu ini.
          </p>
          <Button onClick={() => window.open(`${window.location.origin}/menu`, '_blank')} variant="outline">
            <QrCode className="w-4 h-4 mr-2" /> Buka Preview Menu
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
