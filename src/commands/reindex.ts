import { getConfiguration } from "../configuration";
import { indexLocator } from "../extension";
import { initialCrawl } from "../index/watcher";
import { Command } from "./command";

export class ReindexCommand extends Command {
  constructor() {
    super("reindex");
  }

  protected async perform(): Promise<any> {
    for (let index of indexLocator.allIndices(false)) {
      this.logger.info(`Clearing index: ${index.name}`);
      index.clear();
    }

    if (getConfiguration().indexing.enabled) {
      this.logger.info("Performing initial crawl.");
      return await initialCrawl(indexLocator);
    }
  }
}