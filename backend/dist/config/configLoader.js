"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigLoader = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class ConfigLoader {
    static surveyConfigCache = null;
    static workerFieldsCache = null;
    static getSurveyConfig() {
        if (!this.surveyConfigCache) {
            const filePath = path_1.default.join(__dirname, 'survey.json');
            const rawData = fs_1.default.readFileSync(filePath, 'utf-8');
            this.surveyConfigCache = JSON.parse(rawData);
        }
        return this.surveyConfigCache;
    }
    static getWorkerFieldsConfig() {
        if (!this.workerFieldsCache) {
            const filePath = path_1.default.join(__dirname, 'worker-fields.json');
            const rawData = fs_1.default.readFileSync(filePath, 'utf-8');
            this.workerFieldsCache = JSON.parse(rawData);
        }
        return this.workerFieldsCache;
    }
    static reloadConfigs() {
        this.surveyConfigCache = null;
        this.workerFieldsCache = null;
    }
}
exports.ConfigLoader = ConfigLoader;
//# sourceMappingURL=configLoader.js.map