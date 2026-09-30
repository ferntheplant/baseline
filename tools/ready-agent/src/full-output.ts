import { mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

// Saves a failed gate's full output where the agent can read it when the condensed report had
// to omit lines. One file per run, named by time and process id, so concurrent gates (several
// subagents in one checkout) never overwrite each other's. `node_modules/.cache` is gitignored
// and is where tools conventionally keep throwaway state.

// How many saved outputs to keep. Each is one failed run; older ones have long been read or
// forgotten, and without a cap the directory grows until `node_modules` is reinstalled.
const KEEP = 100;

// `2026-09-30T01-40-12-4821.log`: the timestamp leads, so name order is age order.
const SAVED = /^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d+\.log$/;

const prune = (dir: string, keep: number): void => {
  const saved = readdirSync(dir)
    .filter((name) => SAVED.test(name))
    .toSorted();
  // `force`: a concurrent run pruning the same directory may have removed the file already.
  for (const name of saved.slice(0, -keep)) rmSync(join(dir, name), { force: true });
};

export const saveFullOutput = (
  root: string,
  output: string,
  now: Date,
  pid: number,
  keep = KEEP,
): string | undefined => {
  const dir = join(root, "node_modules", ".cache", "ready-agent");
  const file = join(
    dir,
    `${now
      .toISOString()
      .replaceAll(":", "-")
      .replace(/\.\d+Z$/, "")}-${pid}.log`,
  );
  try {
    mkdirSync(dir, { recursive: true });
    writeFileSync(file, output);
  } catch {
    // A report without the path beats no report: the marker still says lines were omitted.
    return undefined;
  }
  try {
    prune(dir, keep);
  } catch {
    // The file this run needs is written; a failed cleanup only postpones pruning to next time.
  }
  return relative(root, file);
};
