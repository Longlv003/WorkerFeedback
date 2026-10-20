import { Request, Response } from 'express';
import { APIConfigResponse, APISubmitResponse, SurveySubmission } from '@worker-feedback/shared';
import { ConfigLoader } from '../config/configLoader';
import { ValidationService } from '../services/validationService';
import { SqliteStorage } from '../storage/sqliteStorage';
import { IdempotencyStore } from '../utils/idempotency';

const storage = SqliteStorage.getInstance();

export class SurveyController {
  public static getConfig(_req: Request, res: Response): void {
    try {
      const survey = ConfigLoader.getSurveyConfig();
      const workerFields = ConfigLoader.getWorkerFieldsConfig();

      const response: APIConfigResponse = { survey, workerFields };
      res.json(response);
    } catch (err: any) {
      console.error('Lỗi khi lấy config:', err);
      res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Không thể lấy cấu hình khảo sát.' });
    }
  }

  public static async submitSurvey(req: Request, res: Response): Promise<void> {
    try {
      const submission: SurveySubmission = req.body;
      console.log('[BE] Nhan submission tu client:', JSON.stringify(submission, null, 2));

      if (!submission || !submission.idempotencyKey) {
        const response: APISubmitResponse = {
          success: false,
          message: 'Thiếu idempotencyKey trong yêu cầu.'
        };
        res.status(400).json(response);
        return;
      }

      // Check duplicate submit via Idempotency Key
      const existingSubmissionId = IdempotencyStore.get(submission.idempotencyKey);
      if (existingSubmissionId) {
        console.log('[BE] Trung idempotencyKey:', submission.idempotencyKey);
        const response: APISubmitResponse = {
          success: true,
          submissionId: existingSubmissionId,
          message: 'Khảo sát đã được ghi nhận trước đó.',
          duplicate: true
        };
        res.status(200).json(response);
        return;
      }

      // Validate submission
      const validationErrors = ValidationService.validateSubmission(submission);
      if (validationErrors.length > 0) {
        console.warn('[BE] Server Validation loi:', validationErrors);
        const response: APISubmitResponse = {
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
      IdempotencyStore.set(submission.idempotencyKey, submissionId);

      const response: APISubmitResponse = {
        success: true,
        submissionId,
        message: 'Cảm ơn bạn đã tham gia khảo sát!'
      };
      res.status(200).json(response);
    } catch (err: any) {
      console.error('[BE] Loi khi nop khao sat:', err);
      const response: APISubmitResponse = {
        success: false,
        message: 'Có lỗi hệ thống xảy ra khi lưu khảo sát.'
      };
      res.status(500).json(response);
    }
  }
}
