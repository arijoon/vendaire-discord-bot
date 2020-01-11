import { MiddleWares } from './../middlewares';
import { IClient } from './../../contracts/IClient';
import { IControllerV2 } from './../IControllerV2';
import * as e from 'express';
import { injectable, inject } from 'inversify';
import { verbs } from '../controllers/verbs';
import { TYPES } from '../../ioc/types';
import { getSession } from '../http-utils';
import * as path from 'path';
import * as multer from 'multer';
import { commands } from '../../static';
import { readbleFromBuffer, fromImageRoot, checkFolder } from '../../helpers';

const prefix = "/api";

@injectable()
export class ApiController implements IControllerV2 {
  constructor(
    @inject(TYPES.Logger) private _logger: ILogger,
    @inject(TYPES.IConfig) private _config: IConfig,
    @inject(TYPES.IClient) private _client: IClient,
    @inject(TYPES.MiddleWares) private _m: MiddleWares,
    @inject(TYPES.IFiles) private _filesService: IFiles,
  ) { }

  get actions(){
    return [
      {
        verb: verbs.get,
        path: `${prefix}/username`,
        action: async (req: e.Request, res: e.Response): Promise<any> => {
          const session: ISession = getSession(req);
          const username = await this._client.getUserName(session.user);

          res.send({ username });
        }
      },
      {
        verb: verbs.get,
        path: `${prefix}/folders`,
        action: async (req: e.Request, res: e.Response): Promise<any> => {
          // extract image root into a separate service in future
          const rootimgs = path.join(this._config.images["root"], commands.randomPic)
          const folders = await this._filesService.getAllFolders(rootimgs);

          res.send({ folders });
        }
      },
      {
        verb: verbs.post,
        path: `${prefix}/upload-files`,
        middlewares: [multer({
          storage: multer.memoryStorage(),
          limits: { fileSize: 1024 * 1024 * 4, files: 10 }
        }).any()],
        action: async (req: e.Request, res: e.Response): Promise<any> => {
          const session: ISession = getSession(req);
          const username = await this._client.getUserName(session.user);
          const files = (<any>req).files
          const folderName = req.body.folderName;

          checkFolder(folderName);

          if(!(folderName && files && files.length > 0)) {
            throw new Error("400");
          }

          this._logger.info(`Uploading ${files.length} images to ${folderName}`);

          const result = [];
          for(let file of files) {
            const readable = readbleFromBuffer(file.buffer);
            const dir = fromImageRoot(this._config, folderName);
            const filename = await this._filesService.saveFile(readable, dir, `_${username}_` + file.originalname);
            result.push(filename);
          }

          res.send({ result });
        }
      }
    ]
  }
}