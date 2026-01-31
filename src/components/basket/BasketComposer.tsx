'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, pointerWithin, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import type { Fruit, CustomBasketItem, BasketSize } from '@/types';
import { BASKET_SIZES, FRUITS, CATEGORY_COLORS } from '@/lib/constants';
import { calculateCustomBasketPrice, getSeasonalFruits, validateBasketWeight, calculateSavings } from '@/lib/pricing';
import { useCart } from '@/lib/cart/CartContext';
import { DraggableFruit } from './DraggableFruit';
import { BasketDropZone } from './BasketDropZone';

export function BasketComposer() {
  const router = useRouter();
  const { addItem } = useCart();

  // Sensors pour le drag - distance minimum pour différencier clic et drag
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // pixels avant d'activer le drag
      },
    })
  );

  // État
  const [selectedBasketSize, setSelectedBasketSize] = useState<BasketSize>(BASKET_SIZES[1]); // Panier Équipe par défaut
  const [basketItems, setBasketItems] = useState<CustomBasketItem[]>([]);
  const [activeFruit, setActiveFruit] = useState<Fruit | null>(null);
  const [filter, setFilter] = useState<'all' | 'red' | 'orange' | 'yellow' | 'green'>('all');

  // Fruits de saison filtrés
  const seasonalFruits = useMemo(() => {
    const seasonal = getSeasonalFruits(FRUITS);
    if (filter === 'all') return seasonal;
    return seasonal.filter((f) => f.category === filter);
  }, [filter]);

  // Calculs
  const totalWeight = useMemo(
    () => basketItems.reduce((sum, item) => sum + item.quantity, 0),
    [basketItems]
  );

  const calculatedPrice = useMemo(
    () => calculateCustomBasketPrice(selectedBasketSize, basketItems),
    [selectedBasketSize, basketItems]
  );

  const validation = useMemo(
    () => validateBasketWeight(selectedBasketSize, basketItems),
    [selectedBasketSize, basketItems]
  );

  const savings = useMemo(
    () => calculateSavings(basketItems, calculatedPrice),
    [basketItems, calculatedPrice]
  );

  // Handlers
  const handleDragStart = (event: DragStartEvent) => {
    const fruit = event.active.data.current?.fruit as Fruit;
    setActiveFruit(fruit);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveFruit(null);

    const { active, over } = event;
    if (!over || over.id !== 'basket-drop-zone') return;

    const fruit = active.data.current?.fruit as Fruit;
    if (!fruit) return;

    addFruitToBasket(fruit);
  };

  const addFruitToBasket = (fruit: Fruit) => {
    setBasketItems((prev) => {
      const existing = prev.find((item) => item.fruit.id === fruit.id);
      if (existing) {
        return prev.map((item) =>
          item.fruit.id === fruit.id
            ? { ...item, quantity: item.quantity + 0.5 }
            : item
        );
      }
      return [...prev, { fruit, quantity: 0.5 }];
    });
  };

  const removeFruitFromBasket = (fruitId: string) => {
    setBasketItems((prev) => prev.filter((item) => item.fruit.id !== fruitId));
  };

  const updateFruitQuantity = (fruitId: string, delta: number) => {
    setBasketItems((prev) => {
      return prev
        .map((item) => {
          if (item.fruit.id !== fruitId) return item;
          const newQuantity = Math.max(0, item.quantity + delta);
          return { ...item, quantity: newQuantity };
        })
        .filter((item) => item.quantity > 0);
    });
  };

  const clearBasket = () => {
    setBasketItems([]);
  };

  const handleAddToCart = () => {
    if (!validation.valid || basketItems.length === 0) return;

    // Générer un ID unique pour ce panier composé
    const customBasketId = `custom-${selectedBasketSize.id}-${Date.now()}`;

    // Créer la description des fruits
    const fruitsDescription = basketItems
      .map((item) => `${item.fruit.name} (${item.quantity}kg)`)
      .join(', ');

    addItem({
      type: 'basket',
      productId: customBasketId,
      name: `Panier Personnalisé ${selectedBasketSize.weight}kg`,
      description: fruitsDescription,
      price: calculatedPrice,
      isCustom: true,
      customBasketData: {
        basketSizeId: selectedBasketSize.id,
        items: basketItems.map((item) => ({
          fruitId: item.fruit.id,
          quantity: item.quantity,
        })),
      },
    });

    // Réinitialiser et rediriger
    clearBasket();
    router.push('/commander');
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Colonne gauche : Fruits disponibles */}
        <div>
          {/* Sélection taille du panier */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-white mb-3">Choisissez votre taille de panier</h3>
            <div className="flex gap-3">
              {BASKET_SIZES.map((size, index) => {
                const colors = ['fruit-red', 'fruit-orange', 'fruit-green'];
                const isSelected = selectedBasketSize.id === size.id;
                return (
                  <button
                    key={size.id}
                    onClick={() => {
                      setSelectedBasketSize(size);
                      // Reset basket if changing size
                      if (totalWeight > size.weight + 0.5) {
                        clearBasket();
                      }
                    }}
                    className={`flex-1 p-3 rounded-xl border-2 transition-all ${
                      isSelected
                        ? `border-${colors[index]} bg-${colors[index]}/10`
                        : 'border-border hover:border-foreground-muted'
                    }`}
                  >
                    <div className={`text-lg font-bold ${isSelected ? `text-${colors[index]}` : 'text-white'}`}>
                      {size.weight}kg
                    </div>
                    <div className="text-xs text-foreground-muted">{size.persons} pers.</div>
                    <div className={`text-sm font-medium ${isSelected ? `text-${colors[index]}` : 'text-foreground-muted'}`}>
                      ~{size.price}€
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filtres par couleur */}
          <div className="mb-4">
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  filter === 'all'
                    ? 'bg-white text-background'
                    : 'bg-background-card text-foreground-muted hover:text-white'
                }`}
              >
                Tous
              </button>
              {(['red', 'orange', 'yellow', 'green'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    filter === cat
                      ? `${CATEGORY_COLORS[cat].bg} text-background`
                      : `bg-background-card ${CATEGORY_COLORS[cat].text} hover:opacity-80`
                  }`}
                >
                  {cat === 'red' ? '🍎 Rouge' : cat === 'orange' ? '🍊 Orange' : cat === 'yellow' ? '🍌 Jaune' : '🥝 Vert'}
                </button>
              ))}
            </div>
          </div>

          {/* Grille de fruits */}
          <div className="bg-background-card rounded-2xl p-4 border border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white">Fruits de saison</h3>
              <span className="text-xs text-foreground-muted">{seasonalFruits.length} disponibles</span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {seasonalFruits.map((fruit) => (
                <DraggableFruit
                  key={fruit.id}
                  fruit={fruit}
                  onClick={() => addFruitToBasket(fruit)}
                />
              ))}
            </div>
            {seasonalFruits.length === 0 && (
              <p className="text-center text-foreground-muted py-8">
                Aucun fruit disponible dans cette catégorie ce mois-ci
              </p>
            )}
          </div>
        </div>

        {/* Colonne droite : Panier */}
        <div>
          {/* Drop zone */}
          <BasketDropZone
            items={basketItems}
            basketSize={selectedBasketSize}
            totalWeight={totalWeight}
            onRemoveItem={removeFruitFromBasket}
            onUpdateQuantity={updateFruitQuantity}
          />

          {/* Récapitulatif prix */}
          <div className="mt-6 p-6 rounded-2xl bg-background-card border border-border">
            <div className="flex items-center justify-between mb-4">
              <span className="text-foreground-muted">Prix calculé</span>
              <span className="text-3xl font-bold text-fruit-green">{calculatedPrice}€</span>
            </div>

            {savings > 0 && (
              <div className="flex items-center justify-between text-sm mb-4 p-2 rounded-lg bg-fruit-green/10">
                <span className="text-fruit-green">Économie vs prix catalogue</span>
                <span className="font-medium text-fruit-green">-{savings.toFixed(2)}€</span>
              </div>
            )}

            <div className="text-xs text-foreground-muted mb-4">
              <div className="flex justify-between">
                <span>Poids total</span>
                <span>{totalWeight.toFixed(1)}kg / {selectedBasketSize.weight}kg</span>
              </div>
              <div className="flex justify-between">
                <span>Nombre de fruits</span>
                <span>{basketItems.length} variétés</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={clearBasket}
                disabled={basketItems.length === 0}
                className="px-4 py-3 rounded-xl border border-border text-foreground-muted hover:text-white hover:border-foreground-muted transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Vider
              </button>
              <button
                onClick={handleAddToCart}
                disabled={!validation.valid || basketItems.length === 0}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-fruit-green to-fruit-green/80 text-background font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Ajouter au panier
              </button>
            </div>

            {!validation.valid && basketItems.length > 0 && (
              <p className="text-xs text-fruit-orange mt-3 text-center">
                {validation.message}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Overlay pendant le drag */}
      <DragOverlay>
        {activeFruit && (
          <div className="p-3 rounded-xl bg-background border-2 border-fruit-green shadow-xl scale-105">
            <div className="text-3xl mb-2">{activeFruit.emoji}</div>
            <div className="text-sm font-medium text-white">{activeFruit.name}</div>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
