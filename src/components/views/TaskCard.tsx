'use client';

import { useState } from 'react';
import type { Post } from '@/lib/db';
import { DragHandle } from './DragHandle';
import { ViewCardActions } from './ViewCardActions';
import { StatusBadge } from './StatusBadge';

interface TaskCardProps {
  task: Post;
  milestoneNames: string[];
  isEditing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSave: (postId: number, content: string) => void;
  onStatusChange: (taskId: number, status: string) => void;
  dragHandleProps?: {
    onDragStart?: (e: React.DragEvent) => void;
    onDragEnd?: (e: React.DragEvent) => void;
  };
  dropProps?: {
    onDragOver?: (e: React.DragEvent) => void;
  };
  isDragOver?: boolean;
  isDragging?: boolean;
}

export function TaskCard({
  task,
  milestoneNames,
  isEditing,
  onEdit,
  onCancelEdit,
  onSave,
  onStatusChange,
  dragHandleProps,
  dropProps,
  isDragOver,
  isDragging,
}: TaskCardProps) {
  const [editContent, setEditContent] = useState(task.content || '');

  const isCompleted = Boolean(task.metadata?.isCompleted);
  const isInProgress = Boolean(task.metadata?.isInProgress);

  const handleSave = () => {
    if (editContent.trim()) {
      onSave(task.id, editContent.trim());
    }
  };

  return (
    <div
      className={`view-card task-card ${isDragging ? 'view-card-dragging' : ''} ${isDragOver ? 'view-card-drag-over' : ''} ${isCompleted ? 'view-card-completed' : ''}`}
      {...dropProps}
    >
      <div className="view-card-header">
        <DragHandle {...dragHandleProps} />

        {isEditing ? (
          <div className="view-card-edit-row">
            <input
              type="text"
              className="view-card-edit-input"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
                if (e.key === 'Escape') onCancelEdit();
              }}
              placeholder="Task title..."
              autoFocus
            />
            <button type="button" className="view-card-edit-save" onClick={handleSave}>Save</button>
            <button type="button" className="view-card-edit-cancel" onClick={onCancelEdit}>Cancel</button>
          </div>
        ) : (
          <>
            <span className={`view-card-title ${isCompleted ? 'view-card-title-done' : ''}`}>
              {task.content}
            </span>
            <StatusBadge
              variant="progress"
              status={isCompleted ? 'completed' : isInProgress ? 'in_progress' : 'not_started'}
              onChange={(newStatus) => onStatusChange(task.id, newStatus)}
            />
            {milestoneNames.length > 0 && (
              <div className="view-card-badges">
                {milestoneNames.map((name, i) => (
                  <span key={i} className="view-type-badge">{name.length > 30 ? name.slice(0, 30) + '…' : name}</span>
                ))}
              </div>
            )}
            <ViewCardActions onEdit={onEdit} />
          </>
        )}
      </div>
    </div>
  );
}
