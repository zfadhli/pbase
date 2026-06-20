#!/usr/bin/env node
import { execSync } from "node:child_process";
import { cac } from "cac";
import { scaffold } from "./commands/scaffold";
import { PbaseError } from "./errors";
import { TEMPLATES } from "./utils/fs";

function getDefaultAuthor(): string {
  try {
    return execSync("git config user.name", { encoding: "utf-8" }).trim();
  } catch {
    return "";
  }
}

const cli = cac("pbase");

cli
  .command("[name]", "Scaffold a new project from a built-in template")
  .option("--template <name>", `Template: ${Object.keys(TEMPLATES).join(", ")}`)
  .option("--desc <desc>", "Project description")
  .option("--author <author>", "Author name")
  .option("--force", "Overwrite existing directory")
  .option("--no-install", "Skip nub install")
  .option("--no-git", "Skip git init")
  .option("--dry-run", "Preview what would be created without writing files")
  .option("--list", "List available templates")
  .action(async (name?: string, options?: Record<string, unknown>) => {
    if (options?.list) {
      console.log("\n  Available templates:\n");
      for (const [key, desc] of Object.entries(TEMPLATES)) {
        console.log(`    ${key.padEnd(8)} ${desc}`);
      }
      console.log();
      return;
    }

    try {
      await scaffold({
        projectName: name ?? "",
        template: (options?.template as string) ?? "",
        description: (options?.desc as string) ?? "",
        author: (options?.author as string) || getDefaultAuthor(),
        force: !!options?.force,
        noInstall: !!options?.["no-install"],
        noGit: !!options?.["no-git"],
        dryRun: !!options?.dryRun,
      });
    } catch (err) {
      if (err instanceof PbaseError) {
        console.error(`\n  ${err.message}\n`);
        process.exit(err.exitCode);
      }
      throw err;
    }
  });

cli.help();
cli.version("0.0.0");
cli.parse();
