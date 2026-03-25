'use server';

import { revalidatePath } from 'next/cache';
import { createPost, updatePost, getPost, getAllPosts, getAllTaxonomies } from '@/lib/db';
import { getServerSession } from '@/app/auth/actions';
import type { Post } from '@/lib/db';

export async function getViewDataAction() {
  const session = await getServerSession();
  if (!session) return { error: 'Not authenticated' };

  const [posts, taxonomies] = await Promise.all([
    getAllPosts(session.schemaName),
    getAllTaxonomies(session.schemaName),
  ]);

  return { posts, taxonomies };
}

export async function reorderPostsAction(updates: { id: number; sortOrder: number }[]) {
  const session = await getServerSession();
  if (!session) return { error: 'Not authenticated' };

  for (const { id, sortOrder } of updates) {
    const post = await getPost(session.schemaName, id);
    if (post) {
      await updatePost(session.schemaName, id, {
        metadata: { ...post.metadata, sortOrder },
      });
    }
  }

  revalidatePath('/goals');
  revalidatePath('/milestones');
  revalidatePath('/tasks');
  return { success: true };
}

export async function toggleCompleteAction(
  postId: number,
  completed: boolean,
  type: 'milestone' | 'task'
) {
  const session = await getServerSession();
  if (!session) return { error: 'Not authenticated' };

  const post = await getPost(session.schemaName, postId);
  if (!post) return { error: 'Post not found' };

  const metadataUpdates: Record<string, unknown> = { isCompleted: completed };
  if (type === 'milestone') {
    metadataUpdates.completedAt = completed ? new Date().toISOString() : null;
  }

  await updatePost(session.schemaName, postId, {
    metadata: { ...post.metadata, ...metadataUpdates },
  });

  revalidatePath('/goals');
  revalidatePath('/milestones');
  revalidatePath('/tasks');
  return { success: true, post: { ...post, metadata: { ...post.metadata, ...metadataUpdates } } };
}

export async function updateGoalStatusAction(postId: number, status: string) {
  const session = await getServerSession();
  if (!session) return { error: 'Not authenticated' };

  const post = await getPost(session.schemaName, postId);
  if (!post) return { error: 'Post not found' };

  await updatePost(session.schemaName, postId, {
    metadata: { ...post.metadata, status },
  });

  revalidatePath('/goals');
  return { success: true };
}

export async function createLinkedPostAction(
  content: string,
  taxonomyName: string,
  linkField: string,
  linkToId: number
) {
  const session = await getServerSession();
  if (!session) return { error: 'Not authenticated' };

  const taxonomies = await getAllTaxonomies(session.schemaName);
  const taxonomy = taxonomies.find((t) => t.name.toLowerCase() === taxonomyName.toLowerCase());
  if (!taxonomy) return { error: `Taxonomy "${taxonomyName}" not found` };

  const metadata: Record<string, unknown> = {
    _taxonomyId: taxonomy.id,
    [linkField]: [String(linkToId)],
  };

  // Set defaults based on type
  if (taxonomyName === 'milestone') {
    metadata.isCompleted = false;
    metadata.completedAt = null;
  } else if (taxonomyName === 'task') {
    metadata.isCompleted = false;
    metadata.isInProgress = false;
    metadata.isAutoMigrating = false;
  }

  const post = await createPost(session.schemaName, content, metadata);

  revalidatePath('/goals');
  revalidatePath('/milestones');
  revalidatePath('/tasks');
  return { success: true, post };
}

export async function unlinkPostAction(
  targetPostId: number,
  arrayField: string,
  idToRemove: number
) {
  const session = await getServerSession();
  if (!session) return { error: 'Not authenticated' };

  const post = await getPost(session.schemaName, targetPostId);
  if (!post) return { error: 'Post not found' };

  const currentArray = (post.metadata?.[arrayField] as string[]) || [];
  const updatedArray = currentArray.filter((id) => String(id) !== String(idToRemove));

  await updatePost(session.schemaName, targetPostId, {
    metadata: { ...post.metadata, [arrayField]: updatedArray },
  });

  revalidatePath('/goals');
  revalidatePath('/milestones');
  revalidatePath('/tasks');
  return { success: true };
}

export async function updatePostContentAction(postId: number, content: string) {
  const session = await getServerSession();
  if (!session) return { error: 'Not authenticated' };

  await updatePost(session.schemaName, postId, { content });

  revalidatePath('/goals');
  revalidatePath('/milestones');
  revalidatePath('/tasks');
  return { success: true };
}

export async function updatePostMetadataAction(
  postId: number,
  metadataUpdates: Record<string, unknown>
) {
  const session = await getServerSession();
  if (!session) return { error: 'Not authenticated' };

  const post = await getPost(session.schemaName, postId);
  if (!post) return { error: 'Post not found' };

  await updatePost(session.schemaName, postId, {
    metadata: { ...post.metadata, ...metadataUpdates },
  });

  revalidatePath('/goals');
  revalidatePath('/milestones');
  revalidatePath('/tasks');
  return { success: true };
}

export async function updateGoalAction(
  postId: number,
  content: string,
  metadataUpdates: { type: string; status: string; targetDate: string | null }
) {
  const session = await getServerSession();
  if (!session) return { error: 'Not authenticated' };

  const post = await getPost(session.schemaName, postId);
  if (!post) return { error: 'Post not found' };

  await updatePost(session.schemaName, postId, {
    content,
    metadata: { ...post.metadata, ...metadataUpdates },
  });

  revalidatePath('/goals');
  revalidatePath('/milestones');
  revalidatePath('/tasks');
  return { success: true };
}

export async function updateMilestoneAction(
  postId: number,
  content: string,
  isCompleted: boolean
) {
  const session = await getServerSession();
  if (!session) return { error: 'Not authenticated' };

  const post = await getPost(session.schemaName, postId);
  if (!post) return { error: 'Post not found' };

  await updatePost(session.schemaName, postId, {
    content,
    metadata: {
      ...post.metadata,
      isCompleted,
      completedAt: isCompleted ? new Date().toISOString() : null,
    },
  });

  revalidatePath('/goals');
  revalidatePath('/milestones');
  revalidatePath('/tasks');
  return { success: true };
}

export async function updateTaskAction(
  postId: number,
  content: string,
  metadataUpdates: { isCompleted: boolean; isInProgress: boolean }
) {
  const session = await getServerSession();
  if (!session) return { error: 'Not authenticated' };

  const post = await getPost(session.schemaName, postId);
  if (!post) return { error: 'Post not found' };

  await updatePost(session.schemaName, postId, {
    content,
    metadata: { ...post.metadata, ...metadataUpdates },
  });

  revalidatePath('/goals');
  revalidatePath('/milestones');
  revalidatePath('/tasks');
  return { success: true };
}
