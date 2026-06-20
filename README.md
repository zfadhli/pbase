# pbase

Scaffold TypeScript projects from built-in templates. Zero-config starters for
libraries, packages, and more.

## Usage

```bash
npx pbase my-project
```

Follow the interactive prompts to pick a template and configure your project.

### Command-line options

```
pbase [project-name]

Options:
  --template <name>    Template to use (lib, pkg)
  --desc <desc>        Project description
  --author <author>    Author name (defaults from git config)
  --force              Overwrite existing directory
  --no-install         Skip dependency installation
  --no-git             Skip git init
  --dry-run            Preview files without writing
  --list               Show available templates
  -h, --help           Display help
  -v, --version        Display version
```

### Non-interactive use (CI)

All prompts can be skipped by providing the required flags:

```bash
npx pbase my-lib --template lib --desc "My library" --no-install --no-git
```

## Templates

| Name | Description | Includes |
|------|-------------|----------|
| `lib` | TypeScript library | tsdown + Biome + Lefthook + CI + LICENSE |
| `pkg` | Minimal package | TypeScript + vitest only |

## Development

```bash
git clone <repo>
nub install     # or: npm install
nub run dev     # watch mode
nub run test    # run tests
nub run build   # build CLI
```

## License

MIT
