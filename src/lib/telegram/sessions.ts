// ==========================================
// VERGER & COM - Sessions de création livreur
// ==========================================

export interface DriverCreationSession {
  step: 'email' | 'name' | 'phone' | 'address';
  email?: string;
  name?: string;
  phone?: string;
  createdAt: number;
}

// Stockage en mémoire des sessions (reset à chaque redéploiement)
// Pour une solution persistante, utiliser Supabase
const sessions = new Map<string, DriverCreationSession>();

// Durée de vie d'une session: 10 minutes
const SESSION_TTL = 10 * 60 * 1000;

export function getSession(chatId: string): DriverCreationSession | null {
  const session = sessions.get(chatId);
  if (!session) return null;

  // Vérifier si la session a expiré
  if (Date.now() - session.createdAt > SESSION_TTL) {
    sessions.delete(chatId);
    return null;
  }

  return session;
}

export function setSession(chatId: string, session: DriverCreationSession): void {
  sessions.set(chatId, session);
}

export function deleteSession(chatId: string): void {
  sessions.delete(chatId);
}

export function createSession(chatId: string): DriverCreationSession {
  const session: DriverCreationSession = {
    step: 'email',
    createdAt: Date.now(),
  };
  sessions.set(chatId, session);
  return session;
}
