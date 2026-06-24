// Placeholder geometry for the hero dot-map.
//
// This is an approximate national outline used only to scatter "many dots" in
// the rough shape of Nigeria. In a later pass this is replaced by real LGA
// centroids projected from an open admin-level-2 boundary dataset (one dot per
// the 774 LGAs), precomputed at build time. The component contract stays the
// same: an array of { x, y } points plus a single outline path string.

export type Dot = { x: number; y: number; live?: boolean };

export const NIGERIA_VIEWBOX = { w: 600, h: 520 };

// Outline vertices (clockwise from the north-west), in viewBox units.
const OUTLINE: [number, number][] = [
  [60, 110],
  [120, 92],
  [170, 98],
  [210, 74],
  [270, 66],
  [300, 78],
  [350, 66],
  [400, 74],
  [452, 92],
  [470, 86],
  [520, 72],
  [565, 80],
  [588, 116],
  [560, 150],
  [548, 176],
  [516, 196],
  [536, 236],
  [506, 252],
  [486, 260],
  [472, 300],
  [446, 332],
  [412, 352],
  [372, 366],
  [336, 380],
  [300, 372],
  [250, 360],
  [196, 352],
  [150, 356],
  [116, 338],
  [98, 300],
  [110, 256],
  [88, 212],
  [104, 168],
  [86, 140],
];

export const NIGERIA_PATH =
  OUTLINE.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ') + ' Z';

function isInside(x: number, y: number): boolean {
  let inside = false;
  for (let i = 0, j = OUTLINE.length - 1; i < OUTLINE.length; j = i++) {
    const [xi, yi] = OUTLINE[i];
    const [xj, yj] = OUTLINE[j];
    const crosses = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (crosses) inside = !inside;
  }
  return inside;
}

function buildDots(): Dot[] {
  const step = 12;
  const dots: Dot[] = [];
  let rowIndex = 0;
  for (let y = 70; y <= 384; y += step * 0.92, rowIndex += 1) {
    const offset = rowIndex % 2 === 0 ? 0 : step / 2;
    for (let x = 60; x <= 590; x += step) {
      const px = x + offset;
      if (isInside(px, y)) {
        dots.push({ x: Math.round(px * 10) / 10, y: Math.round(y * 10) / 10 });
      }
    }
  }

  // Flag a few dots as "live" (a result just landed) — nearest dot to each anchor.
  const anchors: [number, number][] = [
    [150, 345], // south-west
    [300, 120], // north-central
    [430, 300], // south-east
  ];
  for (const [ax, ay] of anchors) {
    let best = -1;
    let bestDist = Infinity;
    for (let i = 0; i < dots.length; i += 1) {
      const dist = (dots[i].x - ax) ** 2 + (dots[i].y - ay) ** 2;
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    }
    if (best >= 0) dots[best].live = true;
  }

  return dots;
}

export const LGA_DOTS: Dot[] = buildDots();
