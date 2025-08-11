"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const productRoutes_1 = __importDefault(require("./productRoutes"));
const orderRoutes_1 = __importDefault(require("./orderRoutes"));
const reportRoutes_1 = __importDefault(require("./reportRoutes"));
const webhookRoutes_1 = __importDefault(require("./webhookRoutes"));
const botRoutes_1 = __importDefault(require("./botRoutes"));
const router = express_1.default.Router();
router.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Distribuidora WhatsApp Bot API está funcionando',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});
router.use('/products', productRoutes_1.default);
router.use('/orders', orderRoutes_1.default);
router.use('/reports', reportRoutes_1.default);
router.use('/webhook', webhookRoutes_1.default);
router.use('/bot', botRoutes_1.default);
router.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint não encontrado',
        message: `Rota ${req.method} ${req.originalUrl} não existe`
    });
});
exports.default = router;
//# sourceMappingURL=index.js.map