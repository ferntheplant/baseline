import { readFileSync } from "node:fs";

import { describe, expect, test } from "vite-plus/test";

import { condense, trim } from "./condense.ts";

const fixture = (name: string): string => readFileSync(new URL(`fixtures/${name}`, import.meta.url), "utf8");

// The `-v` summary vp prints after the step output, built from `[n] key: command ✓|✗` rows.
const summary = (...rows: string[]): string =>
  [
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    "    Vite+ Task Runner • Execution Summary",
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    "Task Details:",
    "────────────────────────────────────────────────",
    ...rows.map((row, i) => `  [${i + 1}] ${row}`),
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
  ].join("\n");

describe("condense", () => {
  test("keeps only the failing step, without separators or passing lines", () => {
    const out = condense(`[@baseline/root#ready] $ sherif ◉ cache hit, replaying
── [@baseline/root#ready] ──

✓ No issues found

[@baseline/root#ready] $ vp check ○ cache miss: 'broken.ts' added in 'apps/example/src', executing
── [@baseline/root#ready] ──
pass: All 33 files are correctly formatted (282ms, 10 threads)
× typescript(TS2322): Type 'string' is not assignable to type 'number'.
Found 1 error and 0 warnings in 6 files (309ms, 10 threads)

${summary("@baseline/root#ready: $ sherif ✓", "@baseline/root#ready: $ vp check ✗ (exit code: 1)")}`);

    expect(out).toBe(
      [
        "ready: failed at @baseline/root#ready: $ vp check",
        "× typescript(TS2322): Type 'string' is not assignable to type 'number'.",
        "Found 1 error and 0 warnings in 6 files (309ms, 10 threads)",
      ].join("\n"),
    );
  });

  // Captured from a real run: example's test failed; ready-agent's passed, then vp killed it
  // (exit 137). Both headers print before either block, and blocks arrive in finishing order.
  test("files parallel output by separator and reports a killed sibling as stopped", () => {
    const out = condense(fixture("parallel-test-failure.txt"));

    expect(out.split("\n")[0]).toBe(
      "ready: failed at @baseline/example#test: ~/apps/example$ vp test run --reporter=minimal",
    );
    expect(out).toContain("AssertionError: expected 'Hello, world!' to be 'Hello, moon!'");
    expect(out).not.toContain("Tests  9 passed");
    expect(out.split("\n").at(-1)).toBe(
      "ready: stopped early, result unknown: @baseline/ready-agent#test: ~/tools/ready-agent$ vp test run --reporter=minimal",
    );
  });

  test("reports a killed step as the failure when nothing else failed", () => {
    const out = condense(`[@x/a#test] ~/a$ vp test run ○ cache miss, executing
── [@x/a#test] ──
out of memory
${summary("@x/a#test: ~/a$ vp test run ✗ (exit code: 137)")}`);

    expect(out).toBe("ready: failed at @x/a#test: ~/a$ vp test run\nout of memory");
  });

  test("matches a failed command exactly, not by prefix", () => {
    const out = condense(`[@x/a#ready] $ vp build:x ◉ cache hit, replaying
── [@x/a#ready] ──
build:x ok
[@x/a#ready] $ vp build ○ cache miss, executing
── [@x/a#ready] ──
build broke
${summary("@x/a#ready: $ vp build:x ✓", "@x/a#ready: $ vp build ✗ (exit code: 1)")}`);

    expect(out).toBe("ready: failed at @x/a#ready: $ vp build\nbuild broke");
  });

  test("pairs a repeated command with the run that failed", () => {
    const out = condense(`[@x/a#ready] $ vp check ○ cache miss, executing
── [@x/a#ready] ──
first run clean
[@x/a#ready] $ vp check ○ cache miss, executing
── [@x/a#ready] ──
second run broke
${summary("@x/a#ready: $ vp check ✓", "@x/a#ready: $ vp check ✗ (exit code: 1)")}`);

    expect(out).toBe("ready: failed at @x/a#ready: $ vp check\nsecond run broke");
  });

  test("falls back to the end of the raw output when there is no summary", () => {
    const out = condense("error: Failed to find executable typos under cwd /repo");

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
