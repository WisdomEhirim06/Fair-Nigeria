import Image from 'next/image';

export type BrandLogoSize = 'xs' | 'sm' | 'md' | 'lg' | number;

export interface BrandLogoProps {
  /** Size preset or explicit pixel number */
  size?: BrandLogoSize;
  /** Additional classes to apply to the container or image */
  className?: string;
  /** 'badge' has the native dark forest background; 'transparent' has alpha cutout */
  variant?: 'badge' | 'transparent';
  /** Alternative text for screen readers; omit or pass empty string when placed beside text */
  alt?: string;
  /** Whether to prioritize loading (e.g. above-the-fold navbars) */
  priority?: boolean;
}

const SIZE_MAP: Record<'xs' | 'sm' | 'md' | 'lg', { px: number; rounded: string }> = {
  xs: { px: 20, rounded: 'rounded-md' },
  sm: { px: 28, rounded: 'rounded-lg' },
  md: { px: 36, rounded: 'rounded-xl' },
  lg: { px: 44, rounded: 'rounded-2xl' },
};

export function BrandLogo({
  size = 'sm',
  className = '',
  variant = 'badge',
  alt = '',
  priority = true,
}: BrandLogoProps) {
  const resolved = typeof size === 'number'
    ? { px: size, rounded: size >= 40 ? 'rounded-2xl' : size >= 28 ? 'rounded-lg' : 'rounded-md' }
    : SIZE_MAP[size];

  const src = variant === 'transparent' ? '/fn-logo-transparent.png' : '/fn-logo.png';
  const isDecorative = !alt;

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden ${
        variant === 'badge' ? `${resolved.rounded} shadow-[0_1px_3px_rgba(0,0,0,0.12)]` : ''
      } ${className}`}
      style={{ width: resolved.px, height: resolved.px }}
      aria-hidden={isDecorative ? true : undefined}
    >
      <Image
        src={src}
        alt={alt}
        width={resolved.px}
        height={resolved.px}
        priority={priority}
        className="h-full w-full object-cover select-none"
      />
    </span>
  );
}
