import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/db';
import { format, startOfDay, endOfDay } from 'date-fns';
import { id } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Calendar, Trash2 } from 'lucide-react';

export default function Laporan() {
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-01'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const dateRange = {
    start: startOfDay(new Date(startDate)),
    end: endOfDay(new Date(endDate))
  };

  const transaksiList = useLiveQuery(async () => {
    const trx = await db.transaksi
      .where('tanggal')
      .between(dateRange.start, dateRange.end, true, true)
      .reverse()
      .toArray();

    const users = await db.users.toArray();
    return trx.map(t => ({
      ...t,
      kasir_nama: users.find(u => u.id === t.user_id)?.username || 'Unknown'
    }));
  }, [startDate, endDate]);

  const biayaList = useLiveQuery(async () => {
    return await db.biaya_operasional
      .where('tanggal')
      .between(dateRange.start, dateRange.end, true, true)
      .toArray();
  }, [startDate, endDate]);

  const analisisProduk = useLiveQuery(async () => {
    const trxIds = (await db.transaksi
      .where('tanggal')
      .between(dateRange.start, dateRange.end, true, true)
      .toArray()).map(t => t.id!);
    
    const details = await db.transaksi_detail.where('transaksi_id').anyOf(trxIds).toArray();
    const allProduks = await db.produk.toArray();
    
    const salesMap: Record<number, number> = {};
    details.forEach(d => {
      salesMap[d.produk_id] = (salesMap[d.produk_id] || 0) + d.qty;
    });

    const results = allProduks.map(p => ({
      nama: p.nama,
      qty: salesMap[p.id!] || 0
    }));

    return {
      terlaris: [...results].filter(r => r.qty > 0).sort((a, b) => b.qty - a.qty).slice(0, 5),
      kurangLaris: [...results].filter(r => r.qty > 0).sort((a, b) => a.qty - b.qty).slice(0, 5),
      tidakLaku: results.filter(r => r.qty === 0).slice(0, 10)
    };
  }, [startDate, endDate]);

  const totalBiaya = biayaList?.reduce((acc, b) => acc + b.nominal, 0) || 0;

  const summary = transaksiList?.reduce((acc, t) => {
    acc.omset += t.total;
    acc.transaksi += 1;
    return acc;
  }, { omset: 0, transaksi: 0 });

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
      <div className="bg-card p-4 rounded-xl border border-border shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Calendar className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-bold text-lg leading-none">Laporan Analisis</h2>
            <p className="text-xs text-muted-foreground mt-1">Pantau performa bisnis Anda</p>
          </div>
        </div>

        <div className="flex items-center bg-gray-50 dark:bg-gray-800 p-1 rounded-lg border border-gray-100 dark:border-gray-700 w-full sm:w-auto">
          <div className="flex items-center px-3 gap-2 border-r">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Dari</span>
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-sm font-medium focus:outline-none cursor-pointer"
            />
          </div>
          <div className="flex items-center px-3 gap-2">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Sampai</span>
            <input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-sm font-medium focus:outline-none cursor-pointer"
            />
          </div>
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

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Produk Terlaris 🔥</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analisisProduk?.terlaris.map((p, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="truncate pr-2">{p.nama}</span>
                  <span className="font-bold">{p.qty}x</span>
                </div>
              ))}
              {analisisProduk?.terlaris.length === 0 && <p className="text-xs text-muted-foreground">Belum ada data</p>}
            </div>
          </CardContent>
        </Card>
        <Card className="border-orange-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-700">Kurang Laris 📉</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analisisProduk?.kurangLaris.map((p, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="truncate pr-2">{p.nama}</span>
                  <span className="font-bold">{p.qty}x</span>
                </div>
              ))}
              {analisisProduk?.kurangLaris.length === 0 && <p className="text-xs text-muted-foreground">Belum ada data</p>}
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-700">Tidak Laku ❄️</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analisisProduk?.tidakLaku.map((p, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="truncate pr-2">{p.nama}</span>
                  <span className="font-bold">0x</span>
                </div>
              ))}
              {analisisProduk?.tidakLaku.length === 0 && <p className="text-xs text-muted-foreground">Semua produk laku!</p>}
            </div>
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
                    Tidak ada transaksi pada periode ini
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
