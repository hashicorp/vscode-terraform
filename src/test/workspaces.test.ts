import * as assert from 'assert';
import { getDocUri, testFolderPath, open, sendRequest } from './helper';

suite('rootmodule status', () => {
	test('returns root', async () => {
		const docUri = getDocUri('sample.tf');
		await open(docUri);
		// array will go away, currently sending to all clients
		// should only be single client for single workspace folder
		const [rootmodule] = await sendRequest({
			command: "rootmodule",
			arguments: [docUri.toString()]
		});
		assert.deepEqual(rootmodule, {
			rootmodule: testFolderPath,
			initialized: true
		});
	});
});
