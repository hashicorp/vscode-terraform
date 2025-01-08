schema_version = 1

project {
  license = "MPL-2.0"

  # (OPTIONAL) Represents the copyright holder used in all statements
  # Default: HashiCorp, Inc.
  copyright_holder = "The OpenTofu Authors\nSPDX-License-Identifier: MPL-2.0\nCopyright (c) HashiCorp, Inc."

  # (OPTIONAL) A list of globs that should not have copyright/license headers.
  # Supports doublestar glob patterns for more flexibility in defining which
  # files or folders should be ignored
  header_ignore = [
    ".changes/**",
    ".github/ISSUE_TEMPLATE/**",
    ".vscode-test/**",
    ".wdio-vscode-service/**",
    "**/node_modules/**",
    "out/**",
    "dist/**",
    "src/test/fixtures/**",
    "src/test/integration/*/workspace/**",
  ]
}
