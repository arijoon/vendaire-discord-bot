import { IMessage } from './../contracts';
import { IClient } from '../contracts';
import { IQuestionService } from './../contracts';
import { injectable, inject } from 'inversify';
import { TYPES } from '../ioc/types';
import { commands } from '../static';
import { TextChannel, Channel, GroupDMChannel } from 'discord.js';
import { Question } from '../models/question.model';

@injectable()
export class QuestionCommand implements ICommand {

    _command = commands.qs;
    _answerTimeout = 10000;
    _channels = new Set<string>();


    constructor(
        @inject(TYPES.IClient) private _client: IClient,
        @inject(TYPES.IConfig) private _config: IConfig,
        @inject(TYPES.IQuestion) private _questionService: IQuestionService
    ) { }

        attach(): void {
            this._client
                .getCommandStream(this._command)
                .subscribe(imsg => {
                    const msg = imsg.Message;
                    this.setupNewQuestion(msg.channel as TextChannel, imsg);
                });
        }

        setupNewQuestion(channel: TextChannel, msg: IMessage) {

            if(this._channels.has(channel.id)) {
                channel.send('You must answer the question first or wait until timer runs out');
                return;
            }

            this._channels.add(channel.id);

            this._questionService.getRandomQuestion()
                .then((q: Question) => {

                    let id = q.id;

                    channel.send(`${q.question}\n Answer in ${this._answerTimeout/1000} seconds`, { code: 'md' });

                    msg.done();

                    setTimeout(() => {
                        let response = '****************************************\n'
                           response += '               Answer\n'
                           response += '****************************************\n'
                           response += `Answer to, ${q.question} is ... \n\n\t--> ${q.answer}`;

                        channel.send(response, { code: 'md' });

                        this._channels.delete(channel.id);
                    }, this._answerTimeout);
                })

        }
}