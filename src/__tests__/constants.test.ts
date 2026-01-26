import { describe, it, expect } from 'vitest';
import { BASKET_SIZES, FRUITS, JUICES, DRIED_FRUITS } from '@/lib/constants';

describe('Constants - Paniers', () => {
  it('devrait avoir 3 tailles de paniers', () => {
    expect(BASKET_SIZES).toHaveLength(3);
  });

  it('chaque panier devrait avoir un prix supérieur au coût', () => {
    BASKET_SIZES.forEach((basket) => {
      expect(basket.price).toBeGreaterThan(basket.costPrice);
    });
  });

  it('les paniers devraient avoir des IDs uniques', () => {
    const ids = BASKET_SIZES.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('les poids devraient être croissants', () => {
    for (let i = 1; i < BASKET_SIZES.length; i++) {
      expect(BASKET_SIZES[i].weight).toBeGreaterThan(BASKET_SIZES[i - 1].weight);
    }
  });
});

describe('Constants - Fruits', () => {
  it('devrait avoir au moins 10 fruits', () => {
    expect(FRUITS.length).toBeGreaterThanOrEqual(10);
  });

  it('chaque fruit devrait avoir un emoji', () => {
    FRUITS.forEach((fruit) => {
      expect(fruit.emoji).toBeDefined();
      expect(fruit.emoji.length).toBeGreaterThan(0);
    });
  });

  it('les catégories devraient être valides', () => {
    const validCategories = ['red', 'orange', 'yellow', 'green'];
    FRUITS.forEach((fruit) => {
      expect(validCategories).toContain(fruit.category);
    });
  });

  it('les saisons devraient être des mois valides (1-12)', () => {
    FRUITS.forEach((fruit) => {
      fruit.season.forEach((month) => {
        expect(month).toBeGreaterThanOrEqual(1);
        expect(month).toBeLessThanOrEqual(12);
      });
    });
  });

  it('le prix de vente devrait être supérieur au coût', () => {
    FRUITS.forEach((fruit) => {
      expect(fruit.pricePerKg).toBeGreaterThan(fruit.costPerKg);
    });
  });
});

describe('Constants - Jus', () => {
  it('devrait avoir 6 jus (3 saveurs x 2 tailles)', () => {
    expect(JUICES).toHaveLength(6);
  });

  it('chaque jus devrait avoir un emoji', () => {
    JUICES.forEach((juice) => {
      expect(juice.emoji).toBeDefined();
    });
  });

  it('les tailles devraient être 25cl ou 1L', () => {
    JUICES.forEach((juice) => {
      expect(['25cl', '1L']).toContain(juice.size);
    });
  });

  it('les jus 25cl devraient avoir 12 bouteilles', () => {
    JUICES.filter((j) => j.size === '25cl').forEach((juice) => {
      expect(juice.quantity).toBe(12);
    });
  });

  it('les jus 1L devraient avoir 6 bouteilles', () => {
    JUICES.filter((j) => j.size === '1L').forEach((juice) => {
      expect(juice.quantity).toBe(6);
    });
  });

  it('le prix devrait être supérieur au coût', () => {
    JUICES.forEach((juice) => {
      expect(juice.price).toBeGreaterThan(juice.costPrice);
    });
  });
});

describe('Constants - Fruits Secs', () => {
  it('devrait avoir 3 mélanges', () => {
    expect(DRIED_FRUITS).toHaveLength(3);
  });

  it('chaque mélange devrait peser 600g', () => {
    DRIED_FRUITS.forEach((dried) => {
      expect(dried.weight).toBe(600);
    });
  });

  it('chaque mélange devrait servir 10 personnes', () => {
    DRIED_FRUITS.forEach((dried) => {
      expect(dried.persons).toBe(10);
    });
  });

  it('le prix devrait être supérieur au coût', () => {
    DRIED_FRUITS.forEach((dried) => {
      expect(dried.price).toBeGreaterThan(dried.costPrice);
    });
  });
});
