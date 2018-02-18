import { IDisposable } from 'rx';

/** Queues tasks and only perform them once every x seconds */
export class  TimerQueue {

    private _timeout: number;
    private _tasks: Map<IDisposable, Function>;
    private _queue: IDisposable[];
    private _busy = false;

    constructor(timeout: number = 1000) {
        this._timeout = timeout;
        this._tasks = new Map<IDisposable, Function>();
    }

    doTask(task: () => void) {
        if(!this._busy) {
            this._busy = true;
            task();

            setTimeout(() => this.update(), this._timeout);
            return;
        } 

        // TODO remove disposal task and remove from map in update
        let d = new DisposableTask(() => this._tasks.delete(d));

        this._tasks.set(d, task);
        this._queue.unshift(d);
    }

    setNewTimeout(timeout: number) {
        this._timeout = timeout;
    }

    private update() {
        if(this._tasks.size > 0) {
            let d = this._queue.pop();

            this._tasks.get(d)(); // execute the task
            d.dispose(); // run disposal

            setTimeout(() => this.update(), this._timeout);

            return;
        } 

        this._busy = false;

    }
}

class DisposableTask implements IDisposable {
    private _onDispose;
    constructor(onDispose: () => void) {
        this._onDispose = onDispose;
    }

    dispose(): void {
        this._onDispose();
    }
}