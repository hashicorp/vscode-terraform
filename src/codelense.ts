import * as vscode from 'vscode';
import { getConfiguration } from './configuration';
import { Index } from './index/index';
import { IndexLocator } from './index/index-locator';
import { Reference } from './index/reference';
import { Section } from './index/section';

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
  private eventEmitter = new vscode.EventEmitter<void>();
  onDidChangeCodeLenses = this.eventEmitter.event;

  constructor(private indexLocator: IndexLocator) {
    this.indexLocator.onChanged(() => {
      this.eventEmitter.fire();
    });
  }

  provideCodeLenses(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.ProviderResult<vscode.CodeLens[]> {
    let index = this.indexLocator.getIndexForDoc(document);
    let fileIndex = index.getOrIndexDocument(document, { exclude: getConfiguration().indexing.exclude });
    if (!fileIndex)
      return [];
    return fileIndex.sections.filter((s) => s.sectionType !== "provider").map((s) => {
      let firstLineOfSection = document.lineAt(s.location.range.start.line).range;
      return new SectionReferenceCodeLens(index, firstLineOfSection, s);
    });
  }

  resolveCodeLens?(codeLens: vscode.CodeLens, token: vscode.CancellationToken): vscode.ProviderResult<vscode.CodeLens> {
    let sectionReferenceCodeLens = codeLens as SectionReferenceCodeLens;
    sectionReferenceCodeLens.command = sectionReferenceCodeLens.createCommand();
    return sectionReferenceCodeLens;
  }
}

export class ReferenceQuickPick implements vscode.QuickPickItem {
  readonly reference: Reference;
  readonly label: string;
  readonly description: string;
  readonly detail?: string;

  constructor(reference: Reference) {
    this.reference = reference;

    if (reference.section) {
      this.label = reference.section.id();
      this.description = reference.section.sectionType;
    } else {
      // tfvars
      this.label = "(assignment)";
      this.description = reference.location.uri.path;
    }
  }

  goto() {
    vscode.window.showTextDocument(this.reference.location.uri, {
      preserveFocus: true,
      preview: true,
      selection: this.reference.location.range
    });
  }
}

export function showReferencesCommand(index: Index, section: Section) {
  let picks = index.queryReferences("ALL_FILES", { target: section }).map((r) => new ReferenceQuickPick(r));

  vscode.window.showQuickPick(picks, {
    onDidSelectItem: (r: ReferenceQuickPick) => r.goto()
  });
}