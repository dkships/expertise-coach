# expertise-coach

Students building a knowledge graph about a domain confuse an insight with a
point of view. This coaches the difference. You enter your domain and a
statement you think is an insight; the app tells you which of three levels it
actually landed in — fact, insight, or point of view — shows a worked example
of all three from somewhere else in your domain, and asks you a question. It
never writes the statement for you. Rewrite, resubmit, repeat.

## Run it

```bash
npm install
echo 'ANTHROPIC_API_KEY=sk-ant-...' > .env.local
npm run dev
```

Open http://localhost:3000.

`npm run build` for the production build.

## How it works

Next.js 14 App Router, TypeScript, Tailwind. No database — attempt history is
React state and resets on reload.

The key is read only inside `app/api/diagnose/route.ts`, which is the single
server route. It calls `claude-opus-5` with a system prompt that forbids
rewriting the student's statement, and pins the response shape with structured
outputs (`output_config.format`) against the Zod schema in `lib/diagnosis.ts`,
so the route either returns a valid diagnosis or an error — never half-parsed
text.

The three level definitions in `lib/diagnosis.ts` are deliberately hardcoded
rather than model-generated. They are the thing being taught, so they shouldn't
drift between attempts.

Prototype by David Kelly.
