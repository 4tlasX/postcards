'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUIStore } from '@/stores';

export function Header() {
  const pathname = usePathname();
  const triggerCreatePost = useUIStore((state) => state.triggerCreatePost);

  const isOnViewPage = pathname.startsWith('/goals') || pathname.startsWith('/milestones') || pathname.startsWith('/tasks');

  return (
    <header className="app-header">
      <Link href="/posts" className="app-logo">POSTCARDS</Link>
      {!isOnViewPage && (
        <button
          className="header-create-btn"
          onClick={triggerCreatePost}
          title="New Post"
          aria-label="Create new post"
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      )}
    </header>
  );
}
