# Building

## Prerequisites

Building requires `docker` to generate the `hcl`/`hil` wrapper library. You can
install *docker* from your distributions repositories or from [docker.com](https://www.docker.com).

I personally develop on both Mac and Windows so both work perfectly fine for development.

## Quick Start

- `cd vscode-terraform`
- `npm install`
- `npm install -g gulp-cli`
- `code .`
- Run default build task:
  - *Win*: `Ctrl + Shift + B`
  - *Mac*: `Cmd + Shift + B`

## Developing

My preferred way of developing the plugin is in Visual Studio Code, but you can also do everything on the command line if you want to:

### Visual Studio Code

The automatic task detection fails in Visual Studio Code if unless you have run `npm install` *before* launching *code*.

Run the following commands to get started:

- `cd vscode-terraform`
- `npm install`
- `npm install -g gulp-cli`
- `code .`

Now you can proceed as follows:

- Run the command *Tasks: Run Build Task* to start the compiler in watch mode (same as `npm run watch`)
- There are three launch/debug configurations:
  - *Launch Extensions*: launches the extension in the debugger
  - *Launch Integration Tests*: launches the integration tests in the debugger (results are shown in the *Debug Console*)
  - *Launch Unit Tests*: launches the unit tests in the debugger (results are shown in the *Debug Console*)

I am using [Mocha Sidebar](https://marketplace.visualstudio.com/items?itemName=maty.vscode-mocha-sidebar) which works okay right now. After installing it should just work.

In order to run the _Integration Tests_ you use the launch configuration *Launch Integration Tests* and launch the integration tests from inside of *vscode*.

### On the command line

Start by running:

- `npm install`
- `npm run gulp`
- `npm run watch` (runs the units)

The unit test coverage is not yet so good though as most of the tests which exist require `vscode` and therefore can only run as integration tests. Invoke them using:

- `npm run integration-test` (only works if vscode is not running)

## Common build problems

If you get an error **Error: Cannot find module '../hcl-hil.js'** then you need to do a build, e.g. `npm run watch` (see above).

## Build targets

|Target                  |Gulp invocation  |Description  |
|------------------------|-----------------|-------------|
|npm run gulp            |gulp             |Run the default build target, this is usually what you want|
|npm run watch           |gulp watch       |Watches for changes in sources and compiles|
|npm run compile         |gulp compile     |Just compiles without building the hcl/hil wrapper, used by VScode targets for a faster build|
|npm run test            |gulp test        |Runs the *unit-test*, already part of `compile`|
|npm run integration-test|*n/a*            |Runs the *integration-test*, **does not** work if Visual Studio Code is already running, this target primarily used by the CI system|

## Special building command line args

The `gulpfile.js` accepts the following extra command line arguments:

1. `--offline-build`: when supplied ignores tasks which require online access (e.g. `generate-hcl-hil.js`), this requires the output of the ignored tasks to exist for dependent tasks to succeed.
1. `--force-wrapper-generation`: `out/src/hcl-hil.js` is only generated when it does not exist (in order to speed up local building). Supplying this arg forces `hcl-hil.js` to be generated even when it already exists.
