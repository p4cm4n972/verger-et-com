import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { CartProvider, useCart } from '@/lib/cart/CartContext';
import { ReactNode } from 'react';

const wrapper = ({ children }: { children: ReactNode }) => (
  <CartProvider>{children}</CartProvider>
);

describe('CartContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('devrait commencer avec un panier vide', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    expect(result.current.items).toHaveLength(0);
    expect(result.current.total).toBe(0);
    expect(result.current.itemCount).toBe(0);
  });

  it('devrait ajouter un article au panier', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addItem({
        type: 'juice',
        productId: 'jus-orange-25cl',
        name: 'Jus d\'Orange',
        price: 18,
      });
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].productId).toBe('jus-orange-25cl');
    expect(result.current.items[0].quantity).toBe(1);
    expect(result.current.total).toBe(18);
    expect(result.current.itemCount).toBe(1);
  });

  it('devrait incrémenter la quantité si l\'article existe déjà', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addItem({
        type: 'juice',
        productId: 'jus-orange-25cl',
        name: 'Jus d\'Orange',
        price: 18,
      });
    });

    act(() => {
      result.current.addItem({
        type: 'juice',
        productId: 'jus-orange-25cl',
        name: 'Jus d\'Orange',
        price: 18,
      });
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].quantity).toBe(2);
    expect(result.current.total).toBe(36);
    expect(result.current.itemCount).toBe(2);
  });

  it('devrait supprimer un article', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addItem({
        type: 'juice',
        productId: 'jus-orange-25cl',
        name: 'Jus d\'Orange',
        price: 18,
      });
    });

    act(() => {
      result.current.removeItem('jus-orange-25cl');
    });

    expect(result.current.items).toHaveLength(0);
    expect(result.current.total).toBe(0);
  });

  it('devrait mettre à jour la quantité', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addItem({
        type: 'juice',
        productId: 'jus-orange-25cl',
        name: 'Jus d\'Orange',
        price: 18,
      });
    });

    act(() => {
      result.current.updateQuantity('jus-orange-25cl', 5);
    });

    expect(result.current.items[0].quantity).toBe(5);
    expect(result.current.total).toBe(90);
    expect(result.current.itemCount).toBe(5);
  });

  it('devrait supprimer l\'article si la quantité est 0', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addItem({
        type: 'juice',
        productId: 'jus-orange-25cl',
        name: 'Jus d\'Orange',
        price: 18,
      });
    });

    act(() => {
      result.current.updateQuantity('jus-orange-25cl', 0);
    });

    expect(result.current.items).toHaveLength(0);
  });

  it('devrait vider le panier', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addItem({
        type: 'juice',
        productId: 'jus-orange-25cl',
        name: 'Jus d\'Orange',
        price: 18,
      });
      result.current.addItem({
        type: 'dried',
        productId: 'mix-energie',
        name: 'Mix Énergie',
        price: 15,
      });
    });

    expect(result.current.items).toHaveLength(2);

    act(() => {
      result.current.clearCart();
    });

    expect(result.current.items).toHaveLength(0);
    expect(result.current.total).toBe(0);
  });

  it('devrait gérer plusieurs types de produits', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addItem({
        type: 'basket',
        productId: 'basket-5kg',
        name: 'Panier Découverte',
        price: 35,
      });
      result.current.addItem({
        type: 'juice',
        productId: 'jus-orange-25cl',
        name: 'Jus d\'Orange',
        price: 18,
      });
      result.current.addItem({
        type: 'dried',
        productId: 'mix-energie',
        name: 'Mix Énergie',
        price: 15,
      });
    });

    expect(result.current.items).toHaveLength(3);
    expect(result.current.total).toBe(35 + 18 + 15);
    expect(result.current.itemCount).toBe(3);
  });
});
