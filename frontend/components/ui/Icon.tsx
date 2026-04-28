import type { SVGProps } from 'react';

/**
 * Küçük inline SVG set. Heroicons/Lucide paketi eklemekten kaçınıyoruz —
 * marketing sayfasında 4-5 ikon yetiyor. `currentColor` kullandığımız için
 * Tailwind `text-kron-accent` gibi class'larla boyanıyor.
 *
 * Erişilebilirlik: decorative kullanımlarda `aria-hidden` parent'ta set
 * edilir (burada her ikon `aria-hidden="true"` default — metin yanında).
 */

type IconName = 'shield' | 'bolt' | 'graph' | 'globe' | 'arrow-right' | 'check';

interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName;
  size?: number;
}

export function Icon({ name, size = 24, className, ...rest }: IconProps) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.75,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    className,
    ...rest,
  };

  switch (name) {
    case 'shield':
      return (
        <svg {...common}>
          <path d="M12 3 4 6v6c0 4.5 3.2 8.3 8 9 4.8-.7 8-4.5 8-9V6l-8-3Z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );
    case 'bolt':
      return (
        <svg {...common}>
          <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z" />
        </svg>
      );
    case 'graph':
      return (
        <svg {...common}>
          <path d="M3 3v18h18" />
          <path d="m7 15 4-4 3 3 5-6" />
        </svg>
      );
    case 'globe':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18" />
          <path d="M12 3a14 14 0 0 1 0 18" />
          <path d="M12 3a14 14 0 0 0 0 18" />
        </svg>
      );
    case 'arrow-right':
      return (
        <svg {...common}>
          <path d="M5 12h14" />
          <path d="m13 5 7 7-7 7" />
        </svg>
      );
    case 'check':
      return (
        <svg {...common}>
          <path d="m5 12 5 5 9-11" />
        </svg>
      );
    default:
      return null;
  }
}
