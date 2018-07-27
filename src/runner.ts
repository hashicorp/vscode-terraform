import { execFile } from "child_process";
import * as path from 'path';
import * as vscode from 'vscode';
import { stripAnsi } from './ansi';
import { getConfiguration, TerraformExecutableConfiguration } from './configuration';
import { Logger } from "./logger";
import { Reporter } from './telemetry';

export interface RunOptions {
  executable?: TerraformExecutable;
  input?: string;
  keepAnsi?: boolean;
  reportMetric?: boolean;
  cwd?: string;
}

function processOutput(output: string, options: RunOptions): string {
  if (options.keepAnsi)
    return output;
  return stripAnsi(output);
}

function execFileAsync(binaryPath): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(binaryPath, ['-version'], {
      encoding: 'utf8',
      maxBuffer: 1024 * 1024
    }, (error, stdout) => {
      if (error) {
        reject(error);
      } else {
        resolve(stdout);
      }
    });
  });
}

export interface TerraformExecutable {
  path: string;
  version: string;
}

async function getTerraformVersion(binaryPath: string): Promise<TerraformExecutable> {
  const output = await execFileAsync(binaryPath);
  const lines = output.split('\n', 1);
  if (lines.length === 0)
    return { path: binaryPath, version: null };

  const match = lines[0].match(/^Terraform v([0-9\.]+)$/);
  if (!match)
    return { path: binaryPath, version: null };

  return {
    path: binaryPath,
    version: match[1]
  }
}

export class Runner extends vscode.Disposable {
  private disposables: vscode.Disposable[] = [];
  private logger = new Logger("runner");
  public executables: TerraformExecutable[] = [];

  private constructor() {
    super(() => this.dispose());

    this.disposables.push(vscode.workspace.onDidChangeConfiguration(this.onDidChangeConfiguration));
  }

  static async create(): Promise<Runner> {
    let runner = new Runner();
    await runner.detect();
    return runner;
  }

  dispose() {
    this.disposables.forEach(d => d.dispose());
  }

  get defaultExecutable(): TerraformExecutable {
    if (this.executables.length === 0)
      return null;

    // sort by version
    const sorted = this.executables.map(e => {
      const match = e.version.match(/^([0-9]+)\.([0-9]+)\.([0-9]+)$/);
      if (!match)
        return { path: e.path, version: e.version, sort: 0 };

      const major = parseInt(match[1], 10);
      const minor = parseInt(match[2], 10);
      const micro = parseInt(match[3], 10);
      return { path: e.path, version: e.version, sort: major * 1000000 + minor * 1000 + micro }
    }).sort((left, right) => {
      if (left.sort < right.sort)
        return -1;
      if (left.sort === right.sort)
        return 0
      return 1;
    });

    // take highest
    return sorted[sorted.length - 1];
  }

  async run(options?: RunOptions, ...args: string[]): Promise<string> {
    if (!options)
      options = {};

    if (!options.executable)
      options.executable = this.defaultExecutable;

    const cwd = options.cwd || process.cwd();

    this.logger.info(`Running terraform cwd='${cwd}' path='${options.executable.path}' (version: ${options.executable.version}) args=[${args.join(", ")}]`);

    return new Promise<string>((resolve, reject) => {
      const child = execFile(options.executable.path, args, {
        encoding: 'utf8',
        maxBuffer: 1024 * 1024,
        cwd: cwd
      }, (error, stdout, stderr) => {
        if (options.reportMetric === true) {
          Reporter.trackEvent("terraform-invocation", {
            command: args[0],
            status: error ? error.name : "success"
          });
        }

        if (error) {
          const processedOutput = processOutput(stderr, options);
          this.logger.error(`Running terraform failed: ${error}`);
          reject(processedOutput);
        } else {
          this.logger.info(`Running terraform succeeded.`);
          resolve(processOutput(stdout, options));
        }
      });

      if (options.input) {
        child.stdin.write(options.input);
        child.stdin.end();
      }
    });
  }

  async detect(): Promise<void> {
    let configured = await this.checkExecutables(this.configuredExecutables());
    let found = await this.findInPath();

    this.executables = configured.concat(found);
  }

  private onDidChangeConfiguration(e: vscode.ConfigurationChangeEvent) {
    if (!e.affectsConfiguration("terraform.path"))
      return;

    if (!e.affectsConfiguration("terraform.paths"))
      return;

    this.logger.info("Configuration change detected, checking installed Terraform versions...");
    this.detect();
  }

  private configuredExecutables(): TerraformExecutableConfiguration[] {
    const cfg = getConfiguration();
    const paths = cfg.paths.map(p => {
      if (typeof p === "string")
        return { path: p };
      else
        return p;
    });

    return [{ path: cfg.path }, ...paths];
  }

  private async checkExecutables(configured: TerraformExecutableConfiguration[]): Promise<TerraformExecutable[]> {
    let result: TerraformExecutable[] = [];
    for (const c of configured) {
      let detected: TerraformExecutable;
      try {
        detected = await getTerraformVersion(c.path);
      } catch (err) {
        this.logger.warn(`Error while checking version of ${c.path}: ${err}`);
        this.logger.warn(`Ignoring configured binary '${c.path}'`);
        continue;
      }

      if (!detected.version) {
        if (c.version) {
          this.logger.warn(`Could not detect version of ${detected.path}, using configured version ${c.version}`);
          detected.version = c.version;
        } else {
          this.logger.warn(`Could not detect version of ${detected.path}`);
          detected.version = "UNKNOWN";
        }
      } else {
        if (c.version && c.version !== detected.version) {
          this.logger.warn(`Executable with path: '${c.path}', configured version ${c.version} differs from detected version ${detected.version}, using configured version`);
        }
      }

      this.logger.info(`Found Terraform binary ${detected.path} with version ${detected.version}`);
      result.push(detected);
    }

    return result;
  }

  private async findInPath(): Promise<TerraformExecutable[]> {
    const PATH: string = process.env.PATH;

    let found: TerraformExecutable[] = [];
    for (const p of PATH.split(path.delimiter)) {
      const binaryPath = path.join(p, 'terraform');
      try {
        const detected = await getTerraformVersion(binaryPath);
        if (!detected.version) {
          this.logger.warn(`Could not detect verison of ${detected.path}`);
          detected.version = "UNKNOWN";
        }
        this.logger.info(`Found Terraform binary ${detected.path} with version ${detected.version}`);
        found.push(detected);
      } catch (err) {
        if (err.code !== "ENOENT") {
          this.logger.error(`Ignoring Terraform binary ${binaryPath}: ${err}`);
        }
      }
    }
    return found;
  }
}