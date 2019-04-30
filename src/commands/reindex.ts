import * as vscode from "vscode";
import { FileSystemWatcher } from "../index/crawler";
import { IndexAdapter } from "../index/index-adapter";
import { Command, CommandType } from "./command";


export class ReindexCommand extends Command {
  constructor(private index: IndexAdapter, private watcher: FileSystemWatcher, ctx: vscode.ExtensionContext) {
    super("reindex", ctx, CommandType.PALETTE);
  }

  protected async perform(): Promise<any> {
    this.index.clear();
    if (this.watcher)
      return await this.watcher.crawl();
  }
}