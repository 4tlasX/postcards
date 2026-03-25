'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores';
import { validateSessionAction } from '@/app/auth/actions';

const PUBLIC_PATHS = ['/auth/login', '/auth/signup'];

function isPublicPath(pathname: string | null): boolean {
  if (!pathname) return false;
  return PUBLIC_PATHS.some(path => pathname.startsWith(path));
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [authState, setAuthState] = useState<'loading' | 'authenticated' | 'public'>('loading');

  useEffect(() => {
    let cancelled = false;

    const checkAuth = async () => {
      // Public paths - render without auth check
      if (isPublicPath(pathname)) {
        if (!cancelled) setAuthState('public');
        return;
      }

      // Protected path - validate session
      const result = await validateSessionAction();

      if (cancelled) return;

      if (!result.valid || !result.data) {
        useAuthStore.getState().clearAuth();
        router.push('/auth/login');
        return;
      }

      // Valid session - set auth state with theme mode
      useAuthStore.getState().setAuth({
        userName: result.data.userName,
        userEmail: result.data.userEmail,
        userSettings: {
          themeMode: result.data.themeMode,
        },
      });

      setAuthState('authenticated');
    };

    setAuthState('loading');
    checkAuth();

    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  // Loading state
  if (authState === 'loading') {
    return null;
  }

  return <>{children}</>;
}
