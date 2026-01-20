'use client';

import { useDroppable } from '@dnd-kit/core';
import type { CustomBasketItem, BasketSize } from '@/types';
import { CATEGORY_COLORS } from '@/lib/constants';

interface BasketDropZoneProps {
  items: CustomBasketItem[];
  basketSize: BasketSize;
  totalWeight: number;
  onRemoveItem: (fruitId: string) => void;
  onUpdateQuantity: (fruitId: string, delta: number) => void;
}

export function BasketDropZone({
  items,
  basketSize,
  totalWeight,
  onRemoveItem,
  onUpdateQuantity,
}: BasketDropZoneProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: 'basket-drop-zone',
  });

  const weightPercentage = Math.min((totalWeight / basketSize.weight) * 100, 100);
  const isOverweight = totalWeight > basketSize.weight + 0.5;
  const isComplete = totalWeight >= basketSize.weight - 0.5 && totalWeight <= basketSize.weight + 0.5;

  return (
    <div
      ref={setNodeRef}
      className={`
        relative min-h-[400px] p-6 rounded-2xl border-2 border-dashed transition-all
        ${isOver ? 'border-fruit-green bg-fruit-green/10 scale-[1.01]' : 'border-border bg-background-card'}
        ${isOverweight ? 'border-fruit-red bg-fruit-red/5' : ''}
        ${isComplete ? 'border-fruit-green bg-fruit-green/5' : ''}
      `}
    >
      {/* Header du panier */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-fruit-green/20 rounded-xl flex items-center justify-center">
            <span className="text-2xl">🧺</span>
          </div>
          <div>
            <h3 className="font-bold text-white">{basketSize.name}</h3>
            <p className="text-sm text-foreground-muted">{basketSize.weight}kg • {basketSize.persons} personnes</p>
          </div>
        </div>
      </div>

      {/* Jauge de poids */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-foreground-muted">Poids du panier</span>
          <span className={`font-medium ${isOverweight ? 'text-fruit-red' : isComplete ? 'text-fruit-green' : 'text-white'}`}>
            {totalWeight.toFixed(1)}kg / {basketSize.weight}kg
          </span>
        </div>
        <div className="h-3 bg-background rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 rounded-full ${
              isOverweight
                ? 'bg-fruit-red'
                : isComplete
                ? 'bg-fruit-green'
                : 'bg-gradient-to-r from-fruit-orange to-fruit-yellow'
            }`}
            style={{ width: `${weightPercentage}%` }}
          />
        </div>
        {isOverweight && (
          <p className="text-xs text-fruit-red mt-1">
            ⚠️ Panier trop lourd ! Retirez {(totalWeight - basketSize.weight).toFixed(1)}kg
          </p>
        )}
        {!isComplete && !isOverweight && totalWeight > 0 && (
          <p className="text-xs text-foreground-muted mt-1">
            Il manque {(basketSize.weight - totalWeight).toFixed(1)}kg pour compléter le panier
          </p>
        )}
        {isComplete && (
          <p className="text-xs text-fruit-green mt-1">
            ✓ Panier complet !
          </p>
        )}
      </div>

      {/* Zone de drop / Liste des fruits */}
      {items.length === 0 ? (
        <div className={`
          flex flex-col items-center justify-center py-16 rounded-xl border border-dashed transition-all
          ${isOver ? 'border-fruit-green bg-fruit-green/5' : 'border-border'}
        `}>
          <span className="text-5xl mb-4 opacity-50">🧺</span>
          <p className="text-foreground-muted text-center">
            {isOver ? (
              <span className="text-fruit-green font-medium">Relâchez pour ajouter !</span>
            ) : (
              <>
                Glissez vos fruits ici<br />
                <span className="text-xs">ou cliquez sur un fruit pour l'ajouter</span>
              </>
            )}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => {
            const colors = CATEGORY_COLORS[item.fruit.category];
            return (
              <div
                key={item.fruit.id}
                className={`flex items-center gap-3 p-3 rounded-xl bg-background border ${colors.border}/30 hover:${colors.border}/50 transition-all`}
              >
                {/* Emoji */}
                <span className="text-2xl">{item.fruit.emoji}</span>

                {/* Infos */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white truncate">{item.fruit.name}</div>
                  <div className="text-xs text-foreground-muted">
                    {item.fruit.pricePerKg}€/kg
                  </div>
                </div>

                {/* Contrôles quantité */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onUpdateQuantity(item.fruit.id, -0.5)}
                    className="w-8 h-8 rounded-lg bg-background-card border border-border hover:border-foreground-muted flex items-center justify-center text-foreground-muted hover:text-white transition-all"
                  >
                    −
                  </button>
                  <span className="w-16 text-center font-medium text-white">
                    {item.quantity.toFixed(1)}kg
                  </span>
                  <button
                    onClick={() => onUpdateQuantity(item.fruit.id, 0.5)}
                    className="w-8 h-8 rounded-lg bg-background-card border border-border hover:border-foreground-muted flex items-center justify-center text-foreground-muted hover:text-white transition-all"
                  >
                    +
                  </button>
                </div>

                {/* Supprimer */}
                <button
                  onClick={() => onRemoveItem(item.fruit.id)}
                  className="w-8 h-8 rounded-lg hover:bg-fruit-red/20 flex items-center justify-center text-foreground-muted hover:text-fruit-red transition-all"
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Indicateur visuel quand on survole */}
      {isOver && (
        <div className="absolute inset-0 rounded-2xl border-2 border-fruit-green pointer-events-none animate-pulse" />
      )}
    </div>
  );
}
