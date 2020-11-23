export class Util {
  static map (value: number, in_min: number, in_max: number, out_min:number, out_max:number) : number {
    return Math.trunc( (value - in_min) * (out_max - out_min) / (in_max - in_min) + out_min );
  }

  static getScaleName(rootIndex: number, scaleIndex: number) {
    let notes = [
      "C", "D", "E", "F", "F#", "A"
    ];

    let scales = [
      "dorian",
      "phrygian",
      "aeolian",
      "locrian pentatonic",
      "minor pentatonic",
      "minor hexatonic"
    ];

    // Wrap around indexes for out of bounds requests
    rootIndex = rootIndex % notes.length;
    scaleIndex = scaleIndex % scales.length;
    let scale = notes[rootIndex] + " " + scales[scaleIndex];
    return scale;
  }
}