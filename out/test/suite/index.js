"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = run;
const path = require("path");
const Mocha = require("mocha");
const glob_1 = require("glob");
async function run() {
    // Create the mocha test
    const mocha = new Mocha({
        ui: 'tdd',
        color: true
    });
    const testsRoot = path.resolve(__dirname, '..');
    try {
        // Find all test files using glob
        const files = await (0, glob_1.glob)('**/**.test.js', { cwd: testsRoot });
        // Add files to the test suite
        files.forEach(f => mocha.addFile(path.resolve(testsRoot, f)));
        // Run the mocha test
        return new Promise((c, e) => {
            mocha.run(failures => {
                if (failures > 0) {
                    e(new Error(`${failures} tests failed.`));
                }
                else {
                    c();
                }
            });
        });
    }
    catch (err) {
        console.error(err);
        throw err;
    }
}
//# sourceMappingURL=index.js.map