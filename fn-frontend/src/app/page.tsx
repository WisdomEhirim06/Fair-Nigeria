import type { ReactNode } from 'react';

import { Hero } from '@/components/Hero';
import { Reveal } from '@/components/Reveal';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteNav } from '@/components/SiteNav';


function Eyebrow({ children, light = false }: { children: ReactNode; light?: boolean }) {
  return (
    <span
      className={`inline-flex items-center font-mono text-[0.72rem] font-semibold uppercase tracking-[0.22em] ${
        light ? 'text-lime-bright' : 'text-leaf'
      }`}
    >
      {children}
    </span>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-[clamp(1.15rem,4.6vw,2.4rem)] font-extrabold tracking-[-0.03em]">
        {value}
      </div>
      <div className="mt-1.5 text-[0.72rem] font-medium leading-snug tracking-wide text-muted sm:text-[0.85rem]">
        {label}
      </div>
    </div>
  );
}

const SECTION_X = 'px-6 md:px-[clamp(1.5rem,7vw,7.5rem)]';

const CIVIC_ARTICLES = [
  { tag: 'Eligibility', title: 'How old should someone be to vote?' },
  { tag: 'Presidential', title: 'All you need to know about the presidential elections' },
  { tag: 'After the vote', title: 'What happens after the elections?' },
];

const RATING_CRITERIA = [
  { label: 'Accreditation', score: 5 },
  { label: 'Orderliness', score: 4 },
  { label: 'Security presence', score: 4 },
  { label: 'Freedom from intimidation', score: 3 },
];

const RESULTS = [
  { name: 'Party A', pct: '41.2%', width: 41, fill: 'var(--color-lime)' },
  { name: 'Party B', pct: '33.5%', width: 33.5, fill: 'var(--color-gold)' },
  { name: 'Party C', pct: '19.1%', width: 19, fill: '#5b8f7a' },
  { name: 'Others', pct: '6.2%', width: 6.2, fill: 'rgba(235,237,224,0.45)' },
];

const VERIFY_STEPS = [
  { n: '01', title: 'Officers upload', body: 'Field officers upload the result sheets from each polling unit.' },
  { n: '02', title: 'People verify', body: 'Two or three people check every sheet before it counts.' },
  { n: '03', title: 'Everyone can see', body: 'Open the public log of every action, anytime.' },
];

