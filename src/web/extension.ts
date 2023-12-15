import { ExtensionContext, Uri, commands, window, workspace } from 'vscode';
import { LanguageClient, LanguageClientOptions } from 'vscode-languageclient/node';
import { ServerOptions } from 'vscode-languageclient/node';
import { Wasm, ProcessOptions, Stdio } from '@vscode/wasm-wasi';
import { runServerProcess } from './lspServer';
require('setimmediate');

let client: LanguageClient;
const channel = window.createOutputChannel('Terraform LS');

function decodeFromSharedBuffer(decoder: TextDecoder, sharedBuffer: Uint8Array) {
  const copyLength = sharedBuffer.byteLength;

  // Create a temporary ArrayBuffer and copy the contents of the shared buffer
  // into it.
  const tempBuffer = new ArrayBuffer(copyLength);
  const tempView = new Uint8Array(tempBuffer);

  let sharedView = new Uint8Array(sharedBuffer);
  if (sharedBuffer.byteLength !== copyLength) {
    sharedView = sharedView.subarray(0, copyLength);
  }
  tempView.set(sharedView);

  return decoder.decode(tempBuffer);
}

export async function activate(context: ExtensionContext) {
  const wasm: Wasm = await Wasm.load();

  commands.registerCommand('wasm-wasi-c-example.run', async () => {
    // Create a pseudoterminal to provide stdio to the WASM process.
    const pty = wasm.createPseudoterminal();
    const terminal = window.createTerminal({
      name: 'Run C Example',
      pty,
      isTransient: true,
    });
    terminal.show(true);

    try {
      // Load the WASM module. It is stored alongside the extension's JS code.
      // So we can use VS Code's file system API to load it. Makes it
      // independent of whether the code runs in the desktop or the web.
      const bits = await workspace.fs.readFile(Uri.joinPath(context.extensionUri, 'server.wasm'));
      const module = await WebAssembly.compile(bits);
      // Create a WASM process.
      const process = await wasm.createProcess('hello', module, { stdio: pty.stdio, args: ['version'] });
      // Run the process and wait for its result.
      const result = await process.run();
      if (result !== 0) {
        await window.showErrorMessage(`Process hello ended with error: ${result}`);
      }
    } catch (error) {
      // Show an error message if something goes wrong.
      await window.showErrorMessage((error as Error).message);
    }
  });

  const serverOptions: ServerOptions = async () => {
    const stdio: Stdio = {
      in: {
        kind: 'pipeIn',
      },
      out: {
        kind: 'pipeOut',
      },
      err: {
        kind: 'pipeOut',
      },
    };

    const options: ProcessOptions = {
      stdio: stdio,
      mountPoints: [{ kind: 'workspaceFolder' }],
      trace: true,
      args: ['serve'],
    };
    const filename = Uri.joinPath(context.extensionUri, 'server.wasm');
    const bits = await workspace.fs.readFile(filename);
    const module = await WebAssembly.compile(bits);
    const process = await wasm.createProcess(
      'lsp-server',
      module,
      { initial: 160, maximum: 160, shared: true },
      options,
    );

    const decoder = new TextDecoder('utf-8');
    process.stderr!.onData((data) => {
      channel.append(decodeFromSharedBuffer(decoder, data));
    });

    return runServerProcess(process);
  };

  const clientOptions: LanguageClientOptions = {
    documentSelector: [{ language: 'terraform' }],
    outputChannel: channel,
    diagnosticCollectionName: 'markers',
  };

  client = new LanguageClient('terraform', 'Terraform Client', serverOptions, clientOptions);
  try {
    await client.start();
  } catch (error) {
    client.error(`Start failed`, error, 'force');
  }
}

export function deactivate() {
  return client.stop();
}
