---
name: Bug report
about: Let us know about an unexpected error, a crash, or an incorrect behavior.
labels: bug
---

## Versions

This bug is reproducible in:
 - [ ] the **latest** version of the extension (below)
 - [ ] the **latest** version of the language server (below)

### Extension
<!--
Find this in the VS Code UI: Extensions Pane -> Installed -> HashiCorp Terraform
-->
```

```

### Language Server
<!--
Find this from the first few lines of relevant Output pane:
View -> Output -> terraform-ls
-->
```

```

### VS Code
<!--
Copy this from VS Code
 - Windows/Linux: Help -> About
 - macOS: Code -> About Visual Studio Code
-->
```

```

### Operating System
<!--
Find version and build (32-bit or 64-bit) of your OS
 - macOS: Apple logo -> About This Mac
 - Windows: right-click on Windows logo -> Settings -> Device and Windows specifications
 - Linux: `uname -a`
   - Ubuntu: `cat /etc/issue`

Also note whether you use WSL (Windows Subsystem for Linux) when on Windows.
-->
```

```

### Terraform Version
<!--
Output of `terraform version`
-->
```

```

### Steps To Reproduce
<!--
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
You can use `tree` to output ASCII-based hierarchy of your project.

If applicable, add screenshots to help explain your problem.
-->

### Expected Behavior
<!-- What should have happened? -->

### Actual Behavior
<!-- What actually happened? -->
 
### Additional context
<!--
Add any other context about the problem here.
Note whether you use any tools for managing Terraform version/execution (e.g. `tfenv`)
any credentials helpers, or whether you have any other Terraform extensions installed.
-->
