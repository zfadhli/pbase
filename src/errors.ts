export class PbaseError extends Error {
  constructor(
    message: string,
    public exitCode = 1,
  ) {
    super(`[pbase] ${message}`);
    this.name = "PbaseError";
  }
}

export function directoryExistsError(dir: string): PbaseError {
  return new PbaseError(`Directory "${dir}" already exists. Use --force to overwrite.`);
}

export function templateNotFoundError(template: string): PbaseError {
  return new PbaseError(`Template "${template}" not found.`);
}

const NAME_RE = /^[a-z0-9][a-z0-9-_.~]*$/;

export function validateProjectName(name: string): string | null {
  if (!name) return "Name is required";
  if (name.length > 214) return "Name is too long (max 214 characters)";
  if (name.includes("/")) return "Scoped names (@scope/name) are not supported";
  if (!NAME_RE.test(name))
    return "Use only lowercase letters, numbers, hyphens, dots, underscores, or tildes";
  return null;
}

export function invalidProjectNameError(name: string, reason: string): PbaseError {
  return new PbaseError(
    `Invalid project name "${name}": ${reason}. Use a lowercase npm-compatible name (e.g. my-lib).`,
  );
}
