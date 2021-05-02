/**
 * converts a callback function into promise
 */
export function toPromise(fn: Function): any {
  return (...args) =>
    new Promise((r, x) => {
      fn(...args, (err, ...resp: any[]) => {
        if (err) {
          x(err)
          return
        }

        r.call(this, ...resp)
      })
    })
}
