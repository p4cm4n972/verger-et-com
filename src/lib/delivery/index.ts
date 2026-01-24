// ==========================================
// VERGER & COM - Gestion des Livraisons
// ==========================================

export type DeliveryDay = 'monday' | 'tuesday';

export interface DeliveryOption {
  day: DeliveryDay;
  date: Date;
  label: string;
  formattedDate: string;
}

/**
 * Calcule la prochaine date de livraison pour un jour donné
 * Livraisons uniquement le lundi ou mardi
 * Minimum 2 jours de préparation requis
 */
export function getNextDeliveryDate(
  preferredDay: DeliveryDay,
  fromDate: Date = new Date()
): Date {
  const targetDow = preferredDay === 'monday' ? 1 : 2; // ISO: Lundi=1, Mardi=2
  const currentDow = fromDate.getDay() === 0 ? 7 : fromDate.getDay(); // Convertir dimanche de 0 à 7

  let daysUntil: number;

  if (currentDow < targetDow) {
    daysUntil = targetDow - currentDow;
  } else {
    daysUntil = 7 - currentDow + targetDow;
  }

  // Minimum 2 jours de préparation
  if (daysUntil <= 2) {
    daysUntil += 7;
  }

  const deliveryDate = new Date(fromDate);
  deliveryDate.setDate(deliveryDate.getDate() + daysUntil);
  deliveryDate.setHours(0, 0, 0, 0);

  return deliveryDate;
}

/**
 * Obtient les deux options de livraison disponibles (prochain lundi et mardi)
 */
export function getDeliveryOptions(fromDate: Date = new Date()): DeliveryOption[] {
  const mondayDate = getNextDeliveryDate('monday', fromDate);
  const tuesdayDate = getNextDeliveryDate('tuesday', fromDate);

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  const options: DeliveryOption[] = [
    {
      day: 'monday',
      date: mondayDate,
      label: 'Lundi',
      formattedDate: formatDate(mondayDate),
    },
    {
      day: 'tuesday',
      date: tuesdayDate,
      label: 'Mardi',
      formattedDate: formatDate(tuesdayDate),
    },
  ];

  // Trier par date (le plus proche en premier)
  return options.sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * Formate une date pour l'API (YYYY-MM-DD)
 */
export function formatDateForApi(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Vérifie si une date est un jour de livraison valide (lundi ou mardi)
 */
export function isValidDeliveryDay(date: Date): boolean {
  const dow = date.getDay();
  return dow === 1 || dow === 2; // Lundi ou Mardi
}

/**
 * Obtient le label français pour un jour de livraison
 */
export function getDeliveryDayLabel(day: DeliveryDay): string {
  return day === 'monday' ? 'Lundi' : 'Mardi';
}
