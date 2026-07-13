import type { ReactNode } from 'react';

/** Default left-panel quote for citizen screens (register + login). */
const CITIZEN_PLEDGE = (
  <p>
    <span aria-hidden>“</span>To serve with heart and might,
    <br />
    one nation bound in <span className="text-lime">freedom, peace and unity.</span>
    <span aria-hidden>”</span>
  </p>
);

// The auth layout is Split. Only the form shows in mobile screens while the pledge and form show in desktop screens.

export function AuthShell({ children, quote }: { children: ReactNode; quote?: ReactNode }) {
  return (
    <main id="main" className="min-h-screen w-full md:grid md:grid-cols-2">

      <aside className="relative hidden overflow-hidden bg-[#f2f5e8] md:flex md:flex-col md:p-12 lg:p-16">
        <a href="/" className="flex items-center gap-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-lime" aria-hidden />
          <span className="text-[1.05rem] font-bold text-forest">Fair Nigeria</span>
        </a>

        <div className="flex flex-1 items-center justify-center">
          <blockquote className="max-w-[19ch] text-center text-[clamp(1.9rem,2.8vw,3rem)] font-extrabold leading-[1.15] tracking-[-0.02em] text-forest [text-wrap:balance]">
            {quote ?? CITIZEN_PLEDGE}
          </blockquote>
        </div>
      </aside>

      {/* Right side of the screen, contains form */}
      <section className="relative flex min-h-screen flex-col justify-center bg-cream px-6 py-16 sm:px-10 md:bg-white md:px-[clamp(2rem,5vw,5rem)] md:py-10">
        <a href="/" className="absolute left-6 top-7 flex items-center gap-2.5 sm:left-10 md:hidden">
          <span className="h-2.5 w-2.5 rounded-full bg-lime" aria-hidden />
          <span className="text-[1.05rem] font-bold">Fair Nigeria</span>
        </a>
        <div className="mx-auto w-full max-w-[420px]">{children}</div>
      </section>
    </main>
  );
}
