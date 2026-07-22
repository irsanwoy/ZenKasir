import React from 'react';
import { useSettingStore } from '@/store/useSettingStore';

interface StrukItem {
  nama: string;
  qty: number;
  harga: number;
  subtotal: number;
}

interface StrukPrintProps {
  transaksi: {
    kode: string;
    tanggal: Date;
    kasir: string;
    items: StrukItem[];
    subtotal: number;
    total: number;
    bayar: number;
    kembalian: number;
    metode_bayar: string;
  };
}

export const StrukPrint = React.forwardRef<HTMLDivElement, StrukPrintProps>(
  ({ transaksi }, ref) => {
    const { settings } = useSettingStore();
    const { items, kode, tanggal, kasir, subtotal, total, bayar, kembalian, metode_bayar } = transaksi;

    return (
      <div ref={ref} className="hidden print:block font-mono text-[12px] leading-tight text-black print:w-full print:px-3 print:py-2 mx-auto bg-white">
        <div className="text-center mb-4">
          <h2 className="font-bold text-[14px]">{settings.nama_toko}</h2>
          <p>{settings.alamat}</p>
          <p>{settings.no_hp}</p>
        </div>

        <div className="border-b border-black border-dashed mb-2 pb-2">
          <p>No   : {kode}</p>
          <p>Tgl  : {tanggal.toLocaleString('id-ID')}</p>
          <p>Ksr  : {kasir}</p>
        </div>

        <div className="mb-2">
          {items.map((item, idx) => (
            <div key={idx} className="mb-1">
              <p>{item.nama}</p>
              <div className="flex justify-between">
                <span>{item.qty} x {item.harga.toLocaleString('id-ID')}</span>
                <span>{item.subtotal.toLocaleString('id-ID')}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-black border-dashed pt-2 mb-4">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{subtotal.toLocaleString('id-ID')}</span>
          </div>

          <div className="flex justify-between font-bold text-[14px] mt-1">
            <span>Total:</span>
            <span>{total.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between mt-1">
            <span>Bayar ({metode_bayar}):</span>
            <span>{bayar.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between">
            <span>Kembali:</span>
            <span>{kembalian.toLocaleString('id-ID')}</span>
          </div>
        </div>

        <div className="text-center mt-4">
          <p>{settings.footer_struk}</p>
        </div>
      </div>
    );
  }
);

StrukPrint.displayName = 'StrukPrint';
