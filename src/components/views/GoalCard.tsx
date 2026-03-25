'use client';

import { useState } from 'react';
import type { Post } from '@/lib/db';
import { DragHandle } from './DragHandle';
import { ViewCardActions } from './ViewCardActions';
import { GoalProgressBar } from './GoalProgressBar';
import { InlineAddForm } from './InlineAddForm';
import { StatusBadge } from './StatusBadge';

interface GoalCardProps {
  goal: Post;
  milestones: Post[];
  isEditing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSave: (postId: number, content: string, metadata: { type: string; status: string; targetDate: string | null }) => void;
  onStatusChange: (postId: number, status: string) => void;
  onTypeChange: (postId: number, type: string) => void;
  onToggleActive: (postId: number, active: boolean) => void;
  onToggleMilestoneComplete: (milestoneId: number, completed: boolean) => void;
  onAddMilestone: (goalId: number, content: string) => void;
  onRemoveMilestone: (milestoneId: number, goalId: number) => void;
  onEditMilestone: (milestoneId: number, content: string) => void;
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

export function GoalCard({
  goal,
  milestones,
  isEditing,
  onEdit,
  onCancelEdit,
  onSave,
  onStatusChange,
  onTypeChange,
  onToggleActive,
  onToggleMilestoneComplete,
  onAddMilestone,
  onRemoveMilestone,
  onEditMilestone,
  dragHandleProps,
  dropProps,
  isDragOver,
  isDragging,
}: GoalCardProps) {
  const [isMilestonesExpanded, setIsMilestonesExpanded] = useState(true);
  const [editContent, setEditContent] = useState(goal.content || '');
  const [editType, setEditType] = useState(String(goal.metadata?.type || 'short_term'));
  const [editStatus, setEditStatus] = useState(String(goal.metadata?.status || 'active'));
  const [editTargetDate, setEditTargetDate] = useState(String(goal.metadata?.targetDate || ''));
  const [editingMilestoneId, setEditingMilestoneId] = useState<number | null>(null);
  const [editMilestoneContent, setEditMilestoneContent] = useState('');

  const metadata = goal.metadata || {};
  const goalType = String(metadata.type || 'short_term');
  const status = String(metadata.status || 'not_started');
  const isActive = metadata._active !== false;

  const completedMilestones = milestones.filter((m) => m.metadata?.isCompleted).length;
  const totalMilestones = milestones.length;

  const typeLabel = goalType === 'long_term' ? 'Long-term' : 'Short-term';

  const handleSave = () => {
    if (editContent.trim()) {
      onSave(goal.id, editContent.trim(), {
        type: editType,
        status: editStatus,
        targetDate: editTargetDate || null,
      });
    }
  };

  const handleStartEditMilestone = (milestone: Post) => {
    setEditingMilestoneId(milestone.id);
    setEditMilestoneContent(milestone.content || '');
  };

  const handleSaveMilestone = () => {
    if (editingMilestoneId && editMilestoneContent.trim()) {
      onEditMilestone(editingMilestoneId, editMilestoneContent.trim());
      setEditingMilestoneId(null);
    }
  };

  return (
    <div
      className={`view-card goal-card ${isDragging ? 'view-card-dragging' : ''} ${isDragOver ? 'view-card-drag-over' : ''}`}
      {...dropProps}
    >
      <div className="view-card-header">
        <DragHandle {...dragHandleProps} />

        {isEditing ? (
          <div className="view-card-edit-form">
            <div className="view-card-edit-row">
              <input
                type="text"
                className="view-card-edit-input"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') onCancelEdit();
                }}
                placeholder="Goal title..."
                autoFocus
              />
            </div>
            <div className="view-card-edit-fields">
              <label className="view-card-edit-field">
                <span>Type</span>
                <select
                  className="view-card-edit-select"
                  value={editType}
                  onChange={(e) => setEditType(e.target.value)}
                >
                  <option value="short_term">Short-term</option>
                  <option value="long_term">Long-term</option>
                </select>
              </label>
              <label className="view-card-edit-field">
                <span>Status</span>
                <select
                  className="view-card-edit-select"
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                >
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </select>
              </label>
              <label className="view-card-edit-field">
                <span>Target Date</span>
                <input
                  type="date"
                  className="view-card-edit-select"
                  value={editTargetDate}
                  onChange={(e) => setEditTargetDate(e.target.value)}
                />
              </label>
            </div>
            <div className="view-card-edit-actions">
              <button type="button" className="view-card-edit-save" onClick={handleSave}>Save</button>
              <button type="button" className="view-card-edit-cancel" onClick={onCancelEdit}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <span className="view-card-title">{goal.content}</span>
            <StatusBadge
              variant="goal-type"
              status={goalType}
              onChange={(newType) => onTypeChange(goal.id, newType)}
            />
            <StatusBadge
              variant="progress"
              status={status}
              onChange={(newStatus) => onStatusChange(goal.id, newStatus)}
            />
            <label className="view-status-checkbox">
              <input
                type="checkbox"
                checked={isActive}
                onChange={() => onToggleActive(goal.id, !isActive)}
              />
              <span>Active</span>
            </label>
            <ViewCardActions onEdit={onEdit} />
          </>
        )}
      </div>

