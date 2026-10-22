// Best-effort abuse guard for the public demo: every request spends real money
// on the server's Anthropic key. State lives in this function instance's
// memory, so a cold start or a second instance starts fresh. It stops one
// visitor or script from looping the endpoint; the hard ceiling is the spend
// limit on the Anthropic workspace that owns the key.

type Window = { limit: number; ms: number };

const PER_IP: Window[] = [
  { limit: 6, ms: 60_000 },
  { limit: 30, ms: 60 * 60_000 },
];
const GLOBAL: Window = { limit: 300, ms: 60 * 60_000 };
const MAX_TRACKED_IPS = 5_000;

const hitsByIp = new Map<string, number[]>();
let globalHits: number[] = [];

function prune(hits: number[], now: number, ms: number) {
  return hits.filter((t) => now - t < ms);
}

export function clientIp(request: Request): string {
  // Vercel sets x-real-ip and overwrites x-forwarded-for with the real client
  // address, so neither can be spoofed by the caller there.
  return (
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

/** Returns seconds to wait if this call is over a limit, otherwise records it. */
export function rateLimit(ip: string, now = Date.now()): number | null {
  const longest = Math.max(...PER_IP.map((w) => w.ms));
  const hits = prune(hitsByIp.get(ip) ?? [], now, longest);
  globalHits = prune(globalHits, now, GLOBAL.ms);

  const checks: [Window, number[]][] = [
    ...PER_IP.map((w): [Window, number[]] => [w, hits]),
    [GLOBAL, globalHits],
  ];
  for (const [w, list] of checks) {
    const recent = list.filter((t) => now - t < w.ms);
    if (recent.length >= w.limit) {
      return Math.ceil((recent[0] + w.ms - now) / 1000);
    }
  }

  hits.push(now);
  globalHits.push(now);
  if (!hitsByIp.has(ip) && hitsByIp.size >= MAX_TRACKED_IPS) {
    const oldest = hitsByIp.keys().next().value;
    if (oldest !== undefined) hitsByIp.delete(oldest);
  }
  hitsByIp.delete(ip);
  hitsByIp.set(ip, hits);
  return null;
}
