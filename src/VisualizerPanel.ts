import * as vscode from 'vscode';

export class TerraformVisualizerPanel {
  public static currentPanel: TerraformVisualizerPanel | undefined;
  private _graphData: any;

  public static get viewType(): string {
    return 'terraformVisualizer';
  }

  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];
  public static createOrShow(extensionUri: vscode.Uri, graphData: any) {
    const column = vscode.window.activeTextEditor?.viewColumn ?? vscode.ViewColumn.One;

    if (TerraformVisualizerPanel.currentPanel) {
      TerraformVisualizerPanel.currentPanel._panel.reveal(column);
      if (graphData) {
        TerraformVisualizerPanel.currentPanel._graphData = graphData;
        TerraformVisualizerPanel.currentPanel.sendData(graphData);
      }
      return;
    }

    const panel = vscode.window.createWebviewPanel(TerraformVisualizerPanel.viewType, 'Terraform Visualizer', column, {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')],
      retainContextWhenHidden: true,
    });

    TerraformVisualizerPanel.currentPanel = new TerraformVisualizerPanel(panel, extensionUri, graphData);
  }

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, graphData: any) {
    this._panel = panel;
    this._extensionUri = extensionUri;
    this._graphData = graphData;

    this._panel.webview.html = this._getHtml();

    this._panel.webview.onDidReceiveMessage(
      (message) => {
        switch (message.command) {
          case 'ready':
            console.log('Webview is ready.');
            if (this._graphData) {
              console.log('Graph data available, sending now...');
              this.sendData(this._graphData);
            } else {
              console.log('Webview ready but graph data still loading in background...');
            }
            return;
          case 'goToCode':
            void this._openEditor(message.filePath, message.line);
            return;
          case 'errorMessage':
            vscode.window.showErrorMessage(message.text);
            return;
        }
      },
      null,
      this._disposables,
    );

    this._panel.onDidDispose(
      () => {
        this.dispose();
      },
      null,
      this._disposables,
    );
  }

  public sendData(graphData: any) {
    this._graphData = graphData;
    this._panel.webview.postMessage({
      command: 'setData',
      data: graphData,
    });
  }

  private async _openEditor(filePath: string, line: number) {
    const uri = vscode.Uri.file(filePath);
    try {
      const doc = await vscode.workspace.openTextDocument(uri);
      await vscode.window.showTextDocument(doc, {
        selection: new vscode.Range(line, 0, line, 0),
        preview: true,
      });
    } catch {
      vscode.window.showErrorMessage(`Could not open file: ${filePath}`);
    }
  }

  private _getHtml() {
    const webview = this._panel.webview;
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js')).toString();
    const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.css')).toString();

    const nonce = getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <meta http-equiv="Content-Security-Policy" content="
        default-src 'none';
        script-src 'nonce-${nonce}';
        style-src ${webview.cspSource} 'unsafe-inline' https://cdn.jsdelivr.net;
        connect-src http://127.0.0.1:4318;
    ">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@xyflow/react@12.3.0/dist/style.css">
    <link rel="stylesheet" href="${styleUri}">
    <style>
        body { margin: 0; padding: 0; height: 100vh; width: 100vw; overflow: hidden; background: #1e1e1e; }
        #root { height: 100%; width: 100%; }
    </style>
</head>
<body>
    <div id="root"></div>
    <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }

  public dispose() {
    TerraformVisualizerPanel.currentPanel = undefined;
    this._panel.dispose();
    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }
}

function getNonce() {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
