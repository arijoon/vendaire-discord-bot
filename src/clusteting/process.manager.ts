import { injectable } from 'inversify';
import { DiscordMessage } from '../models/discord-message';
import { IProcessManager } from '../contracts/IProcessManager';

import * as os from 'os';

@injectable()
export class ProcessManager implements IProcessManager {

    numCpus: number;

    _cluster: any;
    _workers: Map<number, any>;

    _availableSet: Set<number>;
    _messageQueue: DiscordMessage[];
    _available: any[];

    constructor() {
        this._workers = new Map<number, any>();
        this._availableSet = new Set<any>();
        this._messageQueue = [];
        this._available = [];

        this.numCpus = os.cpus().length;
    }

    process(msg: DiscordMessage) {
        this._messageQueue.unshift(msg);

        this.update();
    }

    start(cluster: any) {
           this._cluster = cluster;

           console.log(`[process-manager.ts:${process.pid}] Starting master with ${this.numCpus} cores`);

           for (let i = 0; i < this.numCpus; i++) {
                this.startWorker();
           }

           this._cluster.on('exit', (worker, code, signal) => {
               console.log(`Worker ${worker.process.pid} died with code: ${code} and signal: ${signal}`);

               this.startWorker();

               let w = this._workers[worker.process.pid];

               if (this._availableSet.has(w)) {
                   this._availableSet.delete(w);

                   let index = this._available.indexOf(w);

                   if (index >= 0) {
                       this._available.splice(index, 1);
                   }
               }

           });
    }

    private startWorker(): any {
        let w = this._cluster.fork();

        this._workers.set(w.pid, w);

        console.log(`[+] Added Worker ${w.process.pid}`);

        w.on('message', (msg) => {
            if(msg.ready) {
                if (!this._availableSet.has(w)) {
                    this._available.push(w);
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
        if(this._available.length > 0 && this._messageQueue.length > 0) {
            this.nextAvailable.send({
                discordMessage: this._messageQueue.pop()
            });

            return;
        }
    }
}