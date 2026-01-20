'use client';

// ==========================================
// VERGER & COM - Hook d'authentification
// ==========================================

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
  });

  const supabase = createClient();

  useEffect(() => {
    // Récupère la session initiale
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setAuthState({
        user: session?.user ?? null,
        session,
        loading: false,
      });
    };

    getInitialSession();

    // Écoute les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setAuthState({
          user: session?.user ?? null,
          session,
          loading: false,
        });
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  // Connexion avec email/password
  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  }, [supabase.auth]);

  // Inscription avec email/password
  const signUp = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { data, error };
  }, [supabase.auth]);

  // Déconnexion
  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  }, [supabase.auth]);

  // Connexion avec magic link
  const signInWithMagicLink = useCallback(async (email: string) => {
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { data, error };
  }, [supabase.auth]);

  // Réinitialisation du mot de passe
  const resetPassword = useCallback(async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    return { data, error };
  }, [supabase.auth]);

  return {
    ...authState,
    signIn,
    signUp,
    signOut,
    signInWithMagicLink,
    resetPassword,
  };
}
