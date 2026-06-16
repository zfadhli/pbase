import { describe, expect, it } from "bun:test";
import { existsSync } from "node:fs";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { scaffold } from "../src/commands/scaffold";

describe("scaffold", () => {
  it("scaffolds a project with the given name", async () => {
    const tmpDir = mkdtempSync(join(tmpdir(), "pbase-test-"));
    const outDir = join(tmpDir, "test-lib");

    const result = await scaffold({
      projectName: "test-lib",
      outDir,
      noInstall: true,
      noGit: true,
      force: true,
    });

    expect(result.projectName).toBe("test-lib");
    expect(result.filesCreated).toBeGreaterThan(0);
    expect(existsSync(join(outDir, "package.json"))).toBe(true);
    expect(existsSync(join(outDir, "src/index.ts"))).toBe(true);
    expect(existsSync(join(outDir, "tsconfig.json"))).toBe(true);
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
    });

    const pkg = await Bun.file(join(outDir, "package.json")).json();
    expect(pkg.name).toBe("my-pkg");
    expect(pkg.description).toBe("A test package");
  });
});
