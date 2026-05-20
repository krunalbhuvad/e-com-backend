import express from 'express';
import { productController } from './product.controller.js';
import { verifyJWT, requireRole } from 'shared/middleware/auth';

const router = express.Router();

router.get('/', productController.list);
router.get('/:id', productController.get);

router.post('/', verifyJWT(), requireRole('admin'), productController.create);
router.patch('/:id', verifyJWT(), requireRole('admin'), productController.update);

router.post('/reserve', verifyJWT(), productController.reserve);
router.post('/release', verifyJWT(), productController.release);

export default router;
