// Small display helpers for the dashboards.

export function formatNumber(n: number): string {
  return Math.round(n).toLocaleString('en-NG');
}
export function updatedAgo(iso: string | null, now: number): string {
  if (!iso) return 'awaiting first update';

  const ms = Math.max(0, now - new Date(iso).getTime());
  const min = Math.floor(ms / 60_000);

  if (min < 1) return 'updated just now';
  if (min === 1) return 'updated 1 minute ago';
  if (min < 60) return `updated ${min} minutes ago`;
  
  const hr = Math.floor(min / 60);
  if (hr === 1) return 'updated 1 hour ago';
  if (hr < 24) return `updated ${hr} hours ago`;
  const day = Math.floor(hr / 24);
  return day === 1 ? 'updated 1 day ago' : `updated ${day} days ago`;
}
