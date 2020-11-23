var Midi = require('jsmidgen');

export class Event {
  value: number;
  duration: number;
}

export class Clip {
  events: Event[];
  tickLength: number;

  constructor() {
    this.events = [];
  }

  toString():string {
    let returnValue = '';

    for (var i = 0; i < this.events.length; i++) {
      returnValue += this.events[i].value + "(" + this.events[i].duration + "), ";
    }

    return returnValue;
  }
}