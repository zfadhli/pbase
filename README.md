<div align="center">

# pbase

[![npm version](https://img.shields.io/npm/v/@zfadhli/pbase?style=flat-square)](https://www.npmjs.com/package/@zfadhli/pbase)
[![Build Status](https://img.shields.io/github/actions/workflow/status/zfadhli/pbase/ci.yml?style=flat-square)](https://github.com/zfadhli/pbase/actions)
![Node version](https://img.shields.io/node/v/@zfadhli/pbase?style=flat-square)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

Scaffold TypeScript projects from built-in, extensible templates.

[Features](#features) • [Quick start](#quick-start) • [Usage](#usage) • [Templates](#templates) • [Development](#development)

</div>

**pbase** is a CLI tool that generates ready-to-go TypeScript projects. Pick a template, get a fully configured project with code quality tooling, CI, and proper package structure — no manual setup required.

## Features

- **Template inheritance** — Templates can extend a shared base, keeping common tooling (TypeScript, Biome, Lefthook, CI) in one place while each variant adds its own stack.
- **Zero config** — Run `npx pbase` and follow the prompts. Or skip prompts entirely with flags for CI use.
- **Placeholder rendering** — `__NAME__`, `__DESC__`, `__AUTHOR__`, `__YEAR__` are automatically replaced in all generated files.
- **Ready to publish** — The `lib` template includes `tsdown` bundling, npm provenance support, and a publish workflow.
- **Safe defaults** — Project names are validated against npm naming conventions, overwrites require confirmation, and path traversal is rejected.

## Quick start

```bash
npx pbase my-project
```

Follow the prompts to pick a template and configure your project.

> [!TIP]
> Author name is auto-detected from `git config user.name`. Pass `--author` to override.

## Usage

```bash
pbase [project-name] [options]
```

### Options

| Option | Description |
|--------|-------------|
| `--template <name>` | Template to use (`lib` or `hono`) |
| `--desc <desc>` | Project description |
| `--author <author>` | Author name (defaults from git config) |
| `--force` | Overwrite existing directory |
| `--no-install` | Skip dependency installation |
| `--no-git` | Skip `git init` and initial commit |
| `--dry-run` | Preview files without writing anything |
| `--list` | Show available templates |
| `-h, --help` | Display help |
| `-v, --version` | Display version |

### Examples

**Interactive mode** — Omitting arguments triggers prompts for project name and template:

```bash
npx pbase
```

**CI / non-interactive** — All prompts can be skipped by providing required flags:

```bash
npx pbase my-lib \
  --template lib \
  --desc "A tiny utility library" \
  --no-install \
  --no-git
```

**Dry run** — Preview what would be created without writing files:

```bash
npx pbase my-project --dry-run
```

**List available templates:**

```bash
npx pbase --list
```

## Templates

Templates are defined in `templates/` and can inherit from each other. The shared base (`_base`) provides TypeScript, Biome, Lefthook, and CI — each template extends it with its own stack.

| Template | Description | Stack |
|----------|-------------|-------|
| `lib` | TypeScript library | tsdown bundling, npm publish workflow, MIT license |
| `hono` | Hono API server | peta-orm, peta-auth, OpenAPI docs, in-memory LibSQL |

### Template inheritance

Each template can declare a parent in `template.json`. The parent is copied first, then the child overwrites matching files and deep-merges `package.json`. This keeps the shared tooling in `_base` while letting each template layer on its own dependencies and scripts.

```json
// templates/lib/template.json
{ "extends": "_base" }
```

## What's included

### All templates

- **TypeScript 6** with strict mode, bundler module resolution, and isolated declarations
- **Biome** for linting and formatting (2-space indent, 100-width lines)
- **Lefthook** git hooks — pre-commit runs lint + typecheck, pre-push runs test + build
- **Vitest** test runner
- **CI workflow** (`.github/workflows/ci.yml`) — typecheck, lint, test, and build on push/PR

### `lib` template extras

- **tsdown** bundler — ESM output with `.d.mts` declarations and sourcemaps
- **npm provenance** — Publish workflow with `--provenance` and `--access public`
- **MIT license** — Year and author auto-filled from placeholders

### `hono` template extras

- **Hono** web framework with `@hono/node-server`
- **peta-orm** with Kysely, LibSQL (in-memory by default)
- **peta-auth** — session-based auth with login/logout endpoints
- **peta-docs** — OpenAPI spec generation at `/openapi.json`
- **peta-migrate** — Schema migrations run at startup
- **Dev server** — `nub watch` with auto-reload

## Development

```bash
git clone https://github.com/zfadhli/pbase
cd pbase
nub install        # Install dependencies (npm works too)
nub run dev        # Watch mode rebuild
nub run test       # Run tests
nub run build      # Build CLI binary
nub run typecheck  # Type-check without emitting
nub run lint       # Biome lint
```
