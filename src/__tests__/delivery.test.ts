import { describe, it, expect } from 'vitest';
import {
  getNextDeliveryDate,
  getDeliveryOptions,
  formatDateForApi,
  isValidDeliveryDay,
  getDeliveryDayLabel,
} from '@/lib/delivery';

describe('Delivery - getNextDeliveryDate', () => {
  it('devrait retourner le prochain lundi depuis un mercredi', () => {
    // Mercredi 22 janvier 2025
    const wednesday = new Date(2025, 0, 22);
    const result = getNextDeliveryDate('monday', wednesday);

    // Devrait être lundi 27 janvier (5 jours plus tard)
    expect(result.getDay()).toBe(1); // Lundi
    expect(result.getDate()).toBe(27);
  });

  it('devrait retourner le prochain mardi depuis un mercredi', () => {
    // Mercredi 22 janvier 2025
    const wednesday = new Date(2025, 0, 22);
    const result = getNextDeliveryDate('tuesday', wednesday);

    // Devrait être mardi 28 janvier (6 jours plus tard)
    expect(result.getDay()).toBe(2); // Mardi
    expect(result.getDate()).toBe(28);
  });

  it('devrait sauter à la semaine suivante si moins de 2 jours', () => {
    // Dimanche 19 janvier 2025
    const sunday = new Date(2025, 0, 19);
    const result = getNextDeliveryDate('monday', sunday);

    // Lundi 20 = 1 jour, donc devrait être lundi 27
    expect(result.getDay()).toBe(1);
    expect(result.getDate()).toBe(27);
  });

  it('devrait sauter à la semaine suivante si le jour est aujourd\'hui', () => {
    // Lundi 20 janvier 2025
    const monday = new Date(2025, 0, 20);
    const result = getNextDeliveryDate('monday', monday);

    // 0 jours jusqu'à lundi, donc devrait être lundi 27
    expect(result.getDay()).toBe(1);
    expect(result.getDate()).toBe(27);
  });

  it('devrait fonctionner le samedi pour livraison mardi', () => {
    // Samedi 18 janvier 2025
    const saturday = new Date(2025, 0, 18);
    const result = getNextDeliveryDate('tuesday', saturday);

    // Mardi 21 = 3 jours, OK (> 2 jours)
    expect(result.getDay()).toBe(2);
    expect(result.getDate()).toBe(21);
  });
});

describe('Delivery - getDeliveryOptions', () => {
  it('devrait retourner 2 options (lundi et mardi)', () => {
    const options = getDeliveryOptions(new Date(2025, 0, 15)); // Mercredi

    expect(options).toHaveLength(2);
    expect(options.map((o) => o.day)).toContain('monday');
    expect(options.map((o) => o.day)).toContain('tuesday');
  });

  it('devrait trier par date croissante', () => {
    const options = getDeliveryOptions(new Date(2025, 0, 15));

    expect(options[0].date.getTime()).toBeLessThan(options[1].date.getTime());
  });

  it('chaque option devrait avoir un label', () => {
    const options = getDeliveryOptions();

    options.forEach((option) => {
      expect(option.label).toBeDefined();
      expect(['Lundi', 'Mardi']).toContain(option.label);
    });
  });

  it('chaque option devrait avoir une date formatée', () => {
    const options = getDeliveryOptions();

    options.forEach((option) => {
      expect(option.formattedDate).toBeDefined();
      expect(option.formattedDate.length).toBeGreaterThan(0);
    });
  });
});

describe('Delivery - formatDateForApi', () => {
  it('devrait formater en YYYY-MM-DD', () => {
    const date = new Date(2025, 0, 15); // 15 janvier 2025
    const result = formatDateForApi(date);

    expect(result).toBe('2025-01-15');
  });

  it('devrait ajouter des zéros pour les mois/jours < 10', () => {
    const date = new Date(2025, 5, 5); // 5 juin 2025
    const result = formatDateForApi(date);

    expect(result).toBe('2025-06-05');
  });
});

describe('Delivery - isValidDeliveryDay', () => {
  it('devrait retourner true pour un lundi', () => {
    const monday = new Date(2025, 0, 20); // Lundi
    expect(isValidDeliveryDay(monday)).toBe(true);
  });

  it('devrait retourner true pour un mardi', () => {
    const tuesday = new Date(2025, 0, 21); // Mardi
    expect(isValidDeliveryDay(tuesday)).toBe(true);
  });

  it('devrait retourner false pour un mercredi', () => {
    const wednesday = new Date(2025, 0, 22); // Mercredi
    expect(isValidDeliveryDay(wednesday)).toBe(false);
  });

  it('devrait retourner false pour un dimanche', () => {
    const sunday = new Date(2025, 0, 19); // Dimanche
    expect(isValidDeliveryDay(sunday)).toBe(false);
  });
});

describe('Delivery - getDeliveryDayLabel', () => {
  it('devrait retourner "Lundi" pour monday', () => {
    expect(getDeliveryDayLabel('monday')).toBe('Lundi');
  });

  it('devrait retourner "Mardi" pour tuesday', () => {
    expect(getDeliveryDayLabel('tuesday')).toBe('Mardi');
  });
});
