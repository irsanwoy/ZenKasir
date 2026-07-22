import { db } from '@/db/db';
import { subDays, format } from 'date-fns';

export async function seedDummyData() {
  try {
    // 1. Tambah Pelanggan
    const pelangganNames = ['Budi Santoso', 'Siti Aminah', 'Andi Wijaya', 'Rina Pratama', 'Eko Saputra', 'Dewi Lestari', 'Joko Susilo', 'Maya Sari', 'Hendra Kusuma', 'Lusiana'];
    const pelangganIds: number[] = [];
    for (const nama of pelangganNames) {
      const id = await db.pelanggan.add({
        nama,
        no_hp: `0812${Math.floor(10000000 + Math.random() * 90000000)}`
      });
      pelangganIds.push(id as number);
    }

    // 2. Ambil Produk & User
    const produks = await db.produk.toArray();
    const owner = await db.users.where('role').equals('Owner').first();
    if (produks.length === 0 || !owner) {
      throw new Error('Pastikan sudah ada produk dan akun owner sebelum generate data.');
    }

    // 3. Generate Transaksi (Rentang 2 Tahun)
    const totalTransaksi = 60;
    for (let i = 0; i < totalTransaksi; i++) {
      // Buat tanggal acak dalam 24 bulan terakhir
      const randomDays = Math.floor(Math.random() * 730);
      const tanggal = subDays(new Date(), randomDays);
      
      const randomPelanggan = pelangganIds[Math.floor(Math.random() * pelangganIds.length)];
      
      // Pilih 1-3 produk acak per transaksi
      const itemsCount = Math.floor(Math.random() * 3) + 1;
      let subtotal = 0;
      const details: any[] = [];
      
      for (let j = 0; j < itemsCount; j++) {
        const produk = produks[Math.floor(Math.random() * produks.length)];
        const qty = Math.floor(Math.random() * 3) + 1;
        const itemTotal = produk.harga_jual * qty;
        subtotal += itemTotal;
        details.push({
          produk_id: produk.id,
          qty,
          harga: produk.harga_jual,
          total: itemTotal
        });
      }

      const idTrx = await db.transaksi.add({
        kode_transaksi: `TRX-${format(tanggal, 'yyyyMMdd')}-${Math.floor(1000 + Math.random() * 9000)}`,
        tanggal: tanggal,
        user_id: owner.id!,
        pelanggan_id: randomPelanggan,
        subtotal: subtotal,
        diskon: 0,
        total: subtotal,
        bayar: subtotal + 5000,
        kembalian: 5000,
        metode_bayar: Math.random() > 0.5 ? 'Tunai' : 'QRIS',
        status: 'Lunas'
      });

      // Tambahkan detailnya
      for (const d of details) {
        await db.transaksi_detail.add({
          ...d,
          transaksi_id: idTrx as number
        });
      }
    }

    // 4. Generate Biaya Operasional
    const biayaKategori = ['Listrik', 'Sewa Tempat', 'Internet', 'Gaji Bonus', 'Kebersihan'];
    for (let i = 0; i < 15; i++) {
      const randomDays = Math.floor(Math.random() * 730);
      const tanggal = subDays(new Date(), randomDays);
      await db.biaya_operasional.add({
        tanggal: tanggal,
        kategori: biayaKategori[Math.floor(Math.random() * biayaKategori.length)],
        nominal: Math.floor(Math.random() * 200000) + 10000,
        keterangan: 'Generate otomatis untuk testing',
        user_id: owner.id!
      });
    }

    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}
