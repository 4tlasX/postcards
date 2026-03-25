'use client';

import { useState, useMemo, useCallback } from 'react';
import type { Post, Taxonomy } from '@/lib/db';
import { ViewFilterTabs } from './ViewFilterTabs';
import { GoalCard } from './GoalCard';
import { useDragReorder } from './useDragReorder';
import {
  reorderPostsAction,
  toggleCompleteAction,
  updateGoalStatusAction,
  createLinkedPostAction,
  unlinkPostAction,
  updatePostContentAction,
  updateGoalAction,
  updatePostMetadataAction,
} from '@/app/(dashboard)/views/actions';

const GOAL_TABS = [
  { key: 'active', label: 'Active' },
  { key: 'short_term', label: 'Short-term' },
  { key: 'long_term', label: 'Long-term' },
  { key: 'completed', label: 'Completed' },
  { key: 'all', label: 'All' },
];

interface GoalsViewProps {
  initialGoals: Post[];
  initialMilestones: Post[];
  taxonomies: Taxonomy[];
}

export function GoalsView({ initialGoals, initialMilestones, taxonomies }: GoalsViewProps) {
  const [goals, setGoals] = useState<Post[]>(() =>
    [...initialGoals].sort((a, b) => {
      const aOrder = (a.metadata?.sortOrder as number) ?? Infinity;
      const bOrder = (b.metadata?.sortOrder as number) ?? Infinity;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })
  );
  const [milestones, setMilestones] = useState<Post[]>(initialMilestones);
  const [activeTab, setActiveTab] = useState('active');
  const [editingGoalId, setEditingGoalId] = useState<number | null>(null);

  const filteredGoals = useMemo(() => {
    return goals.filter((goal) => {
      const metadata = goal.metadata || {};
      switch (activeTab) {
        case 'active':
          return metadata._active !== false;
        case 'short_term':
          return metadata.type === 'short_term' || (!metadata.type);
        case 'long_term':
          return metadata.type === 'long_term';
        case 'completed':
          return metadata.status === 'completed';
        case 'all':
        default:
          return true;
      }
    });
  }, [goals, activeTab]);

  const getMilestonesForGoal = useCallback((goalId: number) => {
    return milestones.filter((m) => {
      const goalIds = (m.metadata?.goalIds as string[]) || [];
      return goalIds.includes(String(goalId));
    });
  }, [milestones]);

  const handleReorder = useCallback(async (reordered: Post[]) => {
    setGoals((prev) => {
      // Replace the filtered items in the full list
      const unfilteredIds = new Set(reordered.map((p) => p.id));
      const rest = prev.filter((p) => !unfilteredIds.has(p.id));
      return [...reordered, ...rest];
    });

    const updates = reordered.map((post, index) => ({ id: post.id, sortOrder: index }));
    await reorderPostsAction(updates);
  }, []);

  const { getDragProps, getDropProps, dragIndex, hoverIndex } = useDragReorder(filteredGoals, handleReorder);

  const handleStatusChange = useCallback(async (goalId: number, newStatus: string) => {
    setGoals((prev) => prev.map((g) =>
      g.id === goalId ? { ...g, metadata: { ...g.metadata, status: newStatus } } : g
    ));
    await updateGoalStatusAction(goalId, newStatus);
  }, []);

  const handleTypeChange = useCallback(async (goalId: number, newType: string) => {
    setGoals((prev) => prev.map((g) =>
      g.id === goalId ? { ...g, metadata: { ...g.metadata, type: newType } } : g
    ));
    await updatePostMetadataAction(goalId, { type: newType });
  }, []);

  const handleToggleActive = useCallback(async (goalId: number, active: boolean) => {
    setGoals((prev) => prev.map((g) =>
      g.id === goalId ? { ...g, metadata: { ...g.metadata, _active: active } } : g
    ));
    await updatePostMetadataAction(goalId, { _active: active });
  }, []);

  const handleToggleMilestoneComplete = useCallback(async (milestoneId: number, completed: boolean) => {
    setMilestones((prev) => prev.map((m) =>
      m.id === milestoneId
        ? { ...m, metadata: { ...m.metadata, isCompleted: completed, completedAt: completed ? new Date().toISOString() : null } }
        : m
    ));
    await toggleCompleteAction(milestoneId, completed, 'milestone');
  }, []);

  const handleAddMilestone = useCallback(async (goalId: number, content: string) => {
    const result = await createLinkedPostAction(content, 'milestone', 'goalIds', goalId);
    if (result.success && result.post) {
      setMilestones((prev) => [...prev, result.post!]);
    }
  }, []);

  const handleRemoveMilestone = useCallback(async (milestoneId: number, goalId: number) => {
    setMilestones((prev) => prev.map((m) => {
      if (m.id !== milestoneId) return m;
      const currentGoalIds = (m.metadata?.goalIds as string[]) || [];
      return { ...m, metadata: { ...m.metadata, goalIds: currentGoalIds.filter((id) => String(id) !== String(goalId)) } };
    }));
    await unlinkPostAction(milestoneId, 'goalIds', goalId);
  }, []);

  const handleSaveGoal = useCallback(async (goalId: number, content: string, metadataUpdates: { type: string; status: string; targetDate: string | null }) => {
    setGoals((prev) => prev.map((g) =>
      g.id === goalId ? { ...g, content, metadata: { ...g.metadata, ...metadataUpdates } } : g
    ));
    setEditingGoalId(null);
    await updateGoalAction(goalId, content, metadataUpdates);
  }, []);

  const handleEditMilestone = useCallback(async (milestoneId: number, content: string) => {
    setMilestones((prev) => prev.map((m) => m.id === milestoneId ? { ...m, content } : m));
    await updatePostContentAction(milestoneId, content);
  }, []);

  return (
    <div className="view-page">
      <div className="view-page-header">
        <h1 className="view-page-title">Goals</h1>
      </div>

      <ViewFilterTabs tabs={GOAL_TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="view-card-list">
        {filteredGoals.map((goal, index) => (
          <GoalCard
            key={goal.id}
            goal={goal}
            milestones={getMilestonesForGoal(goal.id)}
            isEditing={editingGoalId === goal.id}
            onEdit={() => setEditingGoalId(goal.id)}
            onCancelEdit={() => setEditingGoalId(null)}
            onSave={handleSaveGoal}
            onStatusChange={handleStatusChange}
            onTypeChange={handleTypeChange}
            onToggleActive={handleToggleActive}
            onToggleMilestoneComplete={handleToggleMilestoneComplete}
            onAddMilestone={handleAddMilestone}
            onRemoveMilestone={handleRemoveMilestone}
            onEditMilestone={handleEditMilestone}
            dragHandleProps={getDragProps(index)}
            dropProps={getDropProps(index)}
            isDragging={dragIndex === index}
            isDragOver={hoverIndex === index && dragIndex !== index}
          />
        ))}

        {filteredGoals.length === 0 && (
          <div className="view-empty-state">
            <p>No goals found. Create a post with the Goal topic to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
