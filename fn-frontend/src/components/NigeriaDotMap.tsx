import { LGA_DOTS, NIGERIA_PATH, NIGERIA_VIEWBOX } from '@/lib/nigeria-shape';

// The signature element: Nigeria rendered from one dot per local government
// area. Dots fade-and-scale in on load via CSS (staggered by latitude, so the
// record reads as "filling in"); a few gold dots pulse as live results. Pure
// SVG + CSS — no client JS — and reduced-motion just shows the filled state.
export function NigeriaDotMap({ className }: { className?: string }) {
  const { w, h } = NIGERIA_VIEWBOX;
  const dots = LGA_DOTS.filter((d) => !d.live);
  const liveDots = LGA_DOTS.filter((d) => d.live);

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className={className}
      role="img"
      aria-label="A map of Nigeria built from one dot for each of its 774 local government areas, filling in as the record forms"
    >
      <path d={NIGERIA_PATH} className="ng-outline" />
      <g>
        {dots.map((d, i) => (
          <circle
            key={i}
            cx={d.x}
            cy={d.y}
            r={2.3}
            className="ng-dot"
            style={{ animationDelay: `${Math.round(280 + d.y * 2.1 + (i % 7) * 28)}ms` }}
          />
        ))}
      </g>
      <g>
        {liveDots.map((d, i) => (
          <g key={`live-${i}`}>
            <circle cx={d.x} cy={d.y} r={9} className="ng-live-ring" />
            <circle cx={d.x} cy={d.y} r={3.4} className="ng-live" />
          </g>
        ))}
      </g>
    </svg>
  );
}
