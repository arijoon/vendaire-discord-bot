import { IController } from "../IController";
import { verbs } from "./verbs";
import { TYPES } from '../../ioc/types';
import { inject } from "inversify";
import { IStatsCollector } from "../../diagnostics";

export class MetricController implements IController {
  readonly verb: string = verbs.get;
  readonly path: string = '/metrics';

  constructor(
    @inject(TYPES.StatsCollector) private _statsCollector: IStatsCollector,
    @inject(TYPES.Logger) private _logger: ILogger,
  ) { }

  async action(_): Promise<any> {
    const metrics = this._statsCollector.getMetrics();
    return {
      type: metrics.type,
      result: metrics.value
    };
  }
}