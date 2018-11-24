import { IStatsCollector } from "./IStatsCollector";
import { injectable, inject } from "inversify";
import { TYPES } from "../ioc/types";
import { timeInSeconds } from "./buckets";
import * as prom from 'prom-client';

@injectable()
export class PrometheusStatsCollector implements IStatsCollector {
  hists: {[key: string]: prom.Histogram} = {};
  counters: {[key: string]: prom.Counter} = {};
  keys = {
    responseTime: 'response-time',
    error: 'error'
  };

  constructor(
    @inject(TYPES.IConfig) private _config: IConfig,
    @inject(TYPES.Logger) private _logger: ILogger,
  ) {
    this.hists[this.keys.responseTime] = new prom.Histogram({
      name: 'command_duration_seconds',
      help: 'Duration of each command in seconds',
      labelNames: ['command'],
      buckets: timeInSeconds
    });

    this.counters[this.keys.error] = new prom.Counter({
      name: 'error_count',
      help: 'number of errors',
      labelNames: ['command']
    });

    prom.collectDefaultMetrics({ timeout: 1000, prefix: 'discord_bot' });
   }

  collectResponseTime(value: number, command: string) {
    this.hists[this.keys.responseTime]
      .labels(command)
      .observe(value);
  }

  addError(command: string) {
    this.counters[this.keys.error]
      .labels(command)
      .inc();
  }
  
  getMetrics(): { type: string, value: any } {
    return {
      type: prom.register.contentType,
      value: prom.register.metrics()
    };
  }
}