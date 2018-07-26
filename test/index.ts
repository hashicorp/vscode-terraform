import * as testRunner from 'vscode/lib/testrunner';

testRunner.configure({
    ui: 'tdd',
    useColors: true,
    forbidOnly: process.env.CI ? true : false
});

module.exports = testRunner;