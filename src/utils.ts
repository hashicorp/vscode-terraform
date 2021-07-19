import * as cp from 'child_process';
import * as https from 'https';

export function exec(cmd: string, args: readonly string[]): Promise<{ stdout: string, stderr: string }> {
	return new Promise((resolve, reject) => {
		cp.execFile(cmd, args, (err, stdout, stderr) => {
			if (err) {
				return reject(err);
			}
			return resolve({ stdout, stderr });
		});
	});
}

export function httpsRequest(url: string, options: https.RequestOptions = {}, encoding = 'utf8'): Promise<string> {
	return new Promise((resolve, reject) => {
		https.request(url, options, res => {
			if (res.statusCode === 301 || res.statusCode === 302) { // follow redirects
				return resolve(httpsRequest(res.headers.location, options, encoding));
			}
			if (res.statusCode !== 200) {
				return reject(res.statusMessage);
			}
			let body = '';
			res.setEncoding(encoding)
				.on('data', data => body += data)
				.on('end', () => resolve(body));
		})
			.on('error', reject)
			.end();
	});
}

export async function sleep(ms: number): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, ms));
}

// A small wrapper around setTimeout which ensures that only a single timeout
// timer can be running at a time. Attempts to add a new timeout silently fail.
export class SingleInstanceTimeout {
	private timerLock = false;
	private timerId: NodeJS.Timeout;

	public timeout(fn, delay, ...args) {
		if (!this.timerLock) {
			this.timerLock = true;
			this.timerId = setTimeout(function () { this.timerLock = false; fn() }, delay, args)
		}
	}

	public clear() {
		if (this.timerId) { clearTimeout(this.timerId) }
		this.timerLock = false;
	}
}
