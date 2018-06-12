# Building

## Prerequisites

Building requires docker to generate the `hcl`/`hil` wrapper library.

## Getting started

- `cd vscode-terraform`
- `npm install`
- `npm run gulp`

## Developing

### On the commandline

To start the TypeScript compiler in watch mode, run `npm run watch`

### Visual Studio Code

- Run the command *Tasks: Run Build Task* to start the compiler in watch mode (same as `npm run watch`)
- There are two debug configurations:
  - *Launch Extensions*: launches the extension in the debugger
  - *Launch Tests*: launches the tests in the debugger (results are shown in the *Debug Console*)