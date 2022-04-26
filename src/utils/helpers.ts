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
