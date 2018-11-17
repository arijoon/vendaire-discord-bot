import { Timer, makeSearcher } from './helpers';
import { MessageWrapper } from './models/MessageWrapper';
import { Message } from 'discord.js';
import { Subject, ISubject, IObservable } from 'rx';
import { injectable, inject } from 'inversify';
import { IClient, ISearcher } from './contracts';
import { swearWords } from './static';
import { commands } from './static';
import { TYPES } from './ioc/types';
import { IMessage } from './contracts';
import { TimerQueue } from './components/timer-queue.com';

import * as discord from 'discord.js';

@injectable()
export class Client implements IClient {

  prefix: string;
  botPrefix: string;
  _client: discord.Client;
  _isAttached: boolean;

  _mappings: Map<string, ISubject<IMessage>>;
  _all: ISubject<IMessage> = new Subject<IMessage>();
  _helpMappings: { [key: string]: IHelp } = {};

  _requstlimit = 2000;
  _userRequests: Set<string>;

  _commandSearch: ISearcher;

  constructor(
    @inject(TYPES.IConfig) private _config: IConfig,
    @inject(TYPES.IPermission) private _permission: IPermission,
    @inject(TYPES.Logger) private _logger: ILogger,
  ) {
    this._isAttached = false;

    this.prefix = _config.app.prefix;
    this.botPrefix = this.prefix+"+";

    this._client = new discord.Client();

    this._mappings = new Map<string, ISubject<IMessage>>();

    this._userRequests = new Set<string>();

    this._client.login(this._config.app.bot.token)
      .catch(err => {
        this._logger.error(`Login failed`, err)
      });;

    this._client.on("ready", () => this.attachListener())

    let queue = new TimerQueue();

    this._client.on("error",
      (err) => {
        this._logger.info(`Errored, trying to login ...`, err)
        this.handleLoginFailure(queue, this._client, this._config.app.bot.token);
      });
  }

  private handleLoginFailure(queue, client, token) {
    queue.doTask(
      () => client.login(token)
        .then(() =>this._logger.info(`Successfully logged in again`))
        .catch(err => {
          this._logger.error(`Failed to login again`, err)
          this.handleLoginFailure(queue, client, token);
      })
    );
  }

  public getCommandStream(command: string): IObservable<IMessage> {

    if (!this._mappings.has(command)) {
      this._mappings.set(command, new Subject<IMessage>());
    }

    return this._mappings.get(command);
  }

  public getGlobalCommandStream(): IObservable<IMessage> {
    return this._all;
  }

  public getClient(): discord.Client {
    return this._client;
  }

  public attachHelp(helps: IHelp[]) {
    for(let help of helps) {
      this._helpMappings[help.Key] = help;
    }
  }

  public async processDiscordMessage(guildId: string, channelId: string, messageId: string) {
    const channel = this.getChannel(guildId, channelId);
    const msg = await channel.fetchMessage(messageId);

    if(!msg)
      throw new Error(`Message ${messageId} not found`)
    
    this.onDiscordMessage(msg);
  }

  public sendMessage(guildId: string, channelId: string, content: string, options?: any, botOptions?: any): Promise<any> {
    if(botOptions && botOptions.isCommand) {
      content = this.botPrefix + content;
    }

    const channel = this.getChannel(guildId, channelId);
    return channel.send(content, options);
  }

  public getNsfwChannel(guildId: string): Promise<string> {
    const channels = this._client.guilds.get(guildId).channels;
    const channel = channels.filter((channel: discord.TextChannel) => channel.nsfw).first();

    return Promise.resolve(channel && channel.id);
  }

  private getChannel(guildId: string, channelId: string) {
    const guild = this._client.guilds.get(guildId);
    return guild.channels.get(channelId) as discord.TextChannel;
  }

