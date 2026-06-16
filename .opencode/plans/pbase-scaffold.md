# pbase — Execution Plan

## What we're building

A CLI tool (`pbase`) that scaffolds a minimal TypeScript library starter from a built-in template. No external templates — the template lives inside the `pbase` repo under `template/`.

## Folder structure

```
pbase/
├── .github/workflows/
│   ├── ci.yml                     # build + test on push/PR
│   └── publish.yml                # build + publish on tag
├── template/                       # THE BUILT-IN STARTER TEMPLATE
│   ├── .editorconfig
│   ├── .gitignore
│   ├── biome.json
│   ├── package.json                # uses __NAME__, __DESC__ placeholders
│   ├── tsconfig.json
│   ├── tsdown.config.ts
│   ├── src/
│   │   ├── index.ts                # export function hello(): string
│   │   └── internal/helpers.ts     # internal utils
│   └── test/
│       └── index.test.ts           # basic test
├── src/                             # CLI SOURCE CODE
│   ├── index.ts                    # cac CLI entry
│   ├── commands/
│   │   └── scaffold.ts             # main command orchestration
│   ├── composables/
│   │   ├── useScaffold.ts          # copy template + render placeholders
│   │   └── usePackage.ts           # rewrite package.json, install, git init
│   ├── utils/
│   │   ├── fs.ts                   # file system helpers
│   │   └── prompts.ts             # interactive prompts
│   ├── types.ts                    # all shared types
│   └── errors.ts                   # typed error classes
├── test/
│   └── scaffold.test.ts            # integration tests
├── .editorconfig
├── .gitignore
├── biome.json
├── package.json
├── tsconfig.json
└── tsdown.config.ts
```

## File-by-file contents

### template/package.json
```json
{
  "name": "__NAME__",
  "version": "0.0.0",
  "description": "__DESC__",
  "type": "module",
  "private": true,
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.mts"
    }
  },
  "scripts": {
    "build": "tsdown",
    "dev": "tsdown --watch",
    "typecheck": "tsc --noEmit",
    "lint": "biome check .",
    "lint:fix": "biome check --write .",
    "format": "biome format --write .",
    "test": "bun test",
    "test:watch": "bun test --watch"
  },
  "devDependencies": {
    "@biomejs/biome": "^1",
    "tsdown": "^1",
    "typescript": "^6"
  }
}
```

### template/tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "isolatedDeclarations": true,
    "declaration": true,
    "noEmit": true,
    "skipLibCheck": true
  },
  "include": ["src", "test"]
}
```

### template/tsdown.config.ts
```ts
import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
})
```

### template/biome.json
```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "vcs": { "enabled": true, "clientKind": "git", "useIgnoreFile": true },
  "files": { "ignoreUnknown": false, "ignore": [] },
  "formatter": { "enabled": true, "indentStyle": "space", "indentWidth": 2, "lineWidth": 100 },
  "linter": { "enabled": true, "rules": { "recommended": true } }
}
```

### template/.editorconfig
```
root = true

[*]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true
```

### template/.gitignore
```
node_modules/
dist/
*.tsbuildinfo
```

### template/src/index.ts
```ts
export function hello(): string {
  return 'hello, world!'
}
```

### template/src/internal/helpers.ts
```ts
export function greet(name: string): string {
  return `hello, ${name}!`
}
```

### template/test/index.test.ts
```ts
import { describe, expect, it } from 'bun:test'
import { hello } from '../src/index'

describe('hello', () => {
  it('returns a greeting', () => {
    expect(hello()).toBe('hello, world!')
  })
})
```

---

### CLI source files

#### src/types.ts
```ts
export interface ScaffoldOptions {
  projectName: string
  outDir?: string
  description?: string
  author?: string
  force?: boolean
  noInstall?: boolean
  noGit?: boolean
}

export interface ScaffoldResult {
  outDir: string
  projectName: string
  filesCreated: number
}
```

#### src/errors.ts
```ts
export class PbaseError extends Error {
  constructor(message: string, public exitCode = 1) {
    super(`[pbase] ${message}`)
    this.name = 'PbaseError'
  }
}

