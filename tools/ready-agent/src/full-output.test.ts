import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, test } from "vite-plus/test";

import { saveFullOutput } from "./full-output.ts";

const roots: string[] = [];
const root = (): string => {
  const dir = mkdtempSync(join(tmpdir(), "ready-agent-"));
  roots.push(dir);
  return dir;
};

afterEach(() => {
  for (const dir of roots.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe("saveFullOutput", () => {
  test("writes one file per run under node_modules/.cache and returns its path from the root", () => {
    const dir = root();
    const now = new Date("2026-09-30T01:40:12.345Z");

    const first = saveFullOutput(dir, "first run", now, 11);
    const second = saveFullOutput(dir, "second run", now, 12);

    expect(first).toBe("node_modules/.cache/ready-agent/2026-09-30T01-40-12-11.log");
    expect(second).toBe("node_modules/.cache/ready-agent/2026-09-30T01-40-12-12.log");
    expect(readFileSync(join(dir, first ?? ""), "utf8")).toBe("first run");
  });

  test("keeps only the newest saved outputs, and leaves other files alone", () => {
    const dir = root();
    const cache = join(dir, "node_modules", ".cache", "ready-agent");
    mkdirSync(cache, { recursive: true });
    writeFileSync(join(cache, "notes.txt"), "");
    for (const minute of [10, 11, 12]) {
      writeFileSync(join(cache, `2026-09-30T01-${minute}-00-1.log`), "");
    }

    const saved = saveFullOutput(dir, "newest", new Date("2026-09-30T01:13:00.000Z"), 2, 2);

    expect(saved).toBe("node_modules/.cache/ready-agent/2026-09-30T01-13-00-2.log");
    expect(readdirSync(cache).toSorted()).toEqual([
      "2026-09-30T01-12-00-1.log",
      "2026-09-30T01-13-00-2.log",
      "notes.txt",
    ]);
  });

  test("never prunes the file this run wrote, even when it sorts oldest", () => {
    const dir = root();
    const cache = join(dir, "node_modules", ".cache", "ready-agent");
    mkdirSync(cache, { recursive: true });
    for (const minute of [10, 11, 12]) {
      writeFileSync(join(cache, `2026-09-30T01-${minute}-00-1.log`), "");
    }

    // The clock stepped back: this run's name sorts before every existing file.
    const saved = saveFullOutput(dir, "stepped back", new Date("2026-09-30T01:00:00.000Z"), 2, 2);

    expect(saved).toBe("node_modules/.cache/ready-agent/2026-09-30T01-00-00-2.log");
    expect(readFileSync(join(dir, saved ?? ""), "utf8")).toBe("stepped back");
    expect(readdirSync(cache).toSorted()).toEqual(["2026-09-30T01-00-00-2.log", "2026-09-30T01-12-00-1.log"]);
  });

  test("returns no path when the file cannot be written", () => {
    const dir = root();
    // A file where the cache directory should go makes mkdir fail.
    writeFileSync(join(dir, "node_modules"), "");

    expect(saveFullOutput(dir, "output", new Date(), 1)).toBeUndefined();
  });
});
