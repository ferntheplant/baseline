// `CLAUDE.md` and `.claude/` are relative symlinks so every agent reads one set of
// instructions. `git clone` and GitHub's "Use this template" preserve them; two common paths
// do not. `vp create github:<repo>` extracts with degit, which rewrites a relative symlink
// into an absolute path inside its own cache — and then deletes that cache, leaving both links
// dangling. "Download ZIP" drops symlinks entirely.
//
// Running from `prepare` makes every generation path converge on the same two links. This
// never replaces a real file or directory: a repo that deliberately keeps its own `.claude/`
// is left alone and told so. Failure to link is reported, never thrown — a broken symlink is
// worth a warning, not a failed install.

import { lstatSync, readlinkSync, symlinkSync, unlinkSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const LINKS = [
  { link: "CLAUDE.md", target: "AGENTS.md", type: "file" },
  { link: ".claude", target: ".agents", type: "dir" },
];

const report = (message) => process.stderr.write(`link-agents: ${message}\n`);

for (const { link, target, type } of LINKS) {
  const path = join(root, link);

  let existing;
  try {
    existing = lstatSync(path);
  } catch {
    existing = undefined;
  }

  if (existing?.isSymbolicLink()) {
    if (readlinkSync(path) === target) continue;
    unlinkSync(path);
  } else if (existing) {
    report(`${link} is a real ${existing.isDirectory() ? "directory" : "file"}, leaving it alone`);
    continue;
  }

  try {
    symlinkSync(target, path, type);
    report(`relinked ${link} -> ${target}`);
  } catch (error) {
    report(`could not link ${link} -> ${target}: ${error.message}`);
  }
}
