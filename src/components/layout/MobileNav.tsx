import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { FiHome, FiBox, FiBarChart, FiMenu, FiX } from 'react-icons/fi';
import { useAuthStore } from '@/store/useAuthStore';
import { useState } from 'react';
import { 
  LayoutDashboard, ShoppingCart, Package, Tags, Users, Wallet, FileText, Settings, LogOut 
} from 'lucide-react';
import { cn } from '@/utils/utils';

export function MobileNav() {
  const { user, logout } = useAuthStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const fullNavItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['Owner', 'Admin'] },
    { name: 'Kasir', path: '/kasir', icon: ShoppingCart, roles: ['Owner', 'Admin', 'Kasir'] },
    { name: 'Master Produk', path: '/produk', icon: Package, roles: ['Owner', 'Admin'] },
    { name: 'Master Kategori', path: '/kategori', icon: Tags, roles: ['Owner', 'Admin'] },
    { name: 'Pelanggan', path: '/pelanggan', icon: Users, roles: ['Owner', 'Admin', 'Kasir'] },
    { name: 'Biaya Operasional', path: '/biaya-operasional', icon: Wallet, roles: ['Owner', 'Admin', 'Kasir'] },
    { name: 'Laporan Penjualan', path: '/laporan', icon: FileText, roles: ['Owner'] },
    { name: 'Pengaturan', path: '/setting', icon: Settings, roles: ['Owner'] },
  ];

  const bottomNavItems = [
    { name: 'Kasir', path: '/kasir', icon: FiHome, roles: ['Owner', 'Admin', 'Kasir'] },
    { name: 'Produk', path: '/produk', icon: FiBox, roles: ['Owner', 'Admin'] },
    { name: 'Laporan', path: '/laporan', icon: FiBarChart, roles: ['Owner'] },
    { name: 'Menu', action: 'menu', icon: FiMenu, roles: ['Owner', 'Admin', 'Kasir'] },
  ];

  const allowedBottomNav = bottomNavItems.filter(item => user && item.roles.includes(user.role));
  const allowedFullNav = fullNavItems.filter(item => user && item.roles.includes(user.role));

  return (
    <>
      <nav className="fixed bottom-0 w-full bg-background dark:bg-card border-t border-border z-50 md:hidden pb-safe">
        <ul className="flex items-center justify-around h-16">
          {allowedBottomNav.map((item) => {
            const Icon = item.icon;
            if (item.action === 'menu') {
              return (
                <li key={item.name} className="flex-1">
                  <button
                    onClick={() => setIsMenuOpen(true)}
                    className="flex flex-col items-center justify-center w-full h-full space-y-1 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-[10px] font-medium">{item.name}</span>
                  </button>
                </li>
              );
            }

            return (
              <li key={item.path} className="flex-1">
                <NavLink
                  to={item.path!}
                  className={({ isActive }) =>
                    `flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                      isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : ''}`} />
                      <span className={`text-[10px] ${isActive ? 'font-bold' : 'font-medium'}`}>
                        {item.name}
                      </span>
                    </>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Full Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[60] bg-background dark:bg-card flex flex-col h-full md:hidden">
          <div className="flex justify-between items-center p-4 border-b">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold mr-3">
                {user?.username.charAt(0).toUpperCase()}
              </div>
              <span className="font-bold text-foreground">{user?.username} <span className="text-xs text-muted-foreground">({user?.role})</span></span>
            </div>
            <button onClick={() => setIsMenuOpen(false)} className="p-2">
              <FiX className="w-6 h-6 text-muted-foreground hover:text-foreground" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-1">
            {allowedFullNav.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setIsMenuOpen(false);
                  }}
                  className={cn(
                    "flex items-center w-full px-4 py-3 text-sm font-medium rounded-xl transition-colors",
                    isActive 
                      ? "bg-primary/10 text-primary" 
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Icon className={cn("w-5 h-5 mr-4", isActive ? "text-primary" : "text-muted-foreground")} />
                  {item.name}
                </button>
              );
            })}
          </div>

          <div className="p-4 border-t">
            <button
              onClick={handleLogout}
              className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Keluar Akun
            </button>
          </div>
        </div>
      )}
    </>
  );
}
