import { existsSync } from "node:fs";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { TemplateNotFoundError } from "../errors";
import type { ScaffoldOptions } from "../types";

const __dirname = dirname(fileURLToPath(import.meta.url));

export const TEMPLATES: Record<string, string> = {
  lib: "TypeScript library (tsdown + Biome + Lefthook)",
  pkg: "Minimal package (TypeScript + Bun only)",
};

export function resolveTemplateDir(template: string): string {
  // When bundled: dist/index.mjs → ../templates/<name>
  // When in source: src/utils/ → ../../templates/<name>
  const candidates = [
    resolve(__dirname, `../templates/${template}`),
    resolve(__dirname, `../../templates/${template}`),
  ];

  for (const dir of candidates) {
    if (existsSync(dir)) return dir;
  }

  throw new TemplateNotFoundError(template);
}

const BINARY_EXTS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".ico",
  ".svg",
  ".woff",
  ".woff2",
  ".ttf",
  ".eot",
  ".otf",
  ".zip",
  ".tar",
  ".gz",
  ".br",
]);

export async function renderPlaceholders(dir: string, options: ScaffoldOptions): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  const year = new Date().getFullYear().toString();
  const replacements: Record<string, string> = {
    __NAME__: options.projectName,
    __DESC__: options.description ?? "",
    __AUTHOR__: options.author ?? "",
    __YEAR__: year,
  };

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      if (entry.name === "node_modules") continue;
      files.push(...(await renderPlaceholders(fullPath, options)));
    } else if (entry.isFile()) {
      if (BINARY_EXTS.has(extname(entry.name))) continue;
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
