const readline = require("readline");
const fs = require('fs');
var Midi = require('jsmidgen');

import { Performance } from "./Performance";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question("Ready for input > ", function(input: string) {
  var performance = new Performance(input);
  var file = performance.CreateFile();
  // fs.fs.writeFileSync(performance.name + '.mid', file.toBytes(), 'binary');
  rl.close();
});

rl.on("close", function() {
    console.log("\nEnd");
    process.exit(0);
});