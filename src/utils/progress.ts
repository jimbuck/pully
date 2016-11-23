
const chalk = require('chalk');
const logUpdate = require('log-update');

import { toHumanTime } from '../utils/human';

export interface ProgressBarOptions<T> {
  width?: number;
  complete?: string;
  incomplete?: string;
  template?: (el: ProgressBarTickData<T>) => string;
}

export interface ProgressBarTickData<T> {
  data?: T,
  bar: string,
  eta: string,
  elapsed: string,
  speed: number
}

// Custom, lightweight implementation of a
export class ProgressBar<T> {

  private _progress: number;  
  private _width: number;
  private _completeChar: string;
  private _incompleteChar: string;
  private _template: (el: ProgressBarTickData<T>) => string;

  private _start: number;
  private _indeterminateBar: Array<string>;

  private get _remaining(): number {
    if (typeof this._progress !== 'number' || isNaN(this._progress)) {
      return 1;
    }

    return 1 - this._progress;
  }

  private get _elapsed(): number {
    return (Date.now() - this._start) / 1000;
  }

  private get _eta(): number {
    if (typeof this._progress !== 'number' || isNaN(this._progress) || this._progress === 0) {
      return null;
    }

    if (this._progress === 1) {
      return 0;
    }
    
    return Math.ceil(this._elapsed * this._remaining / this._progress);
  }

  private get _speed(): number {
    if (typeof this._progress !== 'number' || isNaN(this._progress) || this._progress === 0 || this._progress === 1) {
      return 0;
    }

    return this._progress / this._elapsed;
  }
  
  constructor(options: ProgressBarOptions<T> = {}) {
    this._progress = 0;
    this._width = options.width || 40;
    this._completeChar = options.complete || chalk.green('█');
    this._incompleteChar = options.incomplete || chalk.gray('█');
    this._template = options.template || ((el) => `${el.bar} ${el.eta}`);
    this._indeterminateBar = this._createIndeterminateBar();
  }

  public tick(progress?: number, data?: T): void {
    this._start = this._start || Date.now();

    this._progress = progress;
    const bar = typeof progress === 'number' ? this._renderStandardBar() : this._renderIndeterminateBar();
    const outStr = this._template({
      data,
      bar,
      eta: toHumanTime(this._eta),
      speed: this._speed,
      elapsed: toHumanTime(this._elapsed),
    });

    this.log(outStr);
  }

  public log(msg: string): void {
    logUpdate(msg);
  }

  public done(): void {
    logUpdate.done();
  }

  public clear(): void {
    logUpdate.clear();
  }

  private _createIndeterminateBar(): Array<string> {
    const activeWidth = Math.floor(this._width * 0.33333333);
    const inactiveWidth = this._width - activeWidth;

    return Array(activeWidth).fill(this._completeChar).concat(Array(inactiveWidth).fill(this._incompleteChar));
  }

  private _renderStandardBar(): string {
    const completeCount = Math.floor(this._progress * this._width);
    const incompleteCount = this._width - completeCount;
    
    return Array(completeCount).fill(this._completeChar).join('') + Array(incompleteCount).fill(this._incompleteChar).join('');
  }

  private _renderIndeterminateBar(): string {
    let temp = this._indeterminateBar.pop();
    this._indeterminateBar.unshift(temp);
    return this._indeterminateBar.join('');
  }
}