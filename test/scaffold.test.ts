import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";

vi.mock("../src/utils/prompts", () => ({
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
    expect(existsSync(join(outDir, "tsdown.config.ts"))).toBe(true);
    expect(existsSync(join(outDir, "biome.json"))).toBe(true);
    expect(existsSync(join(outDir, "lefthook.yml"))).toBe(true);
    expect(existsSync(join(outDir, "template.json"))).toBe(false);

    // Verify deep-merge: exports from lib, build script from _base
    const pkg = JSON.parse(readFileSync(join(outDir, "package.json"), "utf-8"));
    expect(pkg.exports?.["."]?.import).toBe("./dist/index.mjs");
    expect(pkg.scripts?.build).toBe("tsdown");
    expect(pkg.scripts?.dev).toBe("tsdown --watch");
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
    expect(existsSync(join(outDir, "tsdown.config.ts"))).toBe(true);
    expect(existsSync(join(outDir, "biome.json"))).toBe(true);
    expect(existsSync(join(outDir, "lefthook.yml"))).toBe(true);
    expect(existsSync(join(outDir, ".editorconfig"))).toBe(true);
    expect(existsSync(join(outDir, "template.json"))).toBe(false);
  });

  it("throws when overwriting without --force", async () => {
    const tmpDir = mkdtempSync(join(tmpdir(), "pbase-test-"));
    const outDir = join(tmpDir, "existing");

    await scaffold({
      projectName: "existing",
      outDir,
      noInstall: true,
      noGit: true,
      force: true,
      template: "lib",
    });

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

    const pkg = JSON.parse(readFileSync(join(outDir, "package.json"), "utf-8"));
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

    const license = await readFile(join(outDir, "LICENSE"), "utf-8");
    const currentYear = new Date().getFullYear().toString();
    expect(license).toContain("Test Author");
    expect(license).toContain(currentYear);
    expect(license).not.toContain("__YEAR__");
  });

  it("scaffolds a project from the hono template", async () => {
    const tmpDir = mkdtempSync(join(tmpdir(), "pbase-test-"));
    const outDir = join(tmpDir, "test-hono");

    await scaffold({
      projectName: "test-hono",
      outDir,
      noInstall: true,
      noGit: true,
      force: true,
      template: "hono",
    });

    expect(existsSync(join(outDir, "package.json"))).toBe(true);
    expect(existsSync(join(outDir, "src/app.ts"))).toBe(true);
    expect(existsSync(join(outDir, "src/index.ts"))).toBe(true);
    expect(existsSync(join(outDir, "test/index.test.ts"))).toBe(true);
    expect(existsSync(join(outDir, "tsconfig.json"))).toBe(true);
    expect(existsSync(join(outDir, "template.json"))).toBe(false);

    // Verify deep-merge: peta-stack deps from child, base deps + scripts from merge
    const pkg = JSON.parse(readFileSync(join(outDir, "package.json"), "utf-8"));
    expect(pkg.dependencies?.["peta-orm"]).toBe("^0");
    expect(pkg.dependencies?.["peta-auth"]).toBe("^0");
    expect(pkg.dependencies?.["peta-docs"]).toBe("^0");
    expect(pkg.dependencies?.["peta-migrate"]).toBe("^0");
    expect(pkg.dependencies?.hono).toBe("^4");
    expect(pkg.devDependencies?.typescript).toBe("^6");
    expect(pkg.scripts?.dev).toBe("nub watch src/index.ts");
    expect(pkg.scripts?.typecheck).toBe("tsc --noEmit");
  });
});
