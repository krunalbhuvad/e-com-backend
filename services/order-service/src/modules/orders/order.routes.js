import express from 'express';
import { orderController } from './order.controller.js';
import { verifyJWT } from 'shared/middleware/auth';

const router = express.Router();

router.use(verifyJWT());

router.post('/', orderController.create);
router.get('/', orderController.list);
router.get('/:id', orderController.get);
router.patch('/:id/status', orderController.changeStatus);

export default router;
