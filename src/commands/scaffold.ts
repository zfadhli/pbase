import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { usePackage } from "../composables/usePackage";
import { useScaffold } from "../composables/useScaffold";
import { DirectoryExistsError } from "../errors";
import type { ScaffoldOptions, ScaffoldResult } from "../types";
import { confirmOverwrite, promptProjectName, promptTemplate } from "../utils/prompts";

export async function scaffold(options: ScaffoldOptions): Promise<ScaffoldResult> {
  // 1. Resolve project name
  let { projectName, template } = options;
  if (!projectName) {
    projectName = await promptProjectName();
    options.projectName = projectName;
  }

  // 2. Resolve template
  if (!template) {
    template = await promptTemplate();
    options.template = template;
  }

  // 3. Resolve output directory
  const outDir = options.outDir ?? resolve(process.cwd(), projectName);

  // 4. Check for existing directory — prompt to overwrite
  if (existsSync(outDir) && !options.force) {
    const ok = await confirmOverwrite(outDir);
    if (!ok) throw new DirectoryExistsError(outDir);
    options.force = true;
  }

  // 5. Scaffold: copy template + render placeholders
  const result = await useScaffold(options, outDir);

  // 6. Post-process: install deps, init git
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
