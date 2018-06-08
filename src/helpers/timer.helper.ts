export class Timer implements ITimer {

    private _start: number;
    private _elapsed: number;
    private _hasStopped: boolean;

    get Elapsed(): number {
        if (this._hasStopped)
            return this._elapsed;

        return Date.now() - this._start;
    }

    start(): ITimer {
        this._start = Date.now();

        return this;
    }

    stop(): number {
        this._elapsed = Date.now() - this._start;
        this._hasStopped = true;

        return this._elapsed;
    }


}