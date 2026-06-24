import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { cp, readFile, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { stderr } from "node:process";
import { PbaseError, validateProjectName } from "../errors";
import type { ScaffoldOptions } from "../types";
import {
  readTemplateMeta,
  renderPlaceholders,
  resolveTemplateDir,
  resolveTemplateDirPath,
} from "../utils/fs";
import { confirmOverwrite, promptProjectName, promptTemplate } from "../utils/prompts";

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function deepMerge(
  base: Record<string, unknown>,
  child: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...base };
  for (const key of Object.keys(child)) {
    const baseVal = result[key];
    const childVal = child[key];
    if (isPlainObject(baseVal) && isPlainObject(childVal)) {
      result[key] = deepMerge(baseVal, childVal);
    } else {
      result[key] = childVal;
    }
  }
  return result;
}

function runOrDie(message: string, cmd: string[], cwd: string): void {
  stderr.write(`  ${message}...\n`);
  try {
    execSync(cmd.join(" "), { cwd, stdio: "pipe" });
  } catch (err) {
    const output = ((err as { stderr?: string | Buffer }).stderr ?? "").toString().trim();
    throw new Error(`${message} failed: ${output || (err as Error).message}`);
  }
}

async function scaffoldTemplate(options: ScaffoldOptions, outDir: string): Promise<void> {
  const templateDir = resolveTemplateDir(options.template ?? "lib");

  // Resolve and copy parent template first (if extends)
  let basePkg: Record<string, unknown> | undefined;
  const meta = await readTemplateMeta(templateDir);
  if (meta.extends) {
    const parentDir = resolveTemplateDirPath(meta.extends);
    basePkg = await readPkg(parentDir);
    await cp(parentDir, outDir, { recursive: true, force: true });
  }

  // Read child's package.json before it overwrites parent's in output
  const childPkg = await readPkg(templateDir);

  // Copy this template (overrides parent files)
  await cp(templateDir, outDir, { recursive: true, force: options.force });

  // Deep-merge package.json: child fields win, sub-objects are merged
  if (basePkg && childPkg) {
    const merged = deepMerge(basePkg, childPkg);
    await writeFile(join(outDir, "package.json"), `${JSON.stringify(merged, null, 2)}\n`, "utf-8");
  }

  // Remove template.json from output (meta file, not user-facing)
  await rm(join(outDir, "template.json"), { force: true });

  await renderPlaceholders(outDir, options);
}

async function readPkg(dir: string): Promise<Record<string, unknown> | undefined> {
  try {
    return JSON.parse(await readFile(join(dir, "package.json"), "utf-8"));
  } catch {
    return undefined;
  }
}

async function setupPackage(targetDir: string, meta: ScaffoldOptions): Promise<void> {
  const pkgPath = resolve(targetDir, "package.json");
  const pkg = JSON.parse(await readFile(pkgPath, "utf-8"));
  pkg.name = meta.projectName;
  if (meta.description) pkg.description = meta.description;
  await writeFile(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`, "utf-8");

  if (!meta.noInstall) {
    runOrDie("Installing dependencies", ["nub", "install"], targetDir);
  }

  if (!meta.noGit) {
    runOrDie("Initializing git", ["git", "init", "-b", "main"], targetDir);
    try {
      runOrDie("Staging files", ["git", "add", "-A"], targetDir);
      runOrDie("Creating commit", ["git", "commit", "-m", "initial commit"], targetDir);
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

  const err = validateProjectName(projectName);
  if (err)
    throw new PbaseError(
      `Invalid project name "${projectName}": ${err}. Use a lowercase npm-compatible name (e.g. my-lib).`,
    );

  if (!template) {
    template = await promptTemplate();
    options.template = template;
  }

  const outDir = options.outDir ?? resolve(process.cwd(), projectName);

  if (options.dryRun) {
    console.log(`\n  Project:  ${projectName}`);
    console.log(`  Template: ${template}`);
    console.log(`  Output:   ${outDir}`);
    console.log(`\n  🟡 dry run — no files written\n`);
    return;
  }

  if (existsSync(outDir) && !options.force) {
    const ok = await confirmOverwrite(outDir);
    if (!ok)
      throw new PbaseError(`Directory "${outDir}" already exists. Use --force to overwrite.`);
    options.force = true;
  }

  await scaffoldTemplate(options, outDir);
  await setupPackage(outDir, options);

  console.log(`\n  ✅ "${projectName}" scaffolded at ${outDir}\n`);
  console.log(`  $ cd ${projectName}`);
  console.log("  $ nub run dev\n");
}
