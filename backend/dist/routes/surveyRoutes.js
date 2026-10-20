"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const surveyController_1 = require("../controllers/surveyController");
const adminController_1 = require("../controllers/adminController");
const router = (0, express_1.Router)();
// Public survey routes
router.get('/config', surveyController_1.SurveyController.getConfig);
router.post('/submit', surveyController_1.SurveyController.submitSurvey);
// Admin routes (protected by middleware inside controller)
router.post('/admin/login', adminController_1.AdminController.login);
router.get('/admin/submissions', adminController_1.AdminController.getSubmissions);
router.get('/admin/export', adminController_1.AdminController.exportExcel);
router.get('/admin/stats', adminController_1.AdminController.getStats);
exports.default = router;
//# sourceMappingURL=surveyRoutes.js.map