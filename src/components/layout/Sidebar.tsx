'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogoutButton } from '@/components/auth';
import { useUIStore } from '@/stores';

export function Sidebar() {
  const pathname = usePathname();
  const toggleTopicSidebar = useUIStore((state) => state.toggleTopicSidebar);
  const isTopicSidebarOpen = useUIStore((state) => state.isTopicSidebarOpen);
  const toggleSearchSidebar = useUIStore((state) => state.toggleSearchSidebar);
  const isSearchSidebarOpen = useUIStore((state) => state.isSearchSidebarOpen);
  const toggleViewsSidebar = useUIStore((state) => state.toggleViewsSidebar);
  const isViewsSidebarOpen = useUIStore((state) => state.isViewsSidebarOpen);

  const isPostsActive = pathname === '/' || pathname.startsWith('/posts');
  const isOnViewPage = pathname.startsWith('/goals') || pathname.startsWith('/milestones') || pathname.startsWith('/tasks');
  const isViewsActive = isViewsSidebarOpen || isOnViewPage;

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        {/* Posts link */}
        <Link
          href="/"
          className={`sidebar-nav-item ${isPostsActive ? 'sidebar-nav-item-active' : ''}`}
          title="Posts"
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        </Link>

        {/* Search button - only on posts page */}
        {!isOnViewPage && (
          <button
            type="button"
            className={`sidebar-nav-item ${isSearchSidebarOpen ? 'sidebar-nav-item-active' : ''}`}
            onClick={toggleSearchSidebar}
            title="Search"
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
        )}

        {/* Topics button - only on posts page */}
        {!isOnViewPage && (
          <button
            type="button"
            className={`sidebar-nav-item ${isTopicSidebarOpen ? 'sidebar-nav-item-active' : ''}`}
            onClick={toggleTopicSidebar}
            title="Topics"
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
              <line x1="7" y1="7" x2="7.01" y2="7" />
            </svg>
          </button>
        )}

        {/* Views button */}
        <button
          type="button"
          className={`sidebar-nav-item ${isViewsActive ? 'sidebar-nav-item-active' : ''}`}
          onClick={toggleViewsSidebar}
          title="Views"
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
          </svg>
        </button>

        {/* Settings link */}
        <Link
          href="/settings"
          className={`sidebar-nav-item ${pathname.startsWith('/settings') ? 'sidebar-nav-item-active' : ''}`}
          title="Settings"
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </Link>

        <LogoutButton className="sidebar-nav-item sidebar-nav-item-logout" iconOnly />
      </nav>
    </aside>
  );
}
