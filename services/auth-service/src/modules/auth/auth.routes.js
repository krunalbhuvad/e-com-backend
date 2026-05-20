import express from 'express';
import { authController } from './auth.controller.js';
import { verifyJWT } from 'shared/middleware/auth';

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.get('/me', verifyJWT(), authController.me);

export default router;
