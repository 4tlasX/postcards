'use client';

type StatusConfig = {
  key: string;
  label: string;
  color: string;
};

const PROGRESS_STATUSES: StatusConfig[] = [
  { key: 'not_started', label: 'Not Started', color: '#6b7280' },
  { key: 'in_progress', label: 'In Progress', color: '#f59e0b' },
  { key: 'completed', label: 'Completed', color: '#22c55e' },
];

const GOAL_TYPE_STATUSES: StatusConfig[] = [
  { key: 'short_term', label: 'Short-term', color: 'var(--accent-color)' },
  { key: 'long_term', label: 'Long-term', color: '#8b5cf6' },
];

interface StatusBadgeProps {
  variant: 'progress' | 'goal-type';
  status: string;
  onChange: (newStatus: string) => void;
}

function getStatuses(variant: StatusBadgeProps['variant']): StatusConfig[] {
  switch (variant) {
    case 'progress': return PROGRESS_STATUSES;
    case 'goal-type': return GOAL_TYPE_STATUSES;
  }
}

export function StatusBadge({ variant, status, onChange }: StatusBadgeProps) {
  const statuses = getStatuses(variant);
  const currentIndex = statuses.findIndex((s) => s.key === status);
  const current = statuses[currentIndex >= 0 ? currentIndex : 0];

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextIndex = (currentIndex + 1) % statuses.length;
    onChange(statuses[nextIndex].key);
  };

  return (
    <button
      type="button"
      className="status-badge-btn"
      onClick={handleClick}
      title={`Click to change status (${statuses.map((s) => s.label).join(' → ')})`}
      style={{
        '--status-color': current.color,
      } as React.CSSProperties}
    >
      {current.label}
    </button>
  );
}
