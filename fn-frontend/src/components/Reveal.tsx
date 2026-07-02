'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Delay before this block animates in, in ms. */
  delay?: number;
  /** Stagger the direct children in sequence instead of moving as one block. */
  group?: boolean;
};

/**
 * Fades + lifts its children into place the first time they scroll into view.
 * With `group`, its direct children cascade one after another (see globals.css).
 * No-ops (shows immediately) when IntersectionObserver is unavailable or the
 * user prefers reduced motion — that branch is handled in CSS.
 */
export function Reveal({ children, className, delay = 0, group = false }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -10% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const flag = group ? { 'data-reveal-group': '' } : { 'data-reveal': '' };

  return (
    <div
      ref={ref}
      {...flag}
      data-shown={shown}
      className={className}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
