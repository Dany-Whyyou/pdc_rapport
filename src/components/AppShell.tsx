'use client';

import { useAuth } from '@/lib/auth';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const pathname = usePathname();

  const isLoginPage = pathname === '/login' || pathname === '/';

  if (loading) {
    return (
      <div className="flex items-center justify-center w-full min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated || isLoginPage) {
    return <div className="flex-1">{children}</div>;
  }

  return (
    <>
      <Sidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </>
  );
}
