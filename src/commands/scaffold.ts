import { cp, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { stderr } from "node:process";
import { directoryExistsError } from "../errors";
import type { ScaffoldOptions } from "../types";
import { confirmOverwrite, promptProjectName, promptTemplate } from "../utils/prompts";
import { renderPlaceholders, resolveTemplateDir } from "../utils/fs";

async function scaffoldTemplate(options: ScaffoldOptions, outDir: string): Promise<void> {
  const templateDir = resolveTemplateDir(options.template ?? "lib");
  await cp(templateDir, outDir, { recursive: true, force: options.force });
  await renderPlaceholders(outDir, options);
}

async function runShell(message: string, cmd: string[], cwd: string): Promise<void> {
  stderr.write(`  ${message}...\n`);
  const proc = Bun.spawn(cmd, { cwd, stdout: "pipe", stderr: "pipe" });
  const result = await proc.exited;
  if (result !== 0) {
    const text = await new Response(proc.stderr).text();
    throw new Error(`${message} failed: ${text.trim()}`);
  }
}

async function setupPackage(targetDir: string, meta: ScaffoldOptions): Promise<void> {
  const pkgPath = resolve(targetDir, "package.json");
  const pkg = JSON.parse(await readFile(pkgPath, "utf-8"));
  pkg.name = meta.projectName;
  if (meta.description) pkg.description = meta.description;
  await writeFile(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`, "utf-8");

  if (!meta.noInstall) {
    await runShell("Installing dependencies", ["bun", "install"], targetDir);
  }

  if (!meta.noGit) {
    await runShell("Initializing git", ["git", "init", "-b", "main"], targetDir);
    try {
      const proc = Bun.spawn(["git", "add", "-A"], { cwd: targetDir });
      await proc.exited;
      const commit = Bun.spawn(["git", "commit", "-m", "initial commit"], { cwd: targetDir });
      await commit.exited;
    } catch {
      // git commit may fail without user config — non-fatal
    }
  }
}

export async function scaffold(options: ScaffoldOptions): Promise<void> {
  let { projectName, template } = options;

  if (!projectName) {
    projectName = await promptProjectName();
    options.projectName = projectName;
  }

  if (!template) {
    template = await promptTemplate();
    options.template = template;
  }

  const outDir = options.outDir ?? resolve(process.cwd(), projectName);

  if (existsSync(outDir) && !options.force) {
    const ok = await confirmOverwrite(outDir);
    if (!ok) throw directoryExistsError(outDir);
    options.force = true;
  }

  await scaffoldTemplate(options, outDir);
  await setupPackage(outDir, options);

  console.log(`\n  ✅ "${projectName}" scaffolded at ${outDir}\n`);
  console.log(`  $ cd ${projectName}`);
  console.log("  $ bun run dev\n");
}
