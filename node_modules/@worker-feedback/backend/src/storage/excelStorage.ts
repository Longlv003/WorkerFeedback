import fs from 'fs';
import path from 'path';
import ExcelJS from 'exceljs';
import { v4 as uuidv4 } from 'uuid';
import { SurveySubmission, Question } from '@worker-feedback/shared';
import { IResponseStorage } from './IResponseStorage';
import { WriteQueue } from './writeQueue';
import { ConfigLoader } from '../config/configLoader';

export class ExcelStorage implements IResponseStorage {
  private filePath: string;
  private writeQueue: WriteQueue;

  constructor(dataDir?: string) {
    const rootDataDir = dataDir || path.join(__dirname, '../../../data');
    if (!fs.existsSync(rootDataDir)) {
      fs.mkdirSync(rootDataDir, { recursive: true });
    }

    this.filePath = path.join(rootDataDir, 'responses.xlsx');
    this.writeQueue = new WriteQueue();
  }

  public async saveSubmission(submission: SurveySubmission): Promise<string> {
    return this.writeQueue.enqueue(async () => {
      const submissionId = submission.submissionId || uuidv4();
      submission.submissionId = submissionId;
      submission.submittedAt = submission.submittedAt || new Date().toLocaleString('vi-VN');

      let workbook = new ExcelJS.Workbook();
      let worksheet: ExcelJS.Worksheet;

      if (fs.existsSync(this.filePath)) {
        await workbook.xlsx.readFile(this.filePath);
        worksheet = workbook.getWorksheet('Responses') || workbook.addWorksheet('Responses');
        this.syncHeaderColumnsIfNeeded(worksheet);
      } else {
        worksheet = workbook.addWorksheet('Responses');
        this.initializeHeaders(worksheet);
      }

      this.appendSubmissionRow(worksheet, submission);

      await workbook.xlsx.writeFile(this.filePath);

      console.log(`[ExcelStorage] Ghi thanh cong vao file: ${this.filePath}`);
      console.log(`[ExcelStorage] Tong so dong trong file hien tai: ${worksheet.rowCount}`);

      return submissionId;
    });
  }

  private getAllQuestions(questions: Question[]): Question[] {
    const list: Question[] = [];
    for (const q of questions) {
      list.push(q);
      if (q.conditionalQuestions) {
        for (const rule of q.conditionalQuestions) {
          list.push(...this.getAllQuestions([rule.question]));
        }
      }
    }
    return list;
  }

  private initializeHeaders(worksheet: ExcelJS.Worksheet): void {
    const surveyConfig = ConfigLoader.getSurveyConfig();
    const allQuestions = this.getAllQuestions(surveyConfig.questions);

    const headers: string[] = [
      'Submission ID',
      'Mã NV (ID)',
      'Họ và tên',
      'Bộ phận',
      'Vị trí làm việc',
      'Ẩn danh'
    ];

    for (const q of allQuestions) {
      headers.push(`[${q.id}] ${q.text}`);
    }

    headers.push('Thời gian nộp', 'Survey Version');

    worksheet.addRow(headers);

    // Header styling
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '1A73E8' }
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  }

  private syncHeaderColumnsIfNeeded(worksheet: ExcelJS.Worksheet): void {
    const surveyConfig = ConfigLoader.getSurveyConfig();
    const allQuestions = this.getAllQuestions(surveyConfig.questions);

    const expectedHeaders: string[] = [
      'Submission ID',
      'Mã NV (ID)',
      'Họ và tên',
      'Bộ phận',
      'Vị trí làm việc',
      'Ẩn danh UI'
    ];

    for (const q of allQuestions) {
      expectedHeaders.push(`[${q.id}] ${q.text}`);
    }
    expectedHeaders.push('Thời gian nộp', 'Survey Version');

    const headerRow = worksheet.getRow(1);
    const currentHeaders = Array.isArray(headerRow.values) ? (headerRow.values.slice(1) as string[]) : [];

    // If headers count changed (e.g. added new question), update row 1
    if (currentHeaders.length !== expectedHeaders.length) {
      worksheet.spliceRows(1, 1, expectedHeaders);
      const updatedHeaderRow = worksheet.getRow(1);
      updatedHeaderRow.font = { bold: true, color: { argb: 'FFFFFF' } };
      updatedHeaderRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '1A73E8' }
      };
      updatedHeaderRow.alignment = { vertical: 'middle', horizontal: 'center' };
    }
  }

  private appendSubmissionRow(worksheet: ExcelJS.Worksheet, submission: SurveySubmission): void {
    const workerFields = ConfigLoader.getWorkerFieldsConfig();
    const deptLabel = workerFields.departments.find(d => d.value === submission.worker.department)?.label || submission.worker.department;
    const locLabel = workerFields.workLocations.find(l => l.value === submission.worker.workLocation)?.label || submission.worker.workLocation;

    const answerMap = new Map<string, string | string[]>();
    for (const ans of submission.answers) {
      answerMap.set(ans.questionId, ans.value);
    }

    const surveyConfig = ConfigLoader.getSurveyConfig();
    const allQuestions = this.getAllQuestions(surveyConfig.questions);

    // Build row values array matching exact column position
    const rowValues: any[] = [
      submission.submissionId,
      submission.worker.workerId,
      submission.worker.name,
      deptLabel,
      locLabel,
      submission.worker.anonymous ? 'Có' : 'Không'
    ];

    for (const q of allQuestions) {
      const val = answerMap.get(q.id);
      if (val === undefined || val === null) {
        rowValues.push('');
      } else if (Array.isArray(val)) {
        const labels = val.map(v => q.options?.find(o => o.value === v)?.label || v);
        rowValues.push(labels.join(', '));
      } else if (q.options) {
        const matched = q.options.find(o => o.value === val);
        rowValues.push(matched ? matched.label : val);
      } else {
        rowValues.push(val);
      }
    }

    rowValues.push(submission.submittedAt, submission.surveyVersion);

    worksheet.addRow(rowValues);
  }
}
