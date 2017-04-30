import { injectable } from 'inversify';
import { DiscordMessage } from '../models/discord-message';
import { IProcessManager } from '../contracts/IProcessManager';

@injectable()
export class ProcessManager implements IProcessManager {

    numCpus = 4;

    _cluster: any;
    _workers: Map<number, any>;

    _availableSet: Set<number>;
    _messageQueu: DiscordMessage[];
    _available: any[];

    constructor() {
        this._workers = new Map<number, any>();
        this._availableSet = new Set<any>();
        this._messageQueu = [];
        this._available = [];
    }

    process(msg: DiscordMessage) {
        this._messageQueu.unshift(msg);

        this.update();
    }

    start(cluster: any) {
           this._cluster = cluster;

           for (let i = 0; i < this.numCpus; i++) {
                this.startWorker();
           }

           this._cluster.on('exit', (worker, code, signal) => {
               console.log(`Worker ${worker.process.pid} died with code: ${code} and signal: ${signal}`);

               let w = this._workers[worker.process.pid];

               if (this._availableSet.has(w)) {
                   this._availableSet.delete(w);

                   let index = this._available.indexOf(w);

                   if (index >= 0) {
                       this._available = this._available.splice(index, 1);
                   }
               }

            //    this.startWorker();
           });
    }

    private startWorker(): any {
        let w = this._cluster.fork();

        this._workers.set(w.pid, w);

        console.log(`[+] Added Worker ${w.process.pid}`);

        w.on('message', (msg) => {
            if(msg.ready) {
                if (!this._availableSet.has(w)) {
                    this._available.unshift(w);
                    this._availableSet.add(w);
                }

                this.update();
            }
        })

        return w;
    }

    private get nextAvailable(): any {
        let worker = this._available.pop();

        this._availableSet.delete(worker);

        return worker;
    }

    private update() {
        if(this._available.length > 0 && this._messageQueu.length > 0) {
            this.nextAvailable.send({
                discordMessage: this._messageQueu.pop()
            });

            return;
        }
    }
}