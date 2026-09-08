import {
  EXAMPLE_KEY,
  LEVELS,
  LEVEL_COPY,
  type Diagnosis,
  type Level,
} from "@/lib/diagnosis";

/** Border weight climbs with the level, because contestability climbs with the
 *  level. A fact is a hairline; a point of view is something you stand behind. */
const RESTING_BORDER: Record<Level, string> = {
  FACT: "1px solid var(--rule)",
  INSIGHT: "1px solid #d3d3de",
  "POINT OF VIEW": "2px solid #c3c3d2",
};

export default function Ladder({
  diagnosis,
  statement,
}: {
  diagnosis: Diagnosis;
  statement: string;
}) {
  return (
    <ol className="relative">
      {/* The spine lives in the gutter reserved by the page, so every card,
          the question, and the form all share one left edge. */}
      <div
        aria-hidden
        className="spine absolute -left-[24px] top-3 bottom-3 w-px"
        style={{ background: "var(--rule)" }}
      />

      {LEVELS.map((level) => {
        const landed = level === diagnosis.classification;
        const copy = LEVEL_COPY[level];

        return (
          <li key={level} className="relative">
            <span
              aria-hidden
              className={`absolute -left-[30px] top-[18px] block h-[13px] w-[13px] rounded-full ${
                landed ? "marker-landed" : ""
              }`}
              style={{
                background: "var(--paper)",
                border: `1.5px solid ${landed ? "var(--accent)" : "var(--rule)"}`,
              }}
            />

            <div
              className="mb-2 rounded-[10px] p-4 sm:p-5"
              style={{
                background: landed ? "var(--accent-wash)" : "var(--paper)",
                border: landed
                  ? "2px solid var(--accent)"
                  : RESTING_BORDER[level],
              }}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <h3 className="text-[15px] font-semibold tracking-[-0.01em]">
                  {copy.name}
                </h3>
                {landed && (
                  <span
                    className="text-[13px] font-medium"
                    style={{ color: "var(--accent)" }}
                  >
                    You landed here
                  </span>
                )}
              </div>

              <p
                className="mt-1 text-[14px] leading-[1.55]"
                style={{ color: "var(--ink-2)" }}
              >
                {copy.test}
              </p>

              {landed && (
                <>
                  <blockquote
                    className="mt-4 rounded-[8px] px-3 py-2.5 text-[15px] leading-[1.5]"
                    style={{
                      background: "var(--paper)",
                      border: "1px solid var(--accent)",
                    }}
                  >
                    {statement}
                  </blockquote>
                  <p className="mt-3 text-[14px] leading-[1.6]">
                    {diagnosis.why}
                  </p>
                </>
              )}

              <p
                className="mt-4 border-t pt-3 text-[14px] leading-[1.55]"
                style={{
                  borderColor: landed ? "var(--accent)" : "var(--rule)",
                }}
              >
                <span style={{ color: "var(--ink-2)" }}>
                  Another example from your field:{" "}
                </span>
                {diagnosis.examples[EXAMPLE_KEY[level]]}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
