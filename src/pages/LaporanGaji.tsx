import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/db';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LaporanGaji() {
  const [monthStr, setMonthStr] = useState(format(new Date(), 'yyyy-MM'));

  const payrollData = useLiveQuery(async () => {
    const selectedDate = new Date(`${monthStr}-01`);
    const start = startOfMonth(selectedDate);
    const end = endOfMonth(selectedDate);
    
    const users = await db.users.toArray();
    const trx = await db.transaksi
      .where('tanggal')
      .between(start, end, true, true)
      .toArray();

    return users.map(u => {
      const userTrx = trx.filter(t => t.user_id === u.id);
      
      const totalTrx = userTrx.length;
      const totalOmset = userTrx.reduce((sum, t) => sum + t.total, 0);
      
      let totalKomisi = 0;
      if (u.tipe_komisi === 'persen') {
        totalKomisi = totalOmset * ((u.nominal_komisi || 0) / 100);
      } else {
        totalKomisi = totalTrx * (u.nominal_komisi || 0);
      }

      const totalGaji = (u.gaji_pokok || 0) + totalKomisi;

      return {
        ...u,
        totalTrx,
        totalOmset,
        totalKomisi,
        totalGaji
      };
    }).sort((a, b) => b.totalGaji - a.totalGaji);
  }, [monthStr]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <h1 className="text-2xl font-bold">Laporan Gaji & Komisi</h1>
        <div className="w-48 space-y-1">
          <Label>Bulan</Label>
          <Input 
            type="month" 
            value={monthStr}
            onChange={(e) => setMonthStr(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rincian Gaji Karyawan ({format(new Date(`${monthStr}-01`), 'MMMM yyyy', { locale: localeId })})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Karyawan</TableHead>
                <TableHead className="text-right">Total Transaksi (Bulan Ini)</TableHead>
                <TableHead className="text-right">Omset Karyawan</TableHead>
                <TableHead className="text-right">Gaji Pokok</TableHead>
                <TableHead className="text-right">Total Komisi</TableHead>
                <TableHead className="text-right text-primary">Total Gaji Dibayarkan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payrollData?.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">
                    {p.username} <span className="text-xs text-muted-foreground ml-2">({p.role})</span>
                  </TableCell>
                  <TableCell className="text-right">{p.totalTrx} trx</TableCell>
                  <TableCell className="text-right">Rp {p.totalOmset.toLocaleString('id-ID')}</TableCell>
                  <TableCell className="text-right">Rp {(p.gaji_pokok || 0).toLocaleString('id-ID')}</TableCell>
                  <TableCell className="text-right text-orange-600">Rp {p.totalKomisi.toLocaleString('id-ID')}</TableCell>
                  <TableCell className="text-right font-bold text-green-600">Rp {p.totalGaji.toLocaleString('id-ID')}</TableCell>
                </TableRow>
              ))}
              {payrollData?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Tidak ada data karyawan
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
