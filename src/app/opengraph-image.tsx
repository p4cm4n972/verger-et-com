import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'Verger & Com - Paniers de fruits frais pour entreprises';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #0a0a0a 0%, #0f1a0f 50%, #0a0a0a 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {/* Top accent bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 8,
            background: '#22c55e',
          }}
        />

        {/* Bottom accent bar */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 8,
            background: '#f97316',
          }}
        />

        {/* Decorative fruits - left */}
        <div
          style={{
            position: 'absolute',
            top: 80,
            left: 60,
            fontSize: 70,
            opacity: 0.5,
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}
        >
          <span>🍎</span>
          <span style={{ marginLeft: 40, fontSize: 55 }}>🍊</span>
          <span style={{ fontSize: 50 }}>🍋</span>
        </div>

        {/* Decorative fruits - right */}
        <div
          style={{
            position: 'absolute',
            bottom: 100,
            right: 60,
            fontSize: 60,
            opacity: 0.5,
            display: 'flex',
            flexDirection: 'column',
            gap: 15,
          }}
        >
          <span style={{ marginLeft: 30 }}>🥝</span>
          <span style={{ fontSize: 55 }}>🍐</span>
          <span style={{ marginLeft: 20, fontSize: 50 }}>🍌</span>
        </div>

        {/* Main content card */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 80px',
            borderRadius: 24,
            background: 'rgba(10, 10, 10, 0.8)',
            border: '2px solid rgba(34, 197, 94, 0.3)',
          }}
        >
          {/* Basket emoji */}
          <div style={{ fontSize: 100, marginBottom: 10 }}>🧺</div>

          {/* Brand name */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              marginBottom: 16,
            }}
          >
            <span
              style={{
                fontSize: 72,
                fontWeight: 'bold',
                color: '#ffffff',
              }}
            >
              Verger
            </span>
            <span
              style={{
                fontSize: 72,
                fontWeight: 'bold',
                color: '#22c55e',
              }}
            >
              & Com
            </span>
          </div>

          {/* Tagline */}
          <div
            style={{
              fontSize: 28,
              color: '#a1a1aa',
              marginBottom: 30,
            }}
          >
            Paniers de fruits frais pour entreprises
          </div>

          {/* Features */}
          <div
            style={{
              display: 'flex',
              gap: 40,
              fontSize: 20,
              color: '#22c55e',
            }}
          >
            <span>✓ Fruits de saison</span>
            <span>✓ Livraison offerte</span>
            <span>✓ Île-de-France</span>
          </div>
        </div>

        {/* URL */}
        <div
          style={{
            position: 'absolute',
            bottom: 30,
            fontSize: 18,
            color: '#71717a',
          }}
        >
          vergercom.fr
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
