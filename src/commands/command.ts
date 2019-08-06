import * as uuid from "uuid/v4";
import * as vscode from "vscode";
import { Logger } from "../logger";
import { Reporter } from "../telemetry";

export enum CommandType {
  INTERNAL,
  PALETTE
}

export abstract class Command extends vscode.Disposable {
  protected trackSuccess: boolean = false;
  protected logger: Logger;
  protected eventName: string;
  protected disposables: vscode.Disposable[] = [];

  static RegisteredCommands: string[] = [];

  public static dynamicRegister(name: string, action: any) {
    vscode.commands.registerCommand(
      'terraform.' + name,
      action
    );
    this.RegisteredCommands.push('terraform.' + name);
  }

  constructor(readonly name: string, protected ctx: vscode.ExtensionContext, type: CommandType) {
    super(() => this.disposables.map(d => d.dispose()));

    this.logger = new Logger("<cmd>" + name);

    // validate command name
    if (type === CommandType.PALETTE) {
      const packageJson = require(ctx.asAbsolutePath('./package.json'));
      const commands: { command: string }[] = packageJson.contributes.commands;
      if (!commands.find((c) => c.command === this.command)) {
        throw new Error(`Cannot find ${this.command} in package.json`);
      }
    }

    this.eventName = "cmd:" + name;
    this.disposables.push(
      vscode.commands.registerCommand(
        this.command,
        (...args: any[]) => {
          return this.execute(...args);
        },
        this
      )
    );

    Command.RegisteredCommands.push(this.command);
  }

  public get command(): string {
    return "terraform." + this.name;
  }

  protected abstract perform(...args: any[]): Promise<any>;

  private async execute(...args: any[]): Promise<any> {
    const operationId = uuid();

    try {
      const start = process.hrtime();

      let result = this.perform(...args);

      const elapsed = process.hrtime(start);
      const elapsedMs = elapsed[0] * 1e3 + elapsed[1] / 1e6;

      if (this.trackSuccess) {
        this.logger.info(`Finished command, took ${elapsedMs} ms.`);
        Reporter.trackEvent(this.eventName, { operationId: operationId }, { elapsedMs: elapsedMs });
      }

      return result;
    } catch (err) {
      this.logger.exception(`Execution of command failed`, err);
      if (Reporter.enabled) {
        this.logger.error(`If you open a bugreport at https://github.com/mauve/vscode-terraform/issues, please supply this operation ID: ${operationId}`);
        Reporter.trackException(this.eventName, err, { operationId: operationId });
      }
    }
  }
}