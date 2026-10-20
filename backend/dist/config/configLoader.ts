import fs from 'fs';
import path from 'path';
import { SurveyConfig, WorkerFieldsConfig } from '@worker-feedback/shared';

export class ConfigLoader {
  private static surveyConfigCache: SurveyConfig | null = null;
  private static workerFieldsCache: WorkerFieldsConfig | null = null;

  public static getSurveyConfig(): SurveyConfig {
    if (!this.surveyConfigCache) {
      const filePath = path.join(__dirname, 'survey.json');
      const rawData = fs.readFileSync(filePath, 'utf-8');
      this.surveyConfigCache = JSON.parse(rawData);
    }
    return this.surveyConfigCache!;
  }

  public static getWorkerFieldsConfig(): WorkerFieldsConfig {
    if (!this.workerFieldsCache) {
      const filePath = path.join(__dirname, 'worker-fields.json');
      const rawData = fs.readFileSync(filePath, 'utf-8');
      this.workerFieldsCache = JSON.parse(rawData);
    }
    return this.workerFieldsCache!;
  }

  public static reloadConfigs(): void {
    this.surveyConfigCache = null;
    this.workerFieldsCache = null;
  }
}
