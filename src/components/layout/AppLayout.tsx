import { Outlet } from 'react-router-dom';
import { DesktopSidebar } from './DesktopSidebar';
import { MobileNav } from './MobileNav';
import { Header } from './Header';

export function AppLayout() {
  return (
    <div className="flex h-screen bg-muted/20 overflow-hidden">
      <DesktopSidebar />
      <div className="flex flex-col flex-1 w-full relative">
        <Header />
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 pb-24 md:pb-6">
          <Outlet />
        </main>
        <MobileNav />
      </div>
    </div>
  );
}
