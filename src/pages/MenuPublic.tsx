import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/db';
import { useSettingStore } from '@/store/useSettingStore';
import { Card, CardContent } from '@/components/ui/card';

export default function MenuPublic() {
  const { settings } = useSettingStore();
  const [activeKategori, setActiveKategori] = useState<number | 'all'>('all');

  const kategoris = useLiveQuery(() => db.kategori.toArray());
  
  const produks = useLiveQuery(async () => {
    let p = await db.produk.toArray();
    if (activeKategori !== 'all') {
      p = p.filter(item => item.kategori_id === activeKategori);
    }
    return p;
  }, [activeKategori]);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-primary text-primary-foreground p-6 rounded-b-3xl shadow-lg mb-6 sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-center">{settings.nama_toko}</h1>
        <p className="text-center opacity-90 text-sm mt-1">Daftar Menu & Layanan</p>
      </div>

      <div className="px-4 space-y-6 max-w-md mx-auto">
        {produks?.length === 0 && (
          <div className="text-center p-8 bg-white rounded-xl shadow-sm border text-red-500">
            <p className="font-bold">Data Menu Kosong!</p>
            <p className="text-sm mt-2 text-muted-foreground">
              Perhatian: Karena sistem menggunakan database lokal (Offline), menu hanya tampil di perangkat utama kasir atau jika aplikasi sudah terhubung ke Cloud.
            </p>
          </div>
        )}

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setActiveKategori('all')}
            className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${
              activeKategori === 'all' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-white text-gray-600 border'
            }`}
          >
            Semua Menu
          </button>
          {kategoris?.map(k => (
            <button
              key={k.id}
              onClick={() => setActiveKategori(k.id!)}
              className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${
                activeKategori === k.id 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-white text-gray-600 border'
              }`}
            >
              {k.nama}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {produks?.map(p => (
            <Card key={p.id} className="overflow-hidden border-none shadow-sm">
              <CardContent className="p-4 flex justify-between items-center bg-white">
                <div>
                  <h3 className="font-bold text-gray-800">{p.nama}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {p.kelola_stok ? (p.stok > 0 ? `Tersedia` : 'Habis') : 'Tersedia'}
                  </p>
                </div>
                <div className="text-primary font-bold">
                  Rp {p.harga_jual.toLocaleString('id-ID')}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
