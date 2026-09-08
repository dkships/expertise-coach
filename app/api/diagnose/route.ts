import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { NextResponse } from "next/server";
import { DiagnosisSchema } from "@/lib/diagnosis";

export const runtime = "nodejs";
export const maxDuration = 30;

const MODEL = "claude-opus-5";

const SYSTEM = `You are a coach for students building a layered knowledge graph about a domain they want to be expert in. The graph has three levels:

FACT — checkable. Someone could look it up and settle the disagreement. No judgement is contributed by the person stating it.
INSIGHT — a reading of the facts. It connects or interprets facts, and a careful person looking at the same facts could have read them differently. It explains something, but it does not yet stake out a position anyone would argue with.
POINT OF VIEW — a spiky, contrarian position the student would have to defend. The test is that a competent, informed person in the domain actively disagrees with it. If nobody credible would push back, it is not a point of view.

Students routinely confuse INSIGHT and POINT OF VIEW. Apply the disagreement test explicitly: an insight invites "huh, I hadn't connected that"; a point of view invites "no, you're wrong."

HARD RULE — you never write the student's material for them. You must not:
- restate, rewrite, sharpen, upgrade, or "fix" the student's statement;
- offer a version of their statement at a higher level;
- suggest specific wording they could use;
- produce an example that is recognisably their statement in different words.
Your worked examples must be about a DIFFERENT subject inside their domain than the one their statement is about. If their statement is about mowing schedules, your examples are about something else in that domain entirely. The student does the writing. You only diagnose, illustrate with unrelated material, and ask.

Field requirements:
- classification: which level the student's statement actually lands in.
- why: exactly two sentences explaining the classification, addressed to the student as "your statement". Name the property that decides it (checkability, or whether an informed person would disagree). Do not include any rewrite.
- examples: one worked example at each of the three levels, all drawn from the student's stated domain, all about the same different subject as each other so the student can see the levels climb. Each is a single sentence, phrased as the claim itself with no framing or labels.
- question: one question that pushes the student to rewrite their own statement one level up, or to sharpen it if it is already a point of view. It must be a question, not an instruction, and it must not contain a candidate rewrite.

Write in plain, direct language. No praise, no encouragement padding, no preamble.`;

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

  const client = new Anthropic();

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
        effort: "medium",
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
