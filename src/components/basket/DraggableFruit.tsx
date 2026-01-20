'use client';

import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { Fruit } from '@/types';
import { CATEGORY_COLORS } from '@/lib/constants';

interface DraggableFruitProps {
  fruit: Fruit;
  disabled?: boolean;
  onClick?: () => void;
}

export function DraggableFruit({ fruit, disabled = false, onClick }: DraggableFruitProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: fruit.id,
    data: { fruit },
    disabled,
  });

  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
        zIndex: isDragging ? 50 : undefined,
      }
    : undefined;

  const colors = CATEGORY_COLORS[fruit.category];

  // Handle click separately from drag
  const handleClick = () => {
    // Only trigger onClick if it wasn't a drag
    if (!isDragging && onClick) {
      onClick();
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={handleClick}
      className={`
        relative p-3 rounded-xl bg-background border-2 transition-all cursor-grab active:cursor-grabbing
        ${isDragging ? `${colors.border} shadow-lg shadow-${fruit.category === 'red' ? 'fruit-red' : fruit.category === 'orange' ? 'fruit-orange' : fruit.category === 'yellow' ? 'fruit-yellow' : 'fruit-green'}/30 scale-105` : 'border-border hover:border-foreground-muted'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      {/* Emoji du fruit */}
      <div className={`text-3xl mb-2 ${isDragging ? 'animate-bounce' : ''}`}>
        {fruit.emoji}
      </div>

      {/* Nom */}
      <div className="text-sm font-medium text-white truncate">
        {fruit.name}
      </div>

      {/* Prix */}
      <div className={`text-xs ${colors.text}`}>
        {fruit.pricePerKg}€/kg
      </div>

      {/* Indicateur draggable */}
      {!disabled && (
        <div className="absolute top-1 right-1 opacity-30">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-foreground-muted">
            <circle cx="8" cy="6" r="2" />
            <circle cx="16" cy="6" r="2" />
            <circle cx="8" cy="12" r="2" />
            <circle cx="16" cy="12" r="2" />
            <circle cx="8" cy="18" r="2" />
            <circle cx="16" cy="18" r="2" />
          </svg>
        </div>
      )}
    </div>
  );
}