      {totalMilestones > 0 && (
        <GoalProgressBar completed={completedMilestones} total={totalMilestones} />
      )}

      {/* Milestones section */}
      <div className="collapsible-section">
        <div className="collapsible-section-header">
          <div
            className="collapsible-section-toggle"
            role="button"
            tabIndex={0}
            onClick={() => setIsMilestonesExpanded(!isMilestonesExpanded)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setIsMilestonesExpanded(!isMilestonesExpanded); }}
          >
            <svg
              className={`collapsible-chevron ${isMilestonesExpanded ? 'collapsible-chevron-open' : ''}`}
              width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            >
              <polyline points="4 2 8 6 4 10" />
            </svg>
            <span>Milestones ({completedMilestones}/{totalMilestones})</span>
          </div>
          <InlineAddForm
            placeholder="New milestone..."
            onSubmit={(content) => onAddMilestone(goal.id, content)}
          />
        </div>

        {isMilestonesExpanded && (
          <div className="collapsible-section-content">
            {milestones.map((milestone) => {
              const mCompleted = Boolean(milestone.metadata?.isCompleted);
              const isEditingThis = editingMilestoneId === milestone.id;

              return (
                <div key={milestone.id} className={`view-sub-item ${mCompleted ? 'view-sub-item-completed' : ''}`}>
                  {isEditingThis ? (
                    <div className="view-sub-item-edit">
                      <input
                        type="text"
                        className="view-card-edit-input"
                        value={editMilestoneContent}
                        onChange={(e) => setEditMilestoneContent(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveMilestone();
                          if (e.key === 'Escape') setEditingMilestoneId(null);
                        }}
                        autoFocus
                      />
                      <button type="button" className="view-card-edit-save" onClick={handleSaveMilestone}>Save</button>
                      <button type="button" className="view-card-edit-cancel" onClick={() => setEditingMilestoneId(null)}>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M1 1L11 11M1 11L11 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="view-sub-item-status">
                        {mCompleted ? 'Completed' : 'Not Started'}
                      </span>
                      <span className={`view-sub-item-text ${mCompleted ? 'view-sub-item-text-done' : ''}`}>
                        {milestone.content}
                      </span>
                      <button
                        type="button"
                        className="view-card-action-btn"
                        onClick={() => onToggleMilestoneComplete(milestone.id, !mCompleted)}
                        title={mCompleted ? 'Mark not started' : 'Mark completed'}
                      >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          {mCompleted ? (
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
                        onEdit={() => handleStartEditMilestone(milestone)}
                        onDelete={() => onRemoveMilestone(milestone.id, goal.id)}
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
