import express = require("express");

export interface IControllerV2 {
  readonly verb: string;
  readonly path: string;
  action(req: express.Request, res: express.Response): Promise<any>;
}