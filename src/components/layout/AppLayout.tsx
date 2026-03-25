import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ViewsSidebar } from '@/components/views';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="app-layout">
      <Sidebar />
      <ViewsSidebar />
      <div className="app-content">
        <Header />
        <main className="app-main">
          {children}
        </main>
      </div>
    </div>
  );
}
