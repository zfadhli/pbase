# pbase — Agent Guide

## Project
pbase is a CLI tool that scaffolds TypeScript projects from built-in templates.
Run with `npx pbase` (or `nub run dev` during development).

## Tech stack
- Runtime: Node.js (ESM)
- Language: TypeScript 6, strict mode, `isolatedDeclarations`
- Package manager: `nub` (experimental; npm works with devEngine warnings)
- Build: `tsdown` (Rolldown-based bundler)
- Test: `vitest`
- Lint/format: `biome`
- CLI framework: `cac`
- Prompts: `@inquirer/prompts`

## Commands
| Command | What it does |
|---------|-------------|
| `nub run dev` | Watch mode rebuild |
| `nub run build` | Build dist/ |
| `nub run typecheck` | tsc --noEmit |
| `nub run lint` | Biome check |
| `nub run test` | Vitest run |
| `nub run format` | Biome format --write |

## Code conventions
- **File layout**: `src/` root, with `commands/` and `utils/` subdirectories.
  Keep files under 200 lines.
- **Error handling**: Extend `PbaseError` (see `src/errors.ts`). Use factory
  functions to create errors. Validation functions return `string | null`
  where null means valid.
- **Testing**: `vitest` with `describe`/`it`/`expect`. Mock modules with
  `vi.mock()`. Create temp dirs with `mkdtempSync` for scaffold tests.
- **CLI commands**: Defined via `cac` in `src/index.ts`. Options in
  `ScaffoldOptions` type in `src/types.ts`.
- **Templates**: Static directories under `templates/<name>/` with
  `__PLACEHOLDER__` markers (`__NAME__`, `__DESC__`, `__AUTHOR__`, `__YEAR__`).
- **Imports**: ESM with `.js` extensions omitted (bundler resolves).
- **No `any` or `as` casts**: Strict mode enforced.
