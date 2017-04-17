import { IObservable } from 'rx';

export interface IClient {
    getCommandStream(command: string): IObservable<any>
}