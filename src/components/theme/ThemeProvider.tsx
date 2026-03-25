'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const themeMode = useAuthStore((state) => state.userSettings.themeMode);

  useEffect(() => {
    // Apply theme class to body
    if (themeMode === 'light') {
      document.body.classList.add('theme-light');
    } else {
      document.body.classList.remove('theme-light');
    }
  }, [themeMode]);

  return <>{children}</>;
}
