import * as vscode from "vscode";
import { indexLocator } from "../extension";
import { Reference } from "../index/reference";
import { Section } from "../index/section";
import { to_vscode_Range } from "../index/vscode-adapter";
import { Command } from "./command";

class ReferenceQuickPick implements vscode.QuickPickItem {
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
      this.description = vscode.Uri.parse(reference.location.uri.toString()).path;
    }
  }

  goto() {
    vscode.window.showTextDocument(vscode.Uri.parse(this.reference.location.uri.toString()), {
      preserveFocus: true,
      preview: true,
      selection: to_vscode_Range(this.reference.location.range)
    });
  }
}

export class ShowReferencesCommand extends Command {
  constructor() {
    super("showReferences");
  }

  protected async perform(section: Section): Promise<any> {
    let index = indexLocator.getIndexForSection(section);
    let picks = index.queryReferences("ALL_FILES", { target: section }).map((r) => new ReferenceQuickPick(r));

    return await vscode.window.showQuickPick(picks, {
      onDidSelectItem: (r: ReferenceQuickPick) => r.goto()
    });
  }
}