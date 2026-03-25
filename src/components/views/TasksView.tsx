'use client';

import { useState, useMemo, useCallback } from 'react';
import type { Post, Taxonomy } from '@/lib/db';
import { ViewFilterTabs } from './ViewFilterTabs';
import { TaskCard } from './TaskCard';
import { useDragReorder } from './useDragReorder';
import {
  reorderPostsAction,
  updatePostContentAction,
  updatePostMetadataAction,
} from '@/app/(dashboard)/views/actions';

const TASK_TABS = [
  { key: 'all', label: 'All' },
  { key: 'not_started', label: 'Not Started' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
];

interface TasksViewProps {
  initialTasks: Post[];
  initialMilestones: Post[];
  taxonomies: Taxonomy[];
}

export function TasksView({ initialTasks, initialMilestones, taxonomies }: TasksViewProps) {
  const [tasks, setTasks] = useState<Post[]>(() =>
    [...initialTasks].sort((a, b) => {
      const aOrder = (a.metadata?.sortOrder as number) ?? Infinity;
      const bOrder = (b.metadata?.sortOrder as number) ?? Infinity;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })
  );
  const [milestones] = useState<Post[]>(initialMilestones);
  const [activeTab, setActiveTab] = useState('all');
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const metadata = t.metadata || {};
      switch (activeTab) {
        case 'not_started':
          return !metadata.isCompleted && !metadata.isInProgress;
        case 'in_progress':
          return Boolean(metadata.isInProgress) && !metadata.isCompleted;
        case 'completed':
          return Boolean(metadata.isCompleted);
        case 'all':
        default:
          return true;
      }
    });
  }, [tasks, activeTab]);

  const getMilestoneNamesForTask = useCallback((task: Post) => {
    const milestoneIds = (task.metadata?.milestoneIds as string[]) || [];
    return milestoneIds
      .map((mid) => milestones.find((m) => m.id === Number(mid)))
      .filter(Boolean)
      .map((m) => m!.content || '');
  }, [milestones]);

  const handleReorder = useCallback(async (reordered: Post[]) => {
    setTasks((prev) => {
      const reorderedIds = new Set(reordered.map((p) => p.id));
      const rest = prev.filter((p) => !reorderedIds.has(p.id));
      return [...reordered, ...rest];
    });
    const updates = reordered.map((post, index) => ({ id: post.id, sortOrder: index }));
    await reorderPostsAction(updates);
  }, []);

  const { getDragProps, getDropProps, dragIndex, hoverIndex } = useDragReorder(filteredTasks, handleReorder);

  const handleStatusChange = useCallback(async (taskId: number, newStatus: string) => {
    const isCompleted = newStatus === 'completed';
    const isInProgress = newStatus === 'in_progress';
    setTasks((prev) => prev.map((t) =>
      t.id === taskId ? { ...t, metadata: { ...t.metadata, isCompleted, isInProgress } } : t
    ));
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      await updatePostMetadataAction(taskId, { isCompleted, isInProgress });
    }
  }, [tasks]);

  const handleSaveTask = useCallback(async (taskId: number, content: string) => {
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, content } : t));
    setEditingTaskId(null);
    await updatePostContentAction(taskId, content);
  }, []);

  return (
    <div className="view-page">
      <div className="view-page-header">
        <h1 className="view-page-title">Tasks</h1>
      </div>

      <ViewFilterTabs tabs={TASK_TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="view-card-list">
        {filteredTasks.map((task, index) => (
          <TaskCard
            key={task.id}
            task={task}
            milestoneNames={getMilestoneNamesForTask(task)}
            isEditing={editingTaskId === task.id}
            onEdit={() => setEditingTaskId(task.id)}
            onCancelEdit={() => setEditingTaskId(null)}
            onSave={handleSaveTask}
            onStatusChange={handleStatusChange}
            dragHandleProps={getDragProps(index)}
            dropProps={getDropProps(index)}
            isDragging={dragIndex === index}
            isDragOver={hoverIndex === index && dragIndex !== index}
          />
        ))}

        {filteredTasks.length === 0 && (
          <div className="view-empty-state">
            <p>No tasks found. Create a post with the Task topic to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
