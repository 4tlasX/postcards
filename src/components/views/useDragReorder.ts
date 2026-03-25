import { useState, useCallback, useRef } from 'react';

interface DragState {
  dragIndex: number | null;
  hoverIndex: number | null;
}

export function useDragReorder<T>(
  items: T[],
  onReorder: (reordered: T[]) => void
) {
  const [dragState, setDragState] = useState<DragState>({ dragIndex: null, hoverIndex: null });
  const dragNodeRef = useRef<HTMLElement | null>(null);

  const handleDragStart = useCallback((index: number, e: React.DragEvent) => {
    dragNodeRef.current = e.currentTarget as HTMLElement;
    e.dataTransfer.effectAllowed = 'move';
    // Set a transparent drag image to use CSS styling instead
    const img = new Image();
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    e.dataTransfer.setDragImage(img, 0, 0);
    setDragState({ dragIndex: index, hoverIndex: index });
  }, []);

  const handleDragOver = useCallback((index: number, e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragState((prev) => ({ ...prev, hoverIndex: index }));
  }, []);

  const handleDragEnd = useCallback(() => {
    const { dragIndex, hoverIndex } = dragState;
    if (dragIndex !== null && hoverIndex !== null && dragIndex !== hoverIndex) {
      const reordered = [...items];
      const [moved] = reordered.splice(dragIndex, 1);
      reordered.splice(hoverIndex, 0, moved);
      onReorder(reordered);
    }
    dragNodeRef.current = null;
    setDragState({ dragIndex: null, hoverIndex: null });
  }, [dragState, items, onReorder]);

  const getDragProps = useCallback((index: number) => ({
    onDragStart: (e: React.DragEvent) => handleDragStart(index, e),
    onDragEnd: handleDragEnd,
  }), [handleDragStart, handleDragEnd]);

  const getDropProps = useCallback((index: number) => ({
    onDragOver: (e: React.DragEvent) => handleDragOver(index, e),
  }), [handleDragOver]);

  return {
    dragIndex: dragState.dragIndex,
    hoverIndex: dragState.hoverIndex,
    isDragging: dragState.dragIndex !== null,
    getDragProps,
    getDropProps,
  };
}
