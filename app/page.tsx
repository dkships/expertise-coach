"use client";

import { useRef, useState } from "react";
import Ladder from "@/components/Ladder";
import { LEVEL_COPY, type Diagnosis } from "@/lib/diagnosis";

/** One click fills both fields and submits. Someone evaluating this should not
 *  have to invent a focus area before they can see what the thing does. */
const EXAMPLES = [
  { focus: "lawn care", statement: "Most people mow on weekends" },
  {
    focus: "sneaker reselling",
    statement:
      "Hyped drops resell for less than quiet ones, because everyone who bought them was planning to flip them too",
  },
  {
    focus: "youth soccer",
    statement:
      "Club soccer before age 12 should not exist. It burns kids out and mostly sells parents hope.",
  },
];

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

  function submit(event: React.FormEvent) {
    event.preventDefault();
    run(domain, statement);
  }

  function runExample(example: (typeof EXAMPLES)[number]) {
    setDomain(example.focus);
    setStatement(example.statement);
    run(example.focus, example.statement);
  }

  async function run(rawDomain: string, rawStatement: string) {
    const domainValue = rawDomain.trim();
    const submitted = rawStatement.trim();
    if (pending || !domainValue || !submitted) return;

    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: domainValue, statement: submitted }),
      });
      const body = await response.json();

      if (!response.ok) {
        setError(body?.error ?? "The diagnosis failed. Try submitting again.");
        return;
      }

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
              {aboveFact} past fact
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-[620px] flex-col pb-16 pl-[50px] pr-5 pt-8">
        {attempts.length === 0 && (
          <div className="mb-7">
            <p className="max-w-[52ch] text-[17px] leading-[1.55]">
              Anyone can look up a fact. To prove you actually know your field,
              you need a take someone could argue with. Write one below and find
              out what you have actually got.
            </p>

            <p className="mb-2 mt-6 text-[14px] font-semibold">
              Or run one of these
            </p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLES.map((example) => (
                <button
                  key={example.focus}
                  type="button"
                  onClick={() => runExample(example)}
                  disabled={pending}
                  className="max-w-full rounded-full px-3.5 py-2 text-left text-[13px] leading-[1.35] disabled:opacity-40"
                  style={{
                    background: "var(--paper)",
                    border: "1px solid var(--rule)",
                  }}
                >
                  <span
                    className="font-semibold"
                    style={{ color: "var(--accent)" }}
                  >
                    {example.focus}
                  </span>
                  <span style={{ color: "var(--ink-2)" }}> · </span>
                  <span>
                    {example.statement.length > 52
                      ? example.statement.slice(0, 52).trimEnd() + "…"
                      : example.statement}
                  </span>
                </button>
              ))}
            </div>
          </div>
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
                Answer this, then try again
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
            Your focus area
          </label>
          <input
            id="domain"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="lawn care"
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
              ? "Something you believe about it"
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
              {pending ? "Checking…" : "Check it"}
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
