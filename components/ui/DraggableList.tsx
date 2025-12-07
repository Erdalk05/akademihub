'use client';

import React, { useState, useCallback } from 'react';
import { GripVertical } from 'lucide-react';

interface DraggableItem {
  id: string;
  [key: string]: any;
}

interface DraggableListProps<T extends DraggableItem> {
  items: T[];
  onReorder: (items: T[]) => void;
  renderItem: (item: T, index: number, isDragging: boolean, dragHandleProps: DragHandleProps) => React.ReactNode;
  disabled?: boolean;
}

interface DragHandleProps {
  onMouseDown: (e: React.MouseEvent) => void;
  onTouchStart: (e: React.TouchEvent) => void;
  style: React.CSSProperties;
  className: string;
}

export default function DraggableList<T extends DraggableItem>({ 
  items, 
  onReorder, 
  renderItem,
  disabled = false 
}: DraggableListProps<T>) {
  const [draggedItem, setDraggedItem] = useState<T | null>(null);
  const [draggedOverIndex, setDraggedOverIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = useCallback((e: React.DragEvent, item: T, index: number) => {
    if (disabled) return;
    
    setDraggedItem(item);
    setIsDragging(true);
    
    // Set drag image
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', item.id);
      
      // Create a ghost element
      const ghost = document.createElement('div');
      ghost.style.opacity = '0';
      document.body.appendChild(ghost);
      e.dataTransfer.setDragImage(ghost, 0, 0);
      setTimeout(() => document.body.removeChild(ghost), 0);
    }
  }, [disabled]);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (disabled || !draggedItem) return;
    
    e.dataTransfer.dropEffect = 'move';
    setDraggedOverIndex(index);
  }, [disabled, draggedItem]);

  const handleDragEnd = useCallback(() => {
    if (disabled) return;
    
    if (draggedItem && draggedOverIndex !== null) {
      const draggedIndex = items.findIndex(item => item.id === draggedItem.id);
      
      if (draggedIndex !== -1 && draggedIndex !== draggedOverIndex) {
        const newItems = [...items];
        const [removed] = newItems.splice(draggedIndex, 1);
        newItems.splice(draggedOverIndex, 0, removed);
        onReorder(newItems);
      }
    }
    
    setDraggedItem(null);
    setDraggedOverIndex(null);
    setIsDragging(false);
  }, [disabled, draggedItem, draggedOverIndex, items, onReorder]);

  const handleDragLeave = useCallback(() => {
    setDraggedOverIndex(null);
  }, []);

  return (
    <div className="space-y-2">
      {items.map((item, index) => {
        const isCurrentlyDragged = draggedItem?.id === item.id;
        const isDropTarget = draggedOverIndex === index && !isCurrentlyDragged;
        
        const dragHandleProps: DragHandleProps = {
          onMouseDown: () => {},
          onTouchStart: () => {},
          style: { cursor: disabled ? 'default' : 'grab' },
          className: `flex-shrink-0 p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition ${
            disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'
          }`,
        };

        return (
          <div
            key={item.id}
            draggable={!disabled}
            onDragStart={(e) => handleDragStart(e, item, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            onDragLeave={handleDragLeave}
            className={`
              transition-all duration-200 ease-out
              ${isCurrentlyDragged ? 'opacity-50 scale-95' : ''}
              ${isDropTarget ? 'transform translate-y-1' : ''}
            `}
          >
            {/* Drop indicator */}
            {isDropTarget && (
              <div className="h-1 bg-indigo-500 rounded-full mb-2 animate-pulse" />
            )}
            
            {renderItem(item, index, isDragging && isCurrentlyDragged, dragHandleProps)}
          </div>
        );
      })}
    </div>
  );
}

// Drag handle component
export function DragHandle({ disabled = false }: { disabled?: boolean }) {
  return (
    <div 
      className={`flex-shrink-0 p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition ${
        disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'
      }`}
    >
      <GripVertical size={16} className="text-slate-400" />
    </div>
  );
}

