import * as assert from 'assert';
import * as path from 'path';

import { LanguageServerInstaller } from './languageServerInstaller';

suite('LS installer', () => {
	test('should calculate correct file sha256 sum', async () => {
		const installer = new LanguageServerInstaller;
		const expectedSum = "0314c6a66b059bde92c5ed0f11601c144cbd916eff6d1241b5b44e076e5888dc";
		const testPath = path.resolve(__dirname, "..", "testFixture", "shasum.txt");

		const sum = await installer.calculateFileSha256Sum(testPath);
		assert.strictEqual(sum, expectedSum);
	});
});
