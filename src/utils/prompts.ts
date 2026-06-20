import { confirm, input, select } from "@inquirer/prompts";
import { validateProjectName } from "../errors";
import { TEMPLATES } from "./fs";

export async function promptProjectName(): Promise<string> {
  return await input({
    message: "Project name:",
    validate: (v: string) => validateProjectName(v) ?? true,
  });
}

export async function promptTemplate(): Promise<string> {
  return await select({
    message: "Pick a template:",
    choices: Object.entries(TEMPLATES).map(([value, description]) => ({
      name: description,
      value,
    })),
  });
}

export async function confirmOverwrite(dir: string): Promise<boolean> {
  return await confirm({
    message: `Directory "${dir}" already exists. Overwrite?`,
    default: false,
  });
}
