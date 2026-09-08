"use client";

import { useRef, useState } from "react";
import Ladder from "@/components/Ladder";
import { LEVEL_COPY, type Diagnosis } from "@/lib/diagnosis";

type Attempt = {
  n: number;
  statement: string;
  diagnosis: Diagnosis;
};

export default function Home() {
  const [domain, setDomain] = useState("");
  const [statement, setStatement] = useState("");
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const latest = attempts[attempts.length - 1];
  const earlier = attempts.slice(0, -1).reverse();
  const attemptNumber = Math.max(1, attempts.length);
  const aboveFact = attempts.filter(
    (a) => a.diagnosis.classification !== "FACT",
  ).length;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (pending || !domain.trim() || !statement.trim()) return;

    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain, statement }),
      });
      const body = await response.json();

      if (!response.ok) {
        setError(body?.error ?? "The diagnosis failed. Try submitting again.");
        return;
      }

      const submitted = statement.trim();
      setAttempts((prior) => [
        ...prior,
        {
          n: prior.length + 1,
          statement: submitted,
          diagnosis: body as Diagnosis,
        },
      ]);
      setStatement("");
      requestAnimationFrame(() =>
        resultRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        }),
      );
    } catch {
      setError(
        "Could not reach the server. Check your connection and try again.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="min-h-dvh">
      <header
        className="sticky top-0 z-10 backdrop-blur"
        style={{
          background: "rgba(245,245,248,0.9)",
          borderBottom: "1px solid var(--rule)",
        }}
      >
        <div className="mx-auto flex max-w-[620px] items-center justify-between gap-3 py-3 pl-5 pr-5 sm:gap-4 sm:pl-[50px]">
          <span className="whitespace-nowrap text-[14px] font-semibold tracking-[-0.01em]">
            Expertise coach
          </span>
          <div className="flex items-center gap-3">
            <span
              className="whitespace-nowrap text-[13px] tabular-nums"
              style={{ color: "var(--ink-2)" }}
            >
              Attempt {attemptNumber} of ∞
            </span>
            <span
              aria-hidden
              className="hidden h-[7px] w-16 gap-[2px] overflow-hidden rounded-full sm:flex"
              style={{ background: "var(--rule)" }}
            >
              {attempts.length > 0 && (
                <span
                  className="h-full rounded-full transition-[width] duration-500"
                  style={{
                    width: `${(aboveFact / attempts.length) * 100}%`,
                    background: "var(--accent)",
                  }}
                />
              )}
            </span>
            <span
              className="whitespace-nowrap text-[13px] tabular-nums"
              style={{ color: "var(--ink-2)" }}
            >
              {aboveFact} above fact
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-[620px] flex-col pb-16 pl-[50px] pr-5 pt-8">
        {attempts.length === 0 && (
          <p className="mb-7 max-w-[52ch] text-[17px] leading-[1.55]">
            Write down something you believe is an insight about your domain.
            This tells you which level it actually sits at, and asks you a
            question. You do the rewriting.
          </p>
        )}

        {latest && (
          <div ref={resultRef} className="order-1 scroll-mt-16">
            <Ladder
              key={latest.n}
              diagnosis={latest.diagnosis}
              statement={latest.statement}
            />

            <div
              className="mt-6 rounded-[10px] p-4 sm:p-5"
              style={{ background: "var(--ink)", color: "#fff" }}
            >
              <p
                className="text-[13px] font-semibold"
                style={{ color: "#a9a9ff" }}
              >
                Answer this, then rewrite
              </p>
              <p className="mt-1.5 text-[16px] leading-[1.55]">
                {latest.diagnosis.question}
              </p>
            </div>

            <hr className="mt-9" style={{ borderColor: "var(--rule)" }} />
          </div>
        )}

        <form onSubmit={submit} className={`order-2 ${latest ? "pt-9" : ""}`}>
          <label htmlFor="domain" className="block text-[14px] font-semibold">
            Your domain
          </label>
          <input
            id="domain"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="lawn care business"
            autoComplete="off"
            className="mt-1.5 w-full rounded-[8px] px-3 py-2.5 text-[15px] outline-none"
            style={{
              background: "var(--paper)",
              border: "1px solid var(--rule)",
            }}
            required
          />

          <label
            htmlFor="statement"
            className="mt-5 block text-[14px] font-semibold"
          >
            {attempts.length === 0
              ? "A statement you think is an insight"
              : "Your rewrite"}
          </label>
          <textarea
            id="statement"
            value={statement}
            onChange={(e) => setStatement(e.target.value)}
            placeholder={
              attempts.length === 0
                ? "Most people mow on weekends"
                : "Answer the question above in your own words"
            }
            rows={3}
            className="mt-1.5 w-full resize-y rounded-[8px] px-3 py-2.5 text-[15px] leading-[1.5] outline-none"
            style={{
              background: "var(--paper)",
              border: "1px solid var(--rule)",
            }}
            required
          />

          <div className="mt-4 flex items-center gap-4">
            <button
              type="submit"
              disabled={pending || !domain.trim() || !statement.trim()}
              className="rounded-[8px] px-4 py-2.5 text-[15px] font-semibold text-white transition-opacity disabled:opacity-40"
              style={{ background: "var(--accent)" }}
            >
              {pending ? "Checking…" : "Check the level"}
            </button>
            {error && (
              <p
                role="alert"
                className="text-[14px]"
                style={{ color: "#b00020" }}
              >
                {error}
              </p>
            )}
          </div>
        </form>

        {earlier.length > 0 && (
          <section className="order-3 mt-9">
            <h2 className="text-[14px] font-semibold">Earlier attempts</h2>
            <ul className="mt-2">
              {earlier.map((attempt) => (
                <li
                  key={attempt.n}
                  className="grid grid-cols-[1.6rem_1fr] gap-3 border-t py-3 text-[14px]"
                  style={{ borderColor: "var(--rule)" }}
                >
                  <span
                    className="tabular-nums"
                    style={{ color: "var(--ink-2)" }}
                  >
                    {attempt.n}
                  </span>
                  <span>
                    <span className="leading-[1.5]">{attempt.statement}</span>
                    <span
                      className="mt-0.5 block text-[13px]"
                      style={{ color: "var(--ink-2)" }}
                    >
                      {LEVEL_COPY[attempt.diagnosis.classification].name}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>

      <footer
        className="mx-auto max-w-[620px] pb-10 pl-[50px] pr-5 text-[13px]"
        style={{ color: "var(--ink-2)" }}
      >
        Prototype by David Kelly
      </footer>
    </div>
  );
}
