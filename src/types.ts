export interface ScaffoldOptions {
  projectName: string;
  outDir?: string;
  description?: string;
  author?: string;
  force?: boolean;
  noInstall?: boolean;
  noGit?: boolean;
  template?: string;
}

export interface ScaffoldResult {
  outDir: string;
  projectName: string;
  filesCreated: number;
}
