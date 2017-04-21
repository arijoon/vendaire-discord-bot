import { inject, injectable } from 'inversify';
import { IConfig } from './../contracts/IConfig';
import { IQuestionService } from './../contracts/IQuestionService';
import { TYPES } from "../ioc/types";
import { Question } from "../models/question.model";
import { IHttp } from "../contracts/IHttpService";

@injectable()
export class QuestionService implements IQuestionService {

    _questionCache: Map<number, Question> = new Map<number, Question>();

    constructor(
        @inject(TYPES.IConfig) private _config: IConfig,
        @inject(TYPES.IHttp) private _http: IHttp
    ) { }

    getRandomQuestion(): Promise<Question> {
        let endpoint = this._config.api['random-question'];

        return new Promise((resolve, reject) => {
            this._http.getJson(endpoint)
                .then((q: Question[]) => {

                    if(q.length < 1) 
                        console.error('[question.service]: no questions received');

                    this._questionCache.set(q[0].id, q[0]);

                    resolve(q[0]);

                }).catch(err => {
                    console.error('[question.service]:', err)
                    reject(err);
                });
        });
    }

    verifyAnswer(answer: string, questionId: number): Promise<boolean> {
        throw new Error('Method not implemented.');
    }

    getAnswer(questionId: number): string {
        return this._questionCache.get(questionId).answer;
    }
}