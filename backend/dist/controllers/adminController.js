"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const exceljs_1 = __importDefault(require("exceljs"));
const sqliteStorage_1 = require("../storage/sqliteStorage");
const configLoader_1 = require("../config/configLoader");
// ─── Fix admin password here ──────────────────────────────
const ADMIN_PASSWORD = 'SEI@Admin2026';
const ADMIN_TOKEN = Buffer.from(`admin:${ADMIN_PASSWORD}`).toString('base64');
function isAuthorized(req) {
    const auth = req.headers['authorization'] || req.query['token'];
    return auth === `Bearer ${ADMIN_TOKEN}` || auth === ADMIN_TOKEN;
}
class AdminController {
    // POST /api/survey/admin/login  { password }
    static login(req, res) {
        const { password } = req.body;
        if (password === ADMIN_PASSWORD) {
            res.json({ success: true, token: ADMIN_TOKEN });
        }
        else {
            res.status(401).json({ success: false, message: 'Sai mật khẩu.' });
        }
    }
    // GET /api/survey/admin/submissions
    static getSubmissions(req, res) {
        if (!isAuthorized(req)) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        try {
            const db = sqliteStorage_1.SqliteStorage.getInstance();
            const submissions = db.getAllSubmissions();
            const allAnswers = db.getAllAnswers();
            // Group answers by submission_id
            const answerMap = new Map();
            for (const a of allAnswers) {
                if (!answerMap.has(a.submission_id))
                    answerMap.set(a.submission_id, {});
                answerMap.get(a.submission_id)[a.question_id] = a.answer_value;
            }
            const result = submissions.map(s => ({
                ...s,
                anonymous: s.anonymous === 1,
                answers: answerMap.get(s.submission_id) || {}
            }));
            res.json({ success: true, data: result });
        }
        catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }
    // GET /api/survey/admin/stats
    static getStats(req, res) {
        if (!isAuthorized(req)) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        try {
            const stats = sqliteStorage_1.SqliteStorage.getInstance().getStats();
            res.json({ success: true, data: stats });
        }
        catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }
    // GET /api/survey/admin/export
    static async exportExcel(req, res) {
        if (!isAuthorized(req)) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        try {
            const db = sqliteStorage_1.SqliteStorage.getInstance();
            const submissions = db.getAllSubmissions();
            const allAnswers = db.getAllAnswers();
            const surveyConfig = configLoader_1.ConfigLoader.getSurveyConfig();
            // Build answer map
            const answerMap = new Map();
            for (const a of allAnswers) {
                if (!answerMap.has(a.submission_id))
                    answerMap.set(a.submission_id, {});
                answerMap.get(a.submission_id)[a.question_id] = a.answer_value;
            }
            // Flatten all questions (including conditional sub-questions)
            const getAllQuestions = (qs) => {
                const out = [];
                for (const q of qs) {
                    out.push(q);
                    if (q.conditionalQuestions) {
                        for (const rule of q.conditionalQuestions) {
                            out.push(...getAllQuestions([rule.question]));
                        }
                    }
                }
                return out;
            };
            const allQuestions = getAllQuestions(surveyConfig.questions);
            const knownIds = new Set(allQuestions.map(q => q.id));
            for (const answer of allAnswers) {
                if (!knownIds.has(answer.question_id)) {
                    knownIds.add(answer.question_id);
                    allQuestions.push({ id: answer.question_id, text: answer.question_id });
                }
            }
            // Build workbook
            const workbook = new exceljs_1.default.Workbook();
            workbook.creator = 'SEI Worker Feedback';
            workbook.created = new Date();
            const ws = workbook.addWorksheet('Ket qua khao sat');
            // Headers
            const headers = ['STT', 'ID', 'Tên'];
            for (const q of allQuestions) {
                headers.push(`[${q.id}] ${q.text}`);
            }
            headers.push('Bộ phận / Phòng ban', 'Vị trí làm việc', 'Ngày gửi', 'Submission ID', 'Phiên bản');
            ws.addRow(headers);
            // Style header row
            const headerRow = ws.getRow(1);
            headerRow.font = { bold: true, color: { argb: 'FFFFFF' }, size: 11 };
            headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E3A8A' } };
            headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
            headerRow.height = 110;
            // Data rows
            submissions.forEach((s, idx) => {
                const answers = answerMap.get(s.submission_id) || {};
                const row = [
                    idx + 1,
                    s.worker_id,
                    s.worker_name
                ];
                for (const q of allQuestions) {
                    const value = answers[q.id] ?? '';
                    row.push(q.options?.find((option) => option.value === value)?.label || value);
                }
                const submittedAt = /^\d{4}-\d{2}-\d{2}/.test(s.submitted_at) ? new Date(s.submitted_at) : null;
                const displayedDate = submittedAt && !Number.isNaN(submittedAt.getTime())
                    ? submittedAt.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) : s.submitted_at;
                row.push(s.department, s.work_location, displayedDate, s.submission_id, s.survey_version);
                const dataRow = ws.addRow(row);
                dataRow.alignment = { vertical: 'middle', wrapText: true };
                if (idx % 2 === 1) {
                    dataRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'EFF6FF' } };
                }
            });
            // Auto-fit columns (approximate)
            ws.columns.forEach((col, i) => {
                col.width = i === 0 ? 8 : i === 1 ? 18 : i === 2 ? 28 : i < allQuestions.length + 3 ? 45 : 24;
            });
            // Freeze top row
            ws.views = [{ state: 'frozen', ySplit: 1, xSplit: 3 }];
            ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: headers.length } };
            // Send file
            const filename = `KhaoSat_${new Date().toISOString().slice(0, 10)}.xlsx`;
            const buffer = await workbook.xlsx.writeBuffer();
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.send(Buffer.from(buffer));
        }
        catch (err) {
            console.error('[AdminController] Export error:', err);
            res.status(500).json({ success: false, message: err.message });
        }
    }
}
exports.AdminController = AdminController;
//# sourceMappingURL=adminController.js.map