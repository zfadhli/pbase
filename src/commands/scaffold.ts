import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { usePackage } from "../composables/usePackage";
import { useScaffold } from "../composables/useScaffold";
import { DirectoryExistsError } from "../errors";
import type { ScaffoldOptions, ScaffoldResult } from "../types";
import { prompt } from "../utils/prompts";

export async function scaffold(options: ScaffoldOptions): Promise<ScaffoldResult> {
  // 1. Resolve project name
  let { projectName } = options;
  if (!projectName) {
    projectName = await prompt("Project name:");
    if (!projectName) throw new Error("Project name is required");
    options.projectName = projectName;
  }

  // 2. Resolve output directory
  const outDir = options.outDir ?? resolve(process.cwd(), projectName);

  // 3. Check for existing directory
  if (existsSync(outDir) && !options.force) {
    throw new DirectoryExistsError(outDir);
  }

  // 4. Scaffold: copy template + render placeholders
  const result = await useScaffold(options, outDir);

  // 5. Post-process: install deps, init git
  await usePackage(outDir, {
    name: projectName,
    description: options.description,
    author: options.author,
    noInstall: options.noInstall,
    noGit: options.noGit,
  });

  console.log(`\n  ✅ "${projectName}" scaffolded at ${outDir}\n`);
  console.log(`  $ cd ${projectName}`);
  console.log("  $ bun run dev\n");

  return result;
}
