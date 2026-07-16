import { PublicDashboard } from '@/components/dashboard/PublicDashboard';

// Public results + ratings dashboard.
export default function ResultsPage() {
  return (
    <main id="main" className="min-h-screen bg-cream">
      <header className="flex items-center justify-between px-6 py-5 md:px-[clamp(1.5rem,7vw,7.5rem)]">
        <a href="/" className="flex items-center gap-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-lime" aria-hidden />
          <span className="text-[1.05rem] font-bold">Fair Nigeria</span>
        </a>
        <nav className="flex items-center gap-5 text-[0.9rem] font-medium text-ink/70">
          <a href="/" className="transition-colors hover:text-ink">
            Home
          </a>
          <a
            href="/register"
            className="rounded-full bg-ink px-4 py-2 font-semibold text-cream transition hover:bg-lime hover:text-ink"
          >
            Rate the election
          </a>
        </nav>
      </header>

      <PublicDashboard />
    </main>
  );
}
