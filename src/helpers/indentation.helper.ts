export class Indentation {
    _current: number

    constructor() { this._current = 0; }

    inc(val: number = 1): void {
        this._current += val 
    }

    dec(val: number = 1): void {
        this._current -= val;

        if(val < 0) {
            val = 0;
        }
    }

    public toString(): string {
        return '\t'.repeat(this._current);
    }
}