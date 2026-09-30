import { mkdirSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

// Saves a failed gate's full output where the agent can read it when the condensed report had
// to omit lines. One file per run, named by time and process id, so concurrent gates (several
// subagents in one checkout) never overwrite each other's. `node_modules/.cache` is gitignored
// and is where tools conventionally keep throwaway state.
export const saveFullOutput = (root: string, output: string, now: Date, pid: number): string | undefined => {
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
  return relative(root, file);
};
