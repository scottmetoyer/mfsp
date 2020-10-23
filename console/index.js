const readline = require("readline");
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question("Ready for input > ", function(input) {
  console.log(`Got some input: ${input}`);
  rl.close();
});

rl.on("close", function() {
    console.log("\nEnd");
    process.exit(0);
});