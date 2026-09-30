/**
 * Placeholder module. `vp run ready` fans out to every workspace package's `test` and `build`
 * scripts, and `tools/ready-agent` has only `test`, so without a package that builds the gate
 * fails with `Task "build" not found`. This package is what makes the gate meaningful on day
 * one; rename it to the first real module and this file goes away.
 */
export const greet = (name: string): string => `Hello, ${name}!`;