export class DirectoryExistsError extends PbaseError {
  constructor(dir: string) {
    super(`Directory "${dir}" already exists. Use --force to overwrite.`)
  }
}

export class TemplateNotFoundError extends PbaseError {
  constructor(dir: string) {
    super(`Template directory not found at "${dir}"`)
  }
}
```

#### src/utils/prompts.ts
```ts
import { stdin, stdout } from 'node:process'

export async function promptForName(): Promise<string> {
  const { default: prompt } = await import('bun-prompt')
  // fallback: use Bun's built-in prompt
  const name = prompt('Project name: ')
  if (!name) throw new Error('Project name is required')
  return name
}
```

Wait — Bun doesn't have a built-in prompt function in the way I assumed. Let me reconsider.

Actually, for interactive prompts, we have a few options:
1. Use `@clack/prompts` — lightweight, beautiful
2. Use `prompts` — popular
3. Use simple stdin readline

For minimal dependencies, I could use Node's `readline` or Bun's built-in `prompt` function (Bun has a `Bun.prompt()`?). Actually Bun has `console.prompt()` in its global scope... no, it doesn't.

Let me just use Node's `readline/promises` which is built-in and needs no deps:

```ts
import { createInterface } from 'node:readline/promises'
import { stdin, stdout } from 'node:process'

export async function prompt(question: string, defaultValue?: string): Promise<string> {
  const rl = createInterface({ input: stdin, output: stdout })
  const answer = await rl.question(question + ' ')
  rl.close()
  return answer || defaultValue || ''
}
```

This is minimal, no extra deps, and works in Bun.

#### src/utils/prompts.ts (revised)
```ts
import { createInterface } from 'node:readline/promises'
import { stdin, stdout } from 'node:process'

export async function prompt(question: string, defaultValue?: string): Promise<string> {
  const rl = createInterface({ input: stdin, output: stdout })
  const answer = await rl.question(question + ' ')
  rl.close()
  return answer || defaultValue || ''
}
```

#### src/utils/fs.ts
```ts
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { statSync } from 'node:fs'

export function resolveTemplateDir(): string {
  const { dirname } = await import('node:path')
  const { fileURLToPath } = await import('node:url')

  const __dirname = dirname(fileURLToPath(import.meta.url))
  // When bundled: dist/index.mjs → ../template
  // When in source: src/utils/ → ../../template
  const candidates = [
    resolve(__dirname, '../template'),
    resolve(__dirname, '../../template'),
  ]

  for (const dir of candidates) {
    if (existsSync(dir)) return dir
  }

  throw new Error('Template directory not found')
}
```

Wait, `await import` at the top of a function is not ideal. Let me restructure.

Actually, I'll use `import.meta.dirname` which Bun supports directly in ESM:

```ts
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

export function resolveTemplateDir(): string {
  const dir = import.meta.dirname ?? ''
  const candidates = [
    resolve(dir, '../template'),
    resolve(dir, '../../template'),
  ]
  for (const d of candidates) {
    if (existsSync(d)) return d
  }
  throw new Error('Template directory not found')
}
```

But `import.meta.dirname` might not survive tsdown bundling. Let me use `fileURLToPath` + `import.meta.url` instead which is more standard:

```ts
import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

export function resolveTemplateDir(): string {
  const candidates = [
    resolve(__dirname, '../template'),
    resolve(__dirname, '../../template'),
  ]
  for (const d of candidates) {
    if (existsSync(d)) return d
  }
  throw new Error('Template directory not found')
}
```

This is clean and works.

#### src/utils/fs.ts
```ts
import { existsSync } from 'node:fs'
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { ScaffoldOptions } from '../types'

const __dirname = dirname(fileURLToPath(import.meta.url))

