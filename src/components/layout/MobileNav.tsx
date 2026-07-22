import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { 
  LayoutDashboard, ShoppingCart, Package, Users, Wallet, FileText, Settings, LogOut, Menu
} from 'lucide-react';
import { Sheet } from '@/components/ui/sheet';

export function MobileNav() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsSheetOpen(false);
  };

  const navItems = [
    { name: 'Home', path: '/', icon: LayoutDashboard, roles: ['Owner', 'Admin'] },
    { name: 'Kasir', path: '/kasir', icon: ShoppingCart, roles: ['Owner', 'Admin', 'Kasir'] },
    { name: 'Produk', path: '/produk', icon: Package, roles: ['Owner', 'Admin'] },
    { name: 'Pelanggan', path: '/pelanggan', icon: Users, roles: ['Owner', 'Admin', 'Kasir'] },
    { name: 'Biaya', path: '/biaya-operasional', icon: Wallet, roles: ['Owner', 'Admin', 'Kasir'] },
    { name: 'Laporan', path: '/laporan', icon: FileText, roles: ['Owner'] },
    { name: 'Pengaturan', path: '/setting', icon: Settings, roles: ['Owner'] },
  ];

  const allowedNav = navItems.filter(item => user && item.roles.includes(user.role));
  
  // Tampilkan maksimal 4 item di bar bawah, sisanya masukkan ke "Lainnya"
  const primaryNav = allowedNav.slice(0, 4);
  const secondaryNav = allowedNav.slice(4);

  return (
    <>
      <nav className="fixed bottom-0 w-full bg-background dark:bg-card border-t border-border z-50 md:hidden pb-safe print:hidden">
        <ul className="flex items-center justify-around h-16 px-2">
          {primaryNav.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path!}
                  className={({ isActive }) =>
                    `flex flex-col items-center justify-center w-16 h-full space-y-1 transition-colors ${
                      isActive ? 'text-primary' : 'text-muted-foreground'
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
          <li>
            <button
              onClick={() => setIsSheetOpen(true)}
              className={`flex flex-col items-center justify-center w-16 h-full space-y-1 transition-colors ${
                isSheetOpen ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <Menu className="w-5 h-5" />
              <span className="text-[10px] font-medium">Lainnya</span>
            </button>
          </li>
        </ul>
      </nav>

      {/* Side Menu / Bottom Sheet untuk item lainnya */}
      <Sheet 
        isOpen={isSheetOpen} 
        onClose={() => setIsSheetOpen(false)} 
        title="Menu Lainnya"
      >
        <div className="p-4 space-y-2">
          {secondaryNav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path!}
                onClick={() => setIsSheetOpen(false)}
                className={({ isActive }) =>
                  `flex items-center w-full p-4 rounded-xl transition-colors ${
                    isActive ? 'bg-primary/10 text-primary' : 'hover:bg-accent text-muted-foreground'
                  }`
                }
              >
                <Icon className="w-6 h-6 mr-4" />
                <span className="text-base font-semibold">{item.name}</span>
              </NavLink>
            );
          })}
          
          <div className="pt-4 mt-4 border-t border-border">
            <button
              onClick={handleLogout}
              className="flex items-center w-full p-4 rounded-xl text-red-500 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-6 h-6 mr-4" />
              <span className="text-base font-semibold">Keluar Aplikasi</span>
            </button>
          </div>
        </div>
      </Sheet>
    </>
  );
}
