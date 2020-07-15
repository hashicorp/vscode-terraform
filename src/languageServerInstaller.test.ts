import { LanguageServerInstaller } from './languageServerInstaller';
import assert = require('assert');
import path = require('path');

suite('LS installer', function () {
	test('should calculate correct file sha256 sum', async () => {
		const installer = new LanguageServerInstaller;
		const expectedSum = "0314c6a66b059bde92c5ed0f11601c144cbd916eff6d1241b5b44e076e5888dc"
		let testPath = path.resolve(__dirname, "..", "src", "test", "testfile.txt")

		const sum = await installer.calculateFileSha256Sum(testPath);
		assert.strictEqual(sum, expectedSum);
	});
});
