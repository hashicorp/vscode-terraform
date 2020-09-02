import * as Mocha from 'mocha';
import { exec } from '../utils';

Mocha.before(async () => {
	try {
		const cwd = process.cwd();
		process.chdir('testFixture');
		const {stdout, stderr} = await exec('terraform init -no-color');
		console.log(stdout);
		console.log(stderr);
		process.chdir(cwd);
	} catch (err) {
		console.error(err);
		throw err;
	}
});
