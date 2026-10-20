import { SurveyConfig, SurveySubmission, Question } from '@worker-feedback/shared';
import { ConfigLoader } from '../config/configLoader';

export interface ValidationErrorDetail {
  field?: string;
  questionId?: string;
  message: string;
}

export class ValidationService {
  public static validateSubmission(submission: SurveySubmission): ValidationErrorDetail[] {
    const errors: ValidationErrorDetail[] = [];
    const workerFields = ConfigLoader.getWorkerFieldsConfig();
    const surveyConfig = ConfigLoader.getSurveyConfig();

    // 1. Worker Information Validation
    if (!submission.worker) {
      errors.push({ field: 'worker', message: 'Thiếu thông tin người lao động' });
      return errors;
    }

    if (!submission.worker.workerId || submission.worker.workerId.trim() === '') {
      errors.push({ field: 'worker.workerId', message: 'Vui lòng nhập ID' });
    }

    if (!submission.worker.name || submission.worker.name.trim() === '') {
      errors.push({ field: 'worker.name', message: 'Vui lòng nhập họ tên' });
    }

    const validDepts = workerFields.departments.map(d => d.value);
    if (!submission.worker.department || !validDepts.includes(submission.worker.department)) {
      errors.push({ field: 'worker.department', message: 'Vui lòng chọn bộ phận' });
    }

    const validLocs = workerFields.workLocations.map(l => l.value);
    if (!submission.worker.workLocation || !validLocs.includes(submission.worker.workLocation)) {
      errors.push({ field: 'worker.workLocation', message: 'Vui lòng chọn vị trí làm việc' });
    }

    // 2. Answers Validation according to conditional rules
    const answerMap = new Map<string, string | string[]>();
    if (Array.isArray(submission.answers)) {
      for (const ans of submission.answers) {
        answerMap.set(ans.questionId, ans.value);
      }
    }

    this.validateQuestionsRecursive(surveyConfig.questions, answerMap, errors);

    return errors;
  }

  private static validateQuestionsRecursive(
    questions: Question[],
    answerMap: Map<string, string | string[]>,
    errors: ValidationErrorDetail[]
  ): void {
    for (const q of questions) {
      const val = answerMap.get(q.id);

      if (q.required) {
        if (val === undefined || val === null) {
          errors.push({ questionId: q.id, message: 'Vui lòng trả lời câu hỏi này.' });
        } else if (typeof val === 'string' && val.trim() === '') {
          errors.push({ questionId: q.id, message: 'Vui lòng trả lời câu hỏi này.' });
        } else if (Array.isArray(val) && val.length === 0) {
          errors.push({ questionId: q.id, message: 'Vui lòng trả lời câu hỏi này.' });
        }
      }

      // Check conditional questions if current question condition matches
      if (q.conditionalQuestions && q.conditionalQuestions.length > 0) {
        for (const rule of q.conditionalQuestions) {
          const isVisible = this.evaluateCondition(rule.showWhen, val);
          if (isVisible) {
            this.validateQuestionsRecursive([rule.question], answerMap, errors);
          }
        }
      }
    }
  }

  private static evaluateCondition(showWhen: any, parentValue: string | string[] | undefined): boolean {
    if (parentValue === undefined || parentValue === null) return false;

    const op = showWhen.operator;
    const targetVal = showWhen.value;

    switch (op) {
      case 'equals':
        return parentValue === targetVal;
      case 'not_equals':
        return parentValue !== targetVal;
      case 'includes':
        return Array.isArray(parentValue) && parentValue.includes(targetVal);
      case 'not_includes':
        return !Array.isArray(parentValue) || !parentValue.includes(targetVal);
      default:
        return false;
    }
  }
}
