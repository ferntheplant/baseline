import { describe, expect, test } from "vite-plus/test";

import { condense, trim } from "./condense-ready.mjs";

// Shapes copied from real `vp run --log grouped ready` and `vp run --last-details` output.
const gate = `[@baseline/root#ready] $ sherif ◉ cache hit, replaying
── [@baseline/root#ready] ──

✓ No issues found

[@baseline/root#ready] $ vp check ○ cache miss: 'broken.ts' added in 'apps/example/src', executing
── [@baseline/root#ready] ──
pass: All 33 files are correctly formatted (282ms, 10 threads)
× typescript(TS2322): Type 'string' is not assignable to type 'number'.
   ╭─[apps/example/src/broken.ts:2:7]
Found 1 error and 0 warnings in 6 files (309ms, 10 threads)

---
vp run: 1/2 cache hit (50%), 74ms saved, 1 failed.`;

const details = `Task Details:
────────────────────────────────────────────────
  [1] @baseline/root#ready: $ sherif ✓
      → Cache hit - output replayed - 74ms saved
  ·······················································
  [2] @baseline/root#ready: $ vp check ✗ (exit code: 1)
      → Cache miss: 'broken.ts' added in 'apps/example/src'`;

describe("condense", () => {
  test("keeps only the failing step, without separators or passing lines", () => {
    const out = condense(gate, details);

    expect(out.split("\n")[0]).toBe("ready: failed at @baseline/root#ready: $ vp check");
    expect(out).toContain("TS2322");
    expect(out).not.toContain("No issues found");
    expect(out).not.toContain("pass: ");
    expect(out).not.toContain("── [");
    expect(out).not.toContain("vp run: ");
  });

  test("picks the failed package when parallel steps share a script name", () => {
    const parallel = `[@x/a#test] ~/apps/a$ vp test run ○ cache miss, executing
── [@x/a#test] ──
a failure
[@x/b#test] ~/apps/b$ vp test run ○ cache miss, executing
── [@x/b#test] ──
b passed`;
    const parallelDetails = `  [1] @x/a#test: ~/apps/a$ vp test run ✗ (exit code: 1)
  [2] @x/b#test: ~/apps/b$ vp test run ✓`;

    const out = condense(parallel, parallelDetails);

    expect(out).toContain("a failure");
    expect(out).not.toContain("b passed");
  });

  test("falls back to the end of the raw output when no step is marked failed", () => {
    const out = condense("error: Failed to find executable typos under cwd /repo", "");

    expect(out).toBe("ready: failed\nerror: Failed to find executable typos under cwd /repo");
  });
});

describe("trim", () => {
  test("drops blank lines and keeps short output whole", () => {
    expect(trim(["a", "", "  ", "b"])).toEqual(["a", "b"]);
  });

  test("keeps head and tail of long output around an omission marker", () => {
    const lines = Array.from({ length: 20 }, (_, i) => `line ${i}`);

    expect(trim(lines, 10)).toEqual([...lines.slice(0, 7), "… 10 lines omitted …", ...lines.slice(17)]);
  });
});
