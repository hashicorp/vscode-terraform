/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import * as assert from 'assert';
import * as vscode from 'vscode';

/*

These tests are puropsely trivial, because we don't actually have any functionality other than syntax highlighting to 'test' inside the web extension.

The main benefit to do this at all is that we have something here to run a unit test, so we can test that we can test the extension under the web host. If we add more functionality at a later date, the functionality is already present and we don't have to consult vscode docs to figure out how to add it, since it was already such a pain to adapt it to our current test harness.

In short, we are testing that we can activate under the web host. We aren't testing any functionality at this point.
*/

suite('Web Extension Test Suite', () => {
  vscode.window.showInformationMessage('Start all tests.');

  test('Sample test', () => {
    assert.strictEqual(-1, [1, 2, 3].indexOf(5));
    assert.strictEqual(-1, [1, 2, 3].indexOf(0));
  });

  test('Foo', () => {
    assert.strictEqual(-1, [1, 2, 3].indexOf(5));
    assert.strictEqual(-1, [1, 2, 3].indexOf(0));
  });
});
