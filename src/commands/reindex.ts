import { FileSystemWatcher } from "../index/crawler";
import { IndexAdapter } from "../index/index-adapter";
import { Command } from "./command";

export class ReindexCommand extends Command {
  constructor(private index: IndexAdapter, private watcher: FileSystemWatcher) {
    super("reindex");
  }

  protected async perform(): Promise<any> {
    this.index.clear();
    return await this.watcher.crawl();
  }
}