import * as fs from 'fs';
import * as process from 'process';

let hcl = require('../hcl-hil.js');

if (process.argv.length < 2) {
  console.log("ERROR: Missing argument.");
} else {
  let path = process.argv[2];

  let text = fs.readFileSync(path).toString();
  let [ast, error] = hcl.parseHcl(text);
  if (error) {
    console.log("ERROR:", error);
  } else {
    process.stdout.write(JSON.stringify(ast, null, 2));
  }
}