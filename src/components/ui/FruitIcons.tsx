'use client';

// Composants SVG de fruits colorés pour décorer les pages

export function AppleIcon({ className = '', size = 48 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className}>
      <ellipse cx="50" cy="60" rx="35" ry="32" fill="#E63946" />
      <ellipse cx="50" cy="60" rx="35" ry="32" fill="url(#apple-gradient)" />
      <ellipse cx="35" cy="50" rx="8" ry="12" fill="#ffffff" fillOpacity="0.3" />
      <path d="M50 28 C55 18, 65 20, 62 30" stroke="#4ECB71" strokeWidth="4" fill="none" />
      <ellipse cx="58" cy="22" rx="8" ry="12" fill="#4ECB71" transform="rotate(30 58 22)" />
      <defs>
        <linearGradient id="apple-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E63946" />
          <stop offset="100%" stopColor="#c41d2e" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function OrangeIcon({ className = '', size = 48 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className}>
      <circle cx="50" cy="55" r="38" fill="#FF6B35" />
      <circle cx="50" cy="55" r="38" fill="url(#orange-gradient)" />
      <ellipse cx="35" cy="45" rx="6" ry="10" fill="#ffffff" fillOpacity="0.3" />
      <circle cx="50" cy="18" r="8" fill="#4ECB71" />
      <defs>
        <linearGradient id="orange-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF6B35" />
          <stop offset="100%" stopColor="#e85a2a" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function BananaIcon({ className = '', size = 48 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className}>
      <path
        d="M20 70 Q10 50, 30 30 Q50 15, 80 25 Q85 28, 82 35 Q75 30, 55 35 Q35 42, 28 65 Q26 72, 20 70"
        fill="#F7C548"
      />
      <path
        d="M20 70 Q10 50, 30 30 Q50 15, 80 25 Q85 28, 82 35 Q75 30, 55 35 Q35 42, 28 65 Q26 72, 20 70"
        fill="url(#banana-gradient)"
      />
      <path d="M78 27 Q82 22, 85 25" stroke="#8B7355" strokeWidth="3" fill="none" />
      <defs>
        <linearGradient id="banana-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F7C548" />
          <stop offset="100%" stopColor="#e6b43a" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function GrapesIcon({ className = '', size = 48 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className}>
      <circle cx="40" cy="40" r="12" fill="#4ECB71" />
      <circle cx="60" cy="40" r="12" fill="#4ECB71" />
      <circle cx="30" cy="55" r="12" fill="#4ECB71" />
      <circle cx="50" cy="55" r="12" fill="#4ECB71" />
      <circle cx="70" cy="55" r="12" fill="#4ECB71" />
      <circle cx="40" cy="70" r="12" fill="#4ECB71" />
      <circle cx="60" cy="70" r="12" fill="#4ECB71" />
      <circle cx="50" cy="85" r="12" fill="#4ECB71" />
      <path d="M50 28 Q50 15, 55 10" stroke="#8B7355" strokeWidth="3" fill="none" />
      <ellipse cx="62" cy="12" rx="8" ry="5" fill="#4ECB71" />
    </svg>
  );
}

export function WatermelonIcon({ className = '', size = 48 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className}>
      <path d="M10 80 Q50 10, 90 80 Z" fill="#4ECB71" />
      <path d="M15 78 Q50 18, 85 78 Z" fill="#E63946" />
      <ellipse cx="35" cy="55" rx="3" ry="5" fill="#1a1a1a" />
      <ellipse cx="50" cy="60" rx="3" ry="5" fill="#1a1a1a" />
      <ellipse cx="65" cy="55" rx="3" ry="5" fill="#1a1a1a" />
      <ellipse cx="42" cy="70" rx="3" ry="5" fill="#1a1a1a" />
      <ellipse cx="58" cy="70" rx="3" ry="5" fill="#1a1a1a" />
    </svg>
  );
}

export function StrawberryIcon({ className = '', size = 48 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className}>
      <path
        d="M50 20 Q20 35, 20 60 Q20 90, 50 95 Q80 90, 80 60 Q80 35, 50 20"
        fill="#E63946"
      />
      <ellipse cx="35" cy="45" rx="3" ry="4" fill="#F7C548" />
      <ellipse cx="50" cy="40" rx="3" ry="4" fill="#F7C548" />
      <ellipse cx="65" cy="45" rx="3" ry="4" fill="#F7C548" />
      <ellipse cx="30" cy="60" rx="3" ry="4" fill="#F7C548" />
      <ellipse cx="45" cy="58" rx="3" ry="4" fill="#F7C548" />
      <ellipse cx="60" cy="55" rx="3" ry="4" fill="#F7C548" />
      <ellipse cx="70" cy="60" rx="3" ry="4" fill="#F7C548" />
      <ellipse cx="40" cy="75" rx="3" ry="4" fill="#F7C548" />
      <ellipse cx="55" cy="72" rx="3" ry="4" fill="#F7C548" />
      <ellipse cx="50" cy="88" rx="3" ry="4" fill="#F7C548" />
      <path d="M40 22 L50 8 L60 22" fill="#4ECB71" />
      <path d="M35 18 L45 5" stroke="#4ECB71" strokeWidth="3" />
      <path d="M65 18 L55 5" stroke="#4ECB71" strokeWidth="3" />
    </svg>
  );
}

// Composant décoratif avec plusieurs fruits flottants
export function FloatingFruits({ className = '' }: { className?: string }) {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      <div className="absolute top-10 left-10 animate-bounce" style={{ animationDuration: '3s' }}>
        <AppleIcon size={60} />
      </div>
      <div className="absolute top-20 right-20 animate-bounce" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }}>
        <OrangeIcon size={50} />
      </div>
      <div className="absolute bottom-40 left-20 animate-bounce" style={{ animationDuration: '3.5s', animationDelay: '1s' }}>
        <BananaIcon size={55} />
      </div>
      <div className="absolute bottom-20 right-10 animate-bounce" style={{ animationDuration: '2.8s', animationDelay: '0.3s' }}>
        <GrapesIcon size={45} />
      </div>
      <div className="absolute top-1/2 left-5 animate-bounce" style={{ animationDuration: '3.2s', animationDelay: '0.7s' }}>
        <StrawberryIcon size={40} />
      </div>
      <div className="absolute top-1/3 right-5 animate-bounce" style={{ animationDuration: '2.7s', animationDelay: '1.2s' }}>
        <WatermelonIcon size={50} />
      </div>
    </div>
  );
}

// Barre de fruits pour décorer les sections
export function FruitStrip({ className = '' }: { className?: string }) {
  return (
    <div className={`flex justify-center items-center gap-4 py-4 ${className}`}>
      <AppleIcon size={32} />
      <OrangeIcon size={32} />
      <BananaIcon size={32} />
      <GrapesIcon size={32} />
      <StrawberryIcon size={32} />
      <WatermelonIcon size={32} />
    </div>
  );
}
