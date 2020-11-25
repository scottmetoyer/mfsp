import { Clip, Event } from "./Clip";
import { Util } from "./Util";
import { transpose, Scale, Note } from "@tonaljs/tonal";
import { throws } from "assert";
import { runInThisContext } from "vm";

var Midi = require('jsmidgen');

const ticksPerBeat = 128;

export class Performance {
  description: string;
  seed: string;
  bpm: number;
  performanceLength: number;
  scaleName: string;
  notePool: string[];
  voiceClips: Clip[];

  constructor(description: string, seed: string) {
    this.seed = seed;
    this.description = description;
    this.notePool = [];
    this.voiceClips = [];

    // Sanity check to make sure we have a long enough seed to work with
    if (this.seed.length >= 8) {
      this.Initialize();
    } else {
      console.log("Seed is too small. Try something else.")
    }
  }

  Initialize() {
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
  }

  CreateSong(): any {
    var file = new Midi.File();
    this.performanceLength = 0;

    // Create a note clip and a CC clip for each digit in the seed. For a UPC code this will result in 12 clips
    this.CreateVoiceClips();

    // Add the instrument tracks
    for (var seedIndex = 0; seedIndex < this.seed.length; seedIndex++) {
      file.addTrack(this.CreateVoiceTrack(seedIndex));
    }

    // Add the control change tracks
    for (var seedIndex = 0; seedIndex < this.seed.length; seedIndex++) {
      file.addTrack(this.CreateControlChangeTrack(seedIndex));
    }

    return file;
  }

  CreateVoiceTrack(startSeedIndex: number): any {
    var track = new Midi.Track();
    var startTimeOffset = 0;
    var velocitySeedIndex = 0;
    var midiTrackNumber = startSeedIndex % 16;
    var currentSeedIndex = startSeedIndex;
    var trackLength = 0;

    // First track gets tempo and starts at offset 0. Other track start offsets are calculated from the seed.
    if (startSeedIndex == 0) {
      track.setTempo(this.bpm);
    } else {
      startTimeOffset = this.GetSeedValue(currentSeedIndex, 1) * 32 * ticksPerBeat;
    }
    currentSeedIndex++;
    console.log("Creating MIDI track " + midiTrackNumber + " starting at tick " + startTimeOffset);

    // Select the number of clips in this track (1 to 4)
    var numberOfClips = Util.map(this.GetSeedValue(currentSeedIndex, 1), 0, 9, 1, 6);

    // Select the track density (modifier for the interval between notes)
    var density = this.GetSeedValue(currentSeedIndex, 1) + 1;
    currentSeedIndex++;

    console.log("Track constructed from " + numberOfClips + " clips at density " + density);

    for (var i = 0; i < numberOfClips; i++) {
      var clipIndex = Util.map(this.GetSeedValue(currentSeedIndex, 1), 0, 9, 0, this.voiceClips.length - 1);
      var clip = this.voiceClips[clipIndex];
      currentSeedIndex++;

      var numberOfLoops = this.GetSeedValue(currentSeedIndex, 1) * density;

      // Write the clip to the track the specified number of loops
      for (var j = 0; j < numberOfLoops; j++) {
        for (var k = 0; k < clip.events.length; k++) {
          // Get the velocity for this added note
          var velocity = Util.map(this.GetSeedValue(velocitySeedIndex, 2), 0, 99, 48, 127);
          track.addNote(midiTrackNumber, clip.events[k].value, clip.events[k].duration / density, startTimeOffset, velocity);
          trackLength += (startTimeOffset + clip.events[k].duration);

          if (startTimeOffset != 0) {
            startTimeOffset = 0;
          }
        }
      }
    }

    if (trackLength > this.performanceLength) {
      this.performanceLength = trackLength;
    }

    return track;
  }

  CreateControlChangeTrack(startSeedIndex: number) {
    var track = new Midi.Track();
    var trackLength = 0;

    // Set a pointer to the seed index and get the number of waveforms to string together in this loop
    var currentIndex = startSeedIndex;
    var numberOfWaveforms = this.GetSeedValue(currentIndex, 1);
    currentIndex++;

    console.log("Creating control change track from " + numberOfWaveforms + " waveforms.");

    var controlChangeNumber = this.GetSeedValue(currentIndex, 1) + 1;
    currentIndex++;

    for (var i = 0; i < numberOfWaveforms; i++) {
      var waveform = Util.getWavetable(this.GetSeedValue(currentIndex, 1));
      currentIndex++

      var sampleEventInterval = Util.map(this.GetSeedValue(currentIndex, 2), 0, 99, 10, 90);
      currentIndex++;

      var numberOfLoops = Util.map(this.GetSeedValue(currentIndex, 1), 0, 9, 2, 24);
      currentIndex++;

      var amplitude = (this.GetSeedValue(currentIndex, 1) / 10) + .1;
      currentIndex++;

      for (var j = 0; j < numberOfLoops; j++) {
        // Instantly return if we have created enough CC to cover the whole performance.
        if (trackLength > this.performanceLength) {
          return track;
        }
        var amplitude = (this.GetSeedValue(currentIndex, 1) / 10) + .1;
        currentIndex++;

        var densityModifier = (this.GetSeedValue(currentIndex, 1) / 10) + .1;
        currentIndex++;

        for (var k = 0; k < waveform.length; k++) {
          track.addEvent(
            new Midi.Event({
              type: 0xB0, // Control change
              channel: startSeedIndex,
              param1: controlChangeNumber,
              param2: waveform[k] * amplitude,
              time: sampleEventInterval * densityModifier,
            })
          );

          trackLength += sampleEventInterval;
        }
      }
    }

    return track;
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

  Print() {
    console.log("Description:\t\t" + this.description);
    console.log("Seed:\t\t" + this.seed);
    console.log("BPM:\t\t" + this.bpm);
    console.log("Scale:\t\t" + this.scaleName);
    console.log("Pool:\t\t" + this.notePool);

    console.log("Voice Clips:");

    for (var i = 0; i < this.voiceClips.length; i++) {
      console.log(this.voiceClips[i].toString());
    }

    console.log("Performance is " + this.performanceLength + " ticks long.");
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