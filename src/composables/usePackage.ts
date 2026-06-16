import { execSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

export interface PackageMeta {
  name: string;
  description?: string;
  author?: string;
  noInstall?: boolean;
  noGit?: boolean;
}

export async function usePackage(targetDir: string, meta: PackageMeta): Promise<void> {
  // Rewrite package.json with the correct name
  const pkgPath = resolve(targetDir, "package.json");
  const pkg = JSON.parse(await readFile(pkgPath, "utf-8"));
  pkg.name = meta.name;
  if (meta.description) pkg.description = meta.description;
  await writeFile(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`, "utf-8");

  // Install dependencies
  if (!meta.noInstall) {
    console.log("  Installing dependencies...");
    execSync("bun install", { cwd: targetDir, stdio: "inherit" });
  }

  // Initialize git
  if (!meta.noGit) {
    console.log("  Initializing git...");
    execSync("git init", { cwd: targetDir, stdio: "inherit" });
    try {
      execSync('git add -A && git commit -m "initial commit"', {
        cwd: targetDir,
        stdio: "inherit",
      });
    } catch {
      // git commit may fail without user config — non-fatal
    }
  }
}
