import { z } from "zod";

export const LEVELS = ["FACT", "INSIGHT", "POINT OF VIEW"] as const;
export type Level = (typeof LEVELS)[number];

/** Stable teaching content. Deliberately not model-generated: the whole point of
 *  the app is that these three definitions never drift between attempts. */
export const LEVEL_COPY: Record<Level, { name: string; test: string }> = {
  FACT: {
    name: "Fact",
    test: "Anyone can look it up. Nobody argues with it.",
  },
  INSIGHT: {
    name: "Insight",
    test: "Your read on the facts. Someone just as smart could read them differently.",
  },
  "POINT OF VIEW": {
    name: "Spiky point of view",
    test: "You would have to defend it. Someone who knows your field thinks you are wrong.",
  },
};

export const DiagnosisSchema = z.object({
  classification: z.enum(LEVELS),
  why: z.string(),
  examples: z.object({
    fact: z.string(),
    insight: z.string(),
    pov: z.string(),
  }),
  question: z.string(),
});

export type Diagnosis = z.infer<typeof DiagnosisSchema>;

export const EXAMPLE_KEY: Record<Level, keyof Diagnosis["examples"]> = {
  FACT: "fact",
  INSIGHT: "insight",
  "POINT OF VIEW": "pov",
};
