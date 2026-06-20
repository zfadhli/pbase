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
