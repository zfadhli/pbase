import { existsSync } from "node:fs";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { invalidTemplateNameError, templateNotFoundError, validateTemplateName } from "../errors";
import type { ScaffoldOptions } from "../types";

const __dirname = dirname(fileURLToPath(import.meta.url));

export const TEMPLATES: Record<string, string> = {
  lib: "TypeScript library (tsdown + Biome + Lefthook)",
  pkg: "Minimal package (TypeScript + vitest)",
};

export function resolveTemplateDir(template: string): string {
  const err = validateTemplateName(template);
  if (err) throw invalidTemplateNameError(template, err);

  // When bundled: dist/index.mjs → ../templates/<name>
  // When in source: src/utils/ → ../../templates/<name>
  const candidates = [
    resolve(__dirname, `../templates/${template}`),
    resolve(__dirname, `../../templates/${template}`),
  ];

  for (const dir of candidates) {
    if (existsSync(dir)) return dir;
  }

  throw templateNotFoundError(template);
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

export async function listTemplateFiles(templateDir: string): Promise<string[]> {
  const entries = await readdir(templateDir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = join(templateDir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules") continue;
      const sub = await listTemplateFiles(fullPath);
      files.push(...sub.map((f) => join(entry.name, f)));
    } else if (entry.isFile() && !BINARY_EXTS.has(extname(entry.name))) {
      files.push(entry.name);
    }
  }
  return files.sort();
}

export function getPlaceholders(options: ScaffoldOptions): Record<string, string> {
  return {
    __NAME__: options.projectName,
    __DESC__: options.description ?? "",
    __AUTHOR__: options.author ?? "",
    __YEAR__: new Date().getFullYear().toString(),
  };
}

export async function renderPlaceholders(dir: string, options: ScaffoldOptions): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  const replacements = getPlaceholders(options);

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      if (entry.name === "node_modules") continue;
      files.push(...(await renderPlaceholders(fullPath, options)));
    } else if (entry.isFile()) {
      if (BINARY_EXTS.has(extname(entry.name))) continue;
      let content = await readFile(fullPath, "utf-8");
      for (const [key, value] of Object.entries(replacements)) {
        content = content.replaceAll(key, value);
      }
      await writeFile(fullPath, content, "utf-8");
      files.push(fullPath);
    }
  }

  return files;
}
