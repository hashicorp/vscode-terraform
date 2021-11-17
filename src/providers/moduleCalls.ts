import * as path from 'path';
import * as vscode from 'vscode';
import { ExecuteCommandParams, ExecuteCommandRequest } from 'vscode-languageclient';
import { Utils } from 'vscode-uri';
import { ClientHandler } from '../clientHandler';
import { getActiveTextEditor } from '../vscodeUtils';

class ModuleCallItem extends vscode.TreeItem {
  constructor(
    public label: string,
    public sourceAddr: string,
    public version: string,
    public sourceType: string,
    public docsLink: string,
    public terraformIcon: string,
    public readonly children: ModuleCallItem[],
  ) {
    super(
      label,
      children.length >= 1 ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None,
    );

    this.description = this.version ? `${this.version}` : '';

    if (this.version === undefined) {
      this.tooltip = `${this.sourceAddr}`;
    } else {
      this.tooltip = `${this.sourceAddr}@${this.version}`;
    }
  }

  iconPath = this.getIcon(this.sourceType);

  getIcon(type: string) {
    switch (type) {
      case 'tfregistry':
        return {
          light: this.terraformIcon,
          dark: this.terraformIcon,
        };
      case 'local':
        return new vscode.ThemeIcon('symbol-folder');
      case 'github':
        return new vscode.ThemeIcon('github');
      case 'git':
        return new vscode.ThemeIcon('git-branch');
      default:
        return new vscode.ThemeIcon('extensions-view-icon');
    }
  }
}

export class ModuleCallsDataProvider implements vscode.TreeDataProvider<ModuleCallItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<ModuleCallItem | undefined | null | void> = new vscode.EventEmitter<
    ModuleCallItem | undefined | null | void
  >();
  readonly onDidChangeTreeData: vscode.Event<ModuleCallItem | undefined | null | void> =
    this._onDidChangeTreeData.event;

  private svg = '';

  constructor(ctx: vscode.ExtensionContext, public handler: ClientHandler) {
    this.svg = ctx.asAbsolutePath(path.join('assets', 'icons', 'terraform.svg'));
    ctx.subscriptions.push(
      vscode.commands.registerCommand('terraform.modules.refreshList', () => this.refresh()),
      vscode.commands.registerCommand('terraform.modules.openDocumentation', (module: ModuleCallItem) => {
        vscode.env.openExternal(vscode.Uri.parse(module.docsLink));
      }),
      vscode.window.onDidChangeActiveTextEditor(async (event: vscode.TextEditor | undefined) => {
        if (event && getActiveTextEditor()) {
          this.refresh();
        }
      }),
    );
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: ModuleCallItem): ModuleCallItem | Thenable<ModuleCallItem> {
    return element;
  }

  getChildren(element?: ModuleCallItem): vscode.ProviderResult<ModuleCallItem[]> {
    if (element) {
      return Promise.resolve(element.children);
    } else {
      const m = this.getModules();
      return Promise.resolve(m);
    }
  }

  async getModules(): Promise<ModuleCallItem[]> {
    const activeEditor = getActiveTextEditor();
    if (activeEditor === undefined) {
      return Promise.resolve([]);
    }

    const document = activeEditor.document;
    if (document === undefined) {
      return Promise.resolve([]);
    }

    const editor = document.uri;
    const documentURI = Utils.dirname(editor);
    const handler = this.handler.getClient();
    if (handler === undefined) {
      return [];
    }

    return await handler.client.onReady().then(async () => {
      const moduleCallsSupported = this.handler.clientSupportsCommand(
        `${handler.commandPrefix}.terraform-ls.module.calls`,
      );
      if (!moduleCallsSupported) {
        return Promise.resolve([]);
      }

      const params: ExecuteCommandParams = {
        command: `${handler.commandPrefix}.terraform-ls.module.calls`,
        arguments: [`uri=${documentURI}`],
      };

      const response = await handler.client.sendRequest(ExecuteCommandRequest.type, params);
      if (response == null) {
        return Promise.resolve([]);
      }

      const list = response.module_calls.map((m) =>
        this.toModuleCall(m.name, m.source_addr, m.version, m.source_type, m.docs_link, this.svg, m.dependent_modules),
      );

      return list;
    });
  }

  toModuleCall(
    name: string,
    sourceAddr: string,
    version: string,
    sourceType: string,
    docsLink: string,
    terraformIcon: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
    dependents: any,
  ): ModuleCallItem {
    let deps: ModuleCallItem[] = [];
    if (dependents.length != 0) {
      deps = dependents.map((dp) =>
        this.toModuleCall(
          dp.name,
          dp.source_addr,
          dp.version,
          dp.source_type,
          dp.docs_link,
          terraformIcon,
          dp.dependent_modules,
        ),
      );
    }

    return new ModuleCallItem(name, sourceAddr, version, sourceType, docsLink, terraformIcon, deps);
  }
}
