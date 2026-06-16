import { cp } from "node:fs/promises";
import type { ScaffoldOptions, ScaffoldResult } from "../types";
import { renderPlaceholders, resolveTemplateDir } from "../utils/fs";

export async function useScaffold(
  options: ScaffoldOptions,
  outDir: string,
): Promise<ScaffoldResult> {
  const templateDir = resolveTemplateDir();

  await cp(templateDir, outDir, {
    recursive: true,
    force: options.force,
  });

  const files = await renderPlaceholders(outDir, options);

  return {
    outDir,
    projectName: options.projectName,
    filesCreated: files.length,
  };
}
