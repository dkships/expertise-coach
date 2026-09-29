import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { NextResponse } from "next/server";
import { DiagnosisSchema } from "@/lib/diagnosis";
import { SYSTEM } from "@/lib/system-prompt";

export const runtime = "nodejs";
export const maxDuration = 30;

// Re-benchmarked 2026-09-29 on 23 labelled cases x2: Sonnet 5.5 at adaptive
// "low" got 46/46 with the disagreement-test clarification in the system
// prompt (Sonnet 5 with thinking off: 41/46), p50 3.6s, p95 4.9s. At "low" it
// skips thinking on these requests. Sonnet 5.5 rejects thinking "disabled".
const MODEL = "claude-sonnet-5-5";

// A few Sonnet 5.5 calls stalled for 30-60s in testing. Fail fast with a
// retryable error inside maxDuration instead of letting the function die.
const CALL_TIMEOUT_MS = 12_000;

export async function POST(request: Request) {
  let domain: unknown;
  let statement: unknown;

  try {
    ({ domain, statement } = await request.json());
  } catch {
    return NextResponse.json(
      { error: "Send JSON with a domain and a statement." },
      { status: 400 },
    );
  }

  if (
    typeof domain !== "string" ||
    typeof statement !== "string" ||
    !domain.trim() ||
    !statement.trim()
  ) {
    return NextResponse.json(
      { error: "Both a domain and a statement are required." },
      { status: 400 },
    );
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not set on the server." },
      { status: 500 },
    );
  }

  const client = new Anthropic({ timeout: CALL_TIMEOUT_MS, maxRetries: 1 });

  try {
    const response = await client.messages.parse({
      model: MODEL,
      max_tokens: 4096,
      thinking: { type: "adaptive" },
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: `Domain: ${domain.trim()}\n\nStatement the student believes is an insight: ${statement.trim()}`,
        },
      ],
      output_config: {
        format: zodOutputFormat(DiagnosisSchema),
        effort: "low",
      },
    });

    if (!response.parsed_output) {
      return NextResponse.json(
        {
          error:
            "The model did not return a usable diagnosis. Try submitting again.",
        },
        { status: 502 },
      );
    }

    return NextResponse.json(response.parsed_output);
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      return NextResponse.json(
        { error: "Rate limited. Wait a moment and try again." },
        { status: 429 },
      );
    }
    if (error instanceof Anthropic.AuthenticationError) {
      return NextResponse.json(
        { error: "The server's Anthropic API key was rejected." },
        { status: 500 },
      );
    }
    if (error instanceof Anthropic.APIConnectionError) {
      return NextResponse.json(
        { error: "Could not reach the Anthropic API." },
        { status: 503 },
      );
    }
    console.error("diagnose failed", error);
    return NextResponse.json(
      { error: "The diagnosis failed. Try submitting again." },
      { status: 500 },
    );
  }
}
