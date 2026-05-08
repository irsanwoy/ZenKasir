import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/db';
import { useAuthStore } from '@/store/useAuthStore';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Plus, Trash2 } from 'lucide-react';
import { formatRupiah, parseRupiah } from '@/utils/utils';

export default function BiayaOperasional() {
  const { user } = useAuthStore();
  const biayaList = useLiveQuery(() => db.biaya_operasional.reverse().toArray());
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    kategori: 'Operasional',
    nominal: '',
    keterangan: ''
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nominal || parseRupiah(formData.nominal) <= 0) return;

    try {
      await db.biaya_operasional.add({
        tanggal: new Date(),
        kategori: formData.kategori,
        nominal: parseRupiah(formData.nominal),
        keterangan: formData.keterangan,
        user_id: user?.id || 1
      });
      setIsModalOpen(false);
      setFormData({ kategori: 'Operasional', nominal: '', keterangan: '' });
    } catch (error) {
      console.error(error);
      alert('Gagal menyimpan biaya');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Yakin ingin menghapus catatan biaya ini?')) {
      await db.biaya_operasional.delete(id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Biaya Operasional</h1>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Tambah Biaya
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Pengeluaran</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Keterangan</TableHead>
                <TableHead className="text-right">Nominal</TableHead>
                <TableHead className="w-[80px] text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {biayaList?.map((b) => (
                <TableRow key={b.id}>
                  <TableCell>{format(b.tanggal, 'dd MMM yyyy HH:mm', { locale: localeId })}</TableCell>
                  <TableCell>{b.kategori}</TableCell>
                  <TableCell>{b.keterangan || '-'}</TableCell>
                  <TableCell className="text-right font-bold text-red-600">
                    Rp {b.nominal.toLocaleString('id-ID')}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(b.id!)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {biayaList?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Belum ada pengeluaran yang dicatat.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Tambah Biaya Operasional"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Kategori Biaya</label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              value={formData.kategori}
              onChange={(e) => setFormData({...formData, kategori: e.target.value})}
              required
            >
              <option value="Operasional">Operasional (Listrik, Air, Internet)</option>
              <option value="Bahan Baku">Bahan Baku Tambahan</option>
              <option value="Gaji & Bonus">Gaji & Bonus</option>
              <option value="Peralatan">Peralatan / Maintenance</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Nominal (Rp)</label>
            <Input 
              type="text"
              value={formatRupiah(formData.nominal)} 
              onChange={(e) => setFormData({...formData, nominal: e.target.value})} 
              placeholder="0" 
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium">Keterangan Tambahan</label>
            <Input 
              value={formData.keterangan} 
              onChange={(e) => setFormData({...formData, keterangan: e.target.value})} 
              placeholder="Contoh: Bayar token listrik" 
            />
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
            <Button type="submit">Simpan Biaya</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
