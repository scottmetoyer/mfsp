import { Clip, Event, ClipType } from "./Clip";
import { Util } from "./Util";
import { Note, Interval, Scale } from "@tonaljs/tonal";
import { throws } from "assert";
import { runInThisContext } from "vm";

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
    this.notePool = [];
    this.clips = [];

    // Sanity check to make sure we have a long enough seed to work with
    if (this.seed.length >= 8) {
      this.Process();
      this.PrintPerformance();
    } else {
      console.log("Seed is too small. Try something else.")
    }
  }

  Process() {
    // Set the performance BPM
    this.bpm = Util.map(this.GetSeedValue(1, 2), 0, 99, 63, 130);

    // Set the performance note pool
    let scaleIndex = this.GetSeedValue(3, 1);
    let rootIndex = this.GetSeedValue(4, 1);
    this.scaleName = Util.getScaleName(rootIndex, scaleIndex);
    this.notePool = Scale.get(this.scaleName).notes;

    // Add a rest to the note pool
    this.notePool.push("");

    // Create performance note clips. Create a clip for each digit in the seed. For a UPC code this will result in 12 clips
    for (var digitIndex = 0; digitIndex < this.seed.length; digitIndex++) {
      var digit  = parseInt(this.seed[digitIndex]);
      var clip = new Clip();

      // Number of notes are determined by the digit value
      for (var noteCount = 0; noteCount < digit; noteCount++) {
        var note = new Event();
        note.type = ClipType.Note;

        // Seed index is calculated by multiplying by the seed digit we are currently processing. This gives a nice broad
        // selection of values from the seed without introducing randomness.
        let seedIndex = (noteCount + 1) * (digit + 1);
        let noteValue = this.GetSeedValue(seedIndex, 1);
        let durationValue = this.GetSeedValue(seedIndex / 3, 1);
        note.value = this.GetNotePoolNote(noteValue);
        note.duration = 16 * durationValue;
        clip.events.push(note);
      }

      if (clip.events.length > 0) {
        this.clips.push(clip);
      }
    }

    // Create performance CC clips

    // Arrange clips into a performance

    // Render the song to disk
  }

  PrintPerformance() {
    console.log("Name:\t\t" + this.name);
    console.log("Seed:\t\t" + this.seed);
    console.log("BPM:\t\t" + this.bpm);
    console.log("Scale:\t\t" + this.scaleName);
    console.log("Pool:\t\t" + this.notePool);
    console.log("Clips:");

    for (var i = 0; i < this.clips.length; i++) {
      console.log(this.clips[i].toString());
    }
  }

  CreateFile() : any {
    var file = new Midi.File();
    return file;
  }

  GetNotePoolNote(index: number) : string {
    let returnValue = '';

    index = index % this.notePool.length;
    returnValue = this.notePool[index];

    return returnValue;
  }

  GetSeedValue(index: number, numberOfDigits: number) : number {
    let returnValue  = 0;

    // Wrap around index for out of bounds requests
    index = index % this.seed.length;
    returnValue = parseInt(this.seed.substring(index, index + numberOfDigits));
    return returnValue;
  }
}