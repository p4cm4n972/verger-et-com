'use client';

import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/">
          <Logo size="sm" />
        </Link>
        <nav className="hidden md:flex items-center gap-8">
          <Link
            href="/paniers"
            className="text-foreground-muted hover:text-white transition-colors"
          >
            Paniers
          </Link>
          <Link
            href="/jus"
            className="text-foreground-muted hover:text-white transition-colors"
          >
            Jus
          </Link>
          <Link
            href="/fruits-secs"
            className="text-foreground-muted hover:text-white transition-colors"
          >
            Fruits Secs
          </Link>
        </nav>
        <Link
          href="/commander"
          className="px-5 py-2 bg-fruit-green text-background font-medium rounded-full hover:bg-fruit-green/90 transition-colors"
        >
          Commander
        </Link>
      </div>
    </header>
  );
}
