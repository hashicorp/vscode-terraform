import * as vscode from 'vscode';
import { AstValueType, getValueType } from '../index/ast';
import { IndexGroup } from '../index/group';
import { IndexAdapter, IndexChangedEvent } from '../index/index-adapter';
import { Property } from '../index/property';
import { QueryOptions, Section } from '../index/section';

interface ModuleNode {
  type: "MODULE";
  group: IndexGroup;
}

interface SectionNode {
  type: "SECTION";
  section: Section;
}

interface PropertyNode {
  type: "PROPERTY";
  property: Property;
}

interface SectionGroupNode {
  type: "SECTION_GROUP";
  label: string;
  group: IndexGroup;
  query: QueryOptions;
}

interface LabelNode {
  type: "LABEL";
  label: string;
}

type Node = ModuleNode | SectionNode | PropertyNode | SectionGroupNode | LabelNode;

export class ModuleOverview extends vscode.Disposable implements vscode.TreeDataProvider<Node> {
  private disposables: vscode.Disposable[] = [];
  private _onDidChangeTreeData = new vscode.EventEmitter<Node>();

  constructor(private index: IndexAdapter) {
    super(() => this.dispose());

    this.disposables.push(this.index.onDidChange((e) => this.onIndexDidChange(e)));
  }

  dispose() {
    this._onDidChangeTreeData.dispose();
    this.disposables.forEach(d => d.dispose());
  }

  get onDidChangeTreeData() {
    return this._onDidChangeTreeData.event;
  }

  private onIndexDidChange(e: IndexChangedEvent) {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: Node): vscode.TreeItem {
    switch (element.type) {
      case "MODULE":
        return this.groupToTreeItem(element.group);
      case "SECTION":
        return this.sectionToTreeItem(element.section);
      case "PROPERTY":
        return this.propertyToTreeItem(element.property);
      case "SECTION_GROUP":
        return this.sectionGroupToTreeItem(element);
      case "LABEL":
        return this.labelToTreeItem(element);
    }
  }

  getChildren(element?: Node): Node[] {
    if (!element) {
      return this.index.index.groups.map(g => {
        return {
          type: "MODULE",
          group: g
        } as ModuleNode;
      });
    }

    switch (element.type) {
      case "MODULE": {
        return [
          {
            type: "LABEL",
            label: `Terraform version requirement: ${element.group.requiredVersion || "no requirement"}`
          },
          {
            type: "SECTION_GROUP",
            group: element.group,
            label: "Providers",
            query: { section_type: "provider" }
          } as SectionGroupNode,
          {
            type: "SECTION_GROUP",
            group: element.group,
            label: "Variables",
            query: { section_type: "variable" }
          } as SectionGroupNode,
          {
            type: "SECTION_GROUP",
            group: element.group,
            label: "Resources and Data",
            query: { section_type: { type: "EXACT", match: ["resource", "data"] } }
          } as SectionGroupNode,
          {
            type: "SECTION_GROUP",
            group: element.group,
            label: "Outputs",
            query: { section_type: "output" }
          } as SectionGroupNode
        ];
      }

      case "SECTION_GROUP": {
        return element.group.query("ALL_FILES", element.query).map(s => {
          return {
            type: "SECTION",
            section: s
          } as SectionNode;
        });
      }

      case "SECTION": {
        return element.section.properties.map(p => {
          return {
            type: "PROPERTY",
            property: p
          } as PropertyNode;
        });
      }

      case "PROPERTY": {
        if (typeof element.property.value === "string")
          return [];
        return element.property.value.map(p => {
          return {
            type: "PROPERTY",
            property: p
          } as PropertyNode;
        });
      }
    }
  }

  private sectionToTreeItem(section: Section): vscode.TreeItem {
    let item = {
      label: section.label,
      id: section.id(),
      collapsibleState: section.properties.length > 0 ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None
    } as vscode.TreeItem;

    if (section.sectionType === "variable") {
      let defaultProperty = section.getProperty("default");
      if (defaultProperty && getValueType(defaultProperty.node.Val) === AstValueType.String) {
        item.tooltip = `default value: ${defaultProperty.value}`;
      }
    }

    return item;
  }

  private groupToTreeItem(group: IndexGroup): vscode.TreeItem {
    // asRelativePath returns false when the tested uri is
    // the same as a workspace folder so we need to handle that
    // case separately
    const workspaceFolders = vscode.workspace.workspaceFolders || [];
    const folder = workspaceFolders.find(f => f.uri.fsPath === group.uri.fsPath);

    let label = folder ? folder.name : vscode.workspace.asRelativePath(group.uri);

    return {
      label: label,
      collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
      id: group.uri.toString(),
      iconPath: vscode.ThemeIcon.Folder
    }
  }

  private propertyToTreeItem(property: Property): vscode.TreeItem {
    if (typeof property.value === "string") {
      return {
        label: `${property.name}: ${property.value}`
      }
    } else {
      return {
        label: property.name,
        collapsibleState: vscode.TreeItemCollapsibleState.Collapsed
      }
    }
  }

  private sectionGroupToTreeItem(node: SectionGroupNode): vscode.TreeItem {
    return {
      label: node.label,
      collapsibleState: vscode.TreeItemCollapsibleState.Collapsed
    };
  }

  private labelToTreeItem(node: LabelNode): vscode.TreeItem {
    return {
      label: node.label
    };
  }
}