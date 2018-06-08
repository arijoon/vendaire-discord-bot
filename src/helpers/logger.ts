import * as stackTrace from 'stack-trace';

export class Logger implements ILogger {

  constructor(private _output: { log, error } = console) {
  }

  public info(msg: any, ...args: any[]) {
    const trace = stackTrace.get()[1];

    const info = this.serialiseTrace(trace, msg);
    this._output.log(info, ...args);
  }  
  
  public error(msg: any, ...args: any[]) {
    const err = args.filter(a => a instanceof Error);
    const trace = err && err.length > 0
      ? stackTrace.parse(err[0])[0]
      : stackTrace.get()[1];

    const info = this.serialiseTrace(trace, msg);
    this._output.error(info, ...args);
  }

  private serialiseTrace(trace: any, msg: any) : any {
    const filePath = trace.getFileName().split(/\/|\\/);
    const filename = filePath[filePath.length-1];
    const funcName = trace.getFunctionName() || trace.getMethodName();
    const typeName = trace.getTypeName();
    const lineNumber = trace.getLineNumber();

    return `[${process.pid}, ${filename}:${lineNumber}, ${funcName ? funcName + ", ": ""}${typeName}]: ${msg}`
  }
}