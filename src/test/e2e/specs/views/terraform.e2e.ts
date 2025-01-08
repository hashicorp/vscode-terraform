// Copyright (c) The OpenTofu Authors
// SPDX-License-Identifier: MPL-2.0
// Copyright (c) HashiCorp, Inc.
// SPDX-License-Identifier: MPL-2.0
import { browser, expect } from '@wdio/globals';
import { Workbench, CustomTreeItem, SideBarView, ViewSection, ViewControl } from 'wdio-vscode-service';

import path from 'node:path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Terraform ViewContainer', function () {
  this.retries(3);
  let workbench: Workbench;

  before(async () => {
    workbench = await browser.getWorkbench();
  });

  after(async () => {
    // TODO: Close the file
  });

  it('should have terraform viewcontainer', async () => {
    const viewContainers = await workbench.getActivityBar().getViewControls();
    const titles = await Promise.all(viewContainers.map((vc) => vc.getTitle()));
    expect(titles).toContain('HashiCorp Terraform');
  });

  describe('in an terraform project', () => {
    before(async () => {
      const testFile = path.join(__dirname, '../../../', 'fixtures', `sample.tf`);
      browser.executeWorkbench((vscode, fileToOpen) => {
        vscode.commands.executeCommand('vscode.open', vscode.Uri.file(fileToOpen));
      }, testFile);
    });

    after(async () => {
      // TODO: close the file
    });

    describe('providers view', () => {
      let terraformViewContainer: ViewControl | undefined;
      let openViewContainer: SideBarView<any> | undefined;
      let callSection: ViewSection | undefined;
      let items: CustomTreeItem[];

      before(async () => {
        terraformViewContainer = await workbench.getActivityBar().getViewControl('HashiCorp Terraform');
        await terraformViewContainer?.wait();
        await terraformViewContainer?.openView();
        openViewContainer = workbench.getSideBar();
      });

      it('should have providers view', async () => {
        callSection = await openViewContainer?.getContent().getSection('PROVIDERS');
        expect(callSection).toBeDefined();
      });

      it('should include all providers', async () => {
        callSection = await openViewContainer?.getContent().getSection('PROVIDERS');

        await browser.waitUntil(
          async () => {
            const provider = await callSection?.getVisibleItems();
            if (!provider) {
              return false;
            }

            if (provider.length > 0) {
              items = provider as CustomTreeItem[];
              return true;
            }
          },
          { timeout: 3_000, timeoutMsg: 'Never found any providers' },
        );

        const labels = await Promise.all(items.map((vi) => vi.getLabel()));
        expect(labels).toEqual(['-/vault', 'hashicorp/google']);
      });
    });

    describe('calls view', () => {
      let terraformViewContainer: ViewControl | undefined;
      let openViewContainer: SideBarView<any> | undefined;
      let callSection: ViewSection | undefined;
      let items: CustomTreeItem[];

      before(async () => {
        terraformViewContainer = await workbench.getActivityBar().getViewControl('HashiCorp Terraform');
        await terraformViewContainer?.wait();
        await terraformViewContainer?.openView();
        openViewContainer = workbench.getSideBar();
      });

      it('should have module calls view', async () => {
        callSection = await openViewContainer?.getContent().getSection('MODULE CALLS');
        expect(callSection).toBeDefined();
      });

      it('should include all module calls', async () => {
        callSection = await openViewContainer?.getContent().getSection('MODULE CALLS');

        await browser.waitUntil(
          async () => {
            const calls = await callSection?.getVisibleItems();
            if (!calls) {
              return false;
            }

            if (calls.length > 0) {
              items = calls as CustomTreeItem[];
              return true;
            }
          },
          { timeout: 3_000, timeoutMsg: 'Never found any modules' },
        );

        const labels = await Promise.all(items.map((vi) => vi.getLabel()));
        expect(labels).toEqual(['compute', 'local']);
      });
    });
  });
});
