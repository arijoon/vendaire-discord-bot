import express = require("express");

export interface IControllerV2 {
  readonly actions: IEndpoint[];
}

export interface IEndpoint {
  readonly verb: string;
  readonly path: string;
  readonly middlewares?: any[];
  action(req: express.Request, res: express.Response): Promise<any>;
}