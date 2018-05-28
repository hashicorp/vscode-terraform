import * as vscode from 'vscode';
import { readBuffer } from './helpers';
import { parsePlan, terraform } from './plan-parser';
import { loadTemplate } from './template';
import { uriQuickPick } from './uri-quickpick';


function getPlanHtml(ctx: vscode.ExtensionContext, folder: vscode.WorkspaceFolder, plan: terraform.Plan): Promise<string> {
    let templatePath = ctx.asAbsolutePath('out/src/ui/plan.html');

    return loadTemplate(templatePath, {
        workspaceFolderName: folder.name,
        plan: JSON.stringify(plan, null, 2)
    });
}

export async function showPlanFileCommand(ctx: vscode.ExtensionContext, uri?: vscode.Uri): Promise<void> {
    if (!uri) {
        let uris = await vscode.workspace.findFiles("**/*.tfplan");
        if (uris.length === 0) {
            await vscode.window.showWarningMessage("No .tfplan files found");
            return;
        }

        uri = await uriQuickPick(uris, "Pick a plan file to visualize");
        if (!uri) {
            await vscode.window.showWarningMessage("No .tfplan files found");
            return;
        }
    }
    let contents = await readBuffer(uri.fsPath);
    let plan = parsePlan(contents);

    let panel = vscode.window.createWebviewPanel('terraform.plan-file', "Terraform: Plan", vscode.ViewColumn.Active, {
        enableScripts: true
    });
    panel.webview.html = await getPlanHtml(ctx, vscode.workspace.getWorkspaceFolder(uri), plan);
    panel.webview.onDidReceiveMessage((message) => {
        vscode.commands.executeCommand('terraform.navigate-to-section', {
            workspaceFolderName: message.workspaceFolderName,
            targetId: message.targetId
        });
    }, undefined, ctx.subscriptions);
}

export async function showPlanCommand(ctx: vscode.ExtensionContext): Promise<void> {
    let uris = await vscode.workspace.findFiles("**/*.tfplan");
    if (uris.length === 0) {
        await vscode.window.showWarningMessage("No .tfplan files found");
        return;
    }
}