# Diagnose eval

Scores the `/api/diagnose` call (same `messages.parse` request as `app/api/diagnose/route.ts`)
on labelled FACT / INSIGHT / POINT OF VIEW statements. It reads the system prompt from
`lib/system-prompt.ts`, so it always tests the prompt that ships.

## Cases and labels

- `cases.tuning.json` + `labels.tuning.json`: 23 cases. The label file was reconstructed from
  the 2026-09-29 session transcript after the original was lost. `author` is the author's label
  (the score the README reports); `gold` is the Opus 5.5 judge consensus (differs only on
  `sneakers`); `accept` lists the reasonable alternatives for ambiguous cases.
- `cases.heldout.json` + `labels.heldout.json`: 16 cases written on 2026-10-07 and kept out of
  prompt tuning. Labels are the author's, each confirmed by 3 Opus 5.5 judge runs.
- Statements are invented examples, not user data.

## Run

    npm run eval -- h55-low,s55-adapt-low "" tag 2      # configs, prompt path ("" = repo prompt), tag, runs
    LABELS=labels.heldout.json npm run eval -- s55-adapt-low "" held 2
    npm run eval:analyze -- res-s55-adapt-low-held.json  # LABELS=... to match the case set
    CASES=cases.heldout.json npm run eval:judge -- defs 0   # Opus 5.5 labels a case file

Configs are in `bench.mjs` (Sonnet 5 / 5.5 and Haiku 5.5 at various effort levels). Results go
to `evals/out/` (gitignored). The key is `ANTHROPIC_API_KEY` from `.env.local`. A full run of
23 cases x 2 costs well under a dollar. Never grade a candidate against another model's output.
