'use client';

import { Checkbox } from './Checkbox';

export interface LinkerPost {
  id: number;
  content: string;
  isCompleted?: boolean;
}

export interface PostLinkerProps {
  posts: LinkerPost[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  emptyMessage?: string;
}

export interface LinkedItemsProps {
  items: LinkerPost[];
  label: string;
  onRemove: (id: number) => void;
  onToggleComplete: (id: number, completed: boolean) => void;
  emptyMessage?: string;
}

function truncate(text: string, maxLength = 60): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + '…';
}

export function PostLinker({
  posts,
  selectedIds,
  onChange,
  emptyMessage = 'None available',
}: PostLinkerProps) {
  if (posts.length === 0) {
    return <p className="field-hint">{emptyMessage}</p>;
  }

  const handleToggle = (postId: number, checked: boolean) => {
    const idStr = String(postId);
    if (checked) {
      onChange([...selectedIds, idStr]);
    } else {
      onChange(selectedIds.filter((id) => id !== idStr));
    }
  };

  return (
    <div className="post-linker">
      {posts.map((post) => (
        <Checkbox
          key={post.id}
          id={`linker-${post.id}`}
          name={`linker-${post.id}`}
          label={truncate(post.content)}
          checked={selectedIds.includes(String(post.id))}
          onChange={(e) => handleToggle(post.id, e.target.checked)}
        />
      ))}
    </div>
  );
}

export function LinkedItems({
  items,
  label,
  onRemove,
  onToggleComplete,
  emptyMessage,
}: LinkedItemsProps) {
  if (items.length === 0) {
    return emptyMessage ? <p className="field-hint">{emptyMessage}</p> : null;
  }

  return (
    <div className="linked-items">
      <span className="linked-items-label">{label}</span>
      <div className="linked-items-list">
        {items.map((item) => (
          <div key={item.id} className={`linked-item ${item.isCompleted ? 'completed' : ''}`}>
            <button
              type="button"
              className="linked-item-check"
              onClick={() => onToggleComplete(item.id, !item.isCompleted)}
              title={item.isCompleted ? 'Mark incomplete' : 'Mark complete'}
            >
              {item.isCompleted ? (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <rect x="1" y="1" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" fill="color-mix(in srgb, currentColor 15%, transparent)" />
                  <path d="M4 7L6 9L10 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <rect x="1" y="1" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              )}
            </button>
            <span className="linked-item-text">{truncate(item.content, 50)}</span>
            <button
              type="button"
              className="linked-item-remove"
              onClick={() => onRemove(item.id)}
              title="Remove link"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M1 1L9 9M1 9L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
