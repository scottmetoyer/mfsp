var Midi = require('jsmidgen');

export class Event {
  type: string;
  value: string;
  duration: number;
}

export class Clip {
  events: Event[];
}