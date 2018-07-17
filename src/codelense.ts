import * as vscode from 'vscode';
import { getConfiguration } from './configuration';
import { Index } from './index';
import { IndexLocator } from './index/index-locator';
import { Section } from './index/section';
import { Logger } from './logger';
import { Reporter } from './telemetry';

export interface TerraformCodeLens {
  type: "REFERENCE" | "PLAN";
}

export class SectionReferenceCodeLens extends vscode.CodeLens implements TerraformCodeLens {
  type: "REFERENCE";

  constructor(
    private index: Index,
    range: vscode.Range,
    readonly section: Section,
    command?: vscode.Command) {
    super(range, command);
  }

  createCommand(): vscode.Command {
    let references = this.index.queryReferences("ALL_FILES", { target: this.section });

    return {
      title: `${references.length} references`,
      command: 'terraform.showReferences',
      tooltip: `Show all references to ${this.section.id}`,
      arguments: [this.section]
    } as vscode.Command;
  }
}

export class CodeLensProvider implements vscode.CodeLensProvider {
  private logger = new Logger("code-lens-provider");

  private eventEmitter = new vscode.EventEmitter<void>();
  onDidChangeCodeLenses = this.eventEmitter.event;

  constructor(private indexLocator: IndexLocator) {
    this.indexLocator.onChanged(() => {
      this.eventEmitter.fire();
    });
  }

  provideCodeLenses(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.ProviderResult<vscode.CodeLens[]> {
    try {
      let index = this.indexLocator.getIndexForDoc(document);
      let fileIndex = index.getOrIndexDocument(document, { exclude: getConfiguration().indexing.exclude });
      if (!fileIndex)
        return [];
      return fileIndex.sections.filter((s) => s.sectionType !== "provider").map((s) => {
        let firstLineOfSection = document.lineAt(s.location.range.start.line).range;
        return new SectionReferenceCodeLens(index, firstLineOfSection, s);
      });
    } catch (error) {
      this.logger.exception("Could not provide code lenses", error);
      Reporter.trackException("provideCodeLenses", error);
      return [];
    }
  }

  resolveCodeLens?(codeLens: vscode.CodeLens, token: vscode.CancellationToken): vscode.ProviderResult<vscode.CodeLens> {
    try {
      let sectionReferenceCodeLens = codeLens as SectionReferenceCodeLens;
      sectionReferenceCodeLens.command = sectionReferenceCodeLens.createCommand();
      return sectionReferenceCodeLens;
    } catch (error) {
      this.logger.exception("Could not resolve code lens", error);
      Reporter.trackException("resolveCodeLens", error);
    }
  }
}