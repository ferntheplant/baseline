// Turns the output of a failed `vp run --log grouped ready` into only what an agent needs:
// the output of each step that failed, trimmed. Pure, so the parsing can be tested against
// captured output; `ready-agent.mjs` does the running.
//
// `--log grouped` prints each step's output as one block under a `[pkg#task] $ command`
// header. Which blocks to keep comes from `vp run --last-details`, which marks each step ✓ or
// ✗ under the same key: `vp run -r` runs packages in parallel, so the last block printed is
// not necessarily the one that failed.

const MAX_LINES = 120;
const FALLBACK_LINES = 40;

// `[@baseline/root#ready] $ vp check ○ cache miss: …` → key `@baseline/root#ready`, command
// `$ vp check ○ cache miss: …`. A package task's command carries its directory: `~/apps/x$ …`.
const HEADER = /^\[([^\]\s]+#[^\]\s]+)\] (.*\$ .*)$/;
const SEPARATOR = /^── \[.*\] ──$/;

const splitSteps = (output) => {
  const steps = [];
  // `vp run` closes with its own `---` / `vp run: 1/3 cache hit …` footer, which belongs to no
  // step; stop there rather than fold it into the last one.
  const [body = ""] = output.split(/^---\nvp run: /m);
  for (const line of body.split("\n")) {
    const header = HEADER.exec(line);
    if (header) steps.push({ key: header[1], command: header[2], lines: [] });
    else if (!SEPARATOR.test(line)) steps.at(-1)?.lines.push(line);
  }
  return steps;
};

// `  [3] @baseline/root#ready: $ vp check ✗ (exit code: 1)` → key and command before the ✗.
const FAILED = /^\s*\[\d+\] (\S+#\S+): (.*\$ .*?) ✗/;

const failedSteps = (details) =>
  details.split("\n").flatMap((line) => {
    const match = FAILED.exec(line);
    return match ? [{ key: match[1], command: match[2] }] : [];
  });

// Keep the head, where linters report, and the tail, where test runners summarise.
export const trim = (lines, max = MAX_LINES) => {
  const kept = lines.filter((line) => line.trim() !== "" && !line.startsWith("pass: "));
  if (kept.length <= max) return kept;
  const head = Math.floor(max * 0.7);
  return [...kept.slice(0, head), `… ${kept.length - max} lines omitted …`, ...kept.slice(head - max)];
};

export const condense = (gateOutput, details) => {
  const steps = splitSteps(gateOutput);
  const blocks = failedSteps(details).map((failure) => ({
    failure,
    step: steps.find((step) => step.key === failure.key && step.command.startsWith(failure.command)),
  }));

  if (blocks.length === 0 || blocks.some(({ step }) => step === undefined)) {
    // Failed before any step ran (a config error, a missing tool), or the output format moved
    // out from under the parser: show the end of the raw output rather than hide it.
    return ["ready: failed", ...trim(gateOutput.split("\n")).slice(-FALLBACK_LINES)].join("\n");
  }

  return blocks
    .flatMap(({ failure, step }) => [`ready: failed at ${failure.key}: ${failure.command}`, ...trim(step?.lines ?? [])])
    .join("\n");
};
