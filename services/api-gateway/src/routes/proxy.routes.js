import express from 'express';
import { proxyTo } from '../middleware/proxy.js';
import { getBreakerMetrics } from '../utils/breaker-registry.js';

const router = express.Router();

router.all('/auth/*', proxyTo('auth'));
router.all('/products/*', proxyTo('products'));
router.all('/orders/*', proxyTo('orders'));
router.all('/notifications/*', proxyTo('notifications'));

router.all('/auth', proxyTo('auth'));
router.all('/products', proxyTo('products'));
router.all('/orders', proxyTo('orders'));
router.all('/notifications', proxyTo('notifications'));

router.get('/metrics', (_req, res) => {
  res.json({ breakers: getBreakerMetrics() });
});

export default router;
