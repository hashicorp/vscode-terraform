import * as vscode from "vscode";
import { groupQuickPick } from "../group-quickpick";
import { IndexGroup } from "../index/group";
import { IndexAdapter } from "../index/index-adapter";
import { Runner, TerraformExecutable } from "../runner";
import { Command, CommandType } from "./command";

export class PlanCommand extends Command {
  constructor(private runner: Runner, private index: IndexAdapter, ctx: vscode.ExtensionContext) {
    super("show-plan", ctx, CommandType.PALETTE);
  }

  protected async perform(...args: any[]): Promise<any> {
    let group = await groupQuickPick(this.index.index);
    if (!group)
      return;

    try {
      let executable = this.getExecutable(group);

      let definition = { type: "terraform", command: "plan" };
      let task = new vscode.Task(
        definition,
        vscode.TaskScope.Workspace,
        "terraform plan",
        "terraform",
        new vscode.ProcessExecution(executable.path, ["plan", "-input=false", "."], {
          cwd: group.uri.fsPath
        }));
      let execution = await vscode.tasks.executeTask(task);
    } catch (error) {
      await vscode.window.showErrorMessage(error.message);
    }
  }

  private getExecutable(group: IndexGroup): TerraformExecutable {
    let requirement = group.terraformSections.map(f => f.requirement).find(r => !!r);
    if (requirement) {
      let executable = this.runner.getRequiredExecutable(requirement);
      if (!executable) {
        throw new Error(`Cannot find terraform executable to satisfy requirement ${requirement.toString()}`);
      }
      return executable;
    } else {
      let executable = this.runner.defaultExecutable
      if (!executable) {
        throw new Error(`No terraform executable available`);
      }
      return executable;
    }
  }
}