#!/usr/bin/env node
import { cac } from "cac";
import { scaffold } from "./commands/scaffold";
import { PbaseError } from "./errors";
import { TEMPLATES } from "./utils/fs";

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
  .action(async (name?: string, options?: Record<string, unknown>) => {
    try {
      await scaffold({
        projectName: name ?? "",
        template: (options?.template as string) ?? "",
        description: (options?.desc as string) ?? "",
        author: (options?.author as string) ?? "",
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
