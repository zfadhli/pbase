import { describe, expect, it, mock } from "bun:test";
import { existsSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Mock prompts module so prompts don't hang waiting for stdin in non-TTY
mock.module("../src/utils/prompts", () => ({
  confirmOverwrite: () => Promise.resolve(false),
  promptProjectName: () => Promise.resolve("test-lib"),
  promptTemplate: () => Promise.resolve("lib"),
}));

const { scaffold } = await import("../src/commands/scaffold");

describe("scaffold", () => {
  it("scaffolds a project from the lib template", async () => {
    const tmpDir = mkdtempSync(join(tmpdir(), "pbase-test-"));
    const outDir = join(tmpDir, "test-lib");

    await scaffold({
      projectName: "test-lib",
      outDir,
      noInstall: true,
      noGit: true,
      force: true,
      template: "lib",
    });

    expect(existsSync(join(outDir, "package.json"))).toBe(true);
    expect(existsSync(join(outDir, "src/index.ts"))).toBe(true);
    expect(existsSync(join(outDir, "tsconfig.json"))).toBe(true);
    // lib template should include tsdown + biome + lefthook
    expect(existsSync(join(outDir, "tsdown.config.ts"))).toBe(true);
    expect(existsSync(join(outDir, "biome.json"))).toBe(true);
    expect(existsSync(join(outDir, "lefthook.yml"))).toBe(true);
  });

  it("scaffolds a project from the pkg template", async () => {
    const tmpDir = mkdtempSync(join(tmpdir(), "pbase-test-"));
    const outDir = join(tmpDir, "test-pkg");

    await scaffold({
      projectName: "test-pkg",
      outDir,
      noInstall: true,
      noGit: true,
      force: true,
      template: "pkg",
    });

    expect(existsSync(join(outDir, "package.json"))).toBe(true);
    expect(existsSync(join(outDir, "src/index.ts"))).toBe(true);
    expect(existsSync(join(outDir, "tsconfig.json"))).toBe(true);
    // pkg template should NOT include lib extras
    expect(existsSync(join(outDir, "tsdown.config.ts"))).toBe(false);
    expect(existsSync(join(outDir, "biome.json"))).toBe(false);
    expect(existsSync(join(outDir, "lefthook.yml"))).toBe(false);
  });

  it("throws when overwriting without --force", async () => {
    const tmpDir = mkdtempSync(join(tmpdir(), "pbase-test-"));
    const outDir = join(tmpDir, "existing");

    // First scaffold succeeds with --force
    await scaffold({
      projectName: "existing",
      outDir,
      noInstall: true,
      noGit: true,
      force: true,
      template: "lib",
    });

    // Second scaffold without --force — mock returns false → throws
    expect(existsSync(outDir)).toBe(true);
    await expect(
      scaffold({
        projectName: "existing",
        outDir,
        noInstall: true,
        noGit: true,
        template: "lib",
      }),
    ).rejects.toThrow("already exists");
  });

  it("replaces placeholders in the scaffolded project", async () => {
    const tmpDir = mkdtempSync(join(tmpdir(), "pbase-test-"));
    const outDir = join(tmpDir, "my-pkg");

    await scaffold({
      projectName: "my-pkg",
      description: "A test package",
      outDir,
      noInstall: true,
      noGit: true,
      force: true,
      template: "lib",
    });

    const pkg = await Bun.file(join(outDir, "package.json")).json();
    expect(pkg.name).toBe("my-pkg");
    expect(pkg.description).toBe("A test package");
  });

  it("verifies __YEAR__ placeholder is replaced", async () => {
    const tmpDir = mkdtempSync(join(tmpdir(), "pbase-test-"));
    const outDir = join(tmpDir, "year-lib");

    await scaffold({
      projectName: "year-lib",
      author: "Test Author",
      outDir,
      noInstall: true,
      noGit: true,
      force: true,
      template: "lib",
    });

    const license = await Bun.file(join(outDir, "LICENSE")).text();
    const currentYear = new Date().getFullYear().toString();
    expect(license).toContain("Test Author");
    expect(license).toContain(currentYear);
    expect(license).not.toContain("__YEAR__");
  });
});
