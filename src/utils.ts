import * as cp from 'child_process';

export function exec(cmd: string, args: readonly string[]): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    cp.execFile(cmd, args, (err, stdout, stderr) => {
      if (err) {
        return reject(err);
      }
      return resolve({ stdout, stderr });
    });
  });
}

export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// A small wrapper around setTimeout which ensures that only a single timeout
// timer can be running at a time. Attempts to add a new timeout silently fail.
export class SingleInstanceTimeout {
  private timerLock = false;
  private timerId: NodeJS.Timeout;

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  public timeout(fn, delay, ...args) {
    if (!this.timerLock) {
      this.timerLock = true;
      this.timerId = setTimeout(
        function () {
          this.timerLock = false;
          fn();
        },
        delay,
        args,
      );
    }
  }

  public clear(): void {
    if (this.timerId) {
      clearTimeout(this.timerId);
    }
    this.timerLock = false;
  }
}
