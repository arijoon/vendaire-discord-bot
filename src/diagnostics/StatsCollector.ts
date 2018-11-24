import { IStatsCollector } from "./IStatsCollector";
import { injectable, inject } from "inversify";
import { TYPES } from "../ioc/types";
import { timeInSeconds } from "./buckets";

import * as prom from 'prom-client';
import { stringify } from "querystring";

@injectable()
export class PrometheusStatsCollector implements IStatsCollector {
  hists: {[key: string]: prom.Histogram} = {};
  keys = {
    responseTime: 'response-time'
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
   }

  collectResponseTime(value: number, command: string) {
    this.hists[this.keys.responseTime]
      .labels(command)
      .observe(value);
  }
  
  getMetrics(): { type: string, value: any } {
    return {
      type: prom.register.contentType,
      value: prom.register.metrics()
    };
  }
}