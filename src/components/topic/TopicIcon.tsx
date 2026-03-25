import { getIconDefinition } from '@/lib/icons';

export interface TopicIconProps {
  icon: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: 16,
  md: 20,
  lg: 24,
};

export function TopicIcon({ icon, size = 'md', className = '' }: TopicIconProps) {
  const iconDef = icon ? getIconDefinition(icon) : null;
  const pixelSize = sizeMap[size];
  const classes = ['topic-icon', className].filter(Boolean).join(' ');

  // If no icon or invalid icon name, show dot fallback
  if (!iconDef) {
    return (
      <span
        className={classes}
        style={{
          display: 'inline-block',
          width: pixelSize * 0.5,
          height: pixelSize * 0.5,
          borderRadius: '50%',
          backgroundColor: 'currentColor',
        }}
        role="img"
        aria-label="topic indicator"
      />
    );
  }

  return (
    <svg
      className={classes}
      width={pixelSize}
      height={pixelSize}
      viewBox={iconDef.viewBox}
      fill="currentColor"
      role="img"
      aria-label="topic icon"
    >
      <path d={iconDef.path} />
    </svg>
  );
}
