# __NAME__

__DESC__

## Stack

| Tool | Role |
|---|---|
| [Node](https://nodejs.org) | Runtime |
| [TypeScript](https://www.typescriptlang.org) | Type system (strict, `isolatedDeclarations`) |
| [Biome](https://biomejs.dev) | Linter + formatter |
| [Lefthook](https://lefthook.dev) | Git hooks manager |

## Scripts

| Command | Description |
|---|---|
| `nub run build` | Build library |
| `nub run dev` | Watch mode rebuild |
| `nub run typecheck` | Type-check all files |
| `nub run lint` | Check lint + formatting |
| `nub run lint:fix` | Auto-fix lint + formatting |
| `nub run format` | Format only |
| `nub run test` | Run tests |
| `nub run test:watch` | Watch mode tests |

## Git hooks

Lefthook is configured in `lefthook.yml`:

- **pre-commit**: Biome lint + type-check on staged files
- **pre-push**: Run tests + build

Skip hooks temporarily with `LEFTHOOK=0`:

```
LEFTHOOK=0 git commit -m "wip"
```
