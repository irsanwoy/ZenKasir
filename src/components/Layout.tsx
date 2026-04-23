import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Tags, 
  Users, 
  Settings,
  LogOut,
  Menu,
  X,
  History,
  FileText
} from 'lucide-react';
import { cn } from '@/utils/utils';

export function Layout() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
    { name: 'Stok Masuk', path: '/stok', icon: History, roles: ['Owner', 'Admin'] },
    { name: 'Laporan', path: '/laporan', icon: FileText, roles: ['Owner'] },
    { name: 'Pengaturan', path: '/setting', icon: Settings, roles: ['Owner'] },
  ];

  const allowedNav = navItems.filter(item => user && item.roles.includes(user.role));

  return (
    <div className="flex h-screen bg-muted/20">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform bg-white border-r shadow-sm transition-transform duration-200 ease-in-out lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b">
          <span className="text-xl font-bold text-primary">POS Universal</span>
          <button className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex flex-col h-[calc(100vh-4rem)]">
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
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className={cn("w-5 h-5 mr-3", isActive ? "text-primary" : "text-gray-500")} />
                  {item.name}
                </Link>
              );
            })}
          </div>

          <div className="p-4 border-t">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                {user?.username.charAt(0).toUpperCase()}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">{user?.username}</p>
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
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header (Mobile only) */}
        <header className="flex items-center justify-between h-16 px-4 bg-white border-b lg:hidden shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 -mr-2 text-gray-600 rounded-md hover:bg-gray-100 focus:outline-none"
          >
            <Menu className="w-6 h-6" />
          </button>
          <span className="text-lg font-bold text-primary">POS Universal</span>
          <div className="w-6" /> {/* Spacer */}
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
