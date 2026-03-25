'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import type { DisplayPost, Taxonomy } from '@/lib/db';
import { TopicIcon } from '@/components/topic';
import { Textarea, Button, LinkedItems } from '@/components/form';
import type { LinkerPost } from '@/components/form';
import { hasSpecializedFields, getDefaultMetadata } from '@/lib/taxonomies';
import {
  MetadataFieldSection,
  TaskFields,
  GoalFields,
  MilestoneFields,
  EventFields,
  MeetingFields,
  SymptomFields,
  FoodFields,
  MedicationFields,
  ExerciseFields,
} from '@/components/metadata';
import type {
  TaskMetadata,
  GoalMetadata,
  MilestoneMetadata,
  EventMetadata,
  MeetingMetadata,
  SymptomMetadata,
  FoodMetadata,
  MedicationMetadata,
  ExerciseMetadata,
} from '@/lib/taxonomies';

interface EditablePostCardProps {
  post: DisplayPost;
  taxonomy?: Taxonomy | null;
  taxonomies: Taxonomy[];
  isEditing: boolean;
  onStartEdit: () => void;
  onSave: (formData: FormData) => void;
  onDelete: (postId: number) => void;
  onCancelEdit?: () => void;
  isNew?: boolean;
  onCancel?: () => void;
  milestonePosts?: LinkerPost[];
  goalPosts?: LinkerPost[];
  taskPosts?: LinkerPost[];
  milestonesForGoal?: Record<number, LinkerPost[]>;
  tasksForMilestone?: Record<number, LinkerPost[]>;
  onRelatedPostUpdate?: (postId: number, metadataUpdates: Record<string, unknown>) => void;
  onUnlinkPost?: (targetPostId: number, arrayField: string, idToRemove: number) => void;
}

function extractMetadataForTaxonomy(
  metadata: Record<string, unknown>,
  taxonomyName: string
): Record<string, unknown> {
  const defaults = getDefaultMetadata(taxonomyName);
  const result: Record<string, unknown> = { ...defaults };

  for (const key of Object.keys(defaults)) {
    if (key in metadata) {
      result[key] = metadata[key];
    }
  }

  return result;
}

