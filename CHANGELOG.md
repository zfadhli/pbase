# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.2] - 2026-06-25

### Fixed

- Scaffold failure when `lefthook install` (prepare script) runs before `git init` — ensures `.git` directory exists before `nub install`
- `--no-git` flag now removes the `prepare` script from `package.json` so dependency install works without a git repository

## [0.1.1] - 2026-06-25

### Changed

- Made `lib` template npm-publishable — added `repository`, `publishConfig`, `private: false`, fixed publish workflow with `--access public`

## [0.1.0] - 2026-06-25

### Added

- Multi-template support with interactive template selection (`lib`, `pkg`, `hono`)
- Template inheritance system — templates declare `extends` in `template.json` to inherit from a shared `_base` template
- Hono API template with peta-orm, peta-auth, OpenAPI, and integration tests
- `--dry-run` flag to preview scaffold without writing files
- `--list` flag to show available templates
- Auto-author detection from `git config user.name`
- Project name validation (npm-compatible names only)
- Path traversal protection on template names

### Changed

- Migrated toolchain from bun to nub/vitest
- Inlined composables into scaffold command, replaced error class factories with inline `new PbaseError()`
- Aligned publish workflow with nub package manager
- Removed `pkg` template (superseded by `hono`)
- Moved `tsdown` from `_base` template to `lib` — only library templates need bundling

### Removed

- Dead code: `resolveInternalTemplateDir()` abstraction, `runProcess()`/`runShell()` wrapper replaced with `execSync`
- Speculative files from `_base` template: `CHANGELOG.md`, `.editorconfig`

[0.1.2]: https://github.com/zfadhli/pbase/releases/tag/v0.1.2
[0.1.1]: https://github.com/zfadhli/pbase/releases/tag/v0.1.1
[0.1.0]: https://github.com/zfadhli/pbase/releases/tag/v0.1.0
