'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';
import { useCart } from '@/lib/cart/CartContext';

const navLinks = [
  { href: '/', label: 'Accueil' },
  { href: '/paniers', label: 'Paniers' },
  { href: '/jus', label: 'Jus' },
  { href: '/fruits-secs', label: 'Fruits Secs' },
  { href: '/mes-commandes', label: 'Mes commandes' },
  { href: '/contact', label: 'Contact' },
];

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { itemCount } = useCart();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" onClick={() => setIsMenuOpen(false)}>
          <Logo size="sm" />
        </Link>

        {/* Navigation desktop */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-foreground-muted hover:text-white transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          {/* Bouton Commander (desktop) */}
          <Link
            href="/commander"
            className="hidden sm:flex items-center gap-2 px-5 py-2 bg-fruit-green text-background font-medium rounded-full hover:bg-fruit-green/90 transition-colors relative"
          >
            <span>🧺</span>
            <span>Commander</span>
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-fruit-orange text-white text-xs font-bold rounded-full flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </Link>

          {/* Bouton hamburger (mobile) */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden w-10 h-10 flex flex-col items-center justify-center gap-1.5"
            aria-label="Menu"
          >
            <span
              className={`w-6 h-0.5 bg-white transition-all duration-300 ${
                isMenuOpen ? 'rotate-45 translate-y-2' : ''
              }`}
            />
            <span
              className={`w-6 h-0.5 bg-white transition-all duration-300 ${
                isMenuOpen ? 'opacity-0' : ''
              }`}
            />
            <span
              className={`w-6 h-0.5 bg-white transition-all duration-300 ${
                isMenuOpen ? '-rotate-45 -translate-y-2' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {/* Menu mobile */}
      <div
        className={`md:hidden fixed inset-0 top-[73px] bg-background/95 backdrop-blur-lg transition-all duration-300 ${
          isMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
      >
        <nav className="flex flex-col items-center justify-center h-full gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsMenuOpen(false)}
              className="text-2xl text-white hover:text-fruit-green transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/commander"
            onClick={() => setIsMenuOpen(false)}
            className="mt-4 px-8 py-3 bg-fruit-green text-background font-semibold rounded-full text-lg hover:bg-fruit-green/90 transition-colors flex items-center gap-2 relative"
          >
            <span>🧺</span>
            <span>Commander</span>
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-2 w-6 h-6 bg-fruit-orange text-white text-sm font-bold rounded-full flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </Link>
        </nav>
      </div>
    </header>
  );
}
