'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fr">
      <body style={{ backgroundColor: '#0a0a0a', color: '#ffffff', fontFamily: 'system-ui' }}>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
        }}>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '5rem', display: 'block', marginBottom: '1.5rem' }}>🍅</span>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              Erreur critique
            </h1>
            <p style={{ color: '#888', marginBottom: '2rem', maxWidth: '400px' }}>
              Une erreur grave s&apos;est produite. Veuillez recharger la page.
            </p>
            <button
              onClick={reset}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#4ade80',
                color: '#0a0a0a',
                fontWeight: '600',
                borderRadius: '9999px',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Recharger
            </button>
            {error.digest && (
              <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '2rem' }}>
                Code: {error.digest}
              </p>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}
