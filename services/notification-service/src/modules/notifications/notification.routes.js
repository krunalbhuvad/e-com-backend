import express from 'express';
import { notificationController } from './notification.controller.js';
import { verifyJWT, requireRole } from 'shared/middleware/auth';

const router = express.Router();

// Admin-only debug endpoint. Why admin: notification content can be PII.
router.get('/', verifyJWT(), requireRole('admin'), notificationController.list);

export default router;
