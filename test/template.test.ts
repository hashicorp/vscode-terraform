import * as assert from 'assert';
import { renderTemplate } from '../src/template';

suite("Template Tests", () => {

    test("Renders template", () => {
        let template = '<html>{{title}}</html><body>{{key}}</body>';

        let result = renderTemplate(template, {
            title: 'Hello',
            key: 'Value'
        });

        assert.equal(result, '<html>Hello</html><body>Value</body>');
    });

    test("Renders template with complex variable names", () => {
        let template = '<html>{{titleOfDocument}}</html><body>{{keyName9}}</body>';

        let result = renderTemplate(template, {
            titleOfDocument: 'Hello',
            keyName9: 'Value'
        });

        assert.equal(result, '<html>Hello</html><body>Value</body>');
    });
});