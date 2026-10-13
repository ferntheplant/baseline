import { describe, expect, it } from "vite-plus/test";

import { toRunResult } from "./run-result.ts";

describe(toRunResult, () => {
  it("joins stdout and stderr and strips colour codes", () => {
    const result = toRunResult(["run", "ready"], {
      status: 1,
      stderr: "err\n",
      stdout: "\u001B[31mred\u001B[0m\n",
    });

    expect(result).toStrictEqual({ output: "red\nerr\n", status: 1 });
  });

  it("reports why vp could not start, with a failing status", () => {
    const error = Object.assign(new Error("spawnSync vp ENOENT"), {
      code: "ENOENT",
    });

    const result = toRunResult(["run", "ready"], {
      error,
      status: null,
      stderr: null,
      stdout: null,
    });

    expect(result).toStrictEqual({
      output: "ready-agent: could not run vp run ready: spawnSync vp ENOENT\n",
      status: 1,
    });
  });
});