export function resolveTemplateDir(): string {
  const candidates = [
    resolve(__dirname, '../template'),
    resolve(__dirname, '../../template'),
  ]
  for (const d of candidates) {
    if (existsSync(d)) return d
  }
  throw new Error('Template directory not found')
}

export async function renderPlaceholders(
  dir: string,
  options: ScaffoldOptions,
): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true })
  const files: string[] = []
  const replacements: Record<string, string> = {
    __NAME__: options.projectName,
    __DESC__: options.description ?? '',
    __AUTHOR__: options.author ?? '',
  }

  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules') continue
      files.push(...await renderPlaceholders(fullPath, options))
    } else if (entry.isFile()) {
      const content = await readFile(fullPath, 'utf-8')
      let updated = content
      for (const [key, value] of Object.entries(replacements)) {
        updated = updated.replaceAll(key, value)
      }
      if (updated !== content) {
        await writeFile(fullPath, updated, 'utf-8')
      }
      files.push(fullPath)
    }
  }
  return files
}
```

#### src/composables/useScaffold.ts
```ts
import { cp } from 'node:fs/promises'
import type { ScaffoldOptions, ScaffoldResult } from '../types'
import { resolveTemplateDir, renderPlaceholders } from '../utils/fs'

export async function useScaffold(
  options: ScaffoldOptions,
  outDir: string,
): Promise<ScaffoldResult> {
  const templateDir = resolveTemplateDir()

  await cp(templateDir, outDir, {
    recursive: true,
    force: options.force,
  })

  const files = await renderPlaceholders(outDir, options)

  return {
    outDir,
    projectName: options.projectName,
    filesCreated: files.length,
  }
}
```

#### src/composables/usePackage.ts
```ts
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { execSync } from 'node:child_process'

interface PackageMeta {
  name: string
  description?: string
  author?: string
  noInstall?: boolean
  noGit?: boolean
}

export async function usePackage(
  targetDir: string,
  meta: PackageMeta,
): Promise<void> {
  // Ensure package.json has the correct name
  const pkgPath = resolve(targetDir, 'package.json')
  const pkg = JSON.parse(await readFile(pkgPath, 'utf-8'))
  pkg.name = meta.name
  if (meta.description) pkg.description = meta.description
  await writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8')

  // Install dependencies
  if (!meta.noInstall) {
    console.log('  Installing dependencies...')
    execSync('bun install', { cwd: targetDir, stdio: 'inherit' })
  }

  // Initialize git
  if (!meta.noGit) {
    console.log('  Initializing git...')
    execSync('git init', { cwd: targetDir, stdio: 'inherit' })
    try {
      execSync('git add -A && git commit -m "initial commit"', {
        cwd: targetDir,
        stdio: 'inherit',
      })
    } catch {
      // commit might fail if no user config — non-fatal
    }
  }
}
```

#### src/commands/scaffold.ts
```ts
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { useScaffold } from '../composables/useScaffold'
import { usePackage } from '../composables/usePackage'
import { DirectoryExistsError } from '../errors'
import { prompt } from '../utils/prompts'
import type { ScaffoldOptions, ScaffoldResult } from '../types'

export async function scaffold(options: ScaffoldOptions): Promise<ScaffoldResult> {
  let { projectName } = options
  if (!projectName) {
    projectName = await prompt('Project name:')
    if (!projectName) throw new Error('Project name is required')
    options.projectName = projectName
  }

  const outDir = options.outDir ?? resolve(process.cwd(), projectName)

  if (existsSync(outDir) && !options.force) {
    throw new DirectoryExistsError(outDir)
  }

  const result = await useScaffold(options, outDir)

  await usePackage(outDir, {
    name: projectName,
    description: options.description,
    author: options.author,
    noInstall: options.noInstall,
    noGit: options.noGit,
  })

  console.log(`\n  ✅ "${projectName}" scaffolded at ${outDir}\n`)
  console.log(`  $ cd ${projectName}`)
  console.log('  $ bun run dev\n')

  return result
}
```

#### src/index.ts
```ts
#!/usr/bin/env bun
import { cac } from 'cac'
import { scaffold } from './commands/scaffold'

