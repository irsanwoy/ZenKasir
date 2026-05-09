import { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/db';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Plus, Edit2, Trash2, Camera, ScanLine } from 'lucide-react';
import { formatRupiah, parseRupiah } from '@/utils/utils';

export default function Produk() {
  const produks = useLiveQuery(() => db.produk.toArray());
  

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  
  const initialForm = {
    sku: '', barcode: '', nama: '', 
    harga_modal: 0, harga_jual: 0, stok: 0, 
    kelola_stok: true, gambar: ''
  };
  const [formData, setFormData] = useState(initialForm);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;
    if (isScanning) {
      setTimeout(() => {
        scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: {width: 250, height: 250} }, false);
        scanner.render((decodedText) => {
          setFormData(prev => ({ ...prev, barcode: decodedText }));
          setIsScanning(false);
          scanner?.clear();
        }, () => {});
      }, 100);
    }
    return () => {
      if (scanner) {
        scanner.clear().catch(console.error);
      }
    };
  }, [isScanning]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 300;
          let width = img.width;
          let height = img.height;
          
          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          setFormData(prev => ({ ...prev, gambar: dataUrl }));
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const openModal = (id: number | null = null, currentData: any = null) => {
    setEditId(id);
    if (currentData) {
      setFormData(currentData);
    } else {
      setFormData(initialForm);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData(initialForm);
    setEditId(null);
    setIsScanning(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama.trim()) return alert('Data tidak lengkap');

    try {
      if (formData.barcode) {
        const existing = await db.produk.where('barcode').equals(formData.barcode).first();
        if (existing && existing.id !== editId) {
          return alert('Barcode sudah dipakai produk lain');
        }
      }
      // Clean data before save
      const finalSku = formData.sku || `SKU${Date.now().toString().slice(-6)}`;
      
      const dataToSave = {
        ...formData,
        sku: finalSku,
        kategori_id: 0,
        tipe: 'barang' as const,
        harga_modal: Number(formData.harga_modal),
        harga_jual: Number(formData.harga_jual),
        stok: Number(formData.stok),
        kelola_stok: formData.kelola_stok,
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
          <div className="space-y-2 col-span-2">
            <label className="text-sm font-medium">Barcode (Opsional)</label>
            <div className="flex gap-2">
              <Input 
                value={formData.barcode} 
                onChange={(e) => setFormData({...formData, barcode: e.target.value})} 
                placeholder="Scan / Ketik"
              />
              <Button type="button" variant="outline" size="icon" onClick={() => setIsScanning(!isScanning)}>
                <ScanLine className="w-4 h-4" />
              </Button>
            </div>
            {isScanning && (
              <div id="reader" className="w-full mt-2 border rounded-md overflow-hidden bg-background"></div>
            )}
          </div>
          
          <div className="space-y-2 col-span-2">
            <label className="text-sm font-medium">Foto Produk</label>
            <div className="flex items-center gap-4">
              {formData.gambar ? (
                <div className="relative w-16 h-16 border rounded-md overflow-hidden">
                  <img src={formData.gambar} alt="Preview" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setFormData({...formData, gambar: ''})} className="absolute top-0 right-0 bg-red-500 text-white rounded-bl-md p-1">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="w-16 h-16 border rounded-md bg-muted flex items-center justify-center text-muted-foreground">
                  <Camera className="w-6 h-6" />
                </div>
              )}
              <Input 
                type="file" 
                accept="image/*" 
                onChange={handleImageUpload}
                className="flex-1"
              />
            </div>
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
            <label className="text-sm font-medium">Harga Modal</label>
            <Input 
              type="text"
              value={formatRupiah(formData.harga_modal)} 
              onChange={(e) => setFormData({...formData, harga_modal: parseRupiah(e.target.value)})} 
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Harga Jual</label>
            <Input 
              type="text"
              value={formatRupiah(formData.harga_jual)} 
              onChange={(e) => setFormData({...formData, harga_jual: parseRupiah(e.target.value)})} 
              required
            />
          </div>

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
                disabled={!!editId}
              />
            </div>
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
