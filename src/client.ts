import { Timer } from './helpers';
import { MessageWrapper } from './models/message-wrapper.model';
import { Message } from 'discord.js';
import { Subject, ISubject, IObservable } from 'rx';
import { injectable, inject } from 'inversify';
import { IClient } from './contracts';
import { swearWords } from './static';
import { commands } from './static';

import * as discord from 'discord.js';
import { TYPES } from './ioc/types';
import { IMessage } from './contracts';
import { TimerQueue } from './components/timer-queue.com';

@injectable()
export class Client implements IClient {

  prefix: string;
  _client: discord.Client;
  _isAttached: boolean;

  _mappings: Map<string, ISubject<IMessage>>;
  _all: ISubject<IMessage> = new Subject<IMessage>();
  _helpMappings: { [key: string]: IHelp } = {};

  _requstlimit = 2000;
  _userRequests: Set<string>;

  constructor(
    @inject(TYPES.IConfig) private _config: IConfig,
    @inject(TYPES.IPermission) private _permission: IPermission,
    @inject(TYPES.Logger) private _logger: ILogger,
  ) {
    this._isAttached = false;

    this.prefix = _config.app.prefix;

    this._client = new discord.Client();

    this._mappings = new Map<string, ISubject<IMessage>>();

    this._userRequests = new Set<string>();

    this._client.login(this._config.secret.bot.token)
      .catch(err => {
        this._logger.error(`Login failed`, err)
      });;

    this._client.on("ready", () => this.attachListener())

    let queue = new TimerQueue();

    this._client.on("error",
      (err) => {
        this._logger.info(`Errored, trying to login ...`, err)
        queue.doTask(
          () => this._client.login(this._config.secret.bot.token)
            .then(() => this._logger.info(`Successfully logged in again`))
            .catch(err => this._logger.error(`Failed to login again`, err))
        )
      });
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

  public processDiscordMessage(msg: Message) {
    this.onDiscordMessage(msg);
  }

  private attachListener() {

    if (this._isAttached) return;

    this._isAttached = true;

    this._client.on("message", (msg) => {
      if (!msg.content.startsWith(this.prefix)) return;

      if (msg.author.bot) return;

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
          message.send(`${this.prefix}${this._helpMappings[command].Usage}`);
          message.done();
        } else {
          subject.onNext(message);
          this._all.onNext(message);
        }

        return true;
      }
    });
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

      if (err)
        this._logger.error(`Processed command: ${command} in ${elapsed / 1000} seconds ${response}`, err);
      else
        this._logger.info(`Processed command: ${command} in ${elapsed / 1000} seconds ${response}`);

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
}

