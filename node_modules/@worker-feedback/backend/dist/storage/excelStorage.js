"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExcelStorage = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const exceljs_1 = __importDefault(require("exceljs"));
const uuid_1 = require("uuid");
const writeQueue_1 = require("./writeQueue");
const configLoader_1 = require("../config/configLoader");
class ExcelStorage {
    filePath;
    writeQueue;
    constructor(dataDir) {
        const rootDataDir = dataDir || path_1.default.join(__dirname, '../../../data');
        if (!fs_1.default.existsSync(rootDataDir)) {
            fs_1.default.mkdirSync(rootDataDir, { recursive: true });
        }
        this.filePath = path_1.default.join(rootDataDir, 'responses.xlsx');
        this.writeQueue = new writeQueue_1.WriteQueue();
    }
    async saveSubmission(submission) {
        return this.writeQueue.enqueue(async () => {
            const submissionId = submission.submissionId || (0, uuid_1.v4)();
            submission.submissionId = submissionId;
            submission.submittedAt = submission.submittedAt || new Date().toLocaleString('vi-VN');
            let workbook = new exceljs_1.default.Workbook();
            let worksheet;
            if (fs_1.default.existsSync(this.filePath)) {
                await workbook.xlsx.readFile(this.filePath);
                worksheet = workbook.getWorksheet('Responses') || workbook.addWorksheet('Responses');
                this.syncHeaderColumnsIfNeeded(worksheet);
            }
            else {
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
    getAllQuestions(questions) {
        const list = [];
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
    initializeHeaders(worksheet) {
        const surveyConfig = configLoader_1.ConfigLoader.getSurveyConfig();
        const allQuestions = this.getAllQuestions(surveyConfig.questions);
        const headers = [
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
    syncHeaderColumnsIfNeeded(worksheet) {
        const surveyConfig = configLoader_1.ConfigLoader.getSurveyConfig();
        const allQuestions = this.getAllQuestions(surveyConfig.questions);
        const expectedHeaders = [
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
        const currentHeaders = Array.isArray(headerRow.values) ? headerRow.values.slice(1) : [];
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
    appendSubmissionRow(worksheet, submission) {
        const workerFields = configLoader_1.ConfigLoader.getWorkerFieldsConfig();
        const deptLabel = workerFields.departments.find(d => d.value === submission.worker.department)?.label || submission.worker.department;
        const locLabel = workerFields.workLocations.find(l => l.value === submission.worker.workLocation)?.label || submission.worker.workLocation;
        const answerMap = new Map();
        for (const ans of submission.answers) {
            answerMap.set(ans.questionId, ans.value);
        }
        const surveyConfig = configLoader_1.ConfigLoader.getSurveyConfig();
        const allQuestions = this.getAllQuestions(surveyConfig.questions);
        // Build row values array matching exact column position
        const rowValues = [
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
            }
            else if (Array.isArray(val)) {
                const labels = val.map(v => q.options?.find(o => o.value === v)?.label || v);
                rowValues.push(labels.join(', '));
            }
            else if (q.options) {
                const matched = q.options.find(o => o.value === val);
                rowValues.push(matched ? matched.label : val);
            }
            else {
                rowValues.push(val);
            }
        }
        rowValues.push(submission.submittedAt, submission.surveyVersion);
        worksheet.addRow(rowValues);
    }
}
exports.ExcelStorage = ExcelStorage;
//# sourceMappingURL=excelStorage.js.map