import { SurveyConfig, WorkerFieldsConfig } from '@worker-feedback/shared';
export declare class ConfigLoader {
    private static surveyConfigCache;
    private static workerFieldsCache;
    static getSurveyConfig(): SurveyConfig;
    static getWorkerFieldsConfig(): WorkerFieldsConfig;
    static reloadConfigs(): void;
}
//# sourceMappingURL=configLoader.d.ts.map