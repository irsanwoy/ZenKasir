import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLicenseStore } from '@/store/useLicenseStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck, KeyRound, AlertCircle } from 'lucide-react';

export default function Aktivasi() {
  const navigate = useNavigate();
  const { activate, isActivated, deviceId } = useLicenseStore();
  const [licenseKey, setLicenseKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Jika sudah aktif, langsung redirect
  if (isActivated) {
    navigate('/login');
    return null;
  }

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!licenseKey.trim()) {
      setError('Kode lisensi tidak boleh kosong');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);

    const result = await activate(licenseKey.trim());
    
    if (result.success) {
      setSuccessMsg(result.message);
      // Tunggu sebentar biar user bisa baca pesan sukses
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } else {
      setError(result.message);
    }
    
    setIsLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50/50 p-4">
      <Card className="w-full max-w-md shadow-lg border-primary/10">
        <CardHeader className="space-y-3 items-center text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center overflow-hidden">
            <img src="/logo.png" alt="ZenKasir Logo" className="w-full h-full object-cover" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold tracking-tight">Aktivasi ZenKasir</CardTitle>
            <CardDescription>
              Masukkan kode lisensi untuk mulai menggunakan ZenKasir. Pastikan perangkat Anda terhubung ke internet.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleActivate} className="space-y-4">
            {error && (
              <div className="p-3 text-sm flex items-start text-red-600 bg-red-50 rounded-md border border-red-200">
                <AlertCircle className="w-5 h-5 mr-2 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {successMsg && (
              <div className="p-3 text-sm flex items-start text-green-600 bg-green-50 rounded-md border border-green-200">
                <ShieldCheck className="w-5 h-5 mr-2 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">Kode Lisensi</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <KeyRound className="h-4 w-4 text-gray-400" />
                </div>
                <Input
                  type="text"
                  placeholder="Contoh: ZEN-XXXX-YYYY"
                  value={licenseKey}
                  onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
                  className="pl-10"
                  disabled={isLoading || !!successMsg}
                />
              </div>
            </div>
            
            <Button type="submit" className="w-full" disabled={isLoading || !!successMsg}>
              {isLoading ? "Memvalidasi Lisensi..." : "Aktivasi Sekarang"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col border-t p-4 bg-muted/20 text-center">
          <p className="text-xs text-muted-foreground mb-1">
            Sistem membutuhkan internet (1x) untuk proses validasi.
          </p>
          <p className="text-[10px] text-gray-400 font-mono">
            Device ID: {deviceId || 'Akan dibuat saat aktivasi'}
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
