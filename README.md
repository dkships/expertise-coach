# expertise-coach

**Live: https://expertise-coach.vercel.app**

![The coach after classifying a student's statement](docs/screenshot.png)

Students building a knowledge graph confuse an insight with a spiky point of view.
This coaches the difference. You enter a focus area and something you believe about
it; the app tells you which of three levels it actually landed in, shows a worked
example of all three from elsewhere in your field, and asks you one question. It
never writes the statement for you. Rewrite, resubmit, repeat.

Where it sits: one screen of the Expertise App. A graded entry here is what should
feed the Audience App's umbrella topics.

Built in about two hours, including the model benchmark below.

## Run it

```bash
npm install
echo 'ANTHROPIC_API_KEY=sk-ant-...' > .env.local
npm run dev
```

Open http://localhost:3000. `npm run build` for the production build.

## How it works

Next.js 14 App Router, TypeScript, Tailwind. No database — attempt history is React
state and resets on reload.

The key is read only inside `app/api/diagnose/route.ts`, the single server route. It
sends the system prompt in `lib/system-prompt.ts`, which forbids rewriting the
student's statement, and pins the response shape with structured outputs against the
Zod schema in `lib/diagnosis.ts` — so the route returns a valid diagnosis or an
error, never half-parsed text.

Two decisions carry the whole thing:

Worked examples must be about a **different subject** than the student's statement.
Left unconstrained, the model illustrates the three levels by rewriting the student's
own claim one rung up, which hands them the answer.

The three level definitions are **hardcoded**, not model-generated. They are the
thing being taught, so they must not drift between attempts.

## Model choice

Benchmarked over labelled cases where the correct level is known, on this prompt:

Re-run 2026-09-29 on 23 cases x2 (labels adjudicated by an Opus 5.5 judge), after
adding one sentence to the prompt's disagreement test: a causal explanation stays an
insight unless it also takes a side.

| Model | Thinking | Accuracy | Median | p95 |
|---|---|---|---|---|
| **claude-sonnet-5-5** | **adaptive, low** | **46/46** | **3.6s** | **4.9s** |
| claude-sonnet-5 | off | 41/46 | 4.9s | 6.1s |

Re-checked 2026-10-07 against claude-haiku-5-5 (about 10x cheaper per call), same
prompt, same 23 cases x2, scored against the author labels:

| Model | Thinking | Accuracy | Median | p95 | Cost per call |
|---|---|---|---|---|---|
| **claude-sonnet-5-5** (control) | adaptive, low | **46/46** | 4.0s | 6.2s | $0.0064 |
| claude-haiku-5-5 | adaptive, low | 40/46 | 6.2s | 8.3s | $0.0006 |
| claude-haiku-5-5 | adaptive, medium | 40/46 | 7.0s | 9.7s | $0.0007 |
| claude-haiku-5-5 | adaptive, high | 42/46 | 9.5s | 15.0s | $0.0010 |

Haiku answered every call and every response parsed, so this is a judgement gap, not
a harness problem. It reads "strict rules keep players longer" as taking a side, the
same trap the disagreement test warns about. It also thinks on almost every call, so
it is slower despite being cheaper. A prompt clarification applied to both models
lifted Haiku to 43/46 (low) and 44/46 (medium) and left Sonnet at 46/46. On 16 new
held-out cases, labelled by an Opus 5.5 judge before any run, Sonnet 5.5 scored 32/32
and Haiku 29/32 (low) and 27/32 (medium) on the current prompt. Sonnet 5.5 stays.

Earlier run, 2026-09-07, on the prompt before that sentence:

| Model | Thinking | Accuracy | Median | Max |
|---|---|---|---|---|
| claude-sonnet-5 | off | 15/15 | 5.5s | 7.0s |
| claude-sonnet-5 | adaptive, low | 14/15 | 5.8s | 9.1s |
| claude-opus-5 | adaptive, low | 5/6 | 8.3s | 10.7s |
| claude-opus-5 | adaptive, medium | 5/6 | 9.9s | 10.9s |
| claude-sonnet-4-6 | off | 4/6 | 9.2s | 11.3s |

In that run, Sonnet 5 with thinking off won on both axes. Opus 5 matched it on accuracy and cost
~4s per call, which is the difference between a demo that feels instant and one that
looks broken. Sonnet 4.6 was the worst option tested — slower *and* the only model to
misread a causal reading as a position, which is exactly the distinction being taught.

Sonnet 5.5 rejects thinking "disabled", so the route sets adaptive thinking and
`effort: "low"` explicitly. A safety-classifier refusal returns a 422 with a plain
message instead of a parse error.

Prototype by David Kelly.
