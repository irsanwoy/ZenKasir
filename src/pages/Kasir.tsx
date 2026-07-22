import { useState, useRef, useEffect } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/db';
import { useAuthStore } from '@/store/useAuthStore';
import { useCartStore } from '@/store/useCartStore';
import { useSettingStore } from '@/store/useSettingStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Search, Plus, Minus, Printer, ShoppingCart, ScanLine, X, FlipHorizontal } from 'lucide-react';
import { StrukPrint } from '@/components/StrukPrint';
import { Sheet } from '@/components/ui/sheet';
import { Modal } from '@/components/ui/modal';
import { formatRupiah, parseRupiah } from '@/utils/utils';

let audioCtx: AudioContext | null = null;
const playBeep = () => {
  try {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) audioCtx = new AudioContext();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    if (audioCtx) {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
      osc.stop(audioCtx.currentTime + 0.1);
    }
    
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  } catch (e) {
    // Abaikan jika tidak didukung
  }
};

export default function Kasir() {
  const { user } = useAuthStore();
  const { items, addItem, updateQty, removeItem, pelanggan_id, setPelanggan, clearCart, getTotal } = useCartStore();
  const { settings } = useSettingStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [bayar, setBayar] = useState(0);
  const [metodeBayar, setMetodeBayar] = useState<'Tunai' | 'QRIS' | 'Bon'>('Tunai');
  const [transaksiSelesai, setTransaksiSelesai] = useState<any>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isAddPelangganOpen, setIsAddPelangganOpen] = useState(false);
  const [newPelangganName, setNewPelangganName] = useState('');

  useEffect(() => {
    let html5QrCode: Html5Qrcode | null = null;
    
    if (isScanning) {
      html5QrCode = new Html5Qrcode("kasir-reader", {
        verbose: false,
        formatsToSupport: [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
        ]
      });
      
      const onScanSuccess = async (decodedText: string) => {
        if (html5QrCode?.isScanning) {
          html5QrCode.stop().then(() => {
            html5QrCode?.clear();
            setIsScanning(false);
          }).catch(console.error);
        }
        
        const match = await db.produk.where('barcode').equals(decodedText).first();
        if (match) {
          handleAddProduct(match);
          setTimeout(() => searchInputRef.current?.focus(), 50);
        } else {
          setToastMessage('Produk tidak ditemukan');
          setTimeout(() => setToastMessage(''), 3000);
          setTimeout(() => searchInputRef.current?.focus(), 50);
        }
      };

      html5QrCode.start(
        { facingMode: facingMode },
        { fps: 10, qrbox: { width: 300, height: 150 } },
        onScanSuccess,
        undefined
      ).catch((err) => {
        console.error("Camera start error", err);
        setToastMessage('Gagal membuka kamera / Izin ditolak');
        setTimeout(() => setToastMessage(''), 3000);
        setIsScanning(false);
      });
    }

    return () => {
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().then(() => html5QrCode?.clear()).catch(console.error);
      } else if (html5QrCode) {
        html5QrCode.clear();
      }
    };
  }, [isScanning, facingMode]);

  const printRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const produks = useLiveQuery(
    () => {
      if (!searchTerm) return db.produk.limit(10).toArray();
      return db.produk
        .filter(p => p.nama.toLowerCase().includes(searchTerm.toLowerCase()) || p.barcode === searchTerm)
        .limit(10)
        .toArray();
    },
    [searchTerm]
  );

  const pelanggans = useLiveQuery(() => db.pelanggan.toArray(), []);

  const total = getTotal();
  const kembalian = Math.max(0, bayar - total);

  const handleAddProduct = (p: any) => {
    const currentItems = useCartStore.getState().items;
    if (p.kelola_stok && p.stok <= 0) {
      alert('Stok habis!');
      return;
    }
    const currentItem = currentItems.find(i => i.produk_id === p.id);
    if (p.kelola_stok && currentItem && currentItem.qty >= p.stok) {
      alert('Stok tidak mencukupi!');
      return;
    }
    
    addItem({
      produk_id: p.id,
      nama: p.nama,
      harga: p.harga_jual,
      qty: 1,
      stok: p.stok,
      kelola_stok: p.kelola_stok
    });
    
    playBeep();
  };

  const handleSearchKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchTerm) {
      const match = await db.produk.where('barcode').equals(searchTerm).first();
      if (match) {
        handleAddProduct(match);
        setSearchTerm('');
        setTimeout(() => searchInputRef.current?.focus(), 50);
      } else {
        const matchName = await db.produk.filter(p => p.nama.toLowerCase() === searchTerm.toLowerCase()).first();
        if (matchName) {
          handleAddProduct(matchName);
          setSearchTerm('');
          setTimeout(() => searchInputRef.current?.focus(), 50);
        } else {
          setToastMessage('Produk tidak ditemukan');
          setTimeout(() => setToastMessage(''), 3000);
          setSearchTerm('');
          setTimeout(() => searchInputRef.current?.focus(), 50);
        }
      }
    }
  };

  const handleCheckout = async () => {
    if (items.length === 0) return alert('Keranjang kosong');
    if (metodeBayar === 'Bon' && !pelanggan_id) {
      alert('Pilih atau Tambah pelanggan untuk pembayaran Bon');
      return;
    }
    if (metodeBayar === 'Tunai' && bayar < total) return alert('Uang bayar kurang');

    try {
      const kode_transaksi = `TRX-${Date.now()}`;
      const now = new Date();

      // Start transaction
      await db.transaction('rw', db.transaksi, db.transaksi_detail, db.produk, async () => {
        // 1. Insert Transaksi
        const trxId = await db.transaksi.add({
          kode_transaksi,
          tanggal: now,
          user_id: user!.id,
          pelanggan_id: pelanggan_id || undefined,
          subtotal: items.reduce((sum, i) => sum + i.subtotal, 0),
          diskon: 0,
          total,
          bayar: metodeBayar === 'QRIS' ? total : (metodeBayar === 'Bon' ? 0 : bayar),
          kembalian: metodeBayar === 'QRIS' ? 0 : (metodeBayar === 'Bon' ? 0 : kembalian),
          metode_bayar: metodeBayar,
          status: metodeBayar === 'Bon' ? 'Bon' : 'Lunas'
        });

        // 2. Insert Transaksi Detail & Update Stok
        const details = items.map(item => ({
          transaksi_id: trxId as number,
          produk_id: item.produk_id,
          qty: item.qty,
          harga: item.harga,
          total: item.subtotal
        }));
        await db.transaksi_detail.bulkAdd(details);

        for (const item of items) {
          if (item.kelola_stok) {
            const prod = await db.produk.get(item.produk_id);
            if (prod) {
              await db.produk.update(prod.id!, { stok: prod.stok - item.qty });
            }
          }
        }

        // Set state for printing
        setTransaksiSelesai({
          kode: kode_transaksi,
          tanggal: now,
          kasir: user!.username,
          items: items.map(i => ({ nama: i.nama, qty: i.qty, harga: i.harga, subtotal: i.subtotal })),
          subtotal: items.reduce((sum, i) => sum + i.subtotal, 0),
          total,
          bayar: metodeBayar === 'QRIS' ? total : (metodeBayar === 'Bon' ? 0 : bayar),
          kembalian: metodeBayar === 'QRIS' ? 0 : (metodeBayar === 'Bon' ? 0 : kembalian),
          metode_bayar: metodeBayar
        });
        
        clearCart();
        setBayar(0);
        setSearchTerm('');
      });
    } catch (error) {
      console.error(error);
      alert('Terjadi kesalahan saat checkout');
    }
  };

  const handlePrint = () => {
    window.print();
    setTransaksiSelesai(null);
  };

  // If transaction completed, show receipt overlay
  if (transaksiSelesai) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4 print:block print:h-auto">
        <div className="hidden print:block">
          <StrukPrint transaksi={transaksiSelesai} ref={printRef} />
        </div>
        <div className="print:hidden bg-card p-8 rounded-xl shadow text-center space-y-4">
          <h2 className="text-2xl font-bold text-green-600">Transaksi Berhasil!</h2>
          <p>Kembalian: <span className="font-bold text-xl">Rp {transaksiSelesai.kembalian.toLocaleString('id-ID')}</span></p>
          <div className="flex gap-4 justify-center">
            <Button onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" /> Print Struk
            </Button>
            <Button variant="outline" onClick={() => setTransaksiSelesai(null)}>
              Transaksi Baru
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const totalItems = items.reduce((sum, i) => sum + i.qty, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full print:hidden relative">
      {/* Floating Cart Button (Mobile Only) */}
      <div className="lg:hidden fixed bottom-20 right-4 z-40">
        <Button 
          size="icon" 
          className="h-14 w-14 rounded-full shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90"
          onClick={() => setIsCartOpen(true)}
        >
          <ShoppingCart className="h-6 w-6 text-white" />
          {totalItems > 0 && (
            <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-white">
              {totalItems}
            </span>
          )}
        </Button>
      </div>

      {/* Left side: Product Search & List */}
      <Card className="lg:col-span-2 flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-10rem)]">
        <CardHeader className="pb-3 shrink-0">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                ref={searchInputRef}
                placeholder="Cari produk / Scan barcode lalu Enter..." 
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                autoFocus
              />
            </div>
            <Button variant="outline" size="icon" onClick={() => setIsScanning(!isScanning)} title="Scan via Kamera">
              <ScanLine className="h-4 w-4" />
            </Button>
          </div>
          {isScanning && (
            <div className="relative w-full mt-2 border rounded-md overflow-hidden bg-black max-w-sm mx-auto">
              <div className="absolute top-2 right-2 z-10 flex gap-2">
                <Button 
                  size="icon" 
                  variant="secondary" 
                  className="rounded-full bg-black/50 text-white hover:bg-black/70 w-8 h-8"
                  onClick={(e) => { e.preventDefault(); setFacingMode(prev => prev === 'environment' ? 'user' : 'environment'); }}
                  title="Tukar Kamera"
                >
                  <FlipHorizontal className="h-4 w-4" />
                </Button>
                <Button 
                  size="icon" 
                  variant="destructive" 
                  className="rounded-full w-8 h-8"
                  onClick={(e) => { e.preventDefault(); setIsScanning(false); }}
                  title="Tutup Scanner"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div id="kasir-reader" className="w-full min-h-[250px] bg-black"></div>
            </div>
          )}
        </CardHeader>
        <CardContent className="flex-1 overflow-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {produks?.map(p => (
              <div 
                key={p.id} 
                className="border rounded-lg overflow-hidden flex flex-col bg-card"
              >
                <div className="aspect-square bg-muted/50 flex items-center justify-center w-full border-b">
                  {(p as any).gambar ? (
                    <img src={(p as any).gambar} alt={p.nama} className="w-full h-full object-cover" />
                  ) : (
                    <ShoppingCart className="w-12 h-12 text-gray-200" />
                  )}
                </div>
                <div className="p-3 flex-1 flex flex-col">
                  <div className="font-semibold text-sm truncate">{p.nama}</div>
                  <div className="text-primary font-bold text-sm mt-1">Rp {p.harga_jual.toLocaleString('id-ID')}</div>
                  <div className="text-xs text-muted-foreground mt-1 mb-3">
                    Stok: {p.kelola_stok ? p.stok : '∞'}
                  </div>
                  <div className="mt-auto">
                    <Button 
                      className="w-full h-8 text-xs" 
                      onClick={() => handleAddProduct(p)}
                      disabled={p.kelola_stok && p.stok <= 0}
                    >
                      {p.kelola_stok && p.stok <= 0 ? 'Habis' : '+ Keranjang'}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Right side: Cart & Checkout */}
      <Sheet isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} title="Keranjang Belanja" isDesktopStatic>
        <Card className="flex flex-col h-full border-0 lg:border lg:h-[calc(100vh-10rem)] rounded-none lg:rounded-xl shadow-none lg:shadow-sm">
          <CardHeader className="hidden lg:flex pb-3 shrink-0 border-b">
            <CardTitle>Keranjang</CardTitle>
          </CardHeader>
        <CardContent className="flex-1 overflow-auto p-0">
          <Table>
            <TableBody>
              {items.map(item => (
                <TableRow key={item.produk_id}>
                  <TableCell className="p-3">
                    <div className="font-medium text-sm">{item.nama}</div>
                    <div className="text-xs text-muted-foreground">Rp {item.harga.toLocaleString('id-ID')}</div>
                  </TableCell>
                  <TableCell className="p-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Button variant="outline" size="icon" className="h-6 w-6" 
                        onClick={() => {
                          if (item.qty > 1) updateQty(item.produk_id, item.qty - 1);
                          else removeItem(item.produk_id);
                        }}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="text-sm font-medium w-4 text-center">{item.qty}</span>
                      <Button variant="outline" size="icon" className="h-6 w-6"
                        onClick={() => {
                          if (item.kelola_stok && item.qty >= item.stok) return alert('Stok tidak cukup');
                          updateQty(item.produk_id, item.qty + 1);
                        }}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="p-3 text-right text-sm font-medium">
                    {item.subtotal.toLocaleString('id-ID')}
                  </TableCell>
                </TableRow>
              ))}
              {items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                    Belum ada produk
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        <div className="shrink-0 border-t p-4 pb-24 lg:pb-4 bg-muted/30 space-y-3 overflow-y-auto max-h-[60vh] lg:max-h-none">

          <div className="flex justify-between items-center font-bold text-lg">
            <span>Total</span>
            <span className="text-primary">Rp {total.toLocaleString('id-ID')}</span>
          </div>

          <div className="space-y-2 pt-2">
            <Label>Metode Pembayaran</Label>
            <div className="flex gap-2">
              {['Tunai', 'QRIS', 'Bon'].map(m => (
                <Button 
                  key={m} 
                  variant={metodeBayar === m ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    setMetodeBayar(m as any);
                    if (m === 'Bon' && !pelanggan_id) {
                      // Optional: focus or prompt
                    }
                  }}
                >
                  {m}
                </Button>
              ))}
            </div>
          </div>

          {metodeBayar === 'Bon' && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Pelanggan (Wajib)</Label>
                <Button 
                  variant="link" 
                  size="sm" 
                  className="h-auto p-0 text-xs"
                  onClick={() => setIsAddPelangganOpen(true)}
                >
                  + Pelanggan Baru
                </Button>
              </div>
              <select 
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                value={pelanggan_id || ''}
                onChange={(e) => setPelanggan(Number(e.target.value))}
              >
                <option value="">Pilih Pelanggan...</option>
                {pelanggans?.map(p => (
                  <option key={p.id} value={p.id}>{p.nama}</option>
                ))}
              </select>
            </div>
          )}

          {metodeBayar === 'Tunai' && (
            <div className="space-y-2 pt-2 border-t border-dashed">
              <div className="flex justify-between items-center text-sm">
                <span>Bayar</span>
                <Input 
                  type="text" 
                  className="w-32 h-8 text-right font-medium" 
                  value={formatRupiah(bayar)} 
                  onChange={(e) => setBayar(parseRupiah(e.target.value))} 
                />
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>Kembali</span>
                <span className="font-bold">Rp {kembalian.toLocaleString('id-ID')}</span>
              </div>
            </div>
          )}

          {metodeBayar === 'QRIS' && (
            <div className="space-y-2 pt-2 border-t border-dashed text-center">
              {settings.qris_image ? (
                <div className="py-2">
                  <img src={settings.qris_image} alt="QRIS" className="w-48 h-48 mx-auto object-contain bg-white dark:bg-gray-100 p-2 rounded-xl shadow-sm border border-gray-100" />
                  <p className="font-bold text-xl mt-3 text-primary">Rp {total.toLocaleString('id-ID')}</p>
                </div>
              ) : (
                <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-200 mt-2 text-left">
                  ⚠️ QRIS belum di-setting. Silakan upload gambar QRIS di menu Pengaturan Toko.
                </div>
              )}
            </div>
          )}

          <Button 
            className="w-full h-12 text-lg font-bold mt-4" 
            onClick={handleCheckout}
            disabled={items.length === 0 || (metodeBayar === 'QRIS' && !settings.qris_image)}
          >
            {metodeBayar === 'QRIS' ? 'Konfirmasi Sudah Dibayar' : 'Bayar'}
          </Button>
        </div>
        </Card>
      </Sheet>

      {/* Modal Tambah Pelanggan Cepat */}
      <Modal 
        isOpen={isAddPelangganOpen} 
        onClose={() => setIsAddPelangganOpen(false)} 
        title="Tambah Pelanggan Baru"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nama Pelanggan</Label>
            <Input 
              value={newPelangganName}
              onChange={(e) => setNewPelangganName(e.target.value)}
              placeholder="Masukkan nama..."
              autoFocus
            />
          </div>
          <Button 
            className="w-full"
            onClick={async () => {
              if (!newPelangganName.trim()) return;
              const id = await db.pelanggan.add({ nama: newPelangganName, no_hp: '' });
              setPelanggan(id as number);
              setNewPelangganName('');
              setIsAddPelangganOpen(false);
            }}
          >
            Simpan & Pilih
          </Button>
        </div>
      </Modal>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded-full shadow-lg font-medium z-50 animate-in fade-in slide-in-from-top-4">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
