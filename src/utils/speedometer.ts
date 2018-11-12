import { toHumanSize, toHumanTime } from "./human";

interface HistoryEntry {
  timestamp: number;
  bytes: number;
}

function currentTimestamp() {
  return Date.now() / 1000;
}

export class Speedometer {
  
  private _history: HistoryEntry[];
  private _start: HistoryEntry;
  private _window: number;
    
  constructor(windowSize: number = 15000) {
    this._start = { bytes: 0, timestamp: currentTimestamp() };
    this._history = [];
    this._window = windowSize / 1000;
  }

  public get bytesPerSecond(): number {
    if (this._history.length === 0) return 0;

    const now = currentTimestamp();
    let oldestTimestamp = now - this._window;
    while (this._history.length > 0 && this._history[0].timestamp < oldestTimestamp) this._history.shift();

    const { older, newer } = this._getRange();

    return (newer.bytes - older.bytes) / (newer.timestamp - older.timestamp);
  }

  public get currentSpeed(): string {
    return `${toHumanSize(this.bytesPerSecond)}/s`;
  }

  public eta(targetBytes: number) {
    const currentSpeed = this.bytesPerSecond;
    const { newer } = this._getRange();

    const remainingBytes = targetBytes - newer.bytes;
    return remainingBytes / currentSpeed;
  }

  public record(bytes: number) {
    this._history.push({
      timestamp: currentTimestamp(),
      bytes
    });
  }

  private _getRange(): { older: HistoryEntry, newer: HistoryEntry } {
    if (this._history.length === 0) return {
      older: {
        timestamp: this._start.timestamp - 1,
        bytes: 0
      },
      newer: this._start
    };

    let older = this._history[0];
    let newer = this._history[this._history.length - 1];

    if (this._history.length === 1) {
      older = this._start;
    }

    return { older, newer };
  }
}