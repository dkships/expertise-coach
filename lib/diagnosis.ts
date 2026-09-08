import { z } from "zod";

export const LEVELS = ["FACT", "INSIGHT", "POINT OF VIEW"] as const;
export type Level = (typeof LEVELS)[number];

/** Stable teaching content. Deliberately not model-generated: the whole point of
 *  the app is that these three definitions never drift between attempts. */
export const LEVEL_COPY: Record<Level, { name: string; test: string }> = {
  FACT: {
    name: "Fact",
    test: "Checkable. Someone could look it up and settle it.",
  },
  INSIGHT: {
    name: "Insight",
    test: "Your reading of the facts. A careful person could read the same facts differently.",
  },
  "POINT OF VIEW": {
    name: "Point of view",
    test: "A position you would have to defend. Someone who knows the domain disagrees with you.",
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
