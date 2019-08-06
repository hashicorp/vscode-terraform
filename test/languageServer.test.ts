import * as assert from 'assert';
import * as vscode from 'vscode';
import { ToggleLanguageServerCommand } from '../src/commands/toggleLanguageServer';
import { getConfiguration } from '../src/configuration';
import { InstallLanguageServerCommand } from '../src/commands/installLanguageServer';
import { ExperimentalLanguageClient } from '../src/languageclient';
import { executeProvider, shouldHaveCompletion } from './completion-provider.test';

suite("Language Server", () => {
  test("Install", async () => {
    await vscode.commands.executeCommand('terraform.' + InstallLanguageServerCommand.CommandName, '18762624', githubReleaseData);
  }).timeout(100000); // Involves the download so may run long.

  test("Enable", async () => {
    await vscode.commands.executeCommand('terraform.' + ToggleLanguageServerCommand.CommandName, false);

    assert.equal(getConfiguration().languageServer.enabled, true, "Expect language server to be enabled");
    assert.equal(getConfiguration().indexing.enabled, false, "Expect indexing to be enabled");

    // Load a doc to start the server
    let doc = await vscode.workspace.openTextDocument({
      language: "terraform",
      content:
        'resource "aws_s3_bucket" "document-link-test" {\n' +
        '  bucket = "document-link-test"\n' +
        '}'
    });

    assert(ExperimentalLanguageClient.isRunning, "Expect Language Server to be running");
  }).timeout(100000);


  test("Variable completion", async () => {
    let doc = await vscode.workspace.openTextDocument({
      language: 'terraform',
      content: 'output "output" {\n' +
        '  value = var.\n' +
        '}\n' +
        'variable "variable" {}\n' +
        'resource "resource_type" "resource" {}'
    });

    let completions = await executeProvider(doc.uri, new vscode.Position(1, 15));

    assert(ExperimentalLanguageClient.isRunning, "Expect Language Server to be running");
    assert.notEqual(completions.items.length, 0, "completions should not be empty");

    assert(shouldHaveCompletion(completions, "variable"));

  }).timeout(1000);


  test("Disable", async () => {
    await vscode.commands.executeCommand('terraform.' + ToggleLanguageServerCommand.CommandName, false);

    assert.equal(getConfiguration().languageServer.enabled, false, "Expect language server to be enabled");
    assert.equal(getConfiguration().indexing.enabled, true, "Expect indexing to be enabled");

    let doc = await vscode.workspace.openTextDocument({
      language: "terraform",
      content:
        'resource "aws_s3_bucket" "document-link-test" {\n' +
        '  bucket = "document-link-test"\n' +
        '}'
    });

    assert(!ExperimentalLanguageClient.isRunning, "Expect Language Server to be stopped");
  }).timeout(10000);
});

