import type { AuditFilters } from './audit';
import type { SheetFilters } from './sheets';
import type {
  Article,
  ArticleSummary,
  AuditEntry,
  Election,
  Lga,
  RatingsDashboard,
  ResultsDashboard,
  Sheet,
  SheetResult,
  StateOption,
} from './types';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1').replace(
  /\/+$/,
  '',
);

interface Envelope<T> {
  success: boolean;
  data?: T;
}

/** Seconds before Next refetches. Content changes rarely; results often. */
export const REVALIDATE_CONTENT = 600;
export const REVALIDATE_RESULTS = 60;

async function fetchPublic<T>(path: string, revalidate: number): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { accept: 'application/json' },
      next: { revalidate },
    });
    if (!res.ok) return null;
    const body = (await res.json()) as Envelope<T>;
    return body.success && body.data !== undefined ? body.data : null;
  } catch {
    // Network failure, DNS, backend down — the caller decides what to show.
    return null;
  }
}

/** A single published article by slug. `null` when missing or unpublished. */
export function getArticleServer(slug: string): Promise<Article | null> {
  return fetchPublic<Article>(`/articles/${encodeURIComponent(slug)}`, REVALIDATE_CONTENT);
}

/** Every published article, for the sitemap and the library page. */
export async function listArticlesServer(): Promise<ArticleSummary[]> {
  return (await fetchPublic<ArticleSummary[]>('/articles', REVALIDATE_CONTENT)) ?? [];
}

/** The current election, resolved the same way the browser client does it. */
export async function getCurrentElectionServer(): Promise<Election | null> {
  const all = (await fetchPublic<Election[]>('/elections', REVALIDATE_RESULTS)) ?? [];
  const byDateDesc = [...all].sort((a, b) => b.electionDate.localeCompare(a.electionDate));
  return (
    byDateDesc.find((e) => e.status === 'active') ??
    byDateDesc.find((e) => e.status === 'concluded') ??
    byDateDesc.find((e) => e.status === 'upcoming') ??
    null
  );
}

/** Collated results for an election. */
export function getResultsDashboardServer(electionId: string): Promise<ResultsDashboard | null> {
  return fetchPublic<ResultsDashboard>(
    `/dashboard/results?electionId=${encodeURIComponent(electionId)}`,
    REVALIDATE_RESULTS,
  );
}

/** Ratings aggregated per LGA for an election. */
export function getRatingsDashboardServer(electionId: string): Promise<RatingsDashboard | null> {
  return fetchPublic<RatingsDashboard>(
    `/dashboard/ratings?electionId=${encodeURIComponent(electionId)}`,
    REVALIDATE_RESULTS,
  );
}

/** All states, for the sheets browser cascade. */
export async function getStatesServer(): Promise<StateOption[]> {
  return (await fetchPublic<StateOption[]>('/geography/states', REVALIDATE_CONTENT)) ?? [];
}

/** The LGAs within a state. */
export async function getLgasServer(stateId: string): Promise<Lga[]> {
  return (
    (await fetchPublic<Lga[]>(
      `/geography/states/${encodeURIComponent(stateId)}/lgas`,
      REVALIDATE_CONTENT,
    )) ?? []
  );
}

/**
 * Human-readable "LGA, State" for a sheet, mirroring the browser client's
 * cascade so server-rendered metadata reads identically to the hydrated page.
 */
export async function resolveSheetPlace(sheet: {
  stateId: string;
  lgaId: string;
}): Promise<string> {
  const [states, lgas] = await Promise.all([
    getStatesServer(),
    getLgasServer(sheet.stateId),
  ]);
  const stateName = states.find((x) => x.id === sheet.stateId)?.name ?? '';
  const lgaName = lgas.find((x) => x.id === sheet.lgaId)?.name ?? '';
  return [lgaName, stateName].filter(Boolean).join(', ');
}

function sheetQuery(filters: SheetFilters): string {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.electionId) params.set('electionId', filters.electionId);
  if (filters.stateId) params.set('stateId', filters.stateId);
  if (filters.lgaId) params.set('lgaId', filters.lgaId);
  if (filters.status) params.set('status', filters.status);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

/** Browse the public paper trail. */
export async function listSheetsServer(filters: SheetFilters = {}): Promise<Sheet[]> {
  return (
    (await fetchPublic<Sheet[]>(`/sheets${sheetQuery(filters)}`, REVALIDATE_RESULTS)) ?? []
  );
}

/** A single sheet by id. Public. */
export function getSheetServer(id: string): Promise<Sheet | null> {
  return fetchPublic<Sheet>(`/sheets/${encodeURIComponent(id)}`, REVALIDATE_RESULTS);
}

/** The figures published from a sheet; `null` when none (pending/disputed). */
export function getSheetResultServer(id: string): Promise<SheetResult | null> {
  return fetchPublic<SheetResult>(
    `/sheets/${encodeURIComponent(id)}/result`,
    REVALIDATE_RESULTS,
  );
}

function auditQuery(filters: AuditFilters): string {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.action) params.set('action', filters.action);
  if (filters.entityType) params.set('entityType', filters.entityType);
  if (filters.entityId) params.set('entityId', filters.entityId);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

/** Public audit trail. Read-only, paginated. */
export async function listAuditServer(filters: AuditFilters = {}): Promise<AuditEntry[]> {
  return (await fetchPublic<AuditEntry[]>(`/audit${auditQuery(filters)}`, REVALIDATE_RESULTS)) ?? [];
}
