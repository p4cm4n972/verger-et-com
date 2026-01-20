// ==========================================
// VERGER & COM - Algorithme de Pricing
// ==========================================

import type { BasketSize, CustomBasketItem, Fruit } from '@/types';

/**
 * Calcule le prix d'un panier personnalisé
 *
 * Logique :
 * 1. Part du prix de revient du panier de base
 * 2. Calcule le coût des fruits choisis au prorata
 * 3. Applique la même marge que le panier standard
 *
 * @param baseBasket - Le panier de base choisi (5kg, 8kg, 12kg)
 * @param items - Les fruits sélectionnés avec leurs quantités
 * @returns Le prix final calculé
 */
export function calculateCustomBasketPrice(
  baseBasket: BasketSize,
  items: CustomBasketItem[]
): number {
  // Calcul du poids total des fruits choisis
  const totalWeight = items.reduce((sum, item) => sum + item.quantity, 0);

  // Si pas de fruits, retourner le prix de base
  if (totalWeight === 0 || items.length === 0) {
    return baseBasket.price;
  }

  // Calcul du coût des fruits choisis
  const fruitsCost = items.reduce((sum, item) => {
    return sum + item.fruit.costPerKg * item.quantity;
  }, 0);

  // Calcul de la marge du panier standard
  const standardMargin = baseBasket.price / baseBasket.costPrice;

  // Application de la marge sur le coût des fruits
  const customPrice = fruitsCost * standardMargin;

  // Arrondi à 0.5€ près pour un prix propre
  return Math.round(customPrice * 2) / 2;
}

/**
 * Calcule le prix au kg moyen d'un panier personnalisé
 */
export function calculatePricePerKg(
  items: CustomBasketItem[]
): number {
  const totalWeight = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalCost = items.reduce((sum, item) => {
    return sum + item.fruit.pricePerKg * item.quantity;
  }, 0);

  if (totalWeight === 0) return 0;
  return totalCost / totalWeight;
}

/**
 * Vérifie si le poids du panier est dans les limites
 */
export function validateBasketWeight(
  baseBasket: BasketSize,
  items: CustomBasketItem[],
  tolerance: number = 0.5 // tolérance de 500g
): { valid: boolean; difference: number; message: string } {
  const totalWeight = items.reduce((sum, item) => sum + item.quantity, 0);
  const difference = totalWeight - baseBasket.weight;

  if (Math.abs(difference) <= tolerance) {
    return {
      valid: true,
      difference,
      message: 'Poids correct',
    };
  }

  if (difference < 0) {
    return {
      valid: false,
      difference,
      message: `Il manque ${Math.abs(difference).toFixed(1)}kg pour compléter votre panier`,
    };
  }

  return {
    valid: false,
    difference,
    message: `Votre panier dépasse de ${difference.toFixed(1)}kg`,
  };
}

/**
 * Filtre les fruits de saison pour le mois actuel
 */
export function getSeasonalFruits(fruits: Fruit[], month?: number): Fruit[] {
  const currentMonth = month ?? new Date().getMonth() + 1; // 1-12
  return fruits.filter((fruit) => fruit.season.includes(currentMonth));
}

/**
 * Calcule les économies par rapport au prix catalogue
 */
export function calculateSavings(
  items: CustomBasketItem[],
  customPrice: number
): number {
  const catalogPrice = items.reduce((sum, item) => {
    return sum + item.fruit.pricePerKg * item.quantity;
  }, 0);

  return Math.max(0, catalogPrice - customPrice);
}
