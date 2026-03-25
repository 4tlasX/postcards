'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUIStore } from '@/stores';

const VIEW_ITEMS = [
  {
    href: '/goals',
    label: 'Goals',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    ),
  },
  {
    href: '/milestones',
    label: 'Milestones',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
        <line x1="4" y1="22" x2="4" y2="15" />
      </svg>
    ),
  },
  {
    href: '/tasks',
    label: 'Tasks',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
  },
];

export function ViewsSidebar() {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const isOpen = useUIStore((state) => state.isViewsSidebarOpen);
  const closeViewsSidebar = useUIStore((state) => state.closeViewsSidebar);

  // Close on escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeViewsSidebar();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeViewsSidebar]);

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        const target = e.target as HTMLElement;
        if (target.closest('.sidebar-nav-item')) return;
        closeViewsSidebar();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, closeViewsSidebar]);

  return (
    <div
      ref={sidebarRef}
      className={`views-sidebar ${isOpen ? 'views-sidebar-open' : ''}`}
    >
      <div className="views-sidebar-header">
        <span className="views-sidebar-title">VIEWS</span>
      </div>

      <div className="views-sidebar-list">
        {VIEW_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`views-sidebar-item ${pathname === item.href ? 'views-sidebar-item-active' : ''}`}
            onClick={closeViewsSidebar}
          >
            <div className="views-sidebar-item-icon">{item.icon}</div>
            <span className="views-sidebar-item-name">{item.label}</span>
            <svg className="views-sidebar-item-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        ))}
      </div>

      <button
        type="button"
        className="views-sidebar-close"
        onClick={closeViewsSidebar}
        aria-label="Close views"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}
