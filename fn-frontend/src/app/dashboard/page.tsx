// Placeholder so the sign-in flow lands somewhere. The real dashboard comes next.
export default function DashboardPage() {
  return (
    <main
      id="main"
      className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center"
    >
      <span className="font-mono text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-leaf">
        You’re in
      </span>
      <h1 className="text-[clamp(1.8rem,4vw,2.8rem)] font-extrabold tracking-[-0.02em]">
        Welcome to Fair Nigeria
      </h1>
      <p className="max-w-[40ch] leading-relaxed text-muted">
        Your dashboard is coming next. This is a placeholder so the sign-in flow has somewhere to
        land.
      </p>
      <a
        href="/"
        className="mt-4 rounded-full bg-ink px-6 py-3 font-semibold text-cream transition hover:bg-lime hover:text-ink"
      >
        Back to home
      </a>
    </main>
  );
}
