import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/db';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Plus, Edit2, Trash2 } from 'lucide-react';

export default function Produk() {
  const produks = useLiveQuery(async () => {
    const prods = await db.produk.toArray();
    const kats = await db.kategori.toArray();
    return prods.map(p => ({
      ...p,
      kategori_nama: kats.find(k => k.id === p.kategori_id)?.nama || 'Unknown'
    }));
  });
  
  const kategoris = useLiveQuery(() => db.kategori.toArray());

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  
  const initialForm = {
    sku: '', barcode: '', nama: '', kategori_id: 0, 
    harga_modal: 0, harga_jual: 0, stok: 0, 
    tipe: 'barang' as 'barang' | 'jasa', kelola_stok: true
  };
  const [formData, setFormData] = useState(initialForm);

  const openModal = (id: number | null = null, currentData: any = null) => {
    setEditId(id);
    if (currentData) {
      setFormData(currentData);
    } else {
      setFormData({ ...initialForm, kategori_id: kategoris?.[0]?.id || 0 });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData(initialForm);
    setEditId(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama.trim() || !formData.kategori_id) return alert('Data tidak lengkap');

    try {
      // Clean data before save
      const dataToSave = {
        ...formData,
        kategori_id: Number(formData.kategori_id),
        harga_modal: Number(formData.harga_modal),
        harga_jual: Number(formData.harga_jual),
        stok: Number(formData.stok),
        kelola_stok: formData.tipe === 'barang' ? formData.kelola_stok : false,
      };

      if (editId) {
        await db.produk.update(editId, dataToSave);
      } else {
        await db.produk.add(dataToSave);
      }
      closeModal();
    } catch (error) {
      console.error(error);
      alert('Gagal menyimpan produk');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Yakin ingin menghapus produk ini?')) {
      const trxTerkait = await db.transaksi_detail.where('produk_id').equals(id).count();
      if (trxTerkait > 0) {
        alert('Tidak bisa dihapus karena produk ini ada di riwayat transaksi!');
        return;
      }
      await db.produk.delete(id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Master Produk</h1>
        <Button onClick={() => openModal()}>
          <Plus className="w-4 h-4 mr-2" /> Tambah Produk
        </Button>
      </div>

      <Card>
        <CardContent className="p-0 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU/Barcode</TableHead>
                <TableHead>Nama Produk</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead className="text-right">Harga Modal</TableHead>
                <TableHead className="text-right">Harga Jual</TableHead>
                <TableHead className="text-right">Stok</TableHead>
                <TableHead className="w-[100px] text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {produks?.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="font-medium">{p.sku}</div>
                    <div className="text-xs text-muted-foreground">{p.barcode}</div>
                  </TableCell>
                  <TableCell className="font-medium">{p.nama}</TableCell>
                  <TableCell>{(p as any).kategori_nama}</TableCell>
                  <TableCell className="text-right">Rp {p.harga_modal.toLocaleString('id-ID')}</TableCell>
                  <TableCell className="text-right">Rp {p.harga_jual.toLocaleString('id-ID')}</TableCell>
                  <TableCell className="text-right">
                    {p.kelola_stok ? p.stok : '∞'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openModal(p.id, p)}>
                      <Edit2 className="w-4 h-4 text-blue-500" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id!)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {produks?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Tidak ada data produk
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Modal 
        isOpen={isModalOpen} 
        onClose={closeModal} 
        title={editId ? "Edit Produk" : "Tambah Produk"}
        className="max-w-2xl"
      >
        <form onSubmit={handleSave} className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">SKU</label>
            <Input 
              value={formData.sku} 
              onChange={(e) => setFormData({...formData, sku: e.target.value})} 
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Barcode</label>
            <Input 
              value={formData.barcode} 
              onChange={(e) => setFormData({...formData, barcode: e.target.value})} 
            />
          </div>
          
          <div className="space-y-2 col-span-2">
            <label className="text-sm font-medium">Nama Produk</label>
            <Input 
              value={formData.nama} 
              onChange={(e) => setFormData({...formData, nama: e.target.value})} 
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Kategori</label>
            <select 
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              value={formData.kategori_id}
              onChange={(e) => setFormData({...formData, kategori_id: Number(e.target.value)})}
              required
            >
              <option value={0} disabled>Pilih Kategori</option>
              {kategoris?.map(k => (
                <option key={k.id} value={k.id}>{k.nama}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Tipe</label>
            <select 
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              value={formData.tipe}
              onChange={(e) => setFormData({...formData, tipe: e.target.value as 'barang' | 'jasa'})}
            >
              <option value="barang">Barang</option>
              <option value="jasa">Jasa</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Harga Modal</label>
            <Input 
              type="number"
              value={formData.harga_modal} 
              onChange={(e) => setFormData({...formData, harga_modal: Number(e.target.value)})} 
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Harga Jual</label>
            <Input 
              type="number"
              value={formData.harga_jual} 
              onChange={(e) => setFormData({...formData, harga_jual: Number(e.target.value)})} 
              required
            />
          </div>

          {formData.tipe === 'barang' && (
            <>
              <div className="space-y-2 flex flex-col justify-center">
                <label className="text-sm font-medium flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    checked={formData.kelola_stok}
                    onChange={(e) => setFormData({...formData, kelola_stok: e.target.checked})}
                    className="rounded border-gray-300"
                  />
                  <span>Kelola Stok?</span>
                </label>
              </div>
              
              {formData.kelola_stok && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Stok Awal</label>
                  <Input 
                    type="number"
                    value={formData.stok} 
                    onChange={(e) => setFormData({...formData, stok: Number(e.target.value)})} 
                    disabled={!!editId} // Stok awal tidak bisa diedit setelah dibuat, gunakan modul stok
                  />
                </div>
              )}
            </>
          )}

          <div className="col-span-2 flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={closeModal}>Batal</Button>
            <Button type="submit">Simpan</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
