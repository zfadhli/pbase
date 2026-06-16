import { existsSync } from "node:fs";
import { readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { TemplateNotFoundError } from "../errors";
import type { ScaffoldOptions } from "../types";

const __dirname = dirname(fileURLToPath(import.meta.url));

export function resolveTemplateDir(): string {
  // When bundled: dist/index.mjs → ../template
  // When in source: src/utils/ → ../../template
  const candidates = [resolve(__dirname, "../template"), resolve(__dirname, "../../template")];

  for (const dir of candidates) {
    if (existsSync(dir)) return dir;
  }

  throw new TemplateNotFoundError(candidates[1]);
}

export async function renderPlaceholders(dir: string, options: ScaffoldOptions): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  const replacements: Record<string, string> = {
    __NAME__: options.projectName,
    __DESC__: options.description ?? "",
    __AUTHOR__: options.author ?? "",
  };

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      if (entry.name === "node_modules") continue;
      files.push(...(await renderPlaceholders(fullPath, options)));
    } else if (entry.isFile()) {
      const content = await readFile(fullPath, "utf-8");
      let updated = content;
      for (const [key, value] of Object.entries(replacements)) {
        updated = updated.replaceAll(key, value);
      }
      if (updated !== content) {
        await writeFile(fullPath, updated, "utf-8");
      }
      files.push(fullPath);
    }
  }

  return files;
}
