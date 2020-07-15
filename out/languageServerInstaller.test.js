"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const languageServerInstaller_1 = require("./languageServerInstaller");
const assert = require("assert");
const path = require("path");
suite('LS installer', function () {
    test('should calculate correct file sha256 sum', () => __awaiter(this, void 0, void 0, function* () {
        const installer = new languageServerInstaller_1.LanguageServerInstaller;
        const expectedSum = "0314c6a66b059bde92c5ed0f11601c144cbd916eff6d1241b5b44e076e5888dc";
        let testPath = path.resolve(__dirname, "..", "src", "test", "testfile.txt");
        const sum = yield installer.calculateFileSha256Sum(testPath);
        assert.strictEqual(sum, expectedSum);
    }));
});
//# sourceMappingURL=languageServerInstaller.test.js.map