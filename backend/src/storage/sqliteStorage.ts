import path from 'path';
import fs from 'fs';
import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import { SurveySubmission } from '@worker-feedback/shared';
import { IResponseStorage } from './IResponseStorage';
import { ConfigLoader } from '../config/configLoader';

export interface SubmissionRow {
  id: number;
  submission_id: string;
  worker_id: string;
  worker_name: string;
  department: string;
  work_location: string;
  anonymous: number;
  submitted_at: string;
  survey_id: string;
  survey_version: string;
}

export interface AnswerRow {
  submission_id: string;
  question_id: string;
  answer_value: string;
}

export class SqliteStorage implements IResponseStorage {
  private db: Database.Database;
  private static instance: SqliteStorage;

  constructor(dataDir?: string) {
    const rootDataDir = dataDir || path.join(__dirname, '../../../data');
    if (!fs.existsSync(rootDataDir)) {
      fs.mkdirSync(rootDataDir, { recursive: true });
    }

    const dbPath = path.join(rootDataDir, 'responses.db');
    this.db = new Database(dbPath);

    // Performance settings
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('synchronous = NORMAL');

    this.initializeTables();
    console.log(`[SqliteStorage] Database khoi tao tai: ${dbPath}`);
  }

  // Singleton so admin routes share the same db instance
  public static getInstance(): SqliteStorage {
    if (!SqliteStorage.instance) {
      SqliteStorage.instance = new SqliteStorage();
    }
    return SqliteStorage.instance;
  }

  private initializeTables(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS submissions (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        submission_id TEXT NOT NULL UNIQUE,
        worker_id     TEXT NOT NULL,
        worker_name   TEXT NOT NULL,
        department    TEXT NOT NULL,
        work_location TEXT NOT NULL,
        anonymous     INTEGER NOT NULL DEFAULT 0,
        submitted_at  TEXT NOT NULL,
        survey_id     TEXT NOT NULL,
        survey_version TEXT NOT NULL,
        idempotency_key TEXT
      );

      CREATE TABLE IF NOT EXISTS answers (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        submission_id TEXT NOT NULL,
        question_id   TEXT NOT NULL,
        answer_value  TEXT,
        FOREIGN KEY (submission_id) REFERENCES submissions(submission_id)
      );

      CREATE INDEX IF NOT EXISTS idx_submissions_submission_id ON submissions(submission_id);
      CREATE INDEX IF NOT EXISTS idx_answers_submission_id ON answers(submission_id);
    `);
  }

  public async saveSubmission(submission: SurveySubmission): Promise<string> {
    const submissionId = submission.submissionId || uuidv4();
    submission.submissionId = submissionId;
    submission.submittedAt = submission.submittedAt || new Date().toISOString();

    const workerFields = ConfigLoader.getWorkerFieldsConfig();
    const deptLabel = workerFields.departments.find(d => d.value === submission.worker.department)?.label || submission.worker.department;
    const locLabel = workerFields.workLocations.find(l => l.value === submission.worker.workLocation)?.label || submission.worker.workLocation;

    const insertSubmission = this.db.prepare(`
      INSERT INTO submissions
        (submission_id, worker_id, worker_name, department, work_location, anonymous, submitted_at, survey_id, survey_version, idempotency_key)
      VALUES
        (@submissionId, @workerId, @workerName, @department, @workLocation, @anonymous, @submittedAt, @surveyId, @surveyVersion, @idempotencyKey)
    `);

    const insertAnswer = this.db.prepare(`
      INSERT INTO answers (submission_id, question_id, answer_value)
      VALUES (@submissionId, @questionId, @answerValue)
    `);

    const surveyConfig = ConfigLoader.getSurveyConfig();

    const flattenValue = (questionId: string, val: string | string[] | undefined): string => {
      if (val === undefined || val === null) return '';
      if (Array.isArray(val)) {
        const q = surveyConfig.questions.find(q => q.id === questionId);
        return val.map(v => q?.options?.find(o => o.value === v)?.label || v).join(', ');
      }
      return String(val);
    };

    const transaction = this.db.transaction(() => {
      insertSubmission.run({
        submissionId,
        workerId: submission.worker.workerId,
        workerName: submission.worker.name,
        department: deptLabel,
        workLocation: locLabel,
        // The anonymity selector is a UI preview only; identity is always retained.
        anonymous: 0,
        submittedAt: submission.submittedAt,
        surveyId: submission.surveyId,
        surveyVersion: submission.surveyVersion,
        idempotencyKey: submission.idempotencyKey || null
      });

      for (const answer of submission.answers) {
        insertAnswer.run({
          submissionId,
          questionId: answer.questionId,
          answerValue: flattenValue(answer.questionId, answer.value)
        });
      }
    });

    transaction();
    console.log(`[SqliteStorage] Ghi thanh cong - submissionId: ${submissionId}`);
    return submissionId;
  }

  // ─── Admin queries ────────────────────────────────────────
  public getAllSubmissions(): SubmissionRow[] {
    return this.db.prepare(`
      SELECT * FROM submissions ORDER BY id DESC
    `).all() as SubmissionRow[];
  }

  public getAnswersForSubmission(submissionId: string): AnswerRow[] {
    return this.db.prepare(`
      SELECT submission_id, question_id, answer_value FROM answers WHERE submission_id = ?
    `).all(submissionId) as AnswerRow[];
  }

  public getAllAnswers(): AnswerRow[] {
    return this.db.prepare(`
      SELECT submission_id, question_id, answer_value FROM answers ORDER BY submission_id
    `).all() as AnswerRow[];
  }

  public getStats(): { total: number; today: number; departments: { dept: string; count: number }[] } {
    const total = (this.db.prepare('SELECT COUNT(*) as cnt FROM submissions').get() as any).cnt;

    const todayStr = new Date().toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
    // Support both legacy vi-VN dates and ISO timestamps, using Vietnam's day boundary.
    const today = (this.db.prepare(`
      SELECT COUNT(*) as cnt FROM submissions
      WHERE submitted_at LIKE ? OR date(submitted_at, '+7 hours') = date('now', '+7 hours')
    `).get(`%${todayStr}%`) as any).cnt;

    const departments = this.db.prepare(`
      SELECT department as dept, COUNT(*) as count FROM submissions GROUP BY department ORDER BY count DESC
    `).all() as { dept: string; count: number }[];

    return { total, today, departments };
  }
}
