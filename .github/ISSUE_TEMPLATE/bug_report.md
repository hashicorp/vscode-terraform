---
name: Bug report
about: Let us know about an unexpected error, a crash, or an incorrect behavior.
labels: bug
---

### VS Code Version
<!--
Copy this from VS Code (Help -> About -> Copy):
-->
```

```
 
### Extension Version
<!--
Copy this from the extension (Extensions Pane -> Terraform -> Manage / Settings -> Copy):
-->
```

```

### Language Server Version
<!--
Copy this from the *first* few lines of Output pane called "terraform-ls"
(View -> Output -> terraform-ls)
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
