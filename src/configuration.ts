import * as vscode from 'vscode';

export interface TerraformIndexConfiguration {
  enabled: boolean;
  liveIndexing: boolean;
  liveIndexingDelay: number;
  exclude: string[];
}

export interface TerraformCodeLensConfiguration {
  enabled: boolean;
}

export interface TerraformTelemetryConfiguration {
  enabled: boolean;
}

export interface TerraformExecutableConfiguration {
  path: string;
  version?: string;
}

export interface TerraformConfiguration {
  formatOnSave: boolean;
  formatVarsOnSave?: boolean;
  path: string;
  paths: (string | TerraformExecutableConfiguration)[];
  templateDirectory: string;
  lintPath: string;
  lintConfig?: string;
  indexing: TerraformIndexConfiguration;
  codelens: TerraformCodeLensConfiguration;
  telemetry: TerraformTelemetryConfiguration;
}

export function getConfiguration(): TerraformConfiguration {
  let raw = vscode.workspace.getConfiguration("terraform");

  // needed for conversion
  let convertible = {
    formatOnSave: raw.formatOnSave,
    formatVarsOnSave: raw.formatVarsOnSave,
    path: raw.path,
    paths: raw.paths,
    templateDirectory: raw.templateDirectory,
    lintPath: raw.lintPath,
    lintConfig: raw.lintConfig,
    indexing: raw.indexing,
    codelens: raw.codelens,
    telemetry: raw.telemetry
  };

  return <TerraformConfiguration>convertible;
}