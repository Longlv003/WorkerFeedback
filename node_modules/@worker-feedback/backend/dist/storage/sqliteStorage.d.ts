import { SurveySubmission } from '@worker-feedback/shared';
import { IResponseStorage } from './IResponseStorage';
export interface SubmissionRow {
    id: number;
    submission_id: string;
    worker_id: string;
    worker_name: string;
    department: string;
    work_location: string;
    anonymous: number;
    submitted_at: string;
    survey_id: string;
    survey_version: string;
}
export interface AnswerRow {
    submission_id: string;
    question_id: string;
    answer_value: string;
}
export declare class SqliteStorage implements IResponseStorage {
    private db;
    private static instance;
    constructor(dataDir?: string);
    static getInstance(): SqliteStorage;
    private initializeTables;
    saveSubmission(submission: SurveySubmission): Promise<string>;
    getAllSubmissions(): SubmissionRow[];
    getAnswersForSubmission(submissionId: string): AnswerRow[];
    getAllAnswers(): AnswerRow[];
    getStats(): {
        total: number;
        today: number;
        departments: {
            dept: string;
            count: number;
        }[];
    };
}
//# sourceMappingURL=sqliteStorage.d.ts.map