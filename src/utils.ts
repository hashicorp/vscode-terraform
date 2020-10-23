import * as cp from 'child_process';
import * as https from 'https';

export function exec(cmd: string): Promise<{ stdout: string, stderr: string }> {
	return new Promise((resolve, reject) => {
		cp.exec(cmd, (err, stdout, stderr) => {
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
