const readline = require("readline");
const fs = require('fs');
var Midi = require('jsmidgen');

import { Performance } from "./Performance";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question("Enter a performance description > ", function(description: string) {

  rl.question("Ready for scan > ", function (scan: string) {
    var performance = new Performance(description, scan);
    var file = performance.CreateSong();

    // Render the song to disk
    fs.writeFileSync(description + '.mid', file.toBytes(), 'binary');

    performance.Print();
    rl.close();
  });
});

rl.on("close", function() {
    console.log("\nEnd");
    process.exit(0);
});