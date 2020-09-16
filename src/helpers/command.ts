import { IObservable } from 'rx';
import { IMessage } from './../contracts/IMessage';

/**
 * Create a subscription based on a function
 * @param stream command stream
 * @param callback callback function, result of promise is ignored
 */
export function makeSubscription(stream: IObservable<IMessage>
  , callback: (_: IMessage) => Promise<any>,) {

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

export function withDependencies(dependencies: IDependency[], cache: IBasicCache,
  callback: (_: IMessage) => Promise<any>,): (_: IMessage) => Promise<any> {
  return (imsg: IMessage) => {
    const cb = Promise.all(dependencies.map(async d => {
      const key = depKeyMaker(d.getName())
      if (await cache.has(key))
        return Promise.resolve()

      return d.poll()
        .then(() => cache.set(key, "", 60 * 5))
        .catch(() => {
          throw d.getName()
        })
    }))
      .then(() => callback(imsg))

      cb.catch((err) => imsg.send(`Dependent service ${err} unavailable`))

      return cb;
  }
}

function depKeyMaker(name: string) {
  return `DEPENEDNCY:${name}`;
 }