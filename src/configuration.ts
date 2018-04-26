import * as vscode from 'vscode';

interface TerraformIndexConfiguration {
  enabled: boolean;
  liveIndexing: boolean;
  liveIndexingDelay: number;
}

interface TerraformConfiguration {
  formatOnSave: boolean;
  formatVarsOnSave?: boolean;
  path: string;
  templateDirectory: string;
  lintPath: string;
  lintConfig?: string;
  indexing: TerraformIndexConfiguration;
}

export function getConfiguration(): TerraformConfiguration {
  let raw = vscode.workspace.getConfiguration("terraform");

  // needed for conversion
  let convertible = {
    formatOnSave: raw.formatOnSave,
    formatVarsOnSave: raw.formatVarsOnSave,
    path: raw.path,
    templateDirectory: raw.templateDirectory,
    lintPath: raw.lintPath,
    lintConfig: raw.lintConfig,
    indexing: raw.indexing
  };

  return <TerraformConfiguration>convertible;
}