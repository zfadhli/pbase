import { exec } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { stderr } from "node:process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

export interface PackageMeta {
  name: string;
  description?: string;
  author?: string;
  noInstall?: boolean;
  noGit?: boolean;
}

async function withSpinner<T>(message: string, fn: () => Promise<T>): Promise<T> {
  const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  let i = 0;
  const timer = setInterval(() => {
    stderr.write(`\r  ${frames[i++ % frames.length]} ${message}`);
  }, 80);
  try {
    const result = await fn();
    stderr.write(`\r  ✓ ${message}\n`);
    return result;
  } catch (e) {
    stderr.write(`\r  ✗ ${message}\n`);
    throw e;
  } finally {
    clearInterval(timer);
  }
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
    await withSpinner("Installing dependencies", async () => {
      await execAsync("bun install", { cwd: targetDir });
    });
  }

  // Initialize git
  if (!meta.noGit) {
    await withSpinner("Initializing git", async () => {
      await execAsync("git init -b main", { cwd: targetDir });
    });
    try {
      await execAsync('git add -A && git commit -m "initial commit"', {
        cwd: targetDir,
      });
    } catch {
      // git commit may fail without user config — non-fatal
    }
  }
}
