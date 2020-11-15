import { Clip, Event } from "./Clip";
import { Util } from "./Util";
import { Note, Interval, Scale } from "@tonaljs/tonal";

var Midi = require('jsmidgen');

export class Performance {
  name: string;
  seed: string;
  bpm: number;
  scaleName: string;
  notePool: string[]
  clips: Clip[]

  constructor(seed: string) {
    this.seed = seed;

    // Sanity check to make sure we have a long enough seed to work with
    if (this.seed.length >= 8) {
      this.Process();
    } else {
      console.log("Seed is too small. Try something else.")
    }

    console.log(this.bpm);
    console.log(this.scaleName);
    console.log(this.notePool);
  }

  Process() {
    this.bpm = Util.map(this.GetSeedValue(1, 2), 0, 99, 63, 130);

    let scaleIndex = this.GetSeedValue(3, 1);
    let rootIndex = this.GetSeedValue(4, 1);
    this.scaleName = Util.getScaleName(rootIndex, scaleIndex);
    this.notePool = Scale.get(this.scaleName).notes;

    /*
    // Create a clip for each digit in the seed. For a UPC code this will result in 12 clips
    for (var digitIndex = 0; digitIndex < seed.length; digitIndex++) {
      var digit  = parseInt(seed[digitIndex]);
      var clip = new Clip();

      // Number of notes are determined by the digit value
      for (var noteCount = 0; noteCount < digit; noteCount++) {
        var note = new Event();
        let noteValue = this.GetSeedValue(this.seed, digit, 1);
        clip.events.push(note);
      }
    }

    // Create CC clips
    */
  }

  CreateFile() : any {
    var file = new Midi.File();
    return file;
  }

  GetSeedValue(index: number, numberOfDigits: number) : number {
    let returnValue  = 0;

    // Wrap around index for out of bounds requests
    index = index % this.seed.length;
    returnValue = parseInt(this.seed.substring(index, index + numberOfDigits));
    return returnValue;
  }
}