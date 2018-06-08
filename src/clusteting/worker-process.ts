import { inject, injectable, Container } from 'inversify';
import { ISubject, Subject, IObservable } from 'rx';
import { IProcess } from '../contracts/IProcess.';
import { DiscordMessage } from '../models/discord-message';
import { TYPES } from "../ioc/types";

@injectable()
export class WorkerProcess implements IProcess {

    isActive: boolean = false;
    _stream: ISubject<DiscordMessage>;

    constructor(
        @inject(TYPES.Logger) private _logger: ILogger,
        @inject(TYPES.Container) private _container: Container
    ) {
        this._stream = new Subject<DiscordMessage>();
    }

    /** Send signal to master that this process is ready again */
    ready(): void {
        process.send({ ready: true });
    }

    /** Start the processor */
    start(): void {
        process.on('message', (msg) => {
            if(msg.discordMessage) {
                let dmsg = msg.discordMessage as DiscordMessage;

                this._stream.onNext(dmsg);
            }
        });

        this.isActive = true;

        let commands = this._container.getAll<ICommand>(TYPES.ICommand);
        for(let i = 0; i < commands.length; i++) {
            commands[i].attach()
        }

        this._logger.info(`[bootstrap.ts:${process.pid}] Attahed ${commands.length} command${(commands.length > 1 ? "s" : "")}`);
    }

    /** Check whether process is active i.e. multi-threading */
    get IsActive(): boolean {
        return this.isActive;
    }

    /** Get the stream for DiscordMessages coming from master process */
    get MessagesStream(): IObservable<DiscordMessage> {
        return this._stream;
    }
}