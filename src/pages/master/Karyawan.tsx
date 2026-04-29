import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type User } from '@/db/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import bcrypt from 'bcryptjs';

export default function Karyawan() {
  const users = useLiveQuery(() => db.users.toArray());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Partial<User>>({
    username: '',
    role: 'Kasir',
    gaji_pokok: 0,
    tipe_komisi: 'persen',
    nominal_komisi: 0
  });
  const [password, setPassword] = useState('');

  const openModal = (u?: User) => {
    if (u) {
      setEditId(u.id!);
      setFormData({
        username: u.username,
        role: u.role,
        gaji_pokok: u.gaji_pokok || 0,
        tipe_komisi: u.tipe_komisi || 'persen',
        nominal_komisi: u.nominal_komisi || 0
      });
      setPassword('');
    } else {
      setEditId(null);
      setFormData({
        username: '',
        role: 'Kasir',
        gaji_pokok: 0,
        tipe_komisi: 'persen',
        nominal_komisi: 0
      });
      setPassword('');
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username) return;

    try {
      const dataToSave: any = { ...formData };
      
      // Hash password if provided
      if (password) {
        const salt = bcrypt.genSaltSync(10);
        dataToSave.password = bcrypt.hashSync(password, salt);
      } else if (!editId) {
        return alert('Password wajib diisi untuk karyawan baru!');
      }

      if (editId) {
        await db.users.update(editId, dataToSave);
      } else {
        const exist = await db.users.where('username').equalsIgnoreCase(formData.username!).first();
        if (exist) return alert('Username sudah dipakai!');
        await db.users.add(dataToSave);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error(error);
      alert('Gagal menyimpan data karyawan');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Yakin ingin menghapus karyawan ini?')) {
      const trxTerkait = await db.transaksi.where('user_id').equals(id).count();
      if (trxTerkait > 0) {
        alert('Tidak bisa dihapus karena karyawan ini memiliki riwayat transaksi! Anda hanya bisa menonaktifkannya (fitur segera).');
        return;
      }
      await db.users.delete(id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Data Karyawan</h1>
        <Button onClick={() => openModal()}>
          <Plus className="w-4 h-4 mr-2" /> Tambah Karyawan
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Karyawan & Skema Gaji</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Akses / Role</TableHead>
                <TableHead className="text-right">Gaji Pokok</TableHead>
                <TableHead className="text-right">Skema Komisi</TableHead>
                <TableHead className="w-[120px] text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users?.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.username}</TableCell>
                  <TableCell>{u.role}</TableCell>
                  <TableCell className="text-right text-blue-600 font-medium">
                    Rp {(u.gaji_pokok || 0).toLocaleString('id-ID')}
                  </TableCell>
                  <TableCell className="text-right">
                    {u.tipe_komisi === 'persen' 
                      ? `${u.nominal_komisi || 0}% per Omset`
                      : `Rp ${(u.nominal_komisi || 0).toLocaleString('id-ID')} per Trx`
                    }
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openModal(u)}>
                      <Edit2 className="w-4 h-4 text-blue-500" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(u.id!)} disabled={u.role === 'Owner'}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editId ? "Edit Karyawan" : "Tambah Karyawan"}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Username (Login)</label>
            <Input 
              value={formData.username} 
              onChange={(e) => setFormData({...formData, username: e.target.value})} 
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium">Password {editId && "(Kosongkan jika tidak ingin ganti)"}</label>
            <Input 
              type="password"
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
            />
          </div>
          <div>
            <label className="text-sm font-medium">Role Akses</label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value as any})}
              disabled={formData.role === 'Owner'} // Don't allow changing owner role easily
            >
              <option value="Kasir">Kasir (Hanya bisa transaksi)</option>
              <option value="Admin">Admin (Bisa kelola master data)</option>
              {formData.role === 'Owner' && <option value="Owner">Owner</option>}
            </select>
          </div>
          <div className="pt-4 border-t space-y-4">
            <h3 className="font-semibold text-sm">Pengaturan Gaji & Komisi</h3>
            <div>
              <label className="text-sm font-medium">Gaji Pokok Harian/Bulanan (Rp)</label>
              <Input 
                type="number"
                value={formData.gaji_pokok} 
                onChange={(e) => setFormData({...formData, gaji_pokok: Number(e.target.value)})} 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Tipe Komisi Penjualan</label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  value={formData.tipe_komisi}
                  onChange={(e) => setFormData({...formData, tipe_komisi: e.target.value as any})}
                >
                  <option value="persen">Persentase (%)</option>
                  <option value="nominal">Nominal Fix (Rp)</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">
                  {formData.tipe_komisi === 'persen' ? 'Besaran Persen (%)' : 'Besaran Rp / Transaksi'}
                </label>
                <Input 
                  type="number"
                  value={formData.nominal_komisi} 
                  onChange={(e) => setFormData({...formData, nominal_komisi: Number(e.target.value)})} 
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
            <Button type="submit">Simpan</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