export default function Home() {
  return (
    <>
      <SiteNav />
      <main id="main">
        <Hero />

        {/*The 2023 record */}
        <Reveal>
          <section
            id="turnout"
            className={`${SECTION_X} py-14 md:py-[clamp(1.75rem,3.5vw,2.75rem)]`}
          >
            <Eyebrow>The 2023 record</Eyebrow>
            <h2 className="mt-4 max-w-[20ch] text-[clamp(1.7rem,3.4vw,2.7rem)] font-extrabold leading-[1.03] tracking-[-0.03em]">
              Your decision matters more than the numbers suggest.
            </h2>

            <div className="mt-[clamp(1rem,3vw,2rem)] flex flex-wrap items-end gap-[clamp(1.25rem,4vw,3rem)]">
              <div className="flex items-start font-extrabold leading-[0.82] tracking-[-0.04em] text-ink">
                <span className="text-[clamp(2.6rem,6vw,4.5rem)]">26.7</span>
                <span className="mt-[0.18em] text-[clamp(1.2rem,2.5vw,2rem)]">%</span>
              </div>
              <p className="mb-1.5 max-w-[34ch] text-[clamp(1rem,1.4vw,1.25rem)] leading-snug text-muted">
                of registered voters cast a ballot in the 2023 general election, the{' '}
                <strong className="font-semibold text-ink">lowest turnout</strong> since the return
                to democracy in 1999.
              </p>
            </div>

            {/* Three across at every width — the desktop composition holds on mobile. */}
            <Reveal
              group
              className="mt-[clamp(1.5rem,3vw,2rem)] grid grid-cols-3 gap-4 border-t border-ink/10 pt-[clamp(1.25rem,2.5vw,1.75rem)] sm:gap-[clamp(1.25rem,3vw,2.5rem)]"
            >
              <Stat value="93.4M" label="registered voters" />
              <Stat value="24.9M" label="actually voted" />
              <Stat value="~1 in 4" label="decided the outcome for all" />
            </Reveal>
          </section>
        </Reveal>

        {/* Before the vote — Civic library */}
        <Reveal>
          <section
            id="civic"
            className={`${SECTION_X} flex flex-wrap items-center gap-10 py-14 md:gap-[clamp(2rem,5vw,4rem)] md:py-[clamp(1.75rem,3.5vw,2.75rem)]`}
          >
            <div className="order-2 min-w-[300px] flex-1 basis-[420px]">
              <Eyebrow>Before the vote · Civic library</Eyebrow>
              <h2 className="mt-4 max-w-[15ch] text-[clamp(1.6rem,3vw,2.5rem)] font-bold leading-[1.05] tracking-[-0.025em]">
                Learn what should and shouldn’t happen.
              </h2>
              <p className="mt-4 max-w-[44ch] text-[clamp(1rem,1.25vw,1.15rem)] leading-relaxed text-muted">
                Easy-to-read guides on your rights, and what
                counts as malpractice, so you know what to expect.
              </p>
              <a
                href="/articles"
                className="mt-5 inline-flex items-center gap-2 border-b-[1.5px] border-ink/30 py-1.5 font-semibold transition-colors hover:border-leaf focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              >
                Open the civic library
              </a>
            </div>


            <div className="order-1 flex min-w-[280px] flex-1 basis-[360px] justify-center md:justify-start">
              <div className="flex w-full max-w-[420px] flex-col gap-3.5">
                {CIVIC_ARTICLES.map((a, i) => (
                  <a
                    key={a.title}
                    href="/articles"
                    className="group relative rounded-2xl border border-ink/12 bg-white/85 p-5 pt-6 shadow-[0_10px_28px_rgba(15,31,23,0.08)] transition-colors hover:border-leaf/50 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                  >
                    <span
                      className="absolute -top-2 left-5 h-4 w-12 rounded-t-md bg-leaf/60"
                      aria-hidden
                    />
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[0.62rem] uppercase tracking-[0.16em] text-leaf">
                        {a.tag}
                      </span>
                      <span className="font-mono text-[0.62rem] tracking-[0.1em] text-muted">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                    </div>
                    <p className="mt-3 text-[1.05rem] font-semibold leading-snug">{a.title}</p>
                    <span className="mt-3 inline-flex items-center gap-1.5 font-mono text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-ink/60 transition-colors group-hover:text-leaf">
                      Read <span aria-hidden>→</span>
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </section>
        </Reveal>

        {/*On the day — LGA ratings */}
        <Reveal>
        <section
          id="ratings"
          className={`${SECTION_X} flex flex-wrap items-center gap-12 pb-[clamp(4rem,10vw,9rem)] pt-4 md:gap-[clamp(2.5rem,6vw,6rem)] md:pt-0`}
        >
          <div className="min-w-[300px] flex-1 basis-[420px]">
            <Eyebrow>On the day · Ratings</Eyebrow>
            <h2 className="mt-6 max-w-[16ch] text-[clamp(2rem,4.2vw,3.4rem)] font-bold leading-[1.03] tracking-[-0.025em]">
              Rate the election around you.
            </h2>
            <p className="mt-6 max-w-[44ch] text-[clamp(1.05rem,1.35vw,1.28rem)] leading-relaxed text-muted">
              Find your state and LGA, then score what really happened. Every rating rolls up into a
              public map, as it happens.
            </p>
          </div>

          <div className="flex min-w-[300px] flex-1 basis-[400px] justify-center">
            <div className="w-full max-w-[420px] overflow-hidden rounded-sm bg-[#fbf8ec] shadow-[0_22px_50px_rgba(15,31,23,0.18)]">
              <div className="flex items-center justify-between gap-2 bg-ink px-5 py-3 text-[#f3efdd]">
                <span className="flex items-center gap-2 text-[0.82rem] font-bold tracking-[0.04em]">
                  <span className="h-2.5 w-2.5 rounded-full bg-lime" aria-hidden />
                  FAIR NIGERIA
                </span>
                <span className="font-mono text-[0.62rem] tracking-[0.1em] text-lime-bright">
                  FN·LAG·SUR
                </span>
              </div>
              <div className="border-b-2 border-ink px-5 pb-3 pt-4 text-center">
                <div className="text-[1.2rem] font-extrabold tracking-wide">LGA RATING</div>
                <div className="mt-1.5 font-mono text-[0.66rem] uppercase tracking-[0.14em] text-[#5e7065]">
                  Surulere · Lagos
                </div>
              </div>
              <div className="px-5">
                {RATING_CRITERIA.map((c, idx) => (
                  <div
                    key={c.label}
                    className={`flex items-center justify-between gap-3 py-3.5 ${
                      idx < RATING_CRITERIA.length - 1 ? 'border-b border-ink/10' : ''
                    }`}
                  >
                    <span className="text-[0.98rem] font-semibold">{c.label}</span>
                    <span className="flex gap-1.5" aria-label={`${c.score} out of 5`}>
                      {/* Leaf rather than lime — five bright dots in a row read
                          as a game score, which is the impression this whole
                          pass is correcting. */}
                      {[1, 2, 3, 4, 5].map((n) => (
                        <span
                          key={n}
                          className="h-3 w-3 rounded-full bg-leaf"
                          style={{ opacity: n <= c.score ? 1 : 0.16 }}
                          aria-hidden
                        />
                      ))}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between px-5 py-4 font-mono text-[0.58rem] uppercase tracking-[0.1em] text-[#9aa595]">
                <span>Illustrative citizen submission</span>
                <span className="font-bold text-leaf">Tallied ✓</span>
              </div>
            </div>
          </div>
        </section>
        </Reveal>

        {/* How you know it's real — the trust mechanism */}
        <Reveal>
          <section id="verify" className={`${SECTION_X} py-[clamp(3.5rem,8vw,6.5rem)]`}>
            <div className="max-w-[640px]">
              <Eyebrow>How you know it’s real</Eyebrow>
              <h2 className="mt-5 max-w-[16ch] text-[clamp(2rem,4.2vw,3.4rem)] font-bold leading-[1.03] tracking-[-0.025em]">
                A record you can check yourself.
              </h2>
              <p className="mt-6 max-w-[52ch] text-[clamp(1.05rem,1.35vw,1.28rem)] leading-relaxed text-muted">
                Fair Nigeria is a parallel, independent record, not a replacement for INEC. It is
                built so anyone can trace a published number back to the paper it came from.
              </p>
            </div>

            <ol className="mt-[clamp(2rem,4vw,3.25rem)] grid gap-px overflow-hidden rounded-2xl border border-ink/12 bg-ink/12 sm:grid-cols-3">
              {VERIFY_STEPS.map((s) => (
                <li key={s.n} className="bg-cream p-6 md:p-7">
                  <span className="font-mono text-[0.8rem] font-semibold text-leaf">{s.n}</span>
                  <h3 className="mt-3 text-[1.15rem] font-bold tracking-[-0.01em]">{s.title}</h3>
                  <p className="mt-2.5 text-[0.98rem] leading-relaxed text-muted">{s.body}</p>
                </li>
              ))}
            </ol>
          </section>
        </Reveal>

        {/* After the vote — Live results */}
        <Reveal>
        <section
          id="results"
          className={`${SECTION_X} flex flex-wrap items-center gap-[clamp(2.5rem,6vw,6rem)] bg-forest py-[clamp(3.5rem,8vw,6.5rem)] text-cream`}
        >
          <div className="min-w-[300px] flex-1 basis-[420px]">
            <Eyebrow light>After the vote · Live results</Eyebrow>
            <h2 className="mt-6 max-w-[15ch] text-[clamp(2rem,4.2vw,3.4rem)] font-bold leading-[1.03] tracking-[-0.025em]">
              Watch the count come in, sheet by sheet.
            </h2>
            <p className="mt-6 max-w-[44ch] text-[clamp(1.05rem,1.35vw,1.28rem)] leading-relaxed text-[#cdd6c4]">
              Result sheets are uploaded from the field, verified by independent transcribers, and
              published the moment they agree. Every figure traces back to a sheet you can see.
            </p>
            {/*
              The section that talks about results now leads to them. Reading
              this far is the clearest signal someone wants to look rather than
              take part, and the sign-up CTA doesn't serve that person.
            */}
            <a
              href="/results"
              className="mt-8 inline-flex min-h-[52px] items-center rounded-full bg-cream px-7 text-[1rem] font-semibold text-ink transition-colors hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cream"
            >
              See the live results
            </a>
          </div>

          <div className="min-w-[300px] flex-1 basis-[400px]">
            <div className="mb-6 flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 font-mono text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-lime-bright">
                <span className="h-2.5 w-2.5 rounded-full bg-lime" aria-hidden />
                Live collation · illustrative
              </span>
              <span className="text-[0.9rem] text-[#9fad95]">418 of 774 LGAs reporting</span>
            </div>

            {RESULTS.map((r) => (
              <div key={r.name} className="py-4">
                <div className="mb-2.5 flex items-baseline justify-between">
                  <span className="text-[1.06rem] font-semibold">{r.name}</span>
                  <span className="text-[1.06rem] font-bold text-lime-bright">{r.pct}</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${r.width}%`, background: r.fill }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
        </Reveal>

        {/* Closing CTA  */}
        <Reveal>
        <section id="dashboard" className={`${SECTION_X} py-[clamp(5rem,12vw,10rem)] text-center`}>
          <div className="mx-auto max-w-[700px]">
            <span className="mb-7 inline-flex items-center gap-2 font-mono text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-leaf">
              <span className="inline-block h-px w-6 bg-ink/25" aria-hidden />
              Be the record
            </span>
            <h2 className="mx-auto max-w-[14ch] text-[clamp(2.5rem,6vw,4.8rem)] font-extrabold leading-[1.02] tracking-[-0.035em] [text-wrap:balance]">
              Nigeria is counting on you to count.
            </h2>
          </div>
        </section>
        </Reveal>
      </main>
      <SiteFooter />
    </>
  );
}
