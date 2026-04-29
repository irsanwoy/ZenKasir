import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/db';
import { format, startOfDay, endOfDay } from 'date-fns';
import { id } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2 } from 'lucide-react';

export default function Laporan() {
  const [dateStr, setDateStr] = useState(format(new Date(), 'yyyy-MM-dd'));

  const transaksiList = useLiveQuery(async () => {
    const selectedDate = new Date(dateStr);
    const start = startOfDay(selectedDate);
    const end = endOfDay(selectedDate);
    
    const trx = await db.transaksi
      .where('tanggal')
      .between(start, end, true, true)
      .reverse()
      .toArray();

    const users = await db.users.toArray();
    return trx.map(t => ({
      ...t,
      kasir_nama: users.find(u => u.id === t.user_id)?.username || 'Unknown'
    }));
  }, [dateStr]);

  const biayaList = useLiveQuery(async () => {
    const selectedDate = new Date(dateStr);
    const start = startOfDay(selectedDate);
    const end = endOfDay(selectedDate);
    
    return await db.biaya_operasional
      .where('tanggal')
      .between(start, end, true, true)
      .toArray();
  }, [dateStr]);

  const totalBiaya = biayaList?.reduce((acc, b) => acc + b.nominal, 0) || 0;

  const summary = transaksiList?.reduce((acc, t) => {
    acc.omset += t.total;
    acc.diskon += t.diskon;
    acc.transaksi += 1;
    // Calculate Laba Kotor = Total (Omset) - Modal
    // But since `transaksi` doesn't store modal per item natively unless we calculate it...
    return acc;
  }, { omset: 0, diskon: 0, transaksi: 0 });

  const labaBersih = (summary?.omset || 0) - totalBiaya;

  const handleDelete = async (id: number) => {
    if (window.confirm('Yakin ingin menghapus transaksi ini? Stok produk akan dikembalikan.')) {
      try {
        await db.transaction('rw', db.transaksi, db.transaksi_detail, db.produk, async () => {
          const details = await db.transaksi_detail.where('transaksi_id').equals(id).toArray();
          
          for (const detail of details) {
            const produk = await db.produk.get(detail.produk_id);
            if (produk && produk.kelola_stok) {
              await db.produk.update(produk.id!, { stok: produk.stok + detail.qty });
            }
          }
          
          await db.transaksi_detail.where('transaksi_id').equals(id).delete();
          await db.transaksi.delete(id);
        });
        alert('Transaksi berhasil dihapus');
      } catch (error) {
        console.error(error);
        alert('Gagal menghapus transaksi');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <h1 className="text-2xl font-bold">Laporan Penjualan</h1>
        <div className="w-48 space-y-1">
          <Label>Tanggal</Label>
          <Input 
            type="date" 
            value={dateStr}
            onChange={(e) => setDateStr(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Transaksi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{summary?.transaksi || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Omset</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">Rp {(summary?.omset || 0).toLocaleString('id-ID')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Diskon Diberikan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-500">Rp {(summary?.diskon || 0).toLocaleString('id-ID')}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-red-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-800">Total Biaya Operasional</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">Rp {totalBiaya.toLocaleString('id-ID')}</div>
          </CardContent>
        </Card>
        <Card className="bg-green-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Laba Bersih Estimasi (Omset - Biaya)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">Rp {labaBersih.toLocaleString('id-ID')}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rincian Transaksi</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode TRX</TableHead>
                <TableHead>Waktu</TableHead>
                <TableHead>Kasir</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
                <TableHead className="text-right">Diskon</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right w-[80px]">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transaksiList?.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.kode_transaksi}</TableCell>
                  <TableCell>{format(t.tanggal, 'HH:mm:ss', { locale: id })}</TableCell>
                  <TableCell>{(t as any).kasir_nama}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${t.status === 'Lunas' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {t.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">Rp {t.subtotal.toLocaleString('id-ID')}</TableCell>
                  <TableCell className="text-right">Rp {t.diskon.toLocaleString('id-ID')}</TableCell>
                  <TableCell className="text-right font-bold">Rp {t.total.toLocaleString('id-ID')}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id!)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {transaksiList?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Tidak ada transaksi pada tanggal ini
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
