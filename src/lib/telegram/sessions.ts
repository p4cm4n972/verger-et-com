// ==========================================
// VERGER & COM - Sessions et Invitations Livreurs
// ==========================================

import { createClient } from '@/lib/supabase/server';

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

// === SESSION DE PHOTO DE LIVRAISON (en mémoire - courte durée) ===
export interface DeliveryPhotoSession {
  orderId: string;
  driverId: string;
  customerEmail: string;
  createdAt: number;
}

// Stockage en mémoire des sessions photo de livraison
const photoSessions = new Map<string, DeliveryPhotoSession>();
const PHOTO_SESSION_TTL = 5 * 60 * 1000; // 5 minutes

// === GESTION DES SESSIONS PHOTO ===
export function getDeliveryPhotoSession(chatId: string): DeliveryPhotoSession | null {
  const session = photoSessions.get(chatId);
  if (!session) return null;

  if (Date.now() - session.createdAt > PHOTO_SESSION_TTL) {
    photoSessions.delete(chatId);
    return null;
  }

  return session;
}

export function setDeliveryPhotoSession(
  chatId: string,
  orderId: string,
  driverId: string,
  customerEmail: string
): DeliveryPhotoSession {
  const session: DeliveryPhotoSession = {
    orderId,
    driverId,
    customerEmail,
    createdAt: Date.now(),
  };
  photoSessions.set(chatId, session);
  return session;
}

export function deleteDeliveryPhotoSession(chatId: string): void {
  photoSessions.delete(chatId);
}

// === SESSION D'INSCRIPTION LIVREUR (en mémoire - courte durée) ===
export interface DriverRegistrationSession {
  step: 'email' | 'name' | 'phone' | 'sector';
  inviteToken: string;
  email?: string;
  name?: string;
  phone?: string;
  createdAt: number;
}

// Stockage en mémoire des sessions (OK car courte durée)
const sessions = new Map<string, DriverRegistrationSession>();
const SESSION_TTL = 10 * 60 * 1000; // 10 minutes

// === GESTION DES SESSIONS (mémoire) ===
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

// === GESTION DES INVITATIONS (Supabase - persistant) ===

/**
 * Génère un token d'invitation et le stocke en base
 */
export async function generateInviteToken(): Promise<string> {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 12; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  const supabase = await createClient();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from('driver_invite_tokens')
    .insert({
      token,
      expires_at: expiresAt.toISOString(),
    });

  return token;
}

/**
 * Vérifie si un token est valide (existe et non expiré)
 */
export async function validateInviteToken(token: string): Promise<boolean> {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('driver_invite_tokens')
    .select('id, expires_at, used_at')
    .eq('token', token)
    .single();

  if (!data) return false;
  if (data.used_at) return false; // Déjà utilisé
  if (new Date(data.expires_at) < new Date()) return false; // Expiré

  return true;
}

/**
 * Marque un token comme utilisé
 */
export async function consumeInviteToken(token: string, userId?: string): Promise<boolean> {
  const isValid = await validateInviteToken(token);
  if (!isValid) return false;

  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('driver_invite_tokens')
    .update({
      used_at: new Date().toISOString(),
      used_by_user_id: userId || null,
    })
    .eq('token', token);

  return !error;
}
