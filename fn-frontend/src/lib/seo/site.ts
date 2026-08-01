

/** Canonical origin, no trailing slash. Override per-environment in Vercel. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://fairnigeria.org').replace(
  /\/+$/,
  '',
);

export const SITE_NAME = 'Fair Nigeria';
export const SITE_DESCRIPTION =
  'A citizen-led record of the 2027 Nigerian election that anyone can verify: civic knowledge, LGA ratings, and results you can trace back to the original polling-unit sheet.';

/** Absolute URL for a path. Accepts '/results' or 'results'. */
export function absoluteUrl(path = '/'): string {
  return `${SITE_URL}/${path.replace(/^\/+/, '')}`.replace(/\/$/, '') || SITE_URL;
}

/**
 * Strip the Markdown syntax an article body carries, so a description falling
 * back to the body reads as prose rather than `## How accreditation works`.
 * Deliberately shallow — this feeds a 155-character summary, not a renderer.
 */
function stripMarkdown(text: string): string {
  return text
    .replace(/^```[\s\S]*?```/gm, ' ') // fenced code
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ') // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // links → their text
    .replace(/^\s{0,3}#{1,6}\s+/gm, '') // headings
    .replace(/^\s{0,3}>\s?/gm, '') // blockquotes
    .replace(/^\s{0,3}([-*+]|\d+\.)\s+/gm, '') // list markers
    .replace(/(\*\*|__|\*|_|`)/g, ''); // emphasis and inline code
}


export function metaDescription(text: string | null | undefined, max = 155): string {
  const clean = stripMarkdown(text ?? '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!clean) return SITE_DESCRIPTION;
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}
