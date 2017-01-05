'use strict';

import * as vscode from 'vscode';
import { exec } from 'child_process';

const fullRange = doc => doc.validateRange(new vscode.Range(0, 0, Number.MAX_VALUE, Number.MAX_VALUE));

function fmt(text: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        const child = exec('terraform fmt -', {
            encoding: 'utf8',
            maxBuffer: 1024 * 1024,
        }, (error, stdout, stderr) => {
            if (error) {
                reject(stderr);
            } else {
                resolve(stdout);
            }
        });

        child.stdin.write(text);
        child.stdin.end();
    });
}

export function activate(context: vscode.ExtensionContext) {
    var onSave = vscode.workspace.onDidSaveTextDocument((document: vscode.TextDocument) => {
        if (document.languageId !== 'terraform') {
            return;
        }

        let terraformConfig = vscode.workspace.getConfiguration('terraform');
        let textEditor = vscode.window.activeTextEditor;

        if (terraformConfig['formatOnSave'] && textEditor.document === document) {
            const range = fullRange(document);

            fmt(document.getText())
                .then((formattedText) => {
                    textEditor.edit((editor) => {
                        editor.replace(range, formattedText);
                    });

                    // sometimes the selections persistes if multiple lines are removed
                    textEditor.selections.length = 0;
                })
                .catch((e) => {
                    vscode.window.showErrorMessage(e);
                });
        }
    });

    context.subscriptions.push(onSave);
}
