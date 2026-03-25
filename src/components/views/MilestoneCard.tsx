'use client';

import { useState } from 'react';
import type { Post } from '@/lib/db';
import { DragHandle } from './DragHandle';
import { ViewCardActions } from './ViewCardActions';
import { InlineAddForm } from './InlineAddForm';
import { StatusBadge } from './StatusBadge';

interface MilestoneCardProps {
  milestone: Post;
  tasks: Post[];
  goalNames: string[];
  isEditing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSave: (postId: number, content: string) => void;
  onToggleComplete: (milestoneId: number, completed: boolean) => void;
  onToggleTaskComplete: (taskId: number, completed: boolean) => void;
  onAddTask: (milestoneId: number, content: string) => void;
  onRemoveTask: (taskId: number, milestoneId: number) => void;
  onEditTask: (taskId: number, content: string) => void;
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

export function MilestoneCard({
  milestone,
  tasks,
  goalNames,
  isEditing,
  onEdit,
  onCancelEdit,
  onSave,
  onToggleComplete,
  onToggleTaskComplete,
  onAddTask,
  onRemoveTask,
  onEditTask,
  dragHandleProps,
  dropProps,
  isDragOver,
  isDragging,
}: MilestoneCardProps) {
  const [isTasksExpanded, setIsTasksExpanded] = useState(true);
  const [editContent, setEditContent] = useState(milestone.content || '');
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editTaskContent, setEditTaskContent] = useState('');

  const isCompleted = Boolean(milestone.metadata?.isCompleted);
  const completedTasks = tasks.filter((t) => t.metadata?.isCompleted).length;
  const totalTasks = tasks.length;

  const handleSave = () => {
    if (editContent.trim()) {
      onSave(milestone.id, editContent.trim());
    }
  };

  const handleStartEditTask = (task: Post) => {
    setEditingTaskId(task.id);
    setEditTaskContent(task.content || '');
  };

  const handleSaveTask = () => {
    if (editingTaskId && editTaskContent.trim()) {
      onEditTask(editingTaskId, editTaskContent.trim());
      setEditingTaskId(null);
    }
  };

  return (
    <div
      className={`view-card milestone-card ${isDragging ? 'view-card-dragging' : ''} ${isDragOver ? 'view-card-drag-over' : ''} ${isCompleted ? 'view-card-completed' : ''}`}
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
              placeholder="Milestone title..."
              autoFocus
            />
            <button type="button" className="view-card-edit-save" onClick={handleSave}>Save</button>
            <button type="button" className="view-card-edit-cancel" onClick={onCancelEdit}>Cancel</button>
          </div>
        ) : (
          <>
            <span className={`view-card-title ${isCompleted ? 'view-card-title-done' : ''}`}>
              {milestone.content}
            </span>
            <StatusBadge
              variant="progress"
              status={isCompleted ? 'completed' : 'not_started'}
              onChange={(newStatus) => onToggleComplete(milestone.id, newStatus === 'completed')}
            />
            {goalNames.length > 0 && (
              <div className="view-card-badges">
                {goalNames.map((name, i) => (
                  <span key={i} className="view-type-badge">{name.length > 30 ? name.slice(0, 30) + '…' : name}</span>
                ))}
              </div>
            )}
            <ViewCardActions onEdit={onEdit} />
          </>
        )}
      </div>

      {/* Tasks section */}
      <div className="collapsible-section">
        <div className="collapsible-section-header">
          <div
            className="collapsible-section-toggle"
            role="button"
            tabIndex={0}
            onClick={() => setIsTasksExpanded(!isTasksExpanded)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setIsTasksExpanded(!isTasksExpanded); }}
          >
            <svg
              className={`collapsible-chevron ${isTasksExpanded ? 'collapsible-chevron-open' : ''}`}
              width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            >
              <polyline points="4 2 8 6 4 10" />
            </svg>
            <span>Tasks ({completedTasks}/{totalTasks})</span>
          </div>
          <InlineAddForm
            placeholder="New task..."
            onSubmit={(content) => onAddTask(milestone.id, content)}
          />
        </div>

        {isTasksExpanded && (
          <div className="collapsible-section-content">
            {tasks.map((task) => {
              const tCompleted = Boolean(task.metadata?.isCompleted);
              const isEditingThis = editingTaskId === task.id;

              return (
                <div key={task.id} className={`view-sub-item ${tCompleted ? 'view-sub-item-completed' : ''}`}>
                  {isEditingThis ? (
                    <div className="view-sub-item-edit">
                      <input
                        type="text"
                        className="view-card-edit-input"
                        value={editTaskContent}
                        onChange={(e) => setEditTaskContent(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveTask();
                          if (e.key === 'Escape') setEditingTaskId(null);
                        }}
                        autoFocus
                      />
                      <button type="button" className="view-card-edit-save" onClick={handleSaveTask}>Save</button>
                      <button type="button" className="view-card-edit-cancel" onClick={() => setEditingTaskId(null)}>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M1 1L11 11M1 11L11 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="view-sub-item-status">
                        {tCompleted ? 'Completed' : 'Not Started'}
                      </span>
                      <span className={`view-sub-item-text ${tCompleted ? 'view-sub-item-text-done' : ''}`}>
                        {task.content}
                      </span>
                      <button
                        type="button"
                        className="view-card-action-btn"
                        onClick={() => onToggleTaskComplete(task.id, !tCompleted)}
                        title={tCompleted ? 'Mark not started' : 'Mark completed'}
                      >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          {tCompleted ? (
                            <>
                              <rect x="1" y="1" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" fill="color-mix(in srgb, currentColor 15%, transparent)" />
                              <path d="M4 7L6 9L10 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </>
                          ) : (
                            <rect x="1" y="1" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
                          )}
                        </svg>
                      </button>
                      <ViewCardActions
                        onEdit={() => handleStartEditTask(task)}
                        onDelete={() => onRemoveTask(task.id, milestone.id)}
                      />
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
