import { SurveySubmission } from '@worker-feedback/shared';
export interface ValidationErrorDetail {
    field?: string;
    questionId?: string;
    message: string;
}
export declare class ValidationService {
    static validateSubmission(submission: SurveySubmission): ValidationErrorDetail[];
    private static validateQuestionsRecursive;
    private static evaluateCondition;
}
//# sourceMappingURL=validationService.d.ts.map