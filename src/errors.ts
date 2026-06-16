export class PbaseError extends Error {
  constructor(
    message: string,
    public exitCode = 1,
  ) {
    super(`[pbase] ${message}`);
    this.name = "PbaseError";
  }
}

export class DirectoryExistsError extends PbaseError {
  constructor(dir: string) {
    super(`Directory "${dir}" already exists. Use --force to overwrite.`);
  }
}

export class TemplateNotFoundError extends PbaseError {
  constructor(dir: string) {
    super(`Template directory not found at "${dir}"`);
  }
}
