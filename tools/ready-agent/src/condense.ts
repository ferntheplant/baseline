// Turns the output of a failed `vp run --log grouped ready` into only what an agent needs:
// the output of each step that failed, trimmed. Pure, so the parsing can be tested against
// captured output; `main.ts` does the running.
//
// `--log grouped` prints a `[pkg#task] $ command` header when each step starts, and the step's
// output later, as one block under a `── [pkg#task] ──` separator. Steps that run in parallel
// (`vp run -r test`) print their headers back to back and their blocks in finishing order, so
// a block belongs to the step its separator names, not to whichever header came last.
//
// Which steps failed comes from `vp run --last-details`, one `[n] pkg#task: $ command ✓|✗`
// line per step, also in finishing order.

const MAX_LINES = 120;
const FALLBACK_LINES = 40;

type Step = { key: string; command: string; lines: string[] };
type Outcome = { key: string; command: string; failed: boolean };

// `[@baseline/root#ready] $ vp check ○ cache miss: …` → key `@baseline/root#ready`, command
// `$ vp check`: the cache note after ◉/○/⊘ is dropped so the command compares exactly with the
// one `--last-details` prints. A package step's command carries its directory: `~/apps/x$ …`.
const HEADER = /^\[([^\]\s]+#[^\]\s]+)\] (.*?\$ .*?)(?: [◉○⊘] .*)?$/;
const SEPARATOR = /^── \[([^\]\s]+#[^\]\s]+)\] ──$/;

const splitSteps = (output: string): Step[] => {
  const steps: Step[] = [];
  let current: Step | undefined;
  // `vp run` closes with its own `---` / `vp run: 1/3 cache hit …` footer, which belongs to no
  // step; stop there rather than fold it into the last one.
  const [body = ""] = output.split(/^---\nvp run: /m);
  for (const line of body.split("\n")) {
    const header = HEADER.exec(line);
    const separator = SEPARATOR.exec(line);
    if (header?.[1] && header[2]) {
      current = { key: header[1], command: header[2], lines: [] };
      steps.push(current);
    } else if (separator) {
      // Steps under one key run one after another, so the latest header with that key is the
      // step whose output this is.
      current = steps.findLast((step) => step.key === separator[1]);
    } else {
      current?.lines.push(line);
    }
  }
  return steps;
};

// `  [3] @baseline/root#ready: $ vp check ✗ (exit code: 1)` → key, command, and outcome.
const OUTCOME = /^\s*\[\d+\] (\S+#\S+): (.*\$ .*?) ([✓✗])/;

const outcomes = (details: string): Outcome[] =>
  details.split("\n").flatMap((line) => {
    const match = OUTCOME.exec(line);
    return match?.[1] && match[2] ? [{ key: match[1], command: match[2], failed: match[3] === "✗" }] : [];
  });

// Pair each outcome with its step. Both lists are in a different order (starting vs finishing),
// but steps sharing a key and command run one after another, so the nth outcome for a given
// key and command is the nth step with them.
const failedSteps = (steps: Step[], results: Outcome[]): { outcome: Outcome; step: Step | undefined }[] => {
  const claimed = new Set<Step>();
  return results.flatMap((outcome) => {
    const step = steps.find((s) => !claimed.has(s) && s.key === outcome.key && s.command === outcome.command);
    if (step) claimed.add(step);
    return outcome.failed ? [{ outcome, step }] : [];
  });
};

// Keep the head, where linters report, and the tail, where test runners summarise.
export const trim = (lines: string[], max = MAX_LINES): string[] => {
  const kept = lines.filter((line) => line.trim() !== "" && !line.startsWith("pass: "));
  if (kept.length <= max) return kept;
  const head = Math.floor(max * 0.7);
  return [...kept.slice(0, head), `… ${kept.length - max} lines omitted …`, ...kept.slice(head - max)];
};

export const condense = (gateOutput: string, details: string): string => {
  const failures = failedSteps(splitSteps(gateOutput), outcomes(details));

  if (failures.length === 0 || failures.some(({ step }) => step === undefined)) {
    // Failed before any step ran (a config error, a missing tool), or the output format moved
    // out from under the parser: show the end of the raw output rather than hide it.
    return ["ready: failed", ...trim(gateOutput.split("\n")).slice(-FALLBACK_LINES)].join("\n");
  }

  return failures
    .flatMap(({ outcome, step }) => [`ready: failed at ${outcome.key}: ${outcome.command}`, ...trim(step?.lines ?? [])])
    .join("\n");
};