export function EditablePostCard({
  post,
  taxonomy,
  taxonomies,
  isEditing,
  onStartEdit,
  onSave,
  onDelete,
  onCancelEdit,
  isNew = false,
  onCancel,
  milestonePosts = [],
  goalPosts = [],
  taskPosts = [],
  milestonesForGoal = {},
  tasksForMilestone = {},
  onRelatedPostUpdate,
  onUnlinkPost,
}: EditablePostCardProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [selectedTaxonomy, setSelectedTaxonomy] = useState<Taxonomy | null>(taxonomy || null);
  const [showTaxonomyDropdown, setShowTaxonomyDropdown] = useState(false);
  const [metadata, setMetadata] = useState<Record<string, unknown>>(() => {
    if (post.metadata && taxonomy) {
      return extractMetadataForTaxonomy(post.metadata, taxonomy.name);
    }
    return {};
  });
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Reset state when editing changes
  useEffect(() => {
    if (isEditing) {
      setSelectedTaxonomy(taxonomy || null);
      if (taxonomy) {
        setMetadata(extractMetadataForTaxonomy(post.metadata || {}, taxonomy.name));
      } else {
        setMetadata({});
      }
    }
  }, [isEditing, taxonomy, post.metadata]);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!showTaxonomyDropdown) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowTaxonomyDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showTaxonomyDropdown]);

  // Escape to cancel edit mode
  useEffect(() => {
    if (!isEditing) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (isNew && onCancel) {
          // New post: cancel and remove card
          onCancel();
        } else if (onCancelEdit) {
          // Existing post: cancel edit mode
          onCancelEdit();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isEditing, isNew, onCancel, onCancelEdit]);

  const handleTaxonomySelect = (tax: Taxonomy | null) => {
    setSelectedTaxonomy(tax);
    setShowTaxonomyDropdown(false);
    if (tax) {
      setMetadata(getDefaultMetadata(tax.name));
    } else {
      setMetadata({});
    }
  };

  const handleMetadataChange = useCallback((field: string, value: unknown) => {
    setMetadata((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(formRef.current!);

    // Add taxonomy info
    if (selectedTaxonomy) {
      formData.set('taxonomyId', String(selectedTaxonomy.id));
    }

    // Add specialized metadata
    if (selectedTaxonomy && hasSpecializedFields(selectedTaxonomy.name)) {
      formData.set('specializedMetadata', JSON.stringify(metadata));
    }

    onSave(formData);
  };

  const postMetadata = post.metadata || {};
  const hasSpecialized = taxonomy && hasSpecializedFields(taxonomy.name);
  const calendarDate = formatCalendarDate(post.createdAt);
  const taxonomyName = selectedTaxonomy?.name || null;

  // Filter metadata for display
  const displayMetadata = Object.entries(postMetadata).filter(
    ([key]) => !key.startsWith('_') && !isSpecializedField(key, taxonomy?.name)
  );

  return (
    <article
      className={`post-view ${isEditing ? 'post-view-editing' : ''}`}
      onClick={!isEditing ? onStartEdit : undefined}
    >
      <header className="post-view-header">
        <div className="post-view-header-row">
          <div className="post-view-date-calendar">
              <span className="post-view-date-month">{calendarDate.month}</span>
              <div className="post-view-date-number">{calendarDate.day}</div>
            </div>
          <div className="post-view-header-right">
            <div className="post-view-topic" ref={dropdownRef}>
              {/* Topic selector - clickable in both modes */}
              <div className="post-view-topic-selector">
                <button
                  type="button"
                  className="post-view-topic-trigger"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isEditing) {
                      // Start editing and open dropdown
                      onStartEdit();
                      setShowTaxonomyDropdown(true);
                    } else {
                      setShowTaxonomyDropdown(!showTaxonomyDropdown);
                    }
                  }}
                >
                  {selectedTaxonomy ? (
                    <>
                      {selectedTaxonomy.name}
                      <TopicIcon icon={selectedTaxonomy.icon} size="sm" />
                    </>
                  ) : (
                    <span className="post-view-topic-placeholder">+ topic</span>
                  )}
                </button>
                {isEditing && showTaxonomyDropdown && (
                  <div className="post-view-topic-dropdown">
                    <button
                      type="button"
                      className={`post-view-topic-option ${!selectedTaxonomy ? 'selected' : ''}`}
                      onClick={() => handleTaxonomySelect(null)}
                    >
                      None
                    </button>
                    {taxonomies.map((tax) => (
                      <button
                        key={tax.id}
                        type="button"
                        className={`post-view-topic-option ${selectedTaxonomy?.id === tax.id ? 'selected' : ''}`}
                        onClick={() => handleTaxonomySelect(tax)}
                      >
                        <TopicIcon icon={tax.icon} size="sm" />
                        {tax.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {/* Cancel button - only show when editing */}
            {isEditing && (
              <button
                type="button"
                className="post-view-delete-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  if (isNew && onCancel) {
                    onCancel();
                  } else if (onCancelEdit) {
                    onCancelEdit();
                  }
                }}
                aria-label="Cancel"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M1 1L11 11M1 11L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </header>

      {isEditing ? (
        // Form replaces content when editing
        <form ref={formRef} onSubmit={handleSubmit} className="post-view-edit-form">
          {!isNew && <input type="hidden" name="id" value={post.id} />}

          <Textarea
            name="content"
            defaultValue={post.content ?? ''}
            placeholder="Write your post..."
            required
            className="post-view-edit-textarea"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                formRef.current?.requestSubmit();
              }
            }}
          />

          {/* Specialized metadata fields */}
          <MetadataFieldSection fieldType="task" selectedTaxonomyName={taxonomyName} title="Task Settings">
            <TaskFields values={metadata as unknown as TaskMetadata} onChange={handleMetadataChange} milestones={milestonePosts} />
          </MetadataFieldSection>
          <MetadataFieldSection fieldType="goal" selectedTaxonomyName={taxonomyName} title="Goal Settings">
            <GoalFields values={metadata as unknown as GoalMetadata} onChange={handleMetadataChange} />
          </MetadataFieldSection>
          <MetadataFieldSection fieldType="milestone" selectedTaxonomyName={taxonomyName} title="Milestone Settings">
            <MilestoneFields values={metadata as unknown as MilestoneMetadata} onChange={handleMetadataChange} goals={goalPosts} />
          </MetadataFieldSection>
          <MetadataFieldSection fieldType="event" selectedTaxonomyName={taxonomyName} title="Event Details">
            <EventFields values={metadata as unknown as EventMetadata} onChange={handleMetadataChange} />
          </MetadataFieldSection>
          <MetadataFieldSection fieldType="meeting" selectedTaxonomyName={taxonomyName} title="Meeting Details">
            <MeetingFields values={metadata as unknown as MeetingMetadata} onChange={handleMetadataChange} />
          </MetadataFieldSection>
          <MetadataFieldSection fieldType="symptom" selectedTaxonomyName={taxonomyName} title="Symptom Details">
            <SymptomFields values={metadata as unknown as SymptomMetadata} onChange={handleMetadataChange} />
          </MetadataFieldSection>
          <MetadataFieldSection fieldType="food" selectedTaxonomyName={taxonomyName} title="Food Details">
            <FoodFields values={metadata as unknown as FoodMetadata} onChange={handleMetadataChange} />
          </MetadataFieldSection>
          <MetadataFieldSection fieldType="medication" selectedTaxonomyName={taxonomyName} title="Medication Details">
            <MedicationFields values={metadata as unknown as MedicationMetadata} onChange={handleMetadataChange} />
          </MetadataFieldSection>
          <MetadataFieldSection fieldType="exercise" selectedTaxonomyName={taxonomyName} title="Exercise Details">
            <ExerciseFields values={metadata as unknown as ExerciseMetadata} onChange={handleMetadataChange} />
          </MetadataFieldSection>

          <div className="post-view-edit-actions">
            <Button type="submit" variant="secondary" size="sm">Save</Button>
            {!isNew && (
              <button
                type="button"
                className="post-view-edit-delete-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(post.id);
                }}
              >
                Delete
              </button>
            )}
          </div>
        </form>
      ) : (
        // Static content when not editing
        <>
          <div className="post-view-content">{post.content}</div>

          {hasSpecialized && (
            <div className="post-view-specialized-metadata">
              <span className="post-view-metadata-label">{taxonomy.name} Details</span>
              <SpecializedMetadataDisplay
                taxonomyName={taxonomy.name}
                metadata={postMetadata}
                postId={post.id}
                milestonePosts={milestonePosts}
                goalPosts={goalPosts}
                taskPosts={taskPosts}
                milestonesForGoal={milestonesForGoal}
                tasksForMilestone={tasksForMilestone}
                onRelatedPostUpdate={onRelatedPostUpdate}
                onUnlinkPost={onUnlinkPost}
              />
            </div>
          )}

          {displayMetadata.length > 0 && (
            <div className="post-view-metadata">
              {displayMetadata.map(([key, value]) => (
                <div key={key} className="post-view-metadata-item">
                  <span className="post-view-metadata-key">{key}</span>
                  <span className="post-view-metadata-value">{formatMetadataValue(value)}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </article>
  );
}

// Helper to check if a key is a specialized field
function isSpecializedField(key: string, taxonomyName?: string): boolean {
  if (!taxonomyName) return false;
  const name = taxonomyName.toLowerCase();

  const specializedKeys: Record<string, string[]> = {
    task: ['isCompleted', 'isInProgress', 'isAutoMigrating', 'milestoneIds'],
    goal: ['type', 'status', 'targetDate'],
    milestone: ['goalIds', 'isCompleted', 'completedAt'],
    event: ['startDate', 'startTime', 'endDate', 'endTime', 'location', 'address', 'phone', 'notes'],
    meeting: ['topic', 'attendees', 'startDate', 'startTime', 'endDate', 'endTime', 'location', 'address', 'phone', 'notes'],
    symptom: ['severity', 'occurredAt', 'duration', 'notes'],
    food: ['mealType', 'consumedAt', 'ingredients', 'calories', 'notes'],
    medication: ['dosage', 'frequency', 'scheduleTimes', 'isActive', 'notes', 'startDate'],
    exercise: ['type', 'otherType', 'duration', 'intensity', 'distance', 'distanceUnit', 'calories', 'performedAt', 'notes'],
  };

  return specializedKeys[name]?.includes(key) || false;
}

// Specialized metadata display component
function SpecializedMetadataDisplay({
  taxonomyName,
  metadata,
  postId,
  milestonePosts = [],
  goalPosts = [],
  taskPosts = [],
  milestonesForGoal = {},
  tasksForMilestone = {},
  onRelatedPostUpdate,
  onUnlinkPost,
}: {
  taxonomyName: string;
  metadata: Record<string, unknown>;
  postId: number;
  milestonePosts?: LinkerPost[];
  goalPosts?: LinkerPost[];
  taskPosts?: LinkerPost[];
  milestonesForGoal?: Record<number, LinkerPost[]>;
  tasksForMilestone?: Record<number, LinkerPost[]>;
  onRelatedPostUpdate?: (postId: number, metadataUpdates: Record<string, unknown>) => void;
  onUnlinkPost?: (targetPostId: number, arrayField: string, idToRemove: number) => void;
}) {
  const name = taxonomyName.toLowerCase();

  switch (name) {
    case 'task': {
      const linkedMilestones = Array.isArray(metadata.milestoneIds)
        ? milestonePosts.filter((p) => (metadata.milestoneIds as string[]).includes(String(p.id)))
        : [];
      return (
        <div className="specialized-metadata task-metadata">
          {Boolean(metadata.isCompleted) && <span className="status-badge completed">Completed</span>}
          {Boolean(metadata.isInProgress) && <span className="status-badge in-progress">In Progress</span>}
          {Boolean(metadata.isAutoMigrating) && <span className="status-badge auto-migrate">Auto-migrate</span>}
          {linkedMilestones.length > 0 && (
            <div className="linked-posts">
              <span className="linked-posts-label">Milestones:</span>
              {linkedMilestones.map((m) => (
                <span key={m.id} className="linked-post-badge">{m.content.length > 40 ? m.content.slice(0, 40) + '…' : m.content}</span>
              ))}
            </div>
          )}
        </div>
      );
    }

    case 'goal': {
      const relatedMilestones = milestonesForGoal?.[postId] || [];
      return (
        <div className="specialized-metadata goal-metadata">
          {Boolean(metadata.type) && <span className="status-badge">{formatLabel(String(metadata.type))}</span>}
          {Boolean(metadata.status) && <span className={`status-badge ${String(metadata.status)}`}>{formatLabel(String(metadata.status))}</span>}
          {Boolean(metadata.targetDate) && (
            <span className="metadata-detail">Target: {formatDateValue(String(metadata.targetDate))}</span>
          )}
          {relatedMilestones.length > 0 && (
            <LinkedItems
              items={relatedMilestones}
              label="Milestones"
              onToggleComplete={(id, completed) => {
                onRelatedPostUpdate?.(id, {
                  isCompleted: completed,
                  completedAt: completed ? new Date().toISOString() : null,
                });
              }}
              onRemove={(milestoneId) => {
                onUnlinkPost?.(milestoneId, 'goalIds', postId);
              }}
            />
          )}
        </div>
      );
    }

    case 'milestone': {
      const linkedGoals = Array.isArray(metadata.goalIds)
        ? goalPosts.filter((p) => (metadata.goalIds as string[]).includes(String(p.id)))
        : [];
      const relatedTasks = tasksForMilestone?.[postId] || [];
      return (
        <div className="specialized-metadata milestone-metadata">
          {Boolean(metadata.isCompleted) && <span className="status-badge completed">Completed</span>}
          {Boolean(metadata.completedAt) && (
            <span className="metadata-detail">Completed on {formatDateValue(String(metadata.completedAt))}</span>
          )}
          {linkedGoals.length > 0 && (
            <div className="linked-posts">
              <span className="linked-posts-label">Goals:</span>
              {linkedGoals.map((g) => (
                <span key={g.id} className="linked-post-badge">{g.content.length > 40 ? g.content.slice(0, 40) + '…' : g.content}</span>
              ))}
            </div>
          )}
          {relatedTasks.length > 0 && (
            <LinkedItems
              items={relatedTasks}
              label="Tasks"
              onToggleComplete={(id, completed) => {
                onRelatedPostUpdate?.(id, { isCompleted: completed });
              }}
              onRemove={(taskId) => {
                onUnlinkPost?.(taskId, 'milestoneIds', postId);
              }}
            />
          )}
        </div>
      );
    }

    case 'event':
    case 'meeting':
      return (
        <div className="specialized-metadata event-metadata">
          {Boolean(metadata.startDate) && (
            <span className="metadata-detail">
              {formatDateValue(String(metadata.startDate))}{metadata.startTime ? ` at ${formatTimeValue(String(metadata.startTime))}` : ''}
            </span>
          )}
          {Boolean(metadata.location) && <span className="metadata-detail">{String(metadata.location)}</span>}
          {Boolean(metadata.address) && <span className="metadata-detail">{String(metadata.address)}</span>}
          {Boolean(metadata.phone) && <span className="metadata-detail">{String(metadata.phone)}</span>}
          {name === 'meeting' && Boolean(metadata.topic) && (
            <span className="metadata-detail">Topic: {String(metadata.topic)}</span>
          )}
          {name === 'meeting' && Boolean(metadata.attendees) && (
            <span className="metadata-detail">{String(metadata.attendees)}</span>
          )}
          {Boolean(metadata.notes) && <span className="metadata-detail notes">{String(metadata.notes)}</span>}
        </div>
      );

    case 'symptom':
      return (
        <div className="specialized-metadata symptom-metadata">
          <span className="severity-badge" data-severity={String(metadata.severity || 5)}>
            Severity: {String(metadata.severity || 5)}/10
          </span>
          {Boolean(metadata.occurredAt) && <span className="metadata-detail">at {formatTimeValue(String(metadata.occurredAt))}</span>}
          {Boolean(metadata.duration) && <span className="metadata-detail">{String(metadata.duration)} minutes</span>}
          {Boolean(metadata.notes) && <span className="metadata-detail notes">{String(metadata.notes)}</span>}
        </div>
      );

    case 'food':
      return (
        <div className="specialized-metadata food-metadata">
          <span className="status-badge">{formatLabel(String(metadata.mealType || ''))}</span>
          {Boolean(metadata.consumedAt) && <span className="metadata-detail">at {formatTimeValue(String(metadata.consumedAt))}</span>}
          {Boolean(metadata.ingredients) && <span className="metadata-detail">{String(metadata.ingredients)}</span>}
          {Boolean(metadata.calories) && <span className="metadata-detail">{String(metadata.calories)} cal</span>}
          {Boolean(metadata.notes) && <span className="metadata-detail notes">{String(metadata.notes)}</span>}
        </div>
      );

    case 'medication':
      return (
        <div className="specialized-metadata medication-metadata">
          {Boolean(metadata.dosage) && <span className="metadata-detail">{String(metadata.dosage)}</span>}
          <span className="status-badge">{formatLabel(String(metadata.frequency || ''))}</span>
          {Boolean(metadata.startDate) && <span className="metadata-detail">Started: {formatDateValue(String(metadata.startDate))}</span>}
          {Boolean(metadata.scheduleTimes) && Array.isArray(metadata.scheduleTimes) && metadata.scheduleTimes.length > 0 && (
            <span className="metadata-detail">Schedule: {(metadata.scheduleTimes as string[]).map(formatTimeValue).join(', ')}</span>
          )}
          {Boolean(metadata.isActive) && <span className="status-badge active">Active</span>}
          {Boolean(metadata.notes) && <span className="metadata-detail notes">{String(metadata.notes)}</span>}
        </div>
      );

    case 'exercise':
      return (
        <div className="specialized-metadata exercise-metadata">
          <span className="status-badge">{formatLabel(String(metadata.type || ''))}</span>
          {metadata.type === 'other' && Boolean(metadata.otherType) && (
            <span className="metadata-detail">({String(metadata.otherType)})</span>
          )}
          {Boolean(metadata.performedAt) && <span className="metadata-detail">at {formatTimeValue(String(metadata.performedAt))}</span>}
          {Boolean(metadata.duration) && <span className="metadata-detail">{String(metadata.duration)} min</span>}
          {Boolean(metadata.intensity) && <span className="status-badge">{formatLabel(String(metadata.intensity))}</span>}
          {Boolean(metadata.distance) && (
            <span className="metadata-detail">
              {String(metadata.distance)} {String(metadata.distanceUnit || '')}
            </span>
          )}
          {Boolean(metadata.calories) && <span className="metadata-detail">{String(metadata.calories)} cal</span>}
          {Boolean(metadata.notes) && <span className="metadata-detail notes">{String(metadata.notes)}</span>}
        </div>
      );

    default:
      return null;
  }
}

function formatLabel(value: string): string {
  if (!value) return '';
  return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDateValue(value: string): string {
  try {
    return new Date(value).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return value;
  }
}

function formatTimeValue(time: string): string {
  if (!time) return '';
  try {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
  } catch {
    return time;
  }
}

function formatMetadataValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function formatCalendarDate(date: Date): { month: string; day: number } {
  const d = new Date(date);
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return {
    month: monthNames[d.getMonth()],
    day: d.getDate(),
  };
}

