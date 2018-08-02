
export interface Output {
  appendLine(line: string);
  show(preserveFocus: boolean);
}

export enum Level {
  Error,
  Warn,
  Info,
  Debug,
  Trace
}

export function configure(output: Output) {
  LoggingOutput.output = output;
}

export class Logger {
  constructor(readonly prefix: string) { }

  public exception(message: string, error: Error, ...params: any[]) {
    LoggingOutput.log(Level.Error, this.prefix, message, error, ...params);
  }

  public error(message: string, ...params: any[]) {
    LoggingOutput.log(Level.Error, this.prefix, message, ...params);
  }

  public warn(message: string, ...params: any[]) {
    LoggingOutput.log(Level.Warn, this.prefix, message, ...params);
  }

  public info(message: string, ...params: any[]) {
    LoggingOutput.log(Level.Info, this.prefix, message, ...params);
  }

  public debug(message: string, ...params: any[]) {
    LoggingOutput.log(Level.Debug, this.prefix, message, ...params);
  }

  public trace(message: string, ...params: any[]) {
    LoggingOutput.log(Level.Trace, this.prefix, message, ...params);
  }
}

const isDebuggingRegex = /^--inspect(-brk)?=?/;

class LoggingOutput {
  public static output: Output | undefined;
  private static _isDebugging: boolean | undefined;

  static log(level: Level, prefix: string, message: string, ...params: any[]) {
    const formattedPrefix = this.formatPrefix(level, prefix);
    if (this.isDebugging) {
      console.log(formattedPrefix, message, ...params);
    }

    if (!this.output) {
      return;
    }

    const lines = message.split('\n');
    for (let i = 0; i < lines.length - 1; i++)
      this.output.appendLine([formattedPrefix, lines[i]].join(" "));
    this.output.appendLine([formattedPrefix, lines[lines.length - 1], ...params].join(" "));
  }

  private static formatPrefix(level: Level, prefix: string) {
    function lvlStr(l: Level) {
      switch (l) {
        case Level.Error: return "ERROR";
        case Level.Warn: return "WARN ";
        case Level.Info: return "INFO ";
        case Level.Debug: return "DEBUG";
        case Level.Trace: return "TRACE";
      }
    }

    return `${this.timestamp} [${lvlStr(level)}] ${prefix}:`;
  }

  private static get timestamp(): string {
    const now = new Date();
    const time = now
      .toISOString()
      .replace(/T/, ' ')
      .replace(/\..+/, '');
    return `${time}:${('00' + now.getUTCMilliseconds()).slice(-3)}`;
  }

  private static get isDebugging() {
    if (this._isDebugging === undefined) {
      try {
        const args = process.execArgv;

        this._isDebugging = args ? args.some(arg => isDebuggingRegex.test(arg)) : false;
      } catch { }
    }

    return this._isDebugging;
  }
}