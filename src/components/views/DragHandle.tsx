'use client';

interface DragHandleProps {
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
}

export function DragHandle({ onDragStart, onDragEnd }: DragHandleProps) {
  return (
    <div
      className="view-card-drag-handle"
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      title="Drag to reorder"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <circle cx="5" cy="3" r="1.5" />
        <circle cx="11" cy="3" r="1.5" />
        <circle cx="5" cy="8" r="1.5" />
        <circle cx="11" cy="8" r="1.5" />
        <circle cx="5" cy="13" r="1.5" />
        <circle cx="11" cy="13" r="1.5" />
      </svg>
    </div>
  );
}
