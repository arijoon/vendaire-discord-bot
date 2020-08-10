import { IObservable } from 'rx';
import { IMessage } from './../contracts/IMessage';

/**
 * Create a subscription based on a function
 * @param stream command stream
 * @param callback callback function, result of promise is ignored
 */
export function makeSubscription(stream: IObservable<IMessage>
  , callback: (_: IMessage) => Promise<any>) {

    stream.subscribe(
      (imsg) => {
        callback(imsg).then(_ => {
          imsg.done();
        }).catch(err => {
          imsg.done('', err);
        });
      }
    );
}