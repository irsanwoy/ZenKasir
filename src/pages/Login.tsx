import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import bcrypt from 'bcryptjs';
import { db } from '@/db/db';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Store, KeyRound, ShieldAlert } from 'lucide-react';
import { useLicenseStore } from '@/store/useLicenseStore';
import { Modal } from '@/components/ui/modal';

const loginSchema = z.object({
  username: z.string().min(3, { message: "Username minimal 3 karakter" }),
  password: z.string().min(6, { message: "Password minimal 6 karakter" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const { licenseKey } = useLicenseStore();
  const [error, setError] = useState<string | null>(null);

  // State untuk Reset Password
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [resetForm, setResetForm] = useState({ key: '', newPass: '', confirmPass: '' });
  const [resetStatus, setResetStatus] = useState({ type: '', message: '' });

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetStatus({ type: '', message: '' });

    // 1. Verifikasi Lisensi
    if (resetForm.key.toUpperCase() !== licenseKey?.toUpperCase()) {
      setResetStatus({ type: 'error', message: 'Kode Lisensi salah atau tidak sesuai!' });
      return;
    }

    // 2. Validasi Password
    if (resetForm.newPass.length < 6) {
      setResetStatus({ type: 'error', message: 'Password minimal 6 karakter!' });
      return;
    }
    if (resetForm.newPass !== resetForm.confirmPass) {
      setResetStatus({ type: 'error', message: 'Konfirmasi password tidak cocok!' });
      return;
    }

    try {
      // 3. Update Owner Password di DB
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync(resetForm.newPass, salt);
      
      const owner = await db.users.where('role').equals('Owner').first();
      if (owner?.id) {
        await db.users.update(owner.id, { password: hash });
        setResetStatus({ type: 'success', message: 'Password berhasil direset! Silakan login.' });
        setTimeout(() => setIsResetOpen(false), 2000);
      } else {
        setResetStatus({ type: 'error', message: 'Data Owner tidak ditemukan.' });
      }
    } catch (err) {
      setResetStatus({ type: 'error', message: 'Gagal mereset password.' });
    }
  };

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setError(null);
      const user = await db.users.where('username').equals(data.username).first();
      
      if (!user || !user.password) {
        setError('Username atau password salah');
        return;
      }

      const isValid = bcrypt.compareSync(data.password, user.password);
      if (!isValid) {
        setError('Username atau password salah');
        return;
      }

      login({
        id: user.id!,
        username: user.username,
        role: user.role
      });
      
      navigate('/');
    } catch (err) {
      console.error(err);
      setError('Terjadi kesalahan saat login');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50/50 p-4">
      <Card className="w-full max-w-md shadow-lg border-primary/10">
        <CardHeader className="space-y-3 items-center text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center overflow-hidden">
            <img src="/logo.png" alt="ZenKasir Logo" className="w-full h-full object-cover" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold tracking-tight">Login ZenKasir</CardTitle>
            <CardDescription>
              Masuk ke sistem kasir menggunakan akun Anda.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md border border-red-200">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="admin"
                {...register("username")}
                className={errors.username ? "border-red-500 focus-visible:ring-red-500" : ""}
              />
              {errors.username && (
                <p className="text-sm text-red-500">{errors.username.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <button 
                  type="button" 
                  onClick={() => setIsResetOpen(true)}
                  className="text-xs text-primary hover:underline font-medium"
                >
                  Lupa Sandi?
                </button>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="******"
                {...register("password")}
                className={errors.password ? "border-red-500 focus-visible:ring-red-500" : ""}
              />
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Loading..." : "Masuk"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center border-t p-4 bg-muted/20">
          <p className="text-xs text-muted-foreground">
            ZenKasir v1.0 - Smart & Peaceful POS
          </p>
        </CardFooter>
      </Card>

      {/* Modal Reset Password */}
      <Modal 
        isOpen={isResetOpen} 
        onClose={() => setIsResetOpen(false)} 
        title="Reset Password Owner"
      >
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-md flex items-start gap-3">
            <KeyRound className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700 leading-relaxed">
              Sebagai fitur keamanan, Anda wajib memasukkan <strong>Kode Lisensi</strong> asli yang Anda gunakan saat aktivasi aplikasi ini untuk mereset password.
            </p>
          </div>

          {resetStatus.message && (
            <div className={`p-3 text-sm rounded-md border flex items-start gap-2 ${
              resetStatus.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{resetStatus.message}</span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="license_key">Kode Lisensi</Label>
            <Input 
              id="license_key"
              placeholder="ZEN-XXXX-XXXX-XXXX"
              value={resetForm.key}
              onChange={(e) => setResetForm({...resetForm, key: e.target.value.toUpperCase()})}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reset_pass">Password Baru</Label>
              <Input 
                id="reset_pass"
                type="password"
                placeholder="Min. 6 karakter"
                value={resetForm.newPass}
                onChange={(e) => setResetForm({...resetForm, newPass: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm_reset">Konfirmasi</Label>
              <Input 
                id="confirm_reset"
                type="password"
                placeholder="Ulangi password"
                value={resetForm.confirmPass}
                onChange={(e) => setResetForm({...resetForm, confirmPass: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="pt-2 flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setIsResetOpen(false)}>
              Batal
            </Button>
            <Button type="submit" className="flex-1">
              Reset Password
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
