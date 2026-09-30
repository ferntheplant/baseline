# baseline

A Vite+ monorepo template: the toolchain setup that every repo here starts from, already wired together. Use it as a GitHub template repository ("Use this template" → new repo) or clone it and delete the git history.

## What's in the box

| File                                                           | What it settles                                                                                          |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| [`vite.config.ts`](./vite.config.ts)                           | Oxlint rules, Oxfmt style (120 cols, double quotes, sorted imports), staged-file checks, Vitest defaults |
| [`tsconfig.json`](./tsconfig.json)                             | Strict TypeScript, bundler resolution, no implicit `any`, no unchecked index access                      |
| [`pnpm-workspace.yaml`](./pnpm-workspace.yaml)                 | Workspace globs and the dependency catalog                                                               |
| [`commitlint.config.ts`](./commitlint.config.ts)               | Conventional Commits, with the allowed type list                                                         |
| [`.github/workflows/ci.yml`](./.github/workflows/ci.yml)       | CI; see [What runs where](#what-runs-where)                                                              |
| [`fallow.toml`](./fallow.toml)                                 | Dead-code, duplication, and complexity analysis                                                          |
| `sherif` in [`package.json`](./package.json)                   | Monorepo `package.json` lint: consistent versions, private root, no empty fields                         |
| [`mise.toml`](./mise.toml), [`.node-version`](./.node-version) | gitleaks, typos, and Node, installed by mise                                                             |
| [`_typos.toml`](./_typos.toml)                                 | Spell-check exceptions                                                                                   |
| [`.vite-hooks/`](./.vite-hooks/)                               | Git hooks; see [What runs where](#what-runs-where)                                                       |
| [`ABSTRACT.md`](./ABSTRACT.md), [`CONTEXT.md`](./CONTEXT.md)   | What the project is, and what its words mean — empty, to fill in                                         |
| [`AGENTS.md`](./AGENTS.md)                                     | Agent instructions, with `CLAUDE.md` symlinked to it                                                     |
| [`tools/ready-agent/`](./tools/ready-agent/)                   | `vp run ready:agent`: the gate condensed for agents — keep it                                            |
| [`.agents/skills/`](./.agents/skills/)                         | Agent skills, with `.claude/` symlinked to `.agents/`                                                    |

`prepare` runs on install, so the git hooks install themselves and the agent symlinks repair themselves on the first `vp install`.

## Prerequisites

Install [Vite+](https://viteplus.dev/guide/) and [mise](https://mise.jdx.dev/getting-started.html), and activate mise in your shell as its guide describes, so the tools it installs are on your `PATH`. Then, once per machine, hand Node to mise and give mise a global Node:

```bash
vp env off node
mise use --global node@24
```

Vite+ manages Node too by default, and two tools managing one runtime can download it twice or pick different versions for different commands. With Node switched off, Vite+ uses the Node that mise provides and still manages pnpm from `devEngines` in `package.json`. The global Node matters for the first step below: `vp create` installs dependencies, which runs Node, before the new project's own Node version is installed.

In each project, [`mise.toml`](./mise.toml) installs gitleaks, typos, and Node.

## Generating a project from it

```bash
vp create github:ferntheplant/baseline
```

Answer the prompts — the first one is the target directory, so the new project is named there and needs no renaming afterwards. Take the default on **Which coding agent instruction files** (`AGENTS.md, CLAUDE.md`) or answer none; both give you `CLAUDE.md` symlinked to `AGENTS.md`. Selecting `CLAUDE.md` alone is the one answer to avoid — Vite+ then writes a real `CLAUDE.md` holding only its own boilerplate, and this repo's house rules never reach Claude Code.

Then, in the new directory:

```bash
mise trust && mise install
```

The pre-commit hook refuses to commit until gitleaks and typos are installed.

That leaves a fresh repo on `main` with no commits, no template history, dependencies installed, and the commit hooks configured.

Non-interactively (`--no-interactive`), pass `--git` for the repo and expect the directory to be named after the template, since `--directory` is rejected for remote templates:

```bash
vp create github:ferntheplant/baseline --git --no-interactive && mv baseline <name>
```

`git clone https://github.com/ferntheplant/baseline.git <name>` works too, if you would rather delete `.git` yourself; then run `mise trust && mise install && vp install` in the clone.

The `CLAUDE.md` and `.claude/` symlinks are created on install by [`scripts/link-agents.mjs`](./scripts/link-agents.mjs) rather than committed; its header says why. Nothing to do by hand, but if agent instructions ever go missing in a generated repo, that is where to look.

## Then, in the new repo

1. Rename the root package: `@baseline/root` → `@<yourname>/root` in `package.json`.
2. Rename or replace `apps/example`. It exists because `vp run ready` fans out to every package's `test` and `build` scripts, and `tools/ready-agent` has only `test`; with no package that builds, `vp run -r build` fails with `Task "build" not found`. Keep at least one package with a `build` script, and the gate stays honest.
3. Fill in [`ABSTRACT.md`](./ABSTRACT.md) (what this project is, and what it is not) and start [`CONTEXT.md`](./CONTEXT.md) with the project's first terms, then put the project's name in the [`AGENTS.md`](./AGENTS.md) heading.
4. Replace this README.
5. `vp run ready`, then make the first commit and push it to a new GitHub repo.
6. Configure the GitHub settings below — they cannot be committed.

## Daily commands

```bash
vp run ready       # the gate; see What runs where below
vp run ready:agent # the same gate for agents: `ready: ok`, or only the failing steps' output
vp check --fix     # format + autofix lint
vp test            # run tests
vp exec fallow     # dead code, duplication, complexity
```

## What runs where

| Check                                 | git hooks       | `vp run ready` | CI                               |
| ------------------------------------- | --------------- | -------------- | -------------------------------- |
| gitleaks                              | staged changes  |                | every commit                     |
| typos                                 | staged files    | whole repo     | whole repo, as ready             |
| `vp check` (format, lint, type-check) | staged, `--fix` | whole repo     | whole repo, as ready             |
| sherif                                |                 | whole repo     | whole repo, as ready             |
| every package's `test` and `build`    |                 | yes            | yes, as ready                    |
| fallow                                |                 | whole repo     | whole repo, as ready             |
| commitlint                            | `commit-msg`    |                | each PR commit, and the PR title |

CI runs `vp run ready` in full, so every check in the gate runs there too. The git hooks keep to what finishes in seconds on the staged files; sherif, tests, builds, and fallow need the whole workspace, so they wait for `ready`. gitleaks is the one check CI runs outside `ready`: it scans every commit on the branch, not the working tree, which catches a secret committed with `--no-verify` and later deleted.

## Manual GitHub settings

Three things live in repository settings rather than in this repo, so they have to be set once per repo after publishing.

### 1. Protect `main` with a ruleset

**Settings → Rules → Rulesets → New ruleset → New branch ruleset**

- **Name**: `main`
- **Enforcement status**: Active
- **Target branches**: Add target → **Include default branch**
- Enable these rules:
  - **Restrict deletions**
  - **Block force pushes**
  - **Require linear history**
  - **Require a pull request before merging** — required approvals `0` if you work solo, and check **Dismiss stale pull request approvals when new commits are pushed**
  - **Require status checks to pass** — check **Require branches to be up to date before merging**, then add the check named **`validate`** (the job id in [`ci.yml`](./.github/workflows/ci.yml); it only appears in the picker after CI has run at least once, so push a first PR before adding it)

Rulesets, not the older "branch protection rules": they are additive, they show which rule blocked a push, and the same ruleset can be reused across repos.

### 2. Delete the branch when a PR merges

**Settings → General → Pull Requests → Automatically delete head branches**

Or with the `gh` CLI, from a clone of the repo:

```bash
gh repo edit --delete-branch-on-merge
```

### 3. Squash-merge only, with the PR's title and description

**Settings → General → Pull Requests**: uncheck **Allow merge commits** and **Allow rebase merging**, and under **Allow squash merging** set the default commit message to **Pull request title and description**.

Or with the `gh` CLI:

```bash
gh repo edit --enable-merge-commit=false --enable-rebase-merge=false
gh api -X PATCH "repos/{owner}/{repo}" -f squash_merge_commit_title=PR_TITLE -f squash_merge_commit_message=PR_BODY
```

Squash-only merging keeps the linear history the ruleset requires. The squash commit takes the PR title as its subject, which is why CI lints that title, and the PR description as its body, so the description is what `main`'s history records about the change.
