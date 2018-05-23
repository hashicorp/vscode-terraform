import * as vscode from 'vscode';
import { readBuffer } from './helpers';
import { parsePlan, terraform } from './plan-parser';
import { loadTemplate } from './template';


function getPlanHtml(ctx: vscode.ExtensionContext, plan: terraform.Plan): Promise<string> {
    let templatePath = ctx.asAbsolutePath('out/src/ui/show-plan.html');

    return loadTemplate(templatePath, {
        plan: JSON.stringify(plan, null, 2)
    });
}

export async function showPlanFileCommand(ctx: vscode.ExtensionContext, uri: vscode.Uri): Promise<void> {
    let contents = await readBuffer(uri.fsPath);
    let plan = parsePlan(contents);

    let panel = vscode.window.createWebviewPanel('terraform.plan-file', "Terraform: Plan", vscode.ViewColumn.Active);
    panel.webview.html = await getPlanHtml(ctx, plan);
}