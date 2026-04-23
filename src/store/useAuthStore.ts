import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserSession {
  id: number;
  username: string;
  role: 'Owner' | 'Admin' | 'Kasir';
}

interface AuthState {
  user: UserSession | null;
  login: (user: UserSession) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      login: (user) => set({ user }),
      logout: () => set({ user: null }),
    }),
    {
      name: 'pos-auth-storage', // saves to localStorage by default
    }
  )
);
