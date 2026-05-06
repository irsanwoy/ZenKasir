import { useAuthStore } from '@/store/useAuthStore';
import { useSettingStore } from '@/store/useSettingStore';
import { LogOut, Store } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Header() {
  const { user, logout } = useAuthStore();
  const { settings } = useSettingStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between w-full h-14 px-4 bg-background dark:bg-card border-b border-border shadow-sm md:h-16 md:px-6 shrink-0">
      {/* Mobile view */}
      <div className="flex items-center md:hidden">
        <Store className="w-5 h-5 text-primary mr-2" />
        <span className="font-bold text-primary truncate max-w-[150px]">
          {settings.nama_toko}
        </span>
      </div>

      <div className="flex items-center md:hidden">
        <button onClick={handleLogout} className="p-2 text-red-600 rounded-md hover:bg-red-50">
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      {/* Desktop view */}
      <div className="hidden md:flex items-center w-full justify-between">
        <div className="flex items-center">
          <Store className="w-5 h-5 text-muted-foreground mr-2" />
          <span className="font-medium text-foreground">{settings.nama_toko}</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-medium text-foreground">{user?.username}</p>
            <p className="text-xs text-muted-foreground">{user?.role}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
