'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { Taxonomy, SerializedPostWithEncryption, DisplayPost } from '@/lib/db';
import { EditablePostCard } from '@/components/post';
import { TopicSidebar } from '@/components/topic';
import { SearchSidebar } from '@/components/search';
import { loadMorePostsAction, createPostAction, updatePostAction, deletePostAction } from './posts/actions';
import { createTopicAction, updateTopicAction, deleteTopicAction } from './topics/actions';
import { useUIStore } from '@/stores';
import { useEncryption, UnlockDialog } from '@/components/encryption';
import type { EncryptedPost, DecryptedPost } from '@/lib/crypto';
import type { LinkerPost } from '@/components/form';

interface PostCardFeedProps {
  initialPosts: SerializedPostWithEncryption[];
  taxonomies: Taxonomy[];
  hasMore: boolean;
}

// Helper to convert server posts to EncryptedPost format for decryption
function toEncryptedPost(post: SerializedPostWithEncryption): EncryptedPost {
  return {
    id: post.id,
    content: post.content ?? undefined,
    metadata: post.metadata ?? undefined,
    contentEncrypted: post.contentEncrypted,
    contentIv: post.contentIv,
    metadataEncrypted: post.metadataEncrypted,
    metadataIv: post.metadataIv,
    isEncrypted: post.isEncrypted,
    createdAt: post.createdAt,
    updatedAt: post.createdAt, // Use createdAt as fallback
  };
}

// Helper to convert DecryptedPost back to SerializedPostWithEncryption format
function toSerializedPost(decrypted: DecryptedPost): SerializedPostWithEncryption {
  return {
    id: decrypted.id,
    content: decrypted.content,
    metadata: decrypted.metadata,
    contentEncrypted: null,
    contentIv: null,
    metadataEncrypted: null,
    metadataIv: null,
    isEncrypted: false, // After decryption, treat as unencrypted for display
    createdAt: decrypted.createdAt,
  };
}

