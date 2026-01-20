import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';

export function Footer() {
  return (
    <footer className="py-12 px-6 bg-background-card border-t border-border">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <Logo size="sm" />
        <div className="text-center">
          <p className="text-foreground-subtle text-sm">
            © 2025 Verger & Com. Tous droits réservés.
          </p>
          <p className="text-foreground-subtle text-xs mt-1">
            Développé par{' '}
            <a
              href="https://itmade.studio"
              target="_blank"
              rel="noopener noreferrer"
              className="text-fruit-green hover:underline"
            >
              ITMade Studio
            </a>
          </p>
        </div>
        <div className="flex gap-6">
          <Link
            href="/cgv"
            className="text-foreground-muted hover:text-white transition-colors"
          >
            CGV
          </Link>
          <Link
            href="/contact"
            className="text-foreground-muted hover:text-white transition-colors"
          >
            Contact
          </Link>
        </div>
      </div>
    </footer>
  );
}
