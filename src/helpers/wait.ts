export function timeout(ms): Promise<void> {
  return new Promise<void>(resolve => setTimeout(resolve, ms));
}