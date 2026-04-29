import Dexie, { type EntityTable } from 'dexie';
import bcrypt from 'bcryptjs';

export interface User {
  id?: number;
  username: string;
  password?: string; // Hashed
  role: 'Owner' | 'Admin' | 'Kasir';
  gaji_pokok?: number;
  tipe_komisi?: 'persen' | 'nominal';
  nominal_komisi?: number;
}

export interface Produk {
  id?: number;
  sku: string;
  barcode: string;
  nama: string;
  kategori_id: number;
  harga_jual: number;
  harga_modal: number;
  stok: number;
  tipe: 'barang' | 'jasa';
  kelola_stok: boolean;
}

export interface Kategori {
  id?: number;
  nama: string;
}

export interface Pelanggan {
  id?: number;
  nama: string;
  no_hp: string;
}

export interface Transaksi {
  id?: number;
  kode_transaksi: string;
  tanggal: Date;
  user_id: number;
  pelanggan_id?: number;
  subtotal: number;
  diskon: number;
  total: number;
  bayar: number;
  kembalian: number;
  metode_bayar: 'Tunai' | 'QRIS' | 'Bon' | 'Pelunasan Bon';
  status: 'Lunas' | 'Bon';
}

export interface TransaksiDetail {
  id?: number;
  transaksi_id: number;
  produk_id: number;
  qty: number;
  harga: number;
  total: number;
}

export interface StokMasuk {
  id?: number;
  produk_id: number;
  tanggal: Date;
  qty: number;
  harga_modal: number;
  keterangan: string;
}

export interface BiayaOperasional {
  id?: number;
  tanggal: Date;
  kategori: string;
  nominal: number;
  keterangan: string;
  user_id: number;
}

const db = new Dexie('POSDatabase') as Dexie & {
  users: EntityTable<User, 'id'>;
  produk: EntityTable<Produk, 'id'>;
  kategori: EntityTable<Kategori, 'id'>;
  pelanggan: EntityTable<Pelanggan, 'id'>;
  transaksi: EntityTable<Transaksi, 'id'>;
  transaksi_detail: EntityTable<TransaksiDetail, 'id'>;
  stok_masuk: EntityTable<StokMasuk, 'id'>;
  biaya_operasional: EntityTable<BiayaOperasional, 'id'>;
};

// Schema declaration
db.version(1).stores({
  users: '++id, username, role', // Don't index password
  produk: '++id, sku, barcode, nama, kategori_id, tipe, kelola_stok',
  kategori: '++id, nama',
  pelanggan: '++id, nama, no_hp',
  transaksi: '++id, kode_transaksi, tanggal, user_id, pelanggan_id, metode_bayar, status',
  transaksi_detail: '++id, transaksi_id, produk_id',
  stok_masuk: '++id, produk_id, tanggal'
});

db.version(2).stores({
  biaya_operasional: '++id, tanggal, kategori'
});

export const initDb = async () => {
  // Check if owner exists
  const ownerCount = await db.users.where('role').equals('Owner').count();
  if (ownerCount === 0) {
    // Seed Owner
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync('admin123', salt);
    await db.users.add({
      username: 'admin',
      password: hash,
      role: 'Owner'
    });
  }

  // Seed Categories if empty
  const katCount = await db.kategori.count();
  if (katCount === 0) {
    const makananId = await db.kategori.add({ nama: 'Makanan' });
    const minumanId = await db.kategori.add({ nama: 'Minuman' });

    // Seed Produk
    const produkCount = await db.produk.count();
    if (produkCount === 0) {
      await db.produk.bulkAdd([
        { sku: 'P001', barcode: '111', nama: 'Nasi Goreng', kategori_id: makananId as number, harga_modal: 10000, harga_jual: 15000, stok: 50, tipe: 'barang', kelola_stok: true },
        { sku: 'P002', barcode: '222', nama: 'Mie Goreng', kategori_id: makananId as number, harga_modal: 8000, harga_jual: 12000, stok: 30, tipe: 'barang', kelola_stok: true },
        { sku: 'P003', barcode: '333', nama: 'Es Teh Manis', kategori_id: minumanId as number, harga_modal: 2000, harga_jual: 5000, stok: 100, tipe: 'barang', kelola_stok: true },
        { sku: 'P004', barcode: '444', nama: 'Kopi Hitam', kategori_id: minumanId as number, harga_modal: 3000, harga_jual: 6000, stok: 0, tipe: 'barang', kelola_stok: false },
        { sku: 'J001', barcode: '555', nama: 'Ongkos Kirim', kategori_id: minumanId as number, harga_modal: 0, harga_jual: 10000, stok: 0, tipe: 'jasa', kelola_stok: false },
      ]);
    }
  }
};

export { db };
