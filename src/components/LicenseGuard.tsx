import { Navigate, Outlet } from 'react-router-dom';
import { useLicenseStore } from '@/store/useLicenseStore';

export const LicenseGuard = () => {
  const { isActivated } = useLicenseStore();

  if (!isActivated) {
    return <Navigate to="/aktivasi" replace />;
  }

  return <Outlet />;
};
