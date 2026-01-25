// ==========================================
// VERGER & COM - Sessions et Invitations Livreurs
// ==========================================

// === SECTEURS ÎLE-DE-FRANCE ===
export const IDF_SECTORS = {
  'paris-centre': { label: 'Paris Centre (1-4)', emoji: '🏛️' },
  'paris-nord': { label: 'Paris Nord (9,10,17-19)', emoji: '🌃' },
  'paris-est': { label: 'Paris Est (11,12,20)', emoji: '🌅' },
  'paris-sud': { label: 'Paris Sud (5,6,13-15)', emoji: '🎓' },
  'paris-ouest': { label: 'Paris Ouest (7,8,16)', emoji: '🗼' },
  '92': { label: 'Hauts-de-Seine (92)', emoji: '🏢' },
  '93': { label: 'Seine-Saint-Denis (93)', emoji: '🏭' },
  '94': { label: 'Val-de-Marne (94)', emoji: '🌳' },
  '78': { label: 'Yvelines (78)', emoji: '🏰' },
  '91': { label: 'Essonne (91)', emoji: '🔬' },
  '95': { label: 'Val-d\'Oise (95)', emoji: '✈️' },
  '77': { label: 'Seine-et-Marne (77)', emoji: '🌾' },
} as const;

export type SectorCode = keyof typeof IDF_SECTORS;

// === SESSION D'INSCRIPTION LIVREUR ===
export interface DriverRegistrationSession {
  step: 'email' | 'name' | 'phone' | 'sector';
  inviteToken: string;
  email?: string;
  name?: string;
  phone?: string;
  createdAt: number;
}

// Stockage en mémoire des sessions
const sessions = new Map<string, DriverRegistrationSession>();

// Stockage des tokens d'invitation (token -> timestamp)
const inviteTokens = new Map<string, number>();

// Durée de vie: session 10min, invitation 24h
const SESSION_TTL = 10 * 60 * 1000;
const INVITE_TTL = 24 * 60 * 60 * 1000;

// === GESTION DES SESSIONS ===
export function getSession(chatId: string): DriverRegistrationSession | null {
  const session = sessions.get(chatId);
  if (!session) return null;

  if (Date.now() - session.createdAt > SESSION_TTL) {
    sessions.delete(chatId);
    return null;
  }

  return session;
}

export function setSession(chatId: string, session: DriverRegistrationSession): void {
  sessions.set(chatId, session);
}

export function deleteSession(chatId: string): void {
  sessions.delete(chatId);
}

export function createSessionFromInvite(chatId: string, token: string): DriverRegistrationSession {
  const session: DriverRegistrationSession = {
    step: 'email',
    inviteToken: token,
    createdAt: Date.now(),
  };
  sessions.set(chatId, session);
  return session;
}

// === GESTION DES INVITATIONS ===
export function generateInviteToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 12; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  inviteTokens.set(token, Date.now());
  return token;
}

export function validateInviteToken(token: string): boolean {
  const created = inviteTokens.get(token);
  if (!created) return false;

  if (Date.now() - created > INVITE_TTL) {
    inviteTokens.delete(token);
    return false;
  }

  return true;
}

export function consumeInviteToken(token: string): boolean {
  if (!validateInviteToken(token)) return false;
  inviteTokens.delete(token);
  return true;
}

// === ANCIENNES FONCTIONS (rétrocompatibilité) ===
// Supprimées car remplacées par le nouveau système