export function PostCardFeed({
  initialPosts,
  taxonomies: initialTaxonomies,
  hasMore: initialHasMore,
}: PostCardFeedProps) {
  const { isUnlocked, encryptionEnabled, decryptPosts, encryptPost } = useEncryption();

  const [posts, setPosts] = useState<SerializedPostWithEncryption[]>(initialPosts);
  const [taxonomies, setTaxonomies] = useState<Taxonomy[]>(initialTaxonomies);
  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [showUnlockDialog, setShowUnlockDialog] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const hasDecryptedRef = useRef(false);

  // Check if we need to show unlock dialog (encrypted posts exist but not unlocked)
  const hasEncryptedPosts = useMemo(() => {
    return initialPosts.some((post) => post.isEncrypted);
  }, [initialPosts]);

  // Decrypt posts when unlocked
  useEffect(() => {
    if (isUnlocked && hasEncryptedPosts && !hasDecryptedRef.current) {
      hasDecryptedRef.current = true;
      setIsDecrypting(true);
      const encryptedPosts = initialPosts.map(toEncryptedPost);
      decryptPosts(encryptedPosts)
        .then((decrypted) => {
          setPosts(decrypted.map(toSerializedPost));
          setIsDecrypting(false);
        })
        .catch(() => {
          setIsDecrypting(false);
        });
    }
  }, [isUnlocked, hasEncryptedPosts, initialPosts, decryptPosts]);

  // Show unlock dialog if needed
  useEffect(() => {
    if (encryptionEnabled && hasEncryptedPosts && !isUnlocked) {
      setShowUnlockDialog(true);
    }
  }, [encryptionEnabled, hasEncryptedPosts, isUnlocked]);

  const loadMoreRef = useRef<HTMLDivElement>(null);
  const lastTriggerRef = useRef(0);

  // Listen for create post trigger from header button
  const createPostTrigger = useUIStore((state) => state.createPostTrigger);
  const selectedTopicId = useUIStore((state) => state.selectedTopicId);

  // Sidebar states for content displacement
  const isTopicSidebarOpen = useUIStore((state) => state.isTopicSidebarOpen);
  const isSearchSidebarOpen = useUIStore((state) => state.isSearchSidebarOpen);
  const isSidebarOpen = isTopicSidebarOpen || isSearchSidebarOpen;

  // Search filters
  const searchKeyword = useUIStore((state) => state.searchKeyword);
  const searchDateFrom = useUIStore((state) => state.searchDateFrom);
  const searchDateTo = useUIStore((state) => state.searchDateTo);

  useEffect(() => {
    // Only trigger if this is a NEW trigger (different from last one we handled)
    if (createPostTrigger > lastTriggerRef.current && !isCreating && editingPostId === null) {
      lastTriggerRef.current = createPostTrigger;
      setIsCreating(true);
    }
  }, [createPostTrigger, isCreating, editingPostId]);

  // Taxonomy lookup helper
  const getTaxonomyForPost = useCallback(
    (post: DisplayPost): Taxonomy | null => {
      const taxonomyId = post.metadata?._taxonomyId as number | undefined;
      if (!taxonomyId) return null;
      return taxonomies.find((t) => t.id === taxonomyId) || null;
    },
    [taxonomies]
  );

  // Filter posts by selected topic and search criteria
  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      // Filter by topic
      if (selectedTopicId !== null) {
        const taxonomyId = post.metadata?._taxonomyId as number | undefined;
        if (taxonomyId !== selectedTopicId) return false;
      }

      // Filter by keyword (searches content and metadata)
      if (searchKeyword) {
        const keyword = searchKeyword.toLowerCase();
        const contentMatch = post.content?.toLowerCase().includes(keyword);
        const metadataMatch = post.metadata
          ? JSON.stringify(post.metadata).toLowerCase().includes(keyword)
          : false;
        if (!contentMatch && !metadataMatch) return false;
      }

      // Filter by date range
      if (searchDateFrom || searchDateTo) {
        const postDate = new Date(post.createdAt);
        if (searchDateFrom) {
          const fromDate = new Date(searchDateFrom);
          if (postDate < fromDate) return false;
        }
        if (searchDateTo) {
          const toDate = new Date(searchDateTo);
          toDate.setHours(23, 59, 59, 999); // Include the entire end date
          if (postDate > toDate) return false;
        }
      }

      return true;
    });
  }, [posts, selectedTopicId, searchKeyword, searchDateFrom, searchDateTo]);

  // Derive milestone, goal, and task posts for linking UI
  const milestonePosts = useMemo(() => {
    const milestoneTax = taxonomies.find((t) => t.name.toLowerCase() === 'milestone');
    if (!milestoneTax) return [];
    return posts
      .filter((p) => (p.metadata?._taxonomyId as number | undefined) === milestoneTax.id)
      .map((p) => ({ id: p.id, content: p.content || '', isCompleted: Boolean(p.metadata?.isCompleted) }));
  }, [posts, taxonomies]);

  const goalPosts = useMemo(() => {
    const goalTax = taxonomies.find((t) => t.name.toLowerCase() === 'goal');
    if (!goalTax) return [];
    return posts
      .filter((p) => (p.metadata?._taxonomyId as number | undefined) === goalTax.id)
      .map((p) => ({ id: p.id, content: p.content || '', isCompleted: p.metadata?.status === 'completed' }));
  }, [posts, taxonomies]);

  const taskPosts = useMemo(() => {
    const taskTax = taxonomies.find((t) => t.name.toLowerCase() === 'task');
    if (!taskTax) return [];
    return posts
      .filter((p) => (p.metadata?._taxonomyId as number | undefined) === taskTax.id)
      .map((p) => ({ id: p.id, content: p.content || '', isCompleted: Boolean(p.metadata?.isCompleted) }));
  }, [posts, taxonomies]);

  // Reverse lookups: milestones that reference each goal, tasks that reference each milestone
  const milestonesForGoal = useMemo(() => {
    const map: Record<number, LinkerPost[]> = {};
    const milestoneTax = taxonomies.find((t) => t.name.toLowerCase() === 'milestone');
    if (!milestoneTax) return map;
    posts.forEach((p) => {
      if ((p.metadata?._taxonomyId as number | undefined) !== milestoneTax.id) return;
      const goalIds = (p.metadata?.goalIds as string[]) || [];
      goalIds.forEach((gid) => {
        const goalId = Number(gid);
        if (!map[goalId]) map[goalId] = [];
        map[goalId].push({ id: p.id, content: p.content || '', isCompleted: Boolean(p.metadata?.isCompleted) });
      });
    });
    return map;
  }, [posts, taxonomies]);

  const tasksForMilestone = useMemo(() => {
    const map: Record<number, LinkerPost[]> = {};
    const taskTax = taxonomies.find((t) => t.name.toLowerCase() === 'task');
    if (!taskTax) return map;
    posts.forEach((p) => {
      if ((p.metadata?._taxonomyId as number | undefined) !== taskTax.id) return;
      const milestoneIds = (p.metadata?.milestoneIds as string[]) || [];
      milestoneIds.forEach((mid) => {
        const milestoneId = Number(mid);
        if (!map[milestoneId]) map[milestoneId] = [];
        map[milestoneId].push({ id: p.id, content: p.content || '', isCompleted: Boolean(p.metadata?.isCompleted) });
      });
    });
    return map;
  }, [posts, taxonomies]);

  // Calculate post counts per topic
  const postCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    posts.forEach((post) => {
      const taxonomyId = post.metadata?._taxonomyId as number | undefined;
      if (taxonomyId) {
        counts[taxonomyId] = (counts[taxonomyId] || 0) + 1;
      }
    });
    return counts;
  }, [posts]);

  // Load more posts (infinite scroll)
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    const result = await loadMorePostsAction(posts.length);

    if (!result.error && result.posts.length > 0) {
      setPosts((prev) => [...prev, ...result.posts]);
      setHasMore(result.hasMore);
    }
    setIsLoadingMore(false);
  }, [posts.length, isLoadingMore, hasMore]);

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, loadMore]);

  // Handle card click
  const handleCardClick = (postId: number) => {
    if (editingPostId !== null || isCreating) return;
    setEditingPostId(postId);
  };

  // Handle edit save
  const handleSave = async (formData: FormData) => {
    const result = await updatePostAction(formData);
    if (result.success && result.post) {
      setPosts((prev) =>
        prev.map((p) => (p.id === result.post!.id ? result.post! : p))
      );
    }
    setEditingPostId(null);
  };

  // Handle new post save (with encryption if unlocked)
  const handleCreateSave = async (formData: FormData) => {
    let finalFormData = formData;

    // If encryption is unlocked, encrypt the content before sending
    if (isUnlocked) {
      const content = formData.get('content') as string;
      const metadataStr = formData.get('metadata') as string;
      const taxonomyId = formData.get('taxonomyId') as string;
      const specializedMetadataStr = formData.get('specializedMetadata') as string;

      // Build metadata object
      let metadata: Record<string, unknown> = {};
      if (metadataStr?.trim()) {
        try {
          metadata = JSON.parse(metadataStr);
        } catch {
          // Invalid JSON
        }
      }
      if (taxonomyId) {
        metadata._taxonomyId = parseInt(taxonomyId, 10);
      }
      if (specializedMetadataStr?.trim()) {
        try {
          const specializedMetadata = JSON.parse(specializedMetadataStr);
          metadata = { ...metadata, ...specializedMetadata };
        } catch {
          // Invalid JSON
        }
      }

      // Encrypt content and metadata
      const encrypted = await encryptPost(content, metadata);

      // Create new FormData with encrypted payload
      finalFormData = new FormData();
      finalFormData.set('isEncrypted', 'true');
      finalFormData.set('encryptedPayload', JSON.stringify(encrypted));
    }

    const result = await createPostAction(finalFormData);
    if (result.success && result.post) {
      // Parse metadata for display
      const metadataStr = formData.get('metadata') as string;
      const taxonomyId = formData.get('taxonomyId') as string;
      const specializedMetadataStr = formData.get('specializedMetadata') as string;

      let metadata: Record<string, unknown> = {};
      if (metadataStr?.trim()) {
        try { metadata = JSON.parse(metadataStr); } catch {}
      }
      if (taxonomyId) {
        metadata._taxonomyId = parseInt(taxonomyId, 10);
      }
      if (specializedMetadataStr?.trim()) {
        try {
          const specializedMetadata = JSON.parse(specializedMetadataStr);
          metadata = { ...metadata, ...specializedMetadata };
        } catch {}
      }

      // Convert to serialized format for display
      const newPost: SerializedPostWithEncryption = {
        id: result.post.id,
        content: formData.get('content') as string, // Use original content for display
        metadata,
        contentEncrypted: null,
        contentIv: null,
        metadataEncrypted: null,
        metadataIv: null,
        isEncrypted: false, // After display, treat as plaintext
        createdAt: result.post.createdAt,
      };

      setPosts((prev) => [newPost, ...prev]);
    }
    setIsCreating(false);
  };

  // Handle create cancel
  const handleCreateCancel = () => {
    setIsCreating(false);
  };

  // Handle delete
  const handleDelete = async (postId: number) => {
    const formData = new FormData();
    formData.set('id', String(postId));
    await deletePostAction(formData);
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    setEditingPostId(null);
  };

  // Handle updating a related post's metadata (mark complete, unlink)
  const handleRelatedPostUpdate = useCallback(async (postId: number, metadataUpdates: Record<string, unknown>) => {
    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    const updatedMetadata = { ...post.metadata, ...metadataUpdates };
    const formData = new FormData();
    formData.set('id', String(postId));
    formData.set('content', post.content || '');
    formData.set('metadata', JSON.stringify(updatedMetadata));

    const result = await updatePostAction(formData);
    if (result.success && result.post) {
      setPosts((prev) => prev.map((p) => (p.id === postId ? result.post! : p)));
    }
  }, [posts]);

  // Handle unlinking: remove an ID from an array field in a related post's metadata
  const handleUnlinkPost = useCallback(async (targetPostId: number, arrayField: string, idToRemove: number) => {
    const post = posts.find((p) => p.id === targetPostId);
    if (!post) return;

    const currentArray = (post.metadata?.[arrayField] as string[]) || [];
    const updatedArray = currentArray.filter((id) => String(id) !== String(idToRemove));
    const updatedMetadata = { ...post.metadata, [arrayField]: updatedArray };

    const formData = new FormData();
    formData.set('id', String(targetPostId));
    formData.set('content', post.content || '');
    formData.set('metadata', JSON.stringify(updatedMetadata));

    const result = await updatePostAction(formData);
    if (result.success && result.post) {
      setPosts((prev) => prev.map((p) => (p.id === targetPostId ? result.post! : p)));
    }
  }, [posts]);

  // Topic sidebar handlers
  const handleCreateTopic = async (formData: FormData) => {
    const result = await createTopicAction(formData);
    if (result.success) {
      // Refresh taxonomies - for now just add a placeholder, ideally would refetch
      const name = formData.get('name') as string;
      const icon = formData.get('icon') as string;
      const newTaxonomy: Taxonomy = {
        id: Date.now(), // Temporary ID
        name,
        icon: icon || null,
        color: null,
      };
      setTaxonomies((prev) => [...prev, newTaxonomy]);
    }
    return result;
  };

  const handleUpdateTopic = async (formData: FormData) => {
    const result = await updateTopicAction(formData);
    if (result.success) {
      const id = parseInt(formData.get('id') as string, 10);
      const name = formData.get('name') as string;
      const icon = formData.get('icon') as string;
      setTaxonomies((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, name: name || t.name, icon: icon || t.icon } : t
        )
      );
    }
    return result;
  };

  const handleDeleteTopic = async (formData: FormData) => {
    const result = await deleteTopicAction(formData);
    if (result.success) {
      const id = parseInt(formData.get('id') as string, 10);
      setTaxonomies((prev) => prev.filter((t) => t.id !== id));
    }
    return result;
  };

  // Get selected topic name for empty state
  const selectedTopic = selectedTopicId
    ? taxonomies.find((t) => t.id === selectedTopicId)
    : null;

  const handleUnlockSuccess = () => {
    setShowUnlockDialog(false);
  };

  return (
    <div className={`post-card-feed-container ${isSidebarOpen ? 'sidebar-open' : ''}`}>
      {/* Unlock Dialog for encrypted posts */}
      <UnlockDialog
        isOpen={showUnlockDialog}
        onSuccess={handleUnlockSuccess}
      />

      <TopicSidebar
        taxonomies={taxonomies}
        postCounts={postCounts}
        onCreateTopic={handleCreateTopic}
        onUpdateTopic={handleUpdateTopic}
        onDeleteTopic={handleDeleteTopic}
      />
      <SearchSidebar />

      <div className="post-card-feed">
        {/* New post card (triggered by header button) */}
        {isCreating && (
          <div className="post-card-wrapper editing">
            <EditablePostCard
              post={{
                id: -1,
                content: '',
                metadata: {},
                createdAt: new Date(),
              }}
              taxonomy={null}
              taxonomies={taxonomies}
              isEditing={true}
              isNew={true}
              onStartEdit={() => {}}
              onSave={handleCreateSave}
              onDelete={() => {}}
              onCancel={handleCreateCancel}
              milestonePosts={milestonePosts}
              goalPosts={goalPosts}
              taskPosts={taskPosts}
              milestonesForGoal={milestonesForGoal}
              tasksForMilestone={tasksForMilestone}
              onRelatedPostUpdate={handleRelatedPostUpdate}
              onUnlinkPost={handleUnlinkPost}
            />
          </div>
        )}

        {/* Post cards */}
        {filteredPosts.map((post) => (
          <div
            key={post.id}
            className={`post-card-wrapper ${editingPostId === post.id ? 'editing' : ''}`}
          >
            <EditablePostCard
              post={post}
              taxonomy={getTaxonomyForPost(post)}
              taxonomies={taxonomies}
              isEditing={editingPostId === post.id}
              onStartEdit={() => handleCardClick(post.id)}
              onSave={handleSave}
              onDelete={handleDelete}
              onCancelEdit={() => setEditingPostId(null)}
              milestonePosts={milestonePosts}
              goalPosts={goalPosts}
              taskPosts={taskPosts}
              milestonesForGoal={milestonesForGoal}
              tasksForMilestone={tasksForMilestone}
              onRelatedPostUpdate={handleRelatedPostUpdate}
              onUnlinkPost={handleUnlinkPost}
            />
          </div>
        ))}

        {/* Infinite scroll trigger */}
        {hasMore && (
          <div ref={loadMoreRef} className="load-more-trigger">
            {isLoadingMore && <div className="load-more-spinner" />}
          </div>
        )}

        {/* Empty state */}
        {filteredPosts.length === 0 && !isCreating && (
          <div className="empty-state">
            {selectedTopic ? (
              <p>No posts with topic "{selectedTopic.name}" yet.</p>
            ) : (
              <p>No posts yet. Click the button above to create your first post.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
