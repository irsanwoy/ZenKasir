import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Tags, 
  Users, 
  Settings,
  LogOut,
  FileText,
  Wallet,
  UserCog,
  Landmark
} from 'lucide-react';
import { cn } from '@/utils/utils';

export function DesktopSidebar() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['Owner', 'Admin'] },
    { name: 'Kasir', path: '/kasir', icon: ShoppingCart, roles: ['Owner', 'Admin', 'Kasir'] },
    { name: 'Master Produk', path: '/produk', icon: Package, roles: ['Owner', 'Admin'] },
    { name: 'Master Kategori', path: '/kategori', icon: Tags, roles: ['Owner', 'Admin'] },
    { name: 'Pelanggan', path: '/pelanggan', icon: Users, roles: ['Owner', 'Admin', 'Kasir'] },
    { name: 'Biaya Operasional', path: '/biaya-operasional', icon: Wallet, roles: ['Owner', 'Admin', 'Kasir'] },
    { name: 'Karyawan', path: '/karyawan', icon: UserCog, roles: ['Owner'] },
    { name: 'Laporan Penjualan', path: '/laporan', icon: FileText, roles: ['Owner'] },
    { name: 'Laporan Gaji', path: '/laporan-gaji', icon: Landmark, roles: ['Owner'] },
    { name: 'Pengaturan', path: '/setting', icon: Settings, roles: ['Owner'] },
  ];

  const allowedNav = navItems.filter(item => user && item.roles.includes(user.role));

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r shadow-sm shrink-0 h-screen sticky top-0">
      <div className="flex items-center justify-between h-16 px-6 border-b shrink-0">
        <span className="text-xl font-bold text-primary">POS Universal</span>
      </div>

      <div className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {allowedNav.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors",
                isActive 
                  ? "bg-primary/10 text-primary" 
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <Icon className={cn("w-5 h-5 mr-3", isActive ? "text-primary" : "text-gray-500")} />
              {item.name}
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t shrink-0">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
            {user?.username.charAt(0).toUpperCase()}
          </div>
          <div className="ml-3 overflow-hidden">
            <p className="text-sm font-medium text-gray-700 truncate">{user?.username}</p>
            <p className="text-xs text-gray-500">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-3 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Keluar
        </button>
      </div>
    </aside>
  );
}
