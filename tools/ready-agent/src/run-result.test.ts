import { describe, expect, test } from "vite-plus/test";

import { toRunResult } from "./run-result.ts";

describe("toRunResult", () => {
  test("joins stdout and stderr and strips colour codes", () => {
    const result = toRunResult(["run", "ready"], { status: 1, stdout: "\u001B[31mred\u001B[0m\n", stderr: "err\n" });

    expect(result).toEqual({ status: 1, output: "red\nerr\n" });
  });

  test("reports why vp could not start, with a failing status", () => {
    const error = Object.assign(new Error("spawnSync vp ENOENT"), { code: "ENOENT" });

    const result = toRunResult(["run", "ready"], { status: null, stdout: null, stderr: null, error });

    expect(result).toEqual({ status: 1, output: "ready-agent: could not run vp run ready: spawnSync vp ENOENT\n" });
  });
});
