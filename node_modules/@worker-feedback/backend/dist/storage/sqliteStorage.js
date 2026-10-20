"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqliteStorage = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const uuid_1 = require("uuid");
const configLoader_1 = require("../config/configLoader");
class SqliteStorage {
    db;
    static instance;
    constructor(dataDir) {
        const rootDataDir = dataDir || path_1.default.join(__dirname, '../../../data');
        if (!fs_1.default.existsSync(rootDataDir)) {
            fs_1.default.mkdirSync(rootDataDir, { recursive: true });
        }
        const dbPath = path_1.default.join(rootDataDir, 'responses.db');
        this.db = new better_sqlite3_1.default(dbPath);
        // Performance settings
        this.db.pragma('journal_mode = WAL');
        this.db.pragma('synchronous = NORMAL');
        this.initializeTables();
        console.log(`[SqliteStorage] Database khoi tao tai: ${dbPath}`);
    }
    // Singleton so admin routes share the same db instance
    static getInstance() {
        if (!SqliteStorage.instance) {
            SqliteStorage.instance = new SqliteStorage();
        }
        return SqliteStorage.instance;
    }
    initializeTables() {
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
    async saveSubmission(submission) {
        const submissionId = submission.submissionId || (0, uuid_1.v4)();
        submission.submissionId = submissionId;
        submission.submittedAt = submission.submittedAt || new Date().toISOString();
        const workerFields = configLoader_1.ConfigLoader.getWorkerFieldsConfig();
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
        const surveyConfig = configLoader_1.ConfigLoader.getSurveyConfig();
        const flattenValue = (questionId, val) => {
            if (val === undefined || val === null)
                return '';
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
    getAllSubmissions() {
        return this.db.prepare(`
      SELECT * FROM submissions ORDER BY id DESC
    `).all();
    }
    getAnswersForSubmission(submissionId) {
        return this.db.prepare(`
      SELECT submission_id, question_id, answer_value FROM answers WHERE submission_id = ?
    `).all(submissionId);
    }
    getAllAnswers() {
        return this.db.prepare(`
      SELECT submission_id, question_id, answer_value FROM answers ORDER BY submission_id
    `).all();
    }
    getStats() {
        const total = this.db.prepare('SELECT COUNT(*) as cnt FROM submissions').get().cnt;
        const todayStr = new Date().toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
        // Support both legacy vi-VN dates and ISO timestamps, using Vietnam's day boundary.
        const today = this.db.prepare(`
      SELECT COUNT(*) as cnt FROM submissions
      WHERE submitted_at LIKE ? OR date(submitted_at, '+7 hours') = date('now', '+7 hours')
    `).get(`%${todayStr}%`).cnt;
        const departments = this.db.prepare(`
      SELECT department as dept, COUNT(*) as count FROM submissions GROUP BY department ORDER BY count DESC
    `).all();
        return { total, today, departments };
    }
}
exports.SqliteStorage = SqliteStorage;
//# sourceMappingURL=sqliteStorage.js.map