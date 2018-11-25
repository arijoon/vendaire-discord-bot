import { IControllerV2 } from './../IControllerV2';
import * as e from 'express';

export class LoginController implements IControllerV2 {
  verb: string;  path: string;
  action(req: e.Request, res: e.Response) :Promise<any> {
       throw new Error("Method not implemented.");
  }
}