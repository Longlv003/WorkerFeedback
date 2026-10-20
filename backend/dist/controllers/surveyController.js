"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SurveyController = void 0;
const configLoader_1 = require("../config/configLoader");
const validationService_1 = require("../services/validationService");
const sqliteStorage_1 = require("../storage/sqliteStorage");
const idempotency_1 = require("../utils/idempotency");
const storage = sqliteStorage_1.SqliteStorage.getInstance();
class SurveyController {
    static getConfig(_req, res) {
        try {
            const survey = configLoader_1.ConfigLoader.getSurveyConfig();
            const workerFields = configLoader_1.ConfigLoader.getWorkerFieldsConfig();
            const response = { survey, workerFields };
            res.json(response);
        }
        catch (err) {
            console.error('Lỗi khi lấy config:', err);
            res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Không thể lấy cấu hình khảo sát.' });
        }
    }
    static async submitSurvey(req, res) {
        try {
            const submission = req.body;
            console.log('[BE] Nhan submission tu client:', JSON.stringify(submission, null, 2));
            if (!submission || !submission.idempotencyKey) {
                const response = {
                    success: false,
                    message: 'Thiếu idempotencyKey trong yêu cầu.'
                };
                res.status(400).json(response);
                return;
            }
            // Check duplicate submit via Idempotency Key
            const existingSubmissionId = idempotency_1.IdempotencyStore.get(submission.idempotencyKey);
            if (existingSubmissionId) {
                console.log('[BE] Trung idempotencyKey:', submission.idempotencyKey);
                const response = {
                    success: true,
                    submissionId: existingSubmissionId,
                    message: 'Khảo sát đã được ghi nhận trước đó.',
                    duplicate: true
                };
                res.status(200).json(response);
                return;
            }
            // Validate submission
            const validationErrors = validationService_1.ValidationService.validateSubmission(submission);
            if (validationErrors.length > 0) {
                console.warn('[BE] Server Validation loi:', validationErrors);
                const response = {
                    success: false,
                    message: 'Dữ liệu khảo sát không hợp lệ.',
                    details: validationErrors
                };
                res.status(400).json(response);
                return;
            }
            // Save to SQLite
            console.log('[BE] Bat dau ghi vao SqliteStorage...');
            const submissionId = await storage.saveSubmission(submission);
            console.log('[BE] Ghi thanh cong vao SqliteStorage! submissionId:', submissionId);
            idempotency_1.IdempotencyStore.set(submission.idempotencyKey, submissionId);
            const response = {
                success: true,
                submissionId,
                message: 'Cảm ơn bạn đã tham gia khảo sát!'
            };
            res.status(200).json(response);
        }
        catch (err) {
            console.error('[BE] Loi khi nop khao sat:', err);
            const response = {
                success: false,
                message: 'Có lỗi hệ thống xảy ra khi lưu khảo sát.'
            };
            res.status(500).json(response);
        }
    }
}
exports.SurveyController = SurveyController;
//# sourceMappingURL=surveyController.js.map