import * as glob from 'glob';
import * as Mocha from 'mocha';
import * as path from 'path';

export function run(): Promise<void> {
    // Create the mocha test
    const mocha = new Mocha({
        ui: 'tdd',
    });
    mocha.useColors(true);

    const testsRoot = path.resolve(__dirname, '.');

    console.log("Test root is: ", testsRoot);

    return new Promise((c, e) => {
        glob('**/**.test.js', { cwd: testsRoot }, (err, files) => {
            if (err) {
                console.error("Glob failed: ", err);
                return e(err);
            }

            // Add files to the test suite
            files.forEach(f => {
                const filePath = path.resolve(testsRoot, f);
                console.log("  Adding test file: ", filePath);
                mocha.addFile(filePath);
            });

            try {
                // Run the mocha test
                console.log("Running tests...");
                mocha.run(failures => {
                    if (failures > 0) {
                        console.error(`Tests failed, number of failures: ${failures}`);
                        e(new Error(`${failures} tests failed.`));
                    } else {
                        console.log("Add tests succeeded");
                        c();
                    }
                });
            } catch (err) {
                console.error("Running tests failed with: ", err);
                e(err);
            }
        });
    });
}