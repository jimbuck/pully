
const chalk = require('chalk');
const logUpdate = require('log-update');

const EMPTY_STRING = '';

export interface ProgressBarOptions<T> {
  windowSize?: number;
  width?: number;
  complete?: string;
  incomplete?: string;
  template?: (el: ProgressBarTickData<T>) => string;
}

export interface ProgressBarTickData<T> {
  data?: T,
  bar: string
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

  
  constructor(options: ProgressBarOptions<T> = {}) {
    this._progress = 0;
    this._width = options.width || 40;
    this._completeChar = options.complete || chalk.green('█');
    this._incompleteChar = options.incomplete || chalk.gray('█');
    this._template = options.template || ((el) => `${el.bar}`);
    this._indeterminateBar = this._createIndeterminateBar();
  }

  public tick(progress?: number, data?: T): void {
    const now = Date.now();
    this._start = this._start || now;

    
    this._progress = progress;
    const bar = typeof progress === 'number' ? this._renderStandardBar() : this._renderIndeterminateBar();
    const outStr = this._template({ data, bar });

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
    const activeWidth = Math.floor(this._width * (1/3));
    const inactiveWidth = this._width - activeWidth;

    return Array(activeWidth).fill(this._completeChar).concat(Array(inactiveWidth).fill(this._incompleteChar));
  }

  private _renderStandardBar(): string {
    const completeCount = Math.floor(this._progress * this._width);
    const incompleteCount = this._width - completeCount;
    
    return Array(completeCount).fill(this._completeChar).join(EMPTY_STRING)
      + Array(incompleteCount).fill(this._incompleteChar).join(EMPTY_STRING);
  }

  private _renderIndeterminateBar(): string {
    let temp = this._indeterminateBar.pop();
    this._indeterminateBar.unshift(temp);
    return this._indeterminateBar.join(EMPTY_STRING);
  }
}