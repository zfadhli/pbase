import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { cp, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { stderr } from "node:process";
import { directoryExistsError } from "../errors";
import type { ScaffoldOptions } from "../types";
import {
  getPlaceholders,
  listTemplateFiles,
  renderPlaceholders,
  resolveTemplateDir,
} from "../utils/fs";
import { confirmOverwrite, promptProjectName, promptTemplate } from "../utils/prompts";

function runProcess(cmd: string[], cwd: string): Promise<{ exitCode: number; stderr: string }> {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd[0], cmd.slice(1), { cwd, stdio: ["ignore", "pipe", "pipe"] });
    const err: Buffer[] = [];
    proc.stderr?.on("data", (d: Buffer) => err.push(d));
    proc.on("close", (exitCode) =>
      resolve({ exitCode: exitCode ?? 1, stderr: Buffer.concat(err).toString().trim() }),
    );
    proc.on("error", reject);
  });
}

async function scaffoldTemplate(options: ScaffoldOptions, outDir: string): Promise<void> {
  const templateDir = resolveTemplateDir(options.template ?? "lib");
  await cp(templateDir, outDir, { recursive: true, force: options.force });
  await renderPlaceholders(outDir, options);
}

async function runShell(message: string, cmd: string[], cwd: string): Promise<void> {
  stderr.write(`  ${message}...\n`);
  const { exitCode, stderr: output } = await runProcess(cmd, cwd);
  if (exitCode !== 0) {
    throw new Error(`${message} failed: ${output}`);
  }
}

async function setupPackage(targetDir: string, meta: ScaffoldOptions): Promise<void> {
  const pkgPath = resolve(targetDir, "package.json");
  const pkg = JSON.parse(await readFile(pkgPath, "utf-8"));
  pkg.name = meta.projectName;
  if (meta.description) pkg.description = meta.description;
  await writeFile(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`, "utf-8");

  if (!meta.noInstall) {
    await runShell("Installing dependencies", ["nub", "install"], targetDir);
  }

  if (!meta.noGit) {
    await runShell("Initializing git", ["git", "init", "-b", "main"], targetDir);
    try {
      await runProcess(["git", "add", "-A"], targetDir);
      await runProcess(["git", "commit", "-m", "initial commit"], targetDir);
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

  if (options.dryRun) {
    const templateDir = resolveTemplateDir(template);
    const files = await listTemplateFiles(templateDir);
    const placeholders = getPlaceholders(options);

    console.log(`\n  Project:  ${projectName}`);
    console.log(`  Template: ${template}`);
    console.log(`  Output:   ${outDir}`);
    console.log(`\n  Files to create (${files.length}):`);
    for (const f of files) {
      console.log(`    ${f}`);
    }
    console.log(`\n  Placeholders:`);
    for (const [key, value] of Object.entries(placeholders)) {
      console.log(`    ${key} → ${value || "(empty)"}`);
    }
    console.log(`\n  🟡 dry run — no files written\n`);
    return;
  }

  if (existsSync(outDir) && !options.force) {
    const ok = await confirmOverwrite(outDir);
    if (!ok) throw directoryExistsError(outDir);
    options.force = true;
  }

  await scaffoldTemplate(options, outDir);
  await setupPackage(outDir, options);

  console.log(`\n  ✅ "${projectName}" scaffolded at ${outDir}\n`);
  console.log(`  $ cd ${projectName}`);
  console.log("  $ nub run dev\n");
}
