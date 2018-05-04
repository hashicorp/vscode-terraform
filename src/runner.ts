import { getConfiguration } from "./configuration";
import { execFile } from "child_process";

export function runTerraform(args: string[], input?: string): Promise<string> {
  let path = getConfiguration().path;
  console.log(`Running terraform cwd='${process.cwd()}' path='${path}' args=[${args.join(", ")}]`);

  return new Promise<string>((resolve, reject) => {

    const child = execFile(path, args, {
      encoding: 'utf8',
      maxBuffer: 1024 * 1024,
    }, (error, stdout, stderr) => {
      if (error) {
        console.log(`Running terraform failed: ${error}: ${stderr}`);
        reject(stderr);
      } else {
        resolve(stdout);
      }
    });

    if (input) {
      child.stdin.write(input);
      child.stdin.end();
    }
  });
}