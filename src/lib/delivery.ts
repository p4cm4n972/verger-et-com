export type DeliveryDay = 'monday' | 'tuesday';

export interface DeliveryOption {
  day: DeliveryDay;
  date: Date;
  label: string;
  formattedDate: string;
}

/**
 * Retourne le label français pour un jour de livraison
 */
export function getDeliveryDayLabel(day: DeliveryDay): string {
  return day === 'monday' ? 'Lundi' : 'Mardi';
}

/**
 * Vérifie si une date est un jour de livraison valide (lundi ou mardi)
 */
export function isValidDeliveryDay(date: Date): boolean {
  const dayOfWeek = date.getDay();
  return dayOfWeek === 1 || dayOfWeek === 2; // 1 = lundi, 2 = mardi
}

/**
 * Formate une date au format YYYY-MM-DD pour l'API
 * Utilise les méthodes locales pour éviter les problèmes de timezone
 */
export function formatDateForApi(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calcule la prochaine date de livraison pour un jour donné
 * Nécessite un délai minimum de 2 jours
 */
export function getNextDeliveryDate(
  targetDay: DeliveryDay,
  fromDate: Date = new Date()
): Date {
  const targetDayNumber = targetDay === 'monday' ? 1 : 2;
  const currentDay = fromDate.getDay();

  // Calculer le nombre de jours jusqu'au prochain jour cible
  let daysUntil = targetDayNumber - currentDay;
  if (daysUntil <= 0) {
    daysUntil += 7;
  }

  // Si moins de 2 jours, sauter à la semaine suivante
  if (daysUntil < 2) {
    daysUntil += 7;
  }

  const result = new Date(fromDate);
  result.setDate(fromDate.getDate() + daysUntil);
  return result;
}

/**
 * Retourne les options de livraison disponibles triées par date
 */
export function getDeliveryOptions(fromDate: Date = new Date()): DeliveryOption[] {
  const options: DeliveryOption[] = [];

  const days: DeliveryDay[] = ['monday', 'tuesday'];

  for (const day of days) {
    const date = getNextDeliveryDate(day, fromDate);
    options.push({
      day,
      date,
      label: getDeliveryDayLabel(day),
      formattedDate: formatDateToFrench(date),
    });
  }

  // Trier par date croissante
  options.sort((a, b) => a.date.getTime() - b.date.getTime());

  return options;
}

/**
 * Formate une date en français (ex: "27 janvier 2025")
 */
function formatDateToFrench(date: Date): string {
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
