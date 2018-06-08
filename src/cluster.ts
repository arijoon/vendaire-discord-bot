import 'reflect-metadata';
import './extensions/index';
import { IProcessManager } from './contracts';
import { ProcessManager } from './clusteting/process.manager';
import { Master } from './clusteting/master-process';
import { IProcess } from './contracts';
import { WorkerProcess } from './clusteting/worker-process';
import { container } from './ioc/container';
import { TYPES } from './ioc/types';

declare let require: any;

let cluster = require('cluster');

if (cluster.isMaster) {
    container.bind<IProcessManager>(TYPES.IProcessManager).to(ProcessManager).inSingletonScope();

    let master = container.resolve(Master);
    master.start(cluster);

} else {

    container.bind<IProcess>(TYPES.IProcess).to(WorkerProcess).inSingletonScope();

    let process = container.get<IProcess>(TYPES.IProcess);
    process.start();
}
