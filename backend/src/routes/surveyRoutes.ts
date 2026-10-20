import { Router } from 'express';
import { SurveyController } from '../controllers/surveyController';
import { AdminController } from '../controllers/adminController';

const router = Router();

// Public survey routes
router.get('/config', SurveyController.getConfig);
router.post('/submit', SurveyController.submitSurvey);

// Admin routes (protected by middleware inside controller)
router.post('/admin/login', AdminController.login);
router.get('/admin/submissions', AdminController.getSubmissions);
router.get('/admin/export', AdminController.exportExcel);
router.get('/admin/stats', AdminController.getStats);

export default router;
