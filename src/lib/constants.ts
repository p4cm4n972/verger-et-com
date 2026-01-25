// ==========================================
// VERGER & COM - Constantes & Données
// ==========================================

import type { BasketSize, Fruit, Juice, DriedFruit } from '@/types';

// === PANIERS DE FRUITS ===
export const BASKET_SIZES: BasketSize[] = [
  {
    id: 'basket-5kg',
    name: 'Panier Découverte',
    weight: 5,
    persons: 10,
    price: 35,
    costPrice: 15,
    description: 'Idéal pour une petite équipe',
  },
  {
    id: 'basket-8kg',
    name: 'Panier Équipe',
    weight: 8,
    persons: 15,
    price: 45,
    costPrice: 22,
    description: 'Le plus populaire',
  },
  {
    id: 'basket-12kg',
    name: 'Panier Entreprise',
    weight: 12,
    persons: 25,
    price: 60,
    costPrice: 30,
    description: 'Pour les grandes équipes',
  },
];

// === FRUITS DISPONIBLES ===
export const FRUITS: Fruit[] = [
  // Rouge
  { id: 'pomme-rouge', name: 'Pomme Rouge', emoji: '🍎', category: 'red', pricePerKg: 3.5, costPerKg: 1.8, season: [1,2,3,4,5,9,10,11,12] },
  { id: 'fraise', name: 'Fraise', emoji: '🍓', category: 'red', pricePerKg: 8, costPerKg: 4.5, season: [4,5,6,7] },
  { id: 'cerise', name: 'Cerise', emoji: '🍒', category: 'red', pricePerKg: 10, costPerKg: 6, season: [5,6,7] },
  { id: 'grenade', name: 'Grenade', emoji: '🍎', category: 'red', pricePerKg: 6, costPerKg: 3.5, season: [9,10,11,12] },

  // Orange
  { id: 'orange', name: 'Orange', emoji: '🍊', category: 'orange', pricePerKg: 3, costPerKg: 1.5, season: [1,2,3,4,11,12] },
  { id: 'mandarine', name: 'Mandarine', emoji: '🍊', category: 'orange', pricePerKg: 4, costPerKg: 2, season: [1,2,11,12] },
  { id: 'abricot', name: 'Abricot', emoji: '🍑', category: 'orange', pricePerKg: 6, costPerKg: 3.5, season: [6,7,8] },
  { id: 'peche', name: 'Pêche', emoji: '🍑', category: 'orange', pricePerKg: 5, costPerKg: 2.8, season: [6,7,8,9] },

  // Jaune
  { id: 'banane', name: 'Banane', emoji: '🍌', category: 'yellow', pricePerKg: 2.5, costPerKg: 1.2, season: [1,2,3,4,5,6,7,8,9,10,11,12] },
  { id: 'citron', name: 'Citron', emoji: '🍋', category: 'yellow', pricePerKg: 3, costPerKg: 1.5, season: [1,2,3,4,5,6,7,8,9,10,11,12] },
  { id: 'ananas', name: 'Ananas', emoji: '🍍', category: 'yellow', pricePerKg: 4, costPerKg: 2.2, season: [1,2,3,4,5,6,7,8,9,10,11,12] },
  { id: 'melon', name: 'Melon', emoji: '🍈', category: 'yellow', pricePerKg: 3.5, costPerKg: 1.8, season: [6,7,8,9] },

  // Vert
  { id: 'pomme-verte', name: 'Pomme Verte', emoji: '🍏', category: 'green', pricePerKg: 3.5, costPerKg: 1.8, season: [1,2,3,4,5,9,10,11,12] },
  { id: 'kiwi', name: 'Kiwi', emoji: '🥝', category: 'green', pricePerKg: 5, costPerKg: 2.8, season: [1,2,3,4,10,11,12] },
  { id: 'raisin-vert', name: 'Raisin Vert', emoji: '🍇', category: 'green', pricePerKg: 5, costPerKg: 2.8, season: [8,9,10] },
  { id: 'poire', name: 'Poire', emoji: '🍐', category: 'green', pricePerKg: 4, costPerKg: 2, season: [8,9,10,11,12,1,2] },
];

// === JUS DE FRUITS ===
export const JUICES: Juice[] = [
  {
    id: 'jus-25cl-orange',
    name: 'Jus d\'Orange',
    flavor: 'Orange',
    emoji: '🍊',
    size: '25cl',
    quantity: 12,
    price: 18,
    costPrice: 9,
  },
  {
    id: 'jus-25cl-pomme',
    name: 'Jus de Pomme',
    flavor: 'Pomme',
    emoji: '🍎',
    size: '25cl',
    quantity: 12,
    price: 16,
    costPrice: 8,
  },
  {
    id: 'jus-25cl-multifruits',
    name: 'Jus Multifruits',
    flavor: 'Multifruits',
    emoji: '🍹',
    size: '25cl',
    quantity: 12,
    price: 20,
    costPrice: 10,
  },
  {
    id: 'jus-1l-orange',
    name: 'Jus d\'Orange',
    flavor: 'Orange',
    emoji: '🍊',
    size: '1L',
    quantity: 6,
    price: 24,
    costPrice: 12,
  },
  {
    id: 'jus-1l-pomme',
    name: 'Jus de Pomme',
    flavor: 'Pomme',
    emoji: '🍎',
    size: '1L',
    quantity: 6,
    price: 22,
    costPrice: 11,
  },
  {
    id: 'jus-1l-multifruits',
    name: 'Jus Multifruits',
    flavor: 'Multifruits',
    emoji: '🍹',
    size: '1L',
    quantity: 6,
    price: 26,
    costPrice: 13,
  },
];

// === FRUITS SECS ===
export const DRIED_FRUITS: DriedFruit[] = [
  {
    id: 'mix-energie',
    name: 'Mix Énergie',
    weight: 600,
    persons: 10,
    price: 18,
    costPrice: 9,
  },
  {
    id: 'mix-gourmand',
    name: 'Mix Gourmand',
    weight: 600,
    persons: 10,
    price: 20,
    costPrice: 10,
  },
  {
    id: 'mix-tropical',
    name: 'Mix Tropical',
    weight: 600,
    persons: 10,
    price: 22,
    costPrice: 11,
  },
];

// === COULEURS PAR CATÉGORIE ===
export const CATEGORY_COLORS = {
  red: {
    bg: 'bg-fruit-red',
    text: 'text-fruit-red',
    border: 'border-fruit-red',
    hex: '#E63946',
  },
  orange: {
    bg: 'bg-fruit-orange',
    text: 'text-fruit-orange',
    border: 'border-fruit-orange',
    hex: '#FF6B35',
  },
  yellow: {
    bg: 'bg-fruit-yellow',
    text: 'text-fruit-yellow',
    border: 'border-fruit-yellow',
    hex: '#F7C548',
  },
  green: {
    bg: 'bg-fruit-green',
    text: 'text-fruit-green',
    border: 'border-fruit-green',
    hex: '#4ECB71',
  },
} as const;
