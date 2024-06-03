import * as vscode from 'vscode';
import { Project } from '../../../api/terraformCloud/project';

export class ProjectItem implements vscode.QuickPickItem {
  constructor(protected project: Project) {}
  get label() {
    return this.project.attributes.name;
  }
  get description() {
    return this.project.id;
  }
}
