
const chalk = require('chalk');
const logUpdate = require('log-update');

import { toHumanTime } from '../utils/human';

export interface ProgressBarOptions {
  width?: number;
  complete?: string;
  incomplete?: string;
  template?: (bar: string) => string;
}

// Custom, lightweight implementation of a
export class ProgressBar {

  private _progress: number;  
  private _width: number;
  private _completeChar: string;
  private _incompleteChar: string;
  private _template: (bar: string) => string;

  private _start: number;
  private _indeterminateBar: Array<string>;

  private get _remaining(): number {
    return 1 - this._progress;
  }

  private get _eta(): number {
    if (this._progress === 1) {
      return 0;
    }
    
    const elapsed = (Date.now() - this._start) / 1000;
    return Math.ceil(elapsed * this._remaining / this._progress);
  }

  constructor(options: ProgressBarOptions = {}) {
    this._progress = 0;
    this._width = options.width || 40;
    this._completeChar = options.complete || chalk.green('█');
    this._incompleteChar = options.incomplete || chalk.gray('█');
    this._template = options.template || (bar => `${bar} (${toHumanTime(this._eta)}s)`);
    this._indeterminateBar = this._createIndeterminateBar();
  }

  public tick(progress?: number) {
    this._start || (this._start = Date.now());

    this._progress = progress;
    const bar = typeof progress === 'number' ? this._renderStandardBar() : this._renderIndeterminateBar();
    const outStr = this._template(bar);

    logUpdate(outStr);
  }

  public done(): void {
    logUpdate.done();
  }

  public clear(): void {
    logUpdate.clear();
  }

  private _createIndeterminateBar(): Array<string> {
    let active = Math.floor(this._width * 0.333);
    let inactive = this._width - active;
    return Array(active).fill(this._completeChar).concat(Array(inactive).fill(this._incompleteChar));
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