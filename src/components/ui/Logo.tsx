'use client';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

const sizes = {
  sm: { icon: 32, text: 'text-lg' },
  md: { icon: 48, text: 'text-2xl' },
  lg: { icon: 64, text: 'text-3xl' },
  xl: { icon: 96, text: 'text-5xl' },
};

export function Logo({ size = 'md', showText = true, className = '' }: LogoProps) {
  const { icon, text } = sizes[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Icône fruit multicolore */}
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Feuille */}
        <path
          d="M50 8 C55 2, 65 5, 62 15 C60 22, 52 25, 50 22"
          fill="#4ECB71"
        />
        <path
          d="M50 8 C45 5, 42 12, 48 18"
          stroke="#3BA55D"
          strokeWidth="2"
          fill="none"
        />

        {/* Fruit - 4 quartiers */}
        {/* Rouge (haut gauche) */}
        <path
          d="M50 25 L50 55 L25 55 C20 55, 15 45, 18 35 C22 25, 35 20, 50 25"
          fill="#E63946"
        />

        {/* Orange (haut droite) */}
        <path
          d="M50 25 C65 20, 78 25, 82 35 C85 45, 80 55, 75 55 L50 55 L50 25"
          fill="#FF6B35"
        />

        {/* Vert (bas gauche) */}
        <path
          d="M25 55 L50 55 L50 85 C35 85, 20 75, 18 65 C16 58, 20 55, 25 55"
          fill="#4ECB71"
        />

        {/* Jaune (bas droite) */}
        <path
          d="M50 55 L75 55 C80 55, 84 58, 82 65 C80 75, 65 85, 50 85 L50 55"
          fill="#F7C548"
        />

        {/* Lignes de séparation */}
        <line x1="50" y1="25" x2="50" y2="85" stroke="#0a0a0a" strokeWidth="2" />
        <line x1="20" y1="55" x2="80" y2="55" stroke="#0a0a0a" strokeWidth="2" />
      </svg>

      {/* Texte */}
      {showText && (
        <div className="flex flex-col leading-tight">
          <span className={`font-serif font-bold text-white ${text}`}>
            Verger
          </span>
          <span className={`font-light text-foreground-muted ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
            <span className="text-fruit-green font-medium">&</span> Com
          </span>
        </div>
      )}
    </div>
  );
}
