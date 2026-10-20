import { SurveySubmission } from '@worker-feedback/shared';
import { IResponseStorage } from './IResponseStorage';
export declare class ExcelStorage implements IResponseStorage {
    private filePath;
    private writeQueue;
    constructor(dataDir?: string);
    saveSubmission(submission: SurveySubmission): Promise<string>;
    private getAllQuestions;
    private initializeHeaders;
    private syncHeaderColumnsIfNeeded;
    private appendSubmissionRow;
}
//# sourceMappingURL=excelStorage.d.ts.map