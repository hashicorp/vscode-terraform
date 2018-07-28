import * as vscode from 'vscode';
import { IndexAdapter } from './index/index-adapter';
import { Location } from './index/location';
import { Property } from './index/property';
import { Section } from './index/section';
import { Logger } from './logger';
import { Reporter } from './telemetry';

export class CodeFoldingProvider implements vscode.FoldingRangeProvider {
  private startMarker = new RegExp("^\\s*#region");
  private endMarker = new RegExp("^\\s*#endregion");
  private logger = new Logger("folding-provider");

  constructor(private index: IndexAdapter) { }

  async provideFoldingRanges(document: vscode.TextDocument): Promise<vscode.FoldingRange[]> {
    try {
      let [file, group] = await this.index.indexDocument(document);
      if (!file)
        return undefined;

      let ranges: vscode.FoldingRange[] = [];
      for (const section of file.sections) {
        ranges.push(this.sectionToRange(section));

        for (const property of section.properties) {
          const range = this.propertyToRange(property);
          if (range)
            ranges.push(range);
        }
      }

      // handle #region #endregion markers
      let regionStart = -1;
      for (let line = 0; line < document.lineCount; line++) {
        const text = document.lineAt(line);
        if (regionStart === -1) {
          if (text.text.match(this.startMarker))
            regionStart = line;
        } else {
          if (text.text.match(this.endMarker)) {
            ranges.push(new vscode.FoldingRange(regionStart, line, vscode.FoldingRangeKind.Comment));
            regionStart = -1;
          }
        }
      }
      return ranges;
    } catch (err) {
      this.logger.exception("Could not provide folding ranges", err);
      Reporter.trackException("provideFoldingRanges", err);
    }
  }

  private locationToLines(location: Location): [number, number] {
    return [location.range.start.line, location.range.end.line];
  }

  private sectionToRange(section: Section): vscode.FoldingRange {
    const [start, end] = this.locationToLines(section.location);
    return new vscode.FoldingRange(start, end, vscode.FoldingRangeKind.Region);
  }

  private propertyToRange(property: Property): vscode.FoldingRange {
    const [start, end] = this.locationToLines(property.valueLocation);
    if (start === end)
      return null;
    return new vscode.FoldingRange(start, end, vscode.FoldingRangeKind.Region);
  }
}
