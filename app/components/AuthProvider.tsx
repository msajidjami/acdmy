'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

import { useRouter } from 'next/navigation';

export interface User {
  id: string;

  name: string;
  email: string;

  role:
    | 'user'
    | 'admin'
    | 'education-admin'
    | 'darul-ifta-admin'
    | 'section1-admin'
    | 'section2-admin';

  provider: 'credentials' | 'google';

  avatar: string;

  isVerified: boolean;
  emailVerified: boolean;

  loginCount: number;
  lastLogin: string | null;

  profileCompleted: boolean;

  accountType?: 'student' | 'parent';
}

interface AuthContextType {
  user: User | null;

  loading: boolean;

  isAuthenticated: boolean;

  isAdmin: boolean;

  isEducationAdmin: boolean;

  isDarulIftaAdmin: boolean;

  isSection1Admin: boolean;

  isSection2Admin: boolean;

  refreshSession: () => Promise<void>;

  logout: () => Promise<void>;

  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);

  const [loading, setLoading] = useState(true);

  const router = useRouter();

  const fetchSession = async () => {
    try {
      setLoading(true);

      const res = await fetch('/api/auth/session', {
        credentials: 'include',
        cache: 'no-store',
      });

      if (!res.ok) {
        setUser(null);
        return;
      }

      const data = await res.json();

      if (data.success) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Session Error:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const refreshSession = async () => {
    await fetchSession();
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      setUser(null);

      router.replace('/login');

      router.refresh();
    } catch (error) {
      console.error(error);
    }
  };

  const value: AuthContextType = {
    user,

    loading,

    isAuthenticated: !!user,

    isAdmin:
      user?.role === 'admin',

    isEducationAdmin:
      user?.role === 'education-admin',

    isDarulIftaAdmin:
      user?.role === 'darul-ifta-admin',

    isSection1Admin:
      user?.role === 'section1-admin',

    isSection2Admin:
      user?.role === 'section2-admin',

    refreshSession,

    logout,

    setUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth must be used inside AuthProvider'
    );
  }

  return context;
}