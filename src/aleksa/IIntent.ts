export interface IIntent {
  name: string;
  getCallback(config): (request, response) => Promise<void>
}