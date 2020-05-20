import { exec } from 'child_process';
import * as vscode from 'vscode';

export function runCommand(rootPath: string, outputChannel: vscode.OutputChannel, command: string) {
	if (rootPath) {
		outputChannel.show(true);
		outputChannel.appendLine(`Running terraform ${command}`);
		console.log(rootPath);
		exec(`terraform ${command} -no-color ${rootPath}`, (err, stdout, stderr) => {
			if (err) {
				outputChannel.appendLine(err.message);
			}
			if (stdout) {
				outputChannel.appendLine(stdout);
			}
			if (stderr) {
				outputChannel.appendLine(stderr);
			}
		});
	}
}
