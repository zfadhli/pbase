export class PbaseError extends Error {
  constructor(
    message: string,
    public exitCode = 1,
  ) {
    super(`[pbase] ${message}`);
    this.name = "PbaseError";
  }
}

const TEMPLATE_RE = /^[a-z][a-z0-9_-]*$/i;

export function validateTemplateName(name: string): string | null {
  if (!name) return "Template name is required";
  if (!TEMPLATE_RE.test(name)) return "Use only letters, numbers, hyphens, and underscores";
  return null;
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
