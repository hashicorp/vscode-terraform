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
});