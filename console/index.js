const readline = require("readline");
const fs = require('fs');
var Midi = require('jsmidgen');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question("Ready for input > ", function(input) {
  console.log(`Got some input: ${input}`);

  // Test midi creation
  var file = new Midi.File();
  var track = new Midi.Track();
  file.addTrack(track);

  track.addNote(0, 'c4', 64);
  track.addNote(0, 'd4', 64);
  track.addNote(0, 'e4', 64);
  track.addNote(0, 'f4', 64);
  track.addNote(0, 'g4', 64);
  track.addNote(0, 'a4', 64);
  track.addNote(0, 'b4', 64);
  track.addNote(0, 'c5', 64);

  fs.writeFileSync('test.mid', file.toBytes(), 'binary');
  rl.close();
});

rl.on("close", function() {
    console.log("\nEnd");
    process.exit(0);
});