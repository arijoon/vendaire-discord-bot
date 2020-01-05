export interface IPipe<TIn, TOut> {
  process(input: TIn): Promise<TOut>;
}