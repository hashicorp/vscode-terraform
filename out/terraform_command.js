"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
function runCommand(rootPath, outputChannel, command) {
    if (rootPath) {
        outputChannel.show();
        outputChannel.appendLine(`Running terraform ${command}`);
        console.log(rootPath);
        child_process_1.exec(`terraform ${command} -no-color ${rootPath}`, (err, stdout, stderr) => {
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
exports.runCommand = runCommand;
//# sourceMappingURL=terraform_command.js.map