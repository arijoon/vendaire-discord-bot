import { IDisposable } from 'rx';
import { IClient } from '../contracts';
import { injectable, inject } from 'inversify';
import { TYPES } from '../ioc/types';
import { commands } from '../static';

const POLLING_RANGE_MIN_DEFAULT = 10;
const POLLING_LOAD_MULTIPLIER_DEFAULT = 1.5;
const INITIAL_WAIT = 5000;

@injectable()
export class RemindCommand implements ICommand, IHasHelp {

  _command: string = commands.remind;
  _subscriptions: IDisposable[] = [];
  _callbacks: { [key: string]: any } = {};
  _nextLoad: number;

  _reg = /(.*)to "(.*)" in ([0-9]*\.?[0-9]+)\s?((m|s|h)((in(ute)?)|(ec(ond)?)|(our))?s?)/;

  constructor(
    @inject(TYPES.IClient) private _client: IClient,
    @inject(TYPES.IConfig) private _config: IConfig,
    @inject(TYPES.Logger) private _logger: ILogger,
    @inject(TYPES.IOrderedSetDataAccess) private _dataAccess: IOrderedSetDataAccess,
  ) { }

  attach(): void {
    setTimeout(() => this.setReminders(), INITIAL_WAIT);

    this._subscriptions.push(this._client
      .getCommandStream(this._command)
      .subscribe(imsg => {

        Promise.resolve().then(async () => {
          const match = this._reg.exec(imsg.Content);
          console.log(imsg.Content);
          // 1 - subject
          // 2 - message
          // 3 - num of sec|min|hour
          // 5 - s|m|h

          if (!match || match.length < 1) {
            imsg.send(this._usage.Usage);
            return;
          }

          const messageContent = match[2];
          const numOfMsToAction = this.convertToMs(match[5] as timing, +match[3]);
          const timeStampOfAction = numOfMsToAction + Date.now();
          const payload: IReminderPayload = {
            msgId: imsg.id,
            guildId: imsg.guidId,
            channelId: imsg.channelId,
            message: messageContent,
            subject: match[1].trim()
          };

          await this._dataAccess.addValues(this._command, [{ key: timeStampOfAction, value: JSON.stringify(payload) }])

          if(timeStampOfAction < this._nextLoad) {
            // Need to register the callback since it won't be picked up
            if(this._callbacks[payload.msgId]) return;

            this._callbacks[payload.msgId] =
              setTimeout(() => this.remind(payload, timeStampOfAction), numOfMsToAction);
          }

        }).then(_ => {
          imsg.done();
        }).catch(err => {
          imsg.done(err, true);
        });
      }));

  }

  getHelp(): IHelp[] {
    return [
      this._usage
    ]
  }

  private _usage: IHelp = {
    Key: this._command,
    Message: "remind you of a task in future",
    Usage: `${this._command} @Arijoon, @Syzygy to "play MoW" in 50 (minutes|seconds|hours)`
  }

  private async setReminders() {
    const [min, max, msUntilNextLoad] = this.getPollingRange();

    try {
      const keyVals = await this._dataAccess.getRange(this._command, min, max);

      for (let item of keyVals) {
        const payload: IReminderPayload = JSON.parse(item.value);
        if (this._callbacks[payload.msgId])
          continue; // Item already registered

        const waitTime = item.key - Date.now();
        if (waitTime < 0) {
          this._logger.info(`Encountered element in the past, wait: ${waitTime}`, payload);
          await this.remind(payload, item.key, true);
          continue;
        }

        this._callbacks[payload.msgId] = setTimeout(() => this.remind(payload, item.key), waitTime);
      }
    } catch (err) {
      this._logger.error("Failed to set reminders", err);
    }

    this._nextLoad = msUntilNextLoad + Date.now();
    setTimeout(() => this.setReminders(), msUntilNextLoad);
  }

  private async remind(item: IReminderPayload, key: number, isLate?: boolean) {
    try {
      const message = `${isLate ? "sry for the delay, I was fucked up" : "" }${item.subject}, ${item.message}`;
      await this._client.sendMessage(item.guildId, item.channelId, message);
      await this._dataAccess.removeRange(this._command, key, key);

      delete this._callbacks[item.msgId];
    } catch (err) {
      this._logger.error(`Failed to remind ${item.message}`, err);
    }
  }

  /**
   * @returns [min, max, msUntilNextLoad] in milliseconds
   */
  private getPollingRange(): [number, number, number] {
    const now = Date.now();

    const remindConfig = this._config.app.commands.remind;
    // Num of milliseconds per each poll
    const pollingRange = ((remindConfig && remindConfig.pollingInMin) || POLLING_RANGE_MIN_DEFAULT) * 60 * 1000;

    // Num of milliseconds to load in future, e.g. pollingRange: 10, multiplier: 1.5 = load all reminders
    // for the next 15
    const pollingLoad = ((remindConfig && remindConfig.pollingLoadMultiplier) || POLLING_LOAD_MULTIPLIER_DEFAULT) * pollingRange;
    const min = 0;
    const max = now + pollingLoad;
    const msUntilNextLoad = pollingRange;

    return [min, max, msUntilNextLoad];
  }

  private convertToMs(key: timing, value: number) {
    switch (key) {
      case 's': return value * 1000;
      case 'm': return value * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
    }
  }
}

type timing = 's' | 'm' | 'h';

interface IReminderPayload {
  msgId: string;
  guildId: string;
  channelId: string;
  message: string;
  subject: string;
}