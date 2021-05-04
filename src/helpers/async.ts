/**
 * Creates a lock that can be aquired, nested aquiring can cause a deadlock
 */
export function lock() {
  const lst: Promise<any>[] = []

  return {
    aquire: async function <T>(fn: () => Promise<T>): Promise<T> {
      let resolve
      const task = new Promise((r, x) => {
        resolve = r
      })

      const wait = [...lst]
      lst.push(task)
      if (wait.length > 0) {
        await Promise.all(wait)
      } 

      try {
        return await fn()
      } finally {
        resolve()
        lst.pop()
      }
    }
  }
}