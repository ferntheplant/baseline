import { stripVTControlCharacters } from "node:util";

export type RunResult = { status: number; output: string };

// The fields of `spawnSync`'s result this reads, so tests can build one by hand.
type Spawned = { status: number | null; stdout?: string | null; stderr?: string | null; error?: Error | undefined };

// One exit status and one block of text from a finished `vp` process. When `vp` cannot start
// (not on PATH) or overflows the buffer, there is no output to parse; the error is the only
// explanation, and the condenser's fallback shows it. Colour codes waste tokens and break the
// condenser's header matching, so they go too.
export const toRunResult = (args: string[], spawned: Spawned): RunResult => {
  const failure = spawned.error ? `ready-agent: could not run vp ${args.join(" ")}: ${spawned.error.message}\n` : "";
  const output = `${spawned.stdout ?? ""}${spawned.stderr ?? ""}${failure}`;
  return { status: spawned.status ?? 1, output: stripVTControlCharacters(output) };
};
