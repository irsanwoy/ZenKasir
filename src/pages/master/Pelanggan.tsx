import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/db';
import { useAuthStore } from '@/store/useAuthStore';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Plus, Edit2, Trash2, Wallet, ClipboardList, MessageCircle } from 'lucide-react';
import { formatRupiah, parseRupiah } from '@/utils/utils';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

export default function Pelanggan() {
  const { user } = useAuthStore();
  
  const pelanggans = useLiveQuery(async () => {
    const list = await db.pelanggan.toArray();
    return await Promise.all(list.map(async (p) => {
      const trx = await db.transaksi.where('pelanggan_id').equals(p.id!).toArray();
      const totalHutang = trx
        .filter(t => t.status === 'Bon')
        .reduce((sum, t) => sum + (t.total - t.bayar), 0);
      return { ...p, totalHutang };
    }));
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ nama: '', no_hp: '' });

  const [isPelunasanOpen, setIsPelunasanOpen] = useState(false);
  const [pelangganPelunasan, setPelangganPelunasan] = useState<any>(null);
  const [jumlahBayar, setJumlahBayar] = useState<number>(0);

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedHistoryPelanggan, setSelectedHistoryPelanggan] = useState<any>(null);
  const [historyList, setHistoryList] = useState<any[]>([]);

  const openModal = (id: number | null = null, currentData = { nama: '', no_hp: '' }) => {
    setEditId(id);
    setFormData(currentData);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({ nama: '', no_hp: '' });
    setEditId(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama.trim()) return;

    try {
      if (editId) {
        await db.pelanggan.update(editId, formData);
      } else {
        await db.pelanggan.add(formData);
      }
      closeModal();
    } catch (error) {
      console.error(error);
      alert('Gagal menyimpan pelanggan');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Yakin ingin menghapus pelanggan ini?')) {
      const trxTerkait = await db.transaksi.where('pelanggan_id').equals(id).count();
      if (trxTerkait > 0) {
        alert('Tidak bisa dihapus karena pelanggan ini memiliki riwayat transaksi!');
        return;
      }
      await db.pelanggan.delete(id);
    }
  };

  const openPelunasan = (p: any) => {
    setPelangganPelunasan(p);
    setJumlahBayar(p.totalHutang);
    setIsPelunasanOpen(true);
  };

  const closePelunasan = () => {
    setIsPelunasanOpen(false);
    setPelangganPelunasan(null);
    setJumlahBayar(0);
  };

  const openHistory = async (p: any) => {
    setSelectedHistoryPelanggan(p);
    const trx = await db.transaksi
      .where('pelanggan_id').equals(p.id)
      .reverse()
      .toArray();
    setHistoryList(trx);
    setIsHistoryOpen(true);
  };

  const closeHistory = () => {
    setIsHistoryOpen(false);
    setSelectedHistoryPelanggan(null);
    setHistoryList([]);
  };

  const handlePelunasan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pelangganPelunasan || jumlahBayar <= 0) return;
    
    let sisaBayar = jumlahBayar;
    const now = new Date();
    const kode_transaksi = 'PLN-' + format(now, 'yyyyMMddHHmmss') + '-' + Math.floor(Math.random() * 1000);
    
    try {
      await db.transaction('rw', db.transaksi, async () => {
        const trx = await db.transaksi
          .where('pelanggan_id').equals(pelangganPelunasan.id)
          .toArray();
        
        const hutangTrx = trx
          .filter(t => t.status === 'Bon')
          .sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());
          
        for (const t of hutangTrx) {
          if (sisaBayar <= 0) break;
          
          const sisaHutangTrx = t.total - t.bayar;
          if (sisaBayar >= sisaHutangTrx) {
            await db.transaksi.update(t.id!, { bayar: t.total, status: 'Lunas' });
            sisaBayar -= sisaHutangTrx;
          } else {
            await db.transaksi.update(t.id!, { bayar: t.bayar + sisaBayar });
            sisaBayar = 0;
          }
        }
        
        await db.transaksi.add({
          kode_transaksi,
          tanggal: now,
          user_id: user?.id || 0,
          pelanggan_id: pelangganPelunasan.id,
          subtotal: 0,
          diskon: 0,
          total: 0,
          bayar: jumlahBayar,
          kembalian: 0,
          metode_bayar: 'Pelunasan Bon',
          status: 'Lunas'
        });
      });
      alert('Pelunasan berhasil diproses!');
      closePelunasan();
    } catch (error) {
      console.error(error);
      alert('Gagal memproses pelunasan');
    }
  };

  const handleWA = (p: any) => {
    let phone = p.no_hp;
    if (!phone) return;
    
    // Format ke +62
    phone = phone.replace(/\D/g, '');
    if (phone.startsWith('0')) {
      phone = '62' + phone.substring(1);
    } else if (phone.startsWith('8')) {
      phone = '62' + phone;
    }
    
    let text = `Halo ${p.nama},\n\n`;
    if (p.totalHutang > 0) {
      text += `Ini pesan dari toko kami. Kami ingin menginformasikan bahwa Anda memiliki sisa tagihan kasbon sebesar *Rp ${p.totalHutang.toLocaleString('id-ID')}*. Mohon untuk segera diselesaikan ya.\n\nTerima kasih! 🙏`;
    } else {
      text += `Terima kasih telah menjadi pelanggan setia di toko kami! 🙏`;
    }
    
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Master Pelanggan</h1>
        <Button onClick={() => openModal()}>
          <Plus className="w-4 h-4 mr-2" /> Tambah Pelanggan
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Pelanggan</TableHead>
                <TableHead>No. HP</TableHead>
                <TableHead className="text-right">Total Hutang</TableHead>
                <TableHead className="w-[150px] text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pelanggans?.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.nama}</TableCell>
                  <TableCell>
                    {p.no_hp ? (
                      <div className="flex items-center gap-2">
                        <span>{p.no_hp}</span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 text-green-600 hover:text-green-700 hover:bg-green-100" 
                          onClick={() => handleWA(p)}
                          title="Chat via WhatsApp"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : '-'}
                  </TableCell>
                  <TableCell className="text-right font-bold text-red-600">
                    {(p as any).totalHutang > 0 ? `Rp ${(p as any).totalHutang.toLocaleString('id-ID')}` : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" title="Lihat Histori" onClick={() => openHistory(p)}>
                      <ClipboardList className="w-4 h-4 text-blue-600" />
                    </Button>
                    {(p as any).totalHutang > 0 && (
                      <Button variant="ghost" size="icon" title="Bayar Hutang" onClick={() => openPelunasan(p)}>
                        <Wallet className="w-4 h-4 text-green-600" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => openModal(p.id, { nama: p.nama, no_hp: p.no_hp })}>
                      <Edit2 className="w-4 h-4 text-blue-500" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id!)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {pelanggans?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    Tidak ada data pelanggan
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
        title={editId ? "Edit Pelanggan" : "Tambah Pelanggan"}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Nama Pelanggan</label>
            <Input 
              value={formData.nama} 
              onChange={(e) => setFormData({...formData, nama: e.target.value})} 
              placeholder="Masukkan nama pelanggan" 
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium">No. HP (Opsional)</label>
            <Input 
              value={formData.no_hp} 
              onChange={(e) => setFormData({...formData, no_hp: e.target.value})} 
              placeholder="08123456789" 
            />
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={closeModal}>Batal</Button>
            <Button type="submit">Simpan</Button>
          </div>
        </form>
      </Modal>

      <Modal 
        isOpen={isPelunasanOpen} 
        onClose={closePelunasan} 
        title="Pelunasan Hutang"
      >
        <form onSubmit={handlePelunasan} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Nama Pelanggan</label>
            <Input value={pelangganPelunasan?.nama || ''} disabled />
          </div>
          <div>
            <label className="text-sm font-medium">Total Hutang</label>
            <Input value={`Rp ${(pelangganPelunasan?.totalHutang || 0).toLocaleString('id-ID')}`} disabled className="font-bold text-red-600" />
          </div>
          <div>
            <label className="text-sm font-medium">Jumlah Bayar</label>
            <Input 
              type="text"
              value={formatRupiah(jumlahBayar)} 
              onChange={(e) => {
                const val = parseRupiah(e.target.value);
                if (val > (pelangganPelunasan?.totalHutang || 0)) {
                  setJumlahBayar(pelangganPelunasan?.totalHutang || 0);
                } else {
                  setJumlahBayar(val);
                }
              }} 
              placeholder="0" 
              required
            />
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={closePelunasan}>Batal</Button>
            <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white">Proses Pembayaran / Cicilan</Button>
          </div>
        </form>
      </Modal>

      <Modal 
        isOpen={isHistoryOpen} 
        onClose={closeHistory} 
        title={`Histori Transaksi - ${selectedHistoryPelanggan?.nama}`}
        className="max-w-4xl"
      >
        <div className="overflow-auto max-h-[70vh]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode TRX</TableHead>
                <TableHead>Waktu</TableHead>
                <TableHead>Metode</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total Tagihan</TableHead>
                <TableHead className="text-right">Telah Dibayar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {historyList.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.kode_transaksi}</TableCell>
                  <TableCell>{format(t.tanggal, 'dd MMM yyyy HH:mm', { locale: localeId })}</TableCell>
                  <TableCell>{t.metode_bayar}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${t.status === 'Lunas' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {t.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-bold">Rp {t.total.toLocaleString('id-ID')}</TableCell>
                  <TableCell className="text-right">Rp {t.bayar.toLocaleString('id-ID')}</TableCell>
                </TableRow>
              ))}
              {historyList.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Belum ada riwayat transaksi
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Modal>
    </div>
  );
}
