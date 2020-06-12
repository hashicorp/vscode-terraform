---
name: Bug report
about: Let us know about an unexpected error, a crash, or an incorrect behavior.
labels: bug
---

**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:

1. Go to '...'
2. Type '...'
3. See error

Include any relevant Terraform configuration or project structure:

```terraform
resource "github_repository" "test" {
  name = "vscode-terraform"
}

# etc...
```

**Expected behavior**
A clear and concise description of what you expected to happen.

**Screenshots**
If applicable, add screenshots to help explain your problem.

**VS Code version**
Copy this from VS Code (Help -> About -> Copy):

```
Version: 1.46.0 (user setup)
Commit: a5d1cc28bb5da32ec67e86cc50f84c67cc690321
Date: 2020-06-10T09:03:20.462Z
Electron: 7.3.1
Chrome: 78.0.3904.130
Node.js: 12.8.1
V8: 7.8.279.23-electron.0
OS: Windows_NT x64 10.0.19635
```
 
**Extension version**
Copy this from the extension (Extensions Pane -> Terraform -> Manage / Settings -> Copy):

```
Name: Terraform
Id: hashicorp.terraform
Description: Syntax highlighting, linting, formatting, and validation for Hashicorp's Terraform
Version: 2.0.1
Publisher: HashiCorp
VS Marketplace Link: https://marketplace.visualstudio.com/items?itemName=HashiCorp.terraform
```

**Terraform version**
Output of `terraform version`:

```
Terraform v0.12.26
+ provider.github v1.2.3
```
 
**Additional context**
Add any other context about the problem here. If you use any tools for Terraform execution (ie. `tfenv`, credentials helpers, etc, please list those as well).
