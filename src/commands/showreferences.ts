import * as vscode from "vscode";
import { IndexAdapter } from "../index/index-adapter";
import { Reference } from "../index/reference";
import { Section } from "../index/section";
import { to_vscode_Range } from "../index/vscode-adapter";
import { Command, CommandType } from "./command";

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
      this.description = vscode.workspace.asRelativePath(reference.location.uri);
    }
  }

  goto() {
    vscode.window.showTextDocument(this.reference.location.uri, {
      preserveFocus: true,
      preview: true,
      selection: to_vscode_Range(this.reference.location.range)
    });
  }
}

export class ShowReferencesCommand extends Command {
  public static readonly CommandName = "showReferences";
  constructor(private index: IndexAdapter, ctx: vscode.ExtensionContext) {
    super(ShowReferencesCommand.CommandName, ctx, CommandType.INTERNAL);
  }

  protected async perform(section: Section): Promise<any> {
    let group = this.index.index.groupFor(section.location.uri);
    let picks = group.queryReferences("ALL_FILES", { target: section }).map((r) => new ReferenceQuickPick(r));

    return await vscode.window.showQuickPick(picks, {
      onDidSelectItem: (r: ReferenceQuickPick) => r.goto()
    });
  }
}