export interface IStatsCollector {
  /**
   * Collect response time in seconds
   * @param value how long the response took in seconds
   * @param command the command name
   */
  collectResponseTime(value: number, command: string);

  /**
   * Increment number of errors
   * @param command command that failed
   */
  addError(command: string); 

  /**
   * Return the metrics to picked by a stats collector
   */
  getMetrics() : { type: string, value: any};
}