const cli = cac('pbase')

cli
  .command('[name]', 'Scaffold a new project')
  .option('--desc <desc>', 'Project description')
  .option('--author <author>', 'Author name')
  .option('--force', 'Overwrite existing directory')
  .option('--no-install', 'Skip bun install')
  .option('--no-git', 'Skip git init')
  .action(async (name?: string, options?: Record<string, unknown>) => {
    await scaffold({
      projectName: name ?? '',
      description: (options?.desc as string) ?? '',
      author: (options?.author as string) ?? '',
      force: !!options?.force,
      noInstall: !!options?.['no-install'],
      noGit: !!options?.['no-git'],
    })
  })

cli.help()
cli.parse()
```

---

### Root config files

#### package.json
```json
{
  "name": "pbase",
  "version": "0.0.0",
  "description": "Scaffold a minimal TypeScript library starter",
  "type": "module",
  "private": true,
  "bin": {
    "pbase": "./dist/index.mjs"
  },
  "exports": {
    ".": "./dist/index.mjs"
  },
  "scripts": {
    "build": "tsdown",
    "dev": "tsdown --watch",
    "typecheck": "tsc --noEmit",
    "lint": "biome check .",
    "lint:fix": "biome check --write .",
    "format": "biome format --write .",
    "test": "bun test",
    "test:watch": "bun test --watch"
  },
  "dependencies": {
    "cac": "^6"
  },
  "devDependencies": {
    "@biomejs/biome": "^1",
    "@types/bun": "latest",
    "tsdown": "^1",
    "typescript": "^6"
  },
  "files": [
    "dist",
    "template"
  ]
}
```

#### tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "isolatedDeclarations": true,
    "declaration": true,
    "noEmit": true,
    "skipLibCheck": true
  },
  "include": ["src", "test"]
}
```

#### tsdown.config.ts
```ts
import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  bundleDts: true,
})
```

#### biome.json
```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true
  },
  "files": {
    "ignoreUnknown": false,
    "ignore": []
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true
    }
  }
}
```

#### .editorconfig
```
root = true

[*]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true
```

#### .gitignore
```
node_modules/
dist/
*.tsbuildinfo
```

---

### Test files

#### test/scaffold.test.ts
```ts
import { describe, expect, it } from 'bun:test'
import { existsSync } from 'node:fs'
import { mkdtempSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { scaffold } from '../src/commands/scaffold'

describe('scaffold', () => {
  it('should scaffold a project with the given name', async () => {
    const tmpDir = mkdtempSync(join(tmpdir(), 'pbase-test-'))
    const result = await scaffold({
      projectName: 'test-lib',
      outDir: join(tmpDir, 'test-lib'),
      noInstall: true,
      noGit: true,
      force: true,
    })

    expect(result.projectName).toBe('test-lib')
    expect(result.filesCreated).toBeGreaterThan(0)
    expect(existsSync(join(result.outDir, 'package.json'))).toBe(true)
    expect(existsSync(join(result.outDir, 'src/index.ts'))).toBe(true)
    expect(existsSync(join(result.outDir, 'tsconfig.json'))).toBe(true)
  })
})
```

---

### GitHub Actions workflows

#### .github/workflows/ci.yml
```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install
      - run: bun run typecheck
      - run: bun run lint
      - run: bun test
      - run: bun run build
```

#### .github/workflows/publish.yml
```yaml
name: Publish
on:
  push:
    tags: ['v*']
jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      id-token: write
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install
      - run: bun run build
      - run: |
          echo "//registry.npmjs.org/:_authToken=${{ secrets.NPM_TOKEN }}" > .npmrc
          npm publish --provenance
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
      - uses: softprops/action-gh-release@v2
```

---

## Execution steps

1. Create all directories (`mkdir -p`)
2. Write all files (as specified above)
3. `git init && git add -A && git commit -m "initial commit"`
4. `gh repo create pbase --public --push --source=.`
5. Print remote URL to verify
