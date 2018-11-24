export interface IStatsCollector {
  /**
   * Collect response time in seconds
   * @param value how long the response took in seconds
   * @param command the command name
   */
  collectResponseTime(value: number, command: string);
}