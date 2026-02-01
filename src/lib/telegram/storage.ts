// ==========================================
// VERGER & COM - Storage pour photos de livraison
// ==========================================

import { createClient } from '@supabase/supabase-js';

// Client Supabase avec service role pour bypass (contournement) RLS
// Utilisé uniquement côté serveur pour les uploads de photos
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getAdminClient() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

const BUCKET_NAME = 'delivery-photos';
// Durée de validité de l'URL signée: 1 an (en secondes)
const SIGNED_URL_EXPIRY = 60 * 60 * 24 * 365; // 365 jours

/**
 * Upload une photo de preuve de livraison vers Supabase Storage
 * @param orderId - L'identifiant de la commande
 * @param photoBuffer - Le contenu de l'image en Buffer
 * @param mimeType - Le type MIME de l'image (par défaut image/jpeg)
 * @returns L'URL signée de la photo ou null en cas d'erreur
 */
export async function uploadDeliveryPhoto(
  orderId: string,
  photoBuffer: Buffer,
  mimeType: string = 'image/jpeg'
): Promise<string | null> {
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Variables d\'environnement Supabase manquantes');
    return null;
  }

  try {
    const supabase = getAdminClient();

    // Générer un nom de fichier unique
    const timestamp = Date.now();
    const extension = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';
    const fileName = `${orderId}/${timestamp}.${extension}`;

    // Upload vers Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, photoBuffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (error) {
      console.error('Erreur upload photo:', error);
      return null;
    }

    console.log('Photo uploadée:', data.path);

    // Générer une URL signée avec expiration longue (1 an)
    // Cela permet de garder une preuve légale accessible
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(data.path, SIGNED_URL_EXPIRY);

    if (signedUrlError) {
      console.error('Erreur création URL signée:', signedUrlError);
      return null;
    }

    return signedUrlData.signedUrl;
  } catch (error) {
    console.error('Erreur upload photo de livraison:', error);
    return null;
  }
}

/**
 * Vérifie si le bucket delivery-photos existe et le crée si nécessaire
 * À appeler au démarrage ou lors de la première utilisation
 */
export async function ensureDeliveryPhotosBucket(): Promise<boolean> {
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Variables d\'environnement Supabase manquantes');
    return false;
  }

  try {
    const supabase = getAdminClient();

    // Vérifier si le bucket existe
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      console.error('Erreur liste buckets:', listError);
      return false;
    }

    const bucketExists = buckets.some((b) => b.name === BUCKET_NAME);

    if (!bucketExists) {
      // Créer le bucket
      const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: false,
        fileSizeLimit: 5 * 1024 * 1024, // 5 MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      });

      if (createError) {
        console.error('Erreur création bucket:', createError);
        return false;
      }

      console.log('Bucket delivery-photos créé');
    }

    return true;
  } catch (error) {
    console.error('Erreur vérification bucket:', error);
    return false;
  }
}