  private attachListener() {

    if (this._isAttached) return;

    this._isAttached = true;

    this._client.on("message", (msg) => {
      if (!msg.content.startsWith(this.prefix)) return;

      if (msg.author.bot && !msg.content.startsWith(this.botPrefix)) return;

      if (!this._permission.isAdmin(msg.author.username) && this.isAtRequestLimit(msg.author.id)) {
        msg.channel.send(`Calm down you ${swearWords.crandom()}`, { reply: msg });
        return;
      }

      this.onDiscordMessage(msg);
    });
  }

  private onDiscordMessage(msg: Message) {
    try {
      this.processMessage(msg);
    } catch (err) {
      this._logger.error(`Error while processing message ${msg.id}, content: ${msg.content}`, err);
    }
  }

  private processMessage(msg: Message) {
    let foundCommand: boolean = false;

    if(msg.content.startsWith(this.botPrefix)) {
      msg.content = msg.content.replace(this.botPrefix, this.prefix);
    }

    // Handle special replay case
    if(msg.content === this.prefix) {
      msg.content = this.prefix + commands.replay
    }

    this._mappings.forEach((subject, command) => {

      if (foundCommand) return;

      const fullCommand = this.prefix + command;

      if (msg.content.toLowerCase().startsWith(fullCommand)) {

        foundCommand = true;

        this._logger.info(`Received command: ${command}`);

        let orig = msg.content;

        msg.content = msg.content.substring(fullCommand.length).trim();

        const message = this.buildMessageWrapper(msg, command, orig);

        // Check if this is for help
        if(this._helpMappings[command] && message.Message.content.indexOf("--help") >= 0) {
          message.send(`USAGE: ${this.prefix}${this._helpMappings[command].Usage}`, { code: 'md'});
          message.done();
        } else {
          subject.onNext(message);
          this._all.onNext(message);
        }

        return true;
      }
    });

    if(!foundCommand) {
      const command = msg.content.split(' ');

      if(command.length > 0) {
        const c = command[0].replace(this.prefix, '');

        const closeMatches = this.proximityCommands(c);

        if(closeMatches.length > 0) {
          msg.channel.send(`Did you mean?\n${closeMatches.join(', ')}`)
        }
      }
    }
  }

  private buildMessageWrapper(msg: Message, command: string, originalContent: string): IMessage {
    const timer = new Timer().start();
    msg.channel.startTyping();

    setTimeout(() => { // Force terminate typing after 10 secs
      if (msg.channel.typing) msg.channel.stopTyping();
    }, 10000);

    const onDone = (cmsg?: string, err?: any, del?: boolean) => {

      msg.content = originalContent;

      const elapsed = timer.stop();
      const response = cmsg || "";

      if (err) {
        this._logger.error(`Processed command: ${command} in ${elapsed / 1000} seconds ${response}`, err);
        const xreaction = '%E2%9D%8C';
        msg.react(xreaction);
      } else {
        this._logger.info(`Processed command: ${command} in ${elapsed / 1000} seconds ${response}`);
      }

      msg.channel.stopTyping(true);
    }

    const wrapper = new MessageWrapper(onDone, msg, timer, msg.content, command);

    return wrapper;
  }

  private isAtRequestLimit(username: string): boolean {

    if (this._userRequests.has(username)) return true;

    this._userRequests.add(username);

    setTimeout(() => this._userRequests.delete(username), this._requstlimit);

    return false;
  }

  private proximityCommands(key: string): string[] {
    if(!this._commandSearch) this.initCommandSearch();
    return this._commandSearch.search(key);
  }

  /**
   * initialise commandSearch ISearcher
   * @param commands array of commands as strings
   */
  private initCommandSearch() {
    const options = {
      shouldSort: true,
      threshold: 0.5,
      location: 0,
      distance: 5,
      maxPatternLength: 32,
      minMatchCharLength: 1,
      keys: ['key'],
      id: 'key'
    };
    const commands = Array.from(this._mappings.keys());
    this._commandSearch = makeSearcher(
      commands.map(c => ({ key: c})), options);
  }
}

