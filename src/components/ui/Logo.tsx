'use client';

import Image from 'next/image';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

const sizes = {
  sm: { icon: 48, text: 'text-lg' },
  md: { icon: 64, text: 'text-2xl' },
  lg: { icon: 80, text: 'text-3xl' },
  xl: { icon: 120, text: 'text-5xl' },
};

export function Logo({ size = 'md', showText = true, className = '' }: LogoProps) {
  const { icon, text } = sizes[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Icône pomme multicolore */}
      <Image
        src="/apple-icon.png"
        alt="Verger & Com"
        width={icon}
        height={icon}
        className="object-contain"
        priority
      />

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
