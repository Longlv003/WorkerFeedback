export type QuestionType = 'single_choice' | 'multiple_choice' | 'textarea' | 'rating';
export interface SelectOption {
    value: string;
    label: string;
}
export interface QuestionOption {
    value: string;
    label: string;
}
export interface ConditionExpression {
    questionId?: string;
    operator: 'equals' | 'not_equals' | 'includes' | 'not_includes';
    value: string | string[];
}
export interface ConditionalRule {
    showWhen: ConditionExpression;
    question: Question;
}
export interface Question {
    id: string;
    text: string;
    type: QuestionType;
    required: boolean;
    options?: QuestionOption[];
    conditionalQuestions?: ConditionalRule[];
}
export interface SurveyConfig {
    surveyId: string;
    title: string;
    description?: string;
    version: string;
    questions: Question[];
}
export interface WorkerFieldsConfig {
    departments: SelectOption[];
    workLocations: SelectOption[];
}
export interface WorkerInfo {
    workerId: string;
    name: string;
    department: string;
    workLocation: string;
    anonymous: boolean;
}
export interface SurveyAnswer {
    questionId: string;
    value: string | string[];
}
export interface SurveySubmission {
    submissionId?: string;
    idempotencyKey: string;
    surveyId: string;
    surveyVersion: string;
    worker: WorkerInfo;
    answers: SurveyAnswer[];
    submittedAt?: string;
}
export interface APIConfigResponse {
    survey: SurveyConfig;
    workerFields: WorkerFieldsConfig;
}
export interface APISubmitResponse {
    success: boolean;
    submissionId?: string;
    message: string;
    duplicate?: boolean;
    details?: {
        field?: string;
        questionId?: string;
        message: string;
    }[];
}
//# sourceMappingURL=index.d.ts.map