import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { FiHome, FiBox, FiBarChart, FiMenu, FiX } from 'react-icons/fi';
import { useAuthStore } from '@/store/useAuthStore';
import { useState } from 'react';
import { 
  LayoutDashboard, ShoppingCart, Package, Users, Wallet, FileText, Settings, LogOut 
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

  const navItems = [
    { name: 'Home', path: '/', icon: LayoutDashboard, roles: ['Owner', 'Admin'] },
    { name: 'Kasir', path: '/kasir', icon: ShoppingCart, roles: ['Owner', 'Admin', 'Kasir'] },
    { name: 'Produk', path: '/produk', icon: Package, roles: ['Owner', 'Admin'] },
    { name: 'Pelanggan', path: '/pelanggan', icon: Users, roles: ['Owner', 'Admin', 'Kasir'] },
    { name: 'Biaya', path: '/biaya-operasional', icon: Wallet, roles: ['Owner', 'Admin', 'Kasir'] },
    { name: 'Laporan', path: '/laporan', icon: FileText, roles: ['Owner'] },
    { name: 'Set', path: '/setting', icon: Settings, roles: ['Owner'] },
  ];

  const allowedNav = navItems.filter(item => user && item.roles.includes(user.role));

  return (
    <>
      <nav className="fixed bottom-0 w-full bg-background dark:bg-card border-t border-border z-50 md:hidden pb-safe overflow-x-auto no-scrollbar">
        <ul className="flex items-center min-w-max h-16 px-2">
          {allowedNav.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.path} className="px-2">
                <NavLink
                  to={item.path!}
                  className={({ isActive }) =>
                    `flex flex-col items-center justify-center w-14 h-full space-y-1 transition-colors ${
                      isActive ? 'text-primary' : 'text-muted-foreground'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : ''}`} />
                      <span className={`text-[10px] whitespace-nowrap ${isActive ? 'font-bold' : 'font-medium'}`}>
                        {item.name}
                      </span>
                    </>
                  )}
                </NavLink>
              </li>
            );
          })}
          <li className="px-2">
            <button
              onClick={handleLogout}
              className="flex flex-col items-center justify-center w-14 h-full space-y-1 text-red-500"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-[10px] font-medium">Keluar</span>
            </button>
          </li>
        </ul>
      </nav>


    </>
  );
}
