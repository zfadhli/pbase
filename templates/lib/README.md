# __NAME__

__DESC__

## Stack

| Tool | Role |
|---|---|
| [Bun](https://bun.sh) | Runtime, package manager, test runner |
| [TypeScript](https://www.typescriptlang.org) | Type system (strict, `isolatedDeclarations`) |
| [Biome](https://biomejs.dev) | Linter + formatter |
| [tsdown](https://tsdown.dev) | Library bundler (Rolldown-based, ESM + CJS + dts) |
| [Lefthook](https://lefthook.dev) | Git hooks manager |

## Scripts

| Command | Description |
|---|---|
| `bun run build` | Build library |
| `bun run dev` | Watch mode rebuild |
| `bun run typecheck` | Type-check all files |
| `bun run lint` | Check lint + formatting |
| `bun run lint:fix` | Auto-fix lint + formatting |
| `bun run format` | Format only |
| `bun test` | Run tests |
| `bun run test:watch` | Watch mode tests |

## Git hooks

Lefthook is configured in `lefthook.yml`:

- **pre-commit**: Biome lint + type-check on staged files
- **pre-push**: Run tests + build

Skip hooks temporarily with `LEFTHOOK=0`:

```
LEFTHOOK=0 git commit -m "wip"
```
