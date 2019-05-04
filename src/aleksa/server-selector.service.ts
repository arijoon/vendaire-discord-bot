import { injectable, inject } from "inversify";
import { TYPES } from "../ioc/types";

const cacheKey = "AleksaDiscordServerSelection";

@injectable()
export class ServerSelectorService {
  constructor(
    @inject(TYPES.IConfig) private _config: IConfig,
    @inject(TYPES.Logger) private _logger: ILogger,
    @inject(TYPES.IBasicCache) private _cache: IBasicCache,
  ) { }

  /**
   * Change to the new server
   * @param name 
   */
  public async changeServer(name: string): Promise<void> {
    const servers: IServer[] = this._config.app.aleksa.discord.servers;

    const matches = servers.filter(s => s.name.indexOf(name) > -1);

    const selection = matches.length > 0
      ? matches[0]
      : servers[0];

      this._logger.info(`Changing server to ${name}`);

      // Ensure never expired
      this._cache.set(cacheKey, JSON.stringify(selection), 0);
  }

  /**
   * Get the current selected server
   */
  public async getServer(): Promise<IServer> {
    if(await this._cache.has(cacheKey)) {
      return JSON.parse(await this._cache.get(cacheKey)) as IServer;
    }

    return this._config.app.aleksa.discord.servers[0] as IServer;
  }
}

export interface IServer {
  name: string;
  guildId: string;
  channelId: string;
  userId: string;
}