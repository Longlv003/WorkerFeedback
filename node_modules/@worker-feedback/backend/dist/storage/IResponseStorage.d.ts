import { SurveySubmission } from '@worker-feedback/shared';
export interface IResponseStorage {
    saveSubmission(submission: SurveySubmission): Promise<string>;
}
//# sourceMappingURL=IResponseStorage.d.ts.map