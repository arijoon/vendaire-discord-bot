export interface IController {
  readonly verb: string;
  readonly path: string;
  action(...args: any[]): Promise<any>;
}