const githubReleaseData = `[
  {
    "url": "https://api.github.com/repos/juliosueiras/terraform-lsp/releases/18762624",
    "assets_url": "https://api.github.com/repos/juliosueiras/terraform-lsp/releases/18762624/assets",
    "upload_url": "https://uploads.github.com/repos/juliosueiras/terraform-lsp/releases/18762624/assets{?name,label}",
    "html_url": "https://github.com/juliosueiras/terraform-lsp/releases/tag/v0.0.5",
    "id": 18762624,
    "node_id": "MDc6UmVsZWFzZTE4NzYyNjI0",
    "tag_name": "v0.0.5",
    "target_commitish": "master",
    "name": "v0.0.5",
    "draft": false,
    "author": {
      "login": "juliosueiras",
      "id": 3680302,
      "node_id": "MDQ6VXNlcjM2ODAzMDI=",
      "avatar_url": "https://avatars0.githubusercontent.com/u/3680302?v=4",
      "gravatar_id": "",
      "url": "https://api.github.com/users/juliosueiras",
      "html_url": "https://github.com/juliosueiras",
      "followers_url": "https://api.github.com/users/juliosueiras/followers",
      "following_url": "https://api.github.com/users/juliosueiras/following{/other_user}",
      "gists_url": "https://api.github.com/users/juliosueiras/gists{/gist_id}",
      "starred_url": "https://api.github.com/users/juliosueiras/starred{/owner}{/repo}",
      "subscriptions_url": "https://api.github.com/users/juliosueiras/subscriptions",
      "organizations_url": "https://api.github.com/users/juliosueiras/orgs",
      "repos_url": "https://api.github.com/users/juliosueiras/repos",
      "events_url": "https://api.github.com/users/juliosueiras/events{/privacy}",
      "received_events_url": "https://api.github.com/users/juliosueiras/received_events",
      "type": "User",
      "site_admin": false
    },
    "prerelease": false,
    "created_at": "2019-07-22T03:32:29Z",
    "published_at": "2019-07-22T03:50:53Z",
    "assets": [
      {
        "url": "https://api.github.com/repos/juliosueiras/terraform-lsp/releases/assets/13838525",
        "id": 13838525,
        "node_id": "MDEyOlJlbGVhc2VBc3NldDEzODM4NTI1",
        "name": "terraform-lsp_0.0.5_checksums.txt",
        "label": "",
        "uploader": {
          "login": "juliosueiras",
          "id": 3680302,
          "node_id": "MDQ6VXNlcjM2ODAzMDI=",
          "avatar_url": "https://avatars0.githubusercontent.com/u/3680302?v=4",
          "gravatar_id": "",
          "url": "https://api.github.com/users/juliosueiras",
          "html_url": "https://github.com/juliosueiras",
          "followers_url": "https://api.github.com/users/juliosueiras/followers",
          "following_url": "https://api.github.com/users/juliosueiras/following{/other_user}",
          "gists_url": "https://api.github.com/users/juliosueiras/gists{/gist_id}",
          "starred_url": "https://api.github.com/users/juliosueiras/starred{/owner}{/repo}",
          "subscriptions_url": "https://api.github.com/users/juliosueiras/subscriptions",
          "organizations_url": "https://api.github.com/users/juliosueiras/orgs",
          "repos_url": "https://api.github.com/users/juliosueiras/repos",
          "events_url": "https://api.github.com/users/juliosueiras/events{/privacy}",
          "received_events_url": "https://api.github.com/users/juliosueiras/received_events",
          "type": "User",
          "site_admin": false
        },
        "content_type": "text/plain; charset=utf-8",
        "state": "uploaded",
        "size": 318,
        "download_count": 6,
        "created_at": "2019-07-22T03:50:53Z",
        "updated_at": "2019-07-22T03:50:53Z",
        "browser_download_url": "https://github.com/juliosueiras/terraform-lsp/releases/download/v0.0.5/terraform-lsp_0.0.5_checksums.txt"
      },
      {
        "url": "https://api.github.com/repos/juliosueiras/terraform-lsp/releases/assets/13838524",
        "id": 13838524,
        "node_id": "MDEyOlJlbGVhc2VBc3NldDEzODM4NTI0",
        "name": "terraform-lsp_0.0.5_darwin_amd64.tar.gz",
        "label": "",
        "uploader": {
          "login": "juliosueiras",
          "id": 3680302,
          "node_id": "MDQ6VXNlcjM2ODAzMDI=",
          "avatar_url": "https://avatars0.githubusercontent.com/u/3680302?v=4",
          "gravatar_id": "",
          "url": "https://api.github.com/users/juliosueiras",
          "html_url": "https://github.com/juliosueiras",
          "followers_url": "https://api.github.com/users/juliosueiras/followers",
          "following_url": "https://api.github.com/users/juliosueiras/following{/other_user}",
          "gists_url": "https://api.github.com/users/juliosueiras/gists{/gist_id}",
          "starred_url": "https://api.github.com/users/juliosueiras/starred{/owner}{/repo}",
          "subscriptions_url": "https://api.github.com/users/juliosueiras/subscriptions",
          "organizations_url": "https://api.github.com/users/juliosueiras/orgs",
          "repos_url": "https://api.github.com/users/juliosueiras/repos",
          "events_url": "https://api.github.com/users/juliosueiras/events{/privacy}",
          "received_events_url": "https://api.github.com/users/juliosueiras/received_events",
          "type": "User",
          "site_admin": false
        },
        "content_type": "application/octet-stream",
        "state": "uploaded",
        "size": 7877539,
        "download_count": 90,
        "created_at": "2019-07-22T03:50:53Z",
        "updated_at": "2019-07-22T03:50:53Z",
        "browser_download_url": "https://github.com/juliosueiras/terraform-lsp/releases/download/v0.0.5/terraform-lsp_0.0.5_darwin_amd64.tar.gz"
      },
      {
        "url": "https://api.github.com/repos/juliosueiras/terraform-lsp/releases/assets/13838522",
        "id": 13838522,
        "node_id": "MDEyOlJlbGVhc2VBc3NldDEzODM4NTIy",
        "name": "terraform-lsp_0.0.5_linux_amd64.tar.gz",
        "label": "",
        "uploader": {
          "login": "juliosueiras",
          "id": 3680302,
          "node_id": "MDQ6VXNlcjM2ODAzMDI=",
          "avatar_url": "https://avatars0.githubusercontent.com/u/3680302?v=4",
          "gravatar_id": "",
          "url": "https://api.github.com/users/juliosueiras",
          "html_url": "https://github.com/juliosueiras",
          "followers_url": "https://api.github.com/users/juliosueiras/followers",
          "following_url": "https://api.github.com/users/juliosueiras/following{/other_user}",
          "gists_url": "https://api.github.com/users/juliosueiras/gists{/gist_id}",
          "starred_url": "https://api.github.com/users/juliosueiras/starred{/owner}{/repo}",
          "subscriptions_url": "https://api.github.com/users/juliosueiras/subscriptions",
          "organizations_url": "https://api.github.com/users/juliosueiras/orgs",
          "repos_url": "https://api.github.com/users/juliosueiras/repos",
          "events_url": "https://api.github.com/users/juliosueiras/events{/privacy}",
          "received_events_url": "https://api.github.com/users/juliosueiras/received_events",
          "type": "User",
          "site_admin": false
        },
        "content_type": "application/octet-stream",
        "state": "uploaded",
        "size": 7578953,
        "download_count": 139,
        "created_at": "2019-07-22T03:50:53Z",
        "updated_at": "2019-07-22T03:50:54Z",
        "browser_download_url": "https://github.com/juliosueiras/terraform-lsp/releases/download/v0.0.5/terraform-lsp_0.0.5_linux_amd64.tar.gz"
      },
      {
        "url": "https://api.github.com/repos/juliosueiras/terraform-lsp/releases/assets/13838523",
        "id": 13838523,
        "node_id": "MDEyOlJlbGVhc2VBc3NldDEzODM4NTIz",
        "name": "terraform-lsp_0.0.5_windows_amd64.tar.gz",
        "label": "",
        "uploader": {
          "login": "juliosueiras",
          "id": 3680302,
          "node_id": "MDQ6VXNlcjM2ODAzMDI=",
          "avatar_url": "https://avatars0.githubusercontent.com/u/3680302?v=4",
          "gravatar_id": "",
          "url": "https://api.github.com/users/juliosueiras",
          "html_url": "https://github.com/juliosueiras",
          "followers_url": "https://api.github.com/users/juliosueiras/followers",
          "following_url": "https://api.github.com/users/juliosueiras/following{/other_user}",
          "gists_url": "https://api.github.com/users/juliosueiras/gists{/gist_id}",
          "starred_url": "https://api.github.com/users/juliosueiras/starred{/owner}{/repo}",
          "subscriptions_url": "https://api.github.com/users/juliosueiras/subscriptions",
          "organizations_url": "https://api.github.com/users/juliosueiras/orgs",
          "repos_url": "https://api.github.com/users/juliosueiras/repos",
          "events_url": "https://api.github.com/users/juliosueiras/events{/privacy}",
          "received_events_url": "https://api.github.com/users/juliosueiras/received_events",
          "type": "User",
          "site_admin": false
        },
        "content_type": "application/octet-stream",
        "state": "uploaded",
        "size": 7517381,
        "download_count": 33,
        "created_at": "2019-07-22T03:50:53Z",
        "updated_at": "2019-07-22T03:50:54Z",
        "browser_download_url": "https://github.com/juliosueiras/terraform-lsp/releases/download/v0.0.5/terraform-lsp_0.0.5_windows_amd64.tar.gz"
      }
    ],
    "tarball_url": "https://api.github.com/repos/juliosueiras/terraform-lsp/tarball/v0.0.5",
    "zipball_url": "https://api.github.com/repos/juliosueiras/terraform-lsp/zipball/v0.0.5",
    "body": "request body"
  }
]`;