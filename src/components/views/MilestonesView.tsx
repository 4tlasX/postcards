'use client';

import { useState, useMemo, useCallback } from 'react';
import type { Post, Taxonomy } from '@/lib/db';
import { ViewFilterTabs } from './ViewFilterTabs';
import { MilestoneCard } from './MilestoneCard';
import { useDragReorder } from './useDragReorder';
import {
  reorderPostsAction,
  toggleCompleteAction,
  createLinkedPostAction,
  unlinkPostAction,
  updatePostContentAction,
} from '@/app/(dashboard)/views/actions';

const MILESTONE_TABS = [
  { key: 'all', label: 'All' },
  { key: 'not_started', label: 'Not Started' },
  { key: 'completed', label: 'Completed' },
];

interface MilestonesViewProps {
  initialMilestones: Post[];
  initialTasks: Post[];
  initialGoals: Post[];
  taxonomies: Taxonomy[];
}

export function MilestonesView({ initialMilestones, initialTasks, initialGoals, taxonomies }: MilestonesViewProps) {
  const [milestones, setMilestones] = useState<Post[]>(() =>
    [...initialMilestones].sort((a, b) => {
      const aOrder = (a.metadata?.sortOrder as number) ?? Infinity;
      const bOrder = (b.metadata?.sortOrder as number) ?? Infinity;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })
  );
  const [tasks, setTasks] = useState<Post[]>(initialTasks);
  const [goals] = useState<Post[]>(initialGoals);
  const [activeTab, setActiveTab] = useState('all');
  const [editingMilestoneId, setEditingMilestoneId] = useState<number | null>(null);

  const filteredMilestones = useMemo(() => {
    return milestones.filter((m) => {
      switch (activeTab) {
        case 'not_started':
          return !m.metadata?.isCompleted;
        case 'completed':
          return Boolean(m.metadata?.isCompleted);
        case 'all':
        default:
          return true;
      }
    });
  }, [milestones, activeTab]);

  const getTasksForMilestone = useCallback((milestoneId: number) => {
    return tasks.filter((t) => {
      const milestoneIds = (t.metadata?.milestoneIds as string[]) || [];
      return milestoneIds.includes(String(milestoneId));
    });
  }, [tasks]);

  const getGoalNamesForMilestone = useCallback((milestone: Post) => {
    const goalIds = (milestone.metadata?.goalIds as string[]) || [];
    return goalIds
      .map((gid) => goals.find((g) => g.id === Number(gid)))
      .filter(Boolean)
      .map((g) => g!.content || '');
  }, [goals]);

  const handleReorder = useCallback(async (reordered: Post[]) => {
    setMilestones((prev) => {
      const reorderedIds = new Set(reordered.map((p) => p.id));
      const rest = prev.filter((p) => !reorderedIds.has(p.id));
      return [...reordered, ...rest];
    });
    const updates = reordered.map((post, index) => ({ id: post.id, sortOrder: index }));
    await reorderPostsAction(updates);
  }, []);

  const { getDragProps, getDropProps, dragIndex, hoverIndex } = useDragReorder(filteredMilestones, handleReorder);

  const handleToggleComplete = useCallback(async (milestoneId: number, completed: boolean) => {
    setMilestones((prev) => prev.map((m) =>
      m.id === milestoneId
        ? { ...m, metadata: { ...m.metadata, isCompleted: completed, completedAt: completed ? new Date().toISOString() : null } }
        : m
    ));
    await toggleCompleteAction(milestoneId, completed, 'milestone');
  }, []);

  const handleToggleTaskComplete = useCallback(async (taskId: number, completed: boolean) => {
    setTasks((prev) => prev.map((t) =>
      t.id === taskId ? { ...t, metadata: { ...t.metadata, isCompleted: completed } } : t
    ));
    await toggleCompleteAction(taskId, completed, 'task');
  }, []);

  const handleAddTask = useCallback(async (milestoneId: number, content: string) => {
    const result = await createLinkedPostAction(content, 'task', 'milestoneIds', milestoneId);
    if (result.success && result.post) {
      setTasks((prev) => [...prev, result.post!]);
    }
  }, []);

  const handleRemoveTask = useCallback(async (taskId: number, milestoneId: number) => {
    setTasks((prev) => prev.map((t) => {
      if (t.id !== taskId) return t;
      const currentMilestoneIds = (t.metadata?.milestoneIds as string[]) || [];
      return { ...t, metadata: { ...t.metadata, milestoneIds: currentMilestoneIds.filter((id) => String(id) !== String(milestoneId)) } };
    }));
    await unlinkPostAction(taskId, 'milestoneIds', milestoneId);
  }, []);

  const handleSaveMilestone = useCallback(async (milestoneId: number, content: string) => {
    setMilestones((prev) => prev.map((m) => m.id === milestoneId ? { ...m, content } : m));
    setEditingMilestoneId(null);
    await updatePostContentAction(milestoneId, content);
  }, []);

  const handleEditTask = useCallback(async (taskId: number, content: string) => {
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, content } : t));
    await updatePostContentAction(taskId, content);
  }, []);

  return (
    <div className="view-page">
      <div className="view-page-header">
        <h1 className="view-page-title">Milestones</h1>
      </div>

      <ViewFilterTabs tabs={MILESTONE_TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="view-card-list">
        {filteredMilestones.map((milestone, index) => (
          <MilestoneCard
            key={milestone.id}
            milestone={milestone}
            tasks={getTasksForMilestone(milestone.id)}
            goalNames={getGoalNamesForMilestone(milestone)}
            isEditing={editingMilestoneId === milestone.id}
            onEdit={() => setEditingMilestoneId(milestone.id)}
            onCancelEdit={() => setEditingMilestoneId(null)}
            onSave={handleSaveMilestone}
            onToggleComplete={handleToggleComplete}
            onToggleTaskComplete={handleToggleTaskComplete}
            onAddTask={handleAddTask}
            onRemoveTask={handleRemoveTask}
            onEditTask={handleEditTask}
            dragHandleProps={getDragProps(index)}
            dropProps={getDropProps(index)}
            isDragging={dragIndex === index}
            isDragOver={hoverIndex === index && dragIndex !== index}
          />
        ))}

        {filteredMilestones.length === 0 && (
          <div className="view-empty-state">
            <p>No milestones found. Create a post with the Milestone topic to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
