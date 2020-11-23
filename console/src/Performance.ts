import { Clip, Event } from "./Clip";
import { Util } from "./Util";
import { transpose, Scale, Note } from "@tonaljs/tonal";
import { throws } from "assert";
import { runInThisContext } from "vm";

var Midi = require('jsmidgen');
var fs = require('fs');

const ticksPerBeat = 128;

export class Performance {
  name: string;
  seed: string;
  bpm: number;
  scaleName: string;
  notePool: string[];
  voiceClips: Clip[];
  controlChangeClips: Clip[];

  constructor(seed: string) {
    this.seed = seed;
    this.notePool = [];
    this.voiceClips = [];

    // Sanity check to make sure we have a long enough seed to work with
    if (this.seed.length >= 8) {
      this.Process();
    } else {
      console.log("Seed is too small. Try something else.")
    }
  }

  Process() {
    // Set the performance BPM and other temporal variables
    this.bpm = Util.map(this.GetSeedValue(1, 2), 0, 99, 63, 130);

    // Set the performance note pool
    let scaleIndex = this.GetSeedValue(3, 1);
    let rootIndex = this.GetSeedValue(4, 1);
    this.scaleName = Util.getScaleName(rootIndex, scaleIndex);
    var notes = Scale.get(this.scaleName).notes;

    for (var i = 3; i <= 5; i++) {
      for (var j = 0; j < notes.length; j++) {
        this.notePool.push(notes[j] + i);
      }
    }

    // Create a note clip and a CC clip for each digit in the seed. For a UPC code this will result in 12 clips
    this.CreateVoiceClips();
    this.CreateControlChangeClips();

    this.PrintPerformance();
    console.log("Creating MIDI file...");

    // Arrange clips into a song
    var file = this.CreateSong();

    // Render the song to disk
    fs.writeFileSync('test.mid', file.toBytes(), 'binary');
  }

  CreateSong(): any {
    var file = new Midi.File();

    // Add the instrument tracks
    for (var seedIndex = 0; seedIndex < this.seed.length; seedIndex++) {
      file.addTrack(this.CreateVoiceTrack(seedIndex));
    }

    return file;
  }

  CreateVoiceTrack(startSeedIndex: number): any {
    var track = new Midi.Track();
    var startTimeOffset = 0;
    var midiTrackNumber = startSeedIndex % 16;
    var currentSeedIndex = startSeedIndex;

    // First track gets tempo and starts at offset 0. Other track start offsets are calculated from the seed.
    if (startSeedIndex == 0) {
      track.setTempo(this.bpm);
    } else {
      startTimeOffset = this.GetSeedValue(currentSeedIndex, 1) * 32 * ticksPerBeat;
    }

    console.log("Creating MIDI track " + midiTrackNumber + " starting at tick " + startTimeOffset);

    // Select the number of clips in this track (1 to 4)
    currentSeedIndex++;
    var numberOfClips = Util.map(this.GetSeedValue(currentSeedIndex, 1), 0, 9, 1, 4);

    console.log("Track constructed from " + numberOfClips + " clips");

    for (var i = 0; i < numberOfClips; i++) {
      currentSeedIndex++;
      var clipIndex = Util.map(this.GetSeedValue(currentSeedIndex, 1), 0, 9, 0, this.clips.length - 1);
      var clip = this.voiceClips[clipIndex];

      currentSeedIndex++;
      var numberOfLoops = this.GetSeedValue(currentSeedIndex, 1);

      // Write the clip to the track the specified number of loops
      for (var j = 0; j < numberOfLoops; j++) {
        for (var k = 0; k < clip.events.length; k++) {
          track.addNote(midiTrackNumber, clip.events[k].value, clip.events[k].duration, startTimeOffset);

          if (startTimeOffset != 0) {
            startTimeOffset = 0;
          }
        }
      }
    }

    return track;
  }

  CreateControlChangeClips() {
    // Create one clip per digit in the seed
    for (var clipIndex = 0; clipIndex < this.seed.length; clipIndex++) {
      var clip = new Clip();

      // Set a pointer to the seed index and get a waveform to loop
      var currentIndex = clipIndex;
      var waveform = Util.getWavetable(this.GetSeedValue(currentIndex, 1));
      currentIndex++

      var sampleEventInterval = (this.GetSeedValue(currentIndex, 2) + 1) * ticksPerBeat;
      currentIndex++;

      var amplification = (this.GetSeedValue(currentIndex, 1) / 10) + .1;
      currentIndex++

      var numberOfLoops = Util.map(this.GetSeedValue(currentIndex, 1), 0, 9, 4, 12);
      currentIndex++;

      for (var i = 0; i < numberOfLoops; i++) {
        for (var j = 0; j < waveform.length; j++) {
          var cc = new Event();
          cc.value = waveform[j] * amplification;
          cc.duration = sampleEventInterval;
          clip.events.push(cc);
        }
      }

    // Sum waveforms

      if (clip.events.length > 0) {
        this.controlChangeClips.push(clip);
      }
    }
  }

  CreateVoiceClips() {
    // Create one clip per digit in the seed
    for (var digitIndex = 0; digitIndex < this.seed.length; digitIndex++) {
      var digit = parseInt(this.seed[digitIndex]);
      var clip = new Clip();

      // Number of notes are determined by the digit value
      for (var noteCount = 0; noteCount < digit; noteCount++) {
        var note = new Event();
        let seedIndex = (digitIndex + (noteCount + 1));
        let noteValue = this.GetSeedValue(seedIndex, 1);
        let durationValue = this.GetSeedValue(seedIndex + 1, 1);
        note.value = this.GetNotePoolNote(noteValue);
        note.duration = ticksPerBeat * durationValue;
        clip.events.push(note);
      }

      if (clip.events.length > 0) {
        this.voiceClips.push(clip);
      }
    }
  }

  PrintPerformance() {
    console.log("Name:\t\t" + this.name);
    console.log("Seed:\t\t" + this.seed);
    console.log("BPM:\t\t" + this.bpm);
    console.log("Scale:\t\t" + this.scaleName);
    console.log("Pool:\t\t" + this.notePool);

    console.log("Voice Clips:");

    for (var i = 0; i < this.voiceClips.length; i++) {
      console.log(this.voiceClips[i].toString());
    }
  }

  CreateFile(): any {
    var file = new Midi.File();
    return file;
  }

  GetNotePoolNote(index: number): number {
    index = index % this.notePool.length;
    var noteString = this.notePool[index];
    let returnValue = Note.midi(noteString);
    return returnValue;
  }

  GetSeedValue(index: number, numberOfDigits: number): number {
    let returnValue = 0;

    // Wrap around index for out of bounds requests
    index = index % this.seed.length;
    returnValue = parseInt(this.seed.substring(index, index + numberOfDigits));
    return returnValue;
  }
}