#!/usr/bin/env bun
import { cac } from "cac";
import { scaffold } from "./commands/scaffold";
import { PbaseError } from "./errors";

const cli = cac("pbase");

cli
  .command("[name]", "Scaffold a new project from the built-in template")
  .option("--desc <desc>", "Project description")
  .option("--author <author>", "Author name")
  .option("--force", "Overwrite existing directory")
  .option("--no-install", "Skip bun install")
  .option("--no-git", "Skip git init")
  .action(async (name?: string, options?: Record<string, unknown>) => {
    try {
      await scaffold({
        projectName: name ?? "",
        description: (options?.desc as string) ?? "",
        author: (options?.author as string) ?? "",
        force: !!options?.force,
        noInstall: !!options?.["no-install"],
        noGit: !!options?.["no-git"],
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
cli.parse();
