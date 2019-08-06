import * as vscode from 'vscode';

export interface TerraformIndexConfiguration {
  enabled: boolean;
  liveIndexing: boolean;
  liveIndexingDelay: number;
  exclude: string[];
}

export interface TerraformLanguageServerConfiguration {
  enabled: boolean;
  args: boolean;
  pathToBinary: string;
  installCommonProviders: boolean;
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
  path: string;
  paths: (string | TerraformExecutableConfiguration)[];
  templateDirectory: string;
  lintPath: string;
  lintConfig?: string;
  indexing: TerraformIndexConfiguration;
  languageServer: TerraformLanguageServerConfiguration;
  codelens: TerraformCodeLensConfiguration;
  telemetry: TerraformTelemetryConfiguration;
  format: TerraformFormatConfiguration;
}

export interface TerraformFormatConfiguration {
  ignoreExtensionsOnSave: string[];
}

export function getConfiguration(): TerraformConfiguration {
  let raw = vscode.workspace.getConfiguration("terraform");

  // needed for conversion
  let convertible = {
    path: raw.path,
    paths: raw.paths,
    templateDirectory: raw.templateDirectory,
    lintPath: raw.lintPath,
    lintConfig: raw.lintConfig,
    indexing: raw.indexing,
    languageServer: raw.languageServer,
    codelens: raw.codelens,
    telemetry: raw.telemetry,
    format: raw.format,
  };

  return <TerraformConfiguration>convertible;
}