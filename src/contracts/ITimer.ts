interface ITimer {
    start(): ITimer;
    stop(): number;

    Elapsed: number;
}