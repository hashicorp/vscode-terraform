import * as assert from 'assert';
import { sendRequest } from './helper';

suite('workspaces', () => {
	test('returns workspaces', async () => {
		const workspaces = (await sendRequest()) as string[];
		assert.equal(workspaces.length, 1);
		console.log(workspaces);
	});
});
