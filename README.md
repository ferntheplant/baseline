# baseline

A Vite+ monorepo template: the toolchain every repo here starts from, already wired together. Ultracite's lint and format presets, strict TypeScript, a dependency catalog at exact versions with a weekly bump PR, git hooks and CI around one gate (`vp run ready`), and agent instructions and skills.

[`BASELINE.md`](./BASELINE.md) says what each piece is and why. It ships into every generated repo, and `/rebaseline` keeps it current there; this README describes the template, and a generated repo replaces it with its own.

## Generating a project from it

Set up the machine as [`BASELINE.md`](./BASELINE.md#prerequisites) describes, then:

```bash
vp create github:ferntheplant/baseline
```

Answer the prompts — the first one is the target directory, so the new project is named there and needs no renaming afterwards. On **Which coding agent instruction files**, take the default (`AGENTS.md, CLAUDE.md`) or answer none; both give you `CLAUDE.md` symlinked to `AGENTS.md`. When asked whether to append the Vite+ instructions to the existing `AGENTS.md`, answer **Skip**. Selecting `CLAUDE.md` alone is the one answer to avoid — Vite+ then writes a real `CLAUDE.md` holding only its own boilerplate, and the house rules in `AGENTS.md` never reach Claude Code.

Then, in the new directory, run `mise trust && mise install`. That leaves a fresh repo on `main` with no commits, no template history, dependencies installed, and the commit hooks configured.

Non-interactively (`--no-interactive`), pass `--git` for the repo and expect the directory to be named after the template, since `--directory` is rejected for remote templates:

```bash
vp create github:ferntheplant/baseline --git --no-interactive && mv baseline <name>
```

`git clone https://github.com/ferntheplant/baseline.git <name>` works too, if you would rather delete `.git` yourself; then run `mise trust && mise install && vp install` in the clone.

## Then, in the new repo

1. Record which baseline commit the repo came from: run `/rebaseline init` in Claude Code, or ask another agent to run the init step of the `rebaseline` skill. It writes `.baseline.jsonc`, which is how the repo takes baseline's later changes; see [`BASELINE.md`](./BASELINE.md#taking-upstream-changes).
2. Rename the root package: `@baseline/root` → `@<yourname>/root` in `package.json`.
3. Rename or replace `apps/example`, keeping at least one package with a `build` script; its [`src/index.ts`](./apps/example/src/index.ts) says why.
4. Fill in [`ABSTRACT.md`](./ABSTRACT.md) (what this project is, and what it is not) and start [`CONTEXT.md`](./CONTEXT.md) with the project's first terms, then put the project's name in the [`AGENTS.md`](./AGENTS.md) heading.
5. Replace this README with the project's own.
6. `vp run ready`, then make the first commit and push it to a new GitHub repo.
7. Configure the [manual GitHub settings](./BASELINE.md#manual-github-settings) — they cannot be committed.
