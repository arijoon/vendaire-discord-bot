import { Question } from './../models/question.model';

export interface IQuestionService {
    getRandomQuestion(): Promise<Question>;

    verifyAnswer(answer: string, questionId: number): Promise<boolean>;

    getAnswer(questionId: number): string;
}