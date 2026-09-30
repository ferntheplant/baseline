// `vp run ready`, condensed for an agent's context window: one line on success, and on failure
// only the output of the steps that failed (see `condense.ts`). It wraps the real gate rather
// than restating it, so the `ready` script in the root package.json stays the single list of
// what the gate runs, and every step keeps its cache.

import { spawnSync } from "node:child_process";

import { condense } from "./condense.ts";
import { saveFullOutput } from "./full-output.ts";
import { type RunResult, toRunResult } from "./run-result.ts";

// Ask tools not to colour their output; `toRunResult` strips whatever they emit anyway.
const env = { ...process.env, NO_COLOR: "1", FORCE_COLOR: "0" };

const vp = (args: string[]): RunResult =>
  toRunResult(args, spawnSync("vp", args, { env, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }));

// `-v` appends the per-step ✓/✗ summary to this run's own output, which `condense` reads.
const gate = vp(["run", "-v", "--log", "grouped", "ready"]);

if (gate.status === 0) {
  process.stdout.write("ready: ok\n");
} else {
  const save = (): string | undefined => saveFullOutput(process.cwd(), gate.output, new Date(), process.pid);
  process.stdout.write(`${condense(gate.output, save)}\n`);
}
process.exitCode = gate.status;
