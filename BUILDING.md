# Building

## Prerequisites

Building requires `docker` to generate the `hcl`/`hil` wrapper library. You can
install *docker* from your distributions repositories or from [docker.com](https://www.docker.com).

I personally develop on both Mac and Windows so both work perfectly fine for development.

## Getting started

- `cd vscode-terraform`
- `npm install`
- `npm run gulp`

## Developing

My preferred way of developing the plugin is in Visual Studio Code, but
you can also do everything on the commandline if you want to:

### Visual Studio Code

- Run the command *Tasks: Run Build Task* to start the compiler in watch mode (same as `npm run watch`)
- There are two debug configurations:
  - *Launch Extensions*: launches the extension in the debugger
  - *Launch Tests*: launches the tests in the debugger (results are shown in the *Debug Console*)

### On the commandline

The following steps should get you up and running:

- To start the TypeScript compiler in watch mode, run `npm run watch`
- To invoke the tests run `npm run test` (this requires at least one full build to be successful,
  as is automatically done by `npm run watch`)
- If you want to just build the everything, just run `npm run gulp`

### Gulp targets

If you have `gulp` installed globally you can also run

- `gulp` (the default target performs a full build)
- `gulp watch` (builds everything, then watches)

## Common build problems

If you get an error **Error: Cannot find module '../hcl-hil.js'** then you need to do a build, e.g. `npm run watch` (see above).
