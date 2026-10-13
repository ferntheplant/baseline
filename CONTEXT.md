# Context

<!-- The project's vocabulary: one entry per term that means something specific here. Add a term when code or discussion starts using it, and keep each definition to what the word means in this project, not what it means in general. Sort entries alphabetically. -->

<!-- Example entry:

**Widget** — a unit of work a customer submits. Not to be confused with a **job**, which is one attempt to process a widget.
-->

**Base** — the upstream commit a copied file was last merged from, recorded in `.baseline.jsonc` (the template) or `.agents/vendored-skills.jsonc` (a skill). `/rebaseline` merges upstream's changes since the base into the local copy.

**Vendored skill** — a skill copied from another repo into `.agents/skills/` and edited in place, with its source and base recorded in `.agents/vendored-skills.jsonc`. A skill with no entry there is the repo's own.
