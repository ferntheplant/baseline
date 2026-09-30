// `vp run ready`, condensed for an agent's context window: one line on success, and on failure
// only the output of the steps that failed (see `condense.ts`). It wraps the real gate rather
// than restating it, so the `ready` script in the root package.json stays the single list of
// what the gate runs, and every step keeps its cache.

import { spawnSync } from "node:child_process";
import { stripVTControlCharacters } from "node:util";

import { condense } from "./condense.ts";

// Colour codes waste tokens and break the header matching; strip whatever a tool emits despite
// being asked not to.
const env = { ...process.env, NO_COLOR: "1", FORCE_COLOR: "0" };

const vp = (args: string[]): { status: number; output: string } => {
  const result = spawnSync("vp", args, { env, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  return { status: result.status ?? 1, output: stripVTControlCharacters(`${result.stdout}${result.stderr}`) };
};

const gate = vp(["run", "--log", "grouped", "ready"]);

if (gate.status === 0) {
  process.stdout.write("ready: ok\n");
} else {
  process.stdout.write(`${condense(gate.output, vp(["run", "--last-details"]).output)}\n`);
}
process.exitCode = gate.status;
