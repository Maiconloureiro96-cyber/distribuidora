import express from 'express';
import productRoutes from './productRoutes';
import orderRoutes from './orderRoutes';
import reportRoutes from './reportRoutes';
import webhookRoutes from './webhookRoutes';
import botRoutes from './botRoutes';

const router = express.Router();

// Rota de saúde da API
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Distribuidora WhatsApp Bot API está funcionando',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Rotas principais
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/reports', reportRoutes);
router.use('/webhook', webhookRoutes);
router.use('/bot', botRoutes);

// Rota 404 para endpoints não encontrados
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint não encontrado',
    message: `Rota ${req.method} ${req.originalUrl} não existe`
  });
});

export default router;