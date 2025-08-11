"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const evolutionApi_1 = __importDefault(require("../services/evolutionApi"));
const cartService_1 = __importDefault(require("../services/cartService"));
const router = express_1.default.Router();
router.get('/status', async (req, res) => {
    try {
        const status = await evolutionApi_1.default.getInstanceStatus();
        const response = {
            success: true,
            data: {
                instance: status,
                server: {
                    uptime: process.uptime(),
                    memory: process.memoryUsage(),
                    timestamp: new Date().toISOString()
                }
            },
            message: 'Status do bot obtido com sucesso'
        };
        res.json(response);
    }
    catch (error) {
        console.error('❌ Erro ao obter status do bot:', error);
        const response = {
            success: false,
            error: error.message || 'Erro interno do servidor'
        };
        res.status(500).json(response);
    }
});
router.post('/connect', async (req, res) => {
    try {
        const result = await evolutionApi_1.default.connectInstance();
        const response = {
            success: true,
            data: result,
            message: 'Tentativa de conexão iniciada'
        };
        res.json(response);
    }
    catch (error) {
        console.error('❌ Erro ao conectar bot:', error);
        const response = {
            success: false,
            error: error.message || 'Erro interno do servidor'
        };
        res.status(500).json(response);
    }
});
router.post('/disconnect', async (req, res) => {
    try {
        const result = await evolutionApi_1.default.logoutInstance();
        const response = {
            success: true,
            data: result,
            message: 'Bot desconectado com sucesso'
        };
        res.json(response);
    }
    catch (error) {
        console.error('❌ Erro ao desconectar bot:', error);
        const response = {
            success: false,
            error: error.message || 'Erro interno do servidor'
        };
        res.status(500).json(response);
    }
});
router.get('/qrcode', async (req, res) => {
    try {
        const qrCode = await evolutionApi_1.default.getQRCode();
        if (!qrCode) {
            const response = {
                success: false,
                error: 'QR Code não disponível. Verifique se a instância está desconectada.'
            };
            return res.status(404).json(response);
        }
        const response = {
            success: true,
            data: { qrCode },
            message: 'QR Code obtido com sucesso'
        };
        res.json(response);
    }
    catch (error) {
        console.error('❌ Erro ao obter QR Code:', error);
        const response = {
            success: false,
            error: error.message || 'Erro interno do servidor'
        };
        res.status(500).json(response);
    }
});
router.post('/send-test', async (req, res) => {
    try {
        const { phone, message } = req.body;
        if (!phone || !message) {
            const response = {
                success: false,
                error: 'Campos obrigatórios: phone, message'
            };
            return res.status(400).json(response);
        }
        const formattedPhone = phone.includes('@') ? phone : `${phone}@s.whatsapp.net`;
        const result = await evolutionApi_1.default.sendTextMessage(formattedPhone, message);
        const response = {
            success: true,
            data: result,
            message: 'Mensagem de teste enviada com sucesso'
        };
        res.json(response);
    }
    catch (error) {
        console.error('❌ Erro ao enviar mensagem de teste:', error);
        const response = {
            success: false,
            error: error.message || 'Erro interno do servidor'
        };
        res.status(500).json(response);
    }
});
router.get('/sessions/stats', async (req, res) => {
    try {
        const stats = await cartService_1.default.getSessionStats();
        const response = {
            success: true,
            data: stats,
            message: 'Estatísticas das sessões obtidas com sucesso'
        };
        res.json(response);
    }
    catch (error) {
        console.error('❌ Erro ao obter estatísticas das sessões:', error);
        const response = {
            success: false,
            error: error.message || 'Erro interno do servidor'
        };
        res.status(500).json(response);
    }
});
router.post('/sessions/cleanup', async (req, res) => {
    try {
        const hoursOld = parseInt(req.body.hours) || 24;
        const cleanedCount = cartService_1.default.cleanupInactiveSessions(hoursOld);
        const response = {
            success: true,
            data: { cleanedCount },
            message: `${cleanedCount} sessões inativas removidas (mais de ${hoursOld} horas)`
        };
        res.json(response);
    }
    catch (error) {
        console.error('❌ Erro ao limpar sessões:', error);
        const response = {
            success: false,
            error: error.message || 'Erro interno do servidor'
        };
        res.status(500).json(response);
    }
});
router.get('/sessions/:phone', async (req, res) => {
    try {
        const { phone } = req.params;
        const session = await cartService_1.default.getSession(phone);
        if (!session) {
            const response = {
                success: false,
                error: 'Sessão não encontrada para este cliente'
            };
            return res.status(404).json(response);
        }
        const response = {
            success: true,
            data: session,
            message: 'Sessão do cliente obtida com sucesso'
        };
        res.json(response);
    }
    catch (error) {
        console.error('❌ Erro ao obter sessão do cliente:', error);
        const response = {
            success: false,
            error: error.message || 'Erro interno do servidor'
        };
        res.status(500).json(response);
    }
});
router.delete('/sessions/:phone/cart', async (req, res) => {
    try {
        const { phone } = req.params;
        await cartService_1.default.clearCart(phone);
        const response = {
            success: true,
            message: 'Carrinho do cliente limpo com sucesso'
        };
        res.json(response);
    }
    catch (error) {
        console.error('❌ Erro ao limpar carrinho:', error);
        const response = {
            success: false,
            error: error.message || 'Erro interno do servidor'
        };
        res.status(500).json(response);
    }
});
router.post('/restart', async (req, res) => {
    try {
        await evolutionApi_1.default.logoutInstance();
        await new Promise(resolve => setTimeout(resolve, 2000));
        const result = await evolutionApi_1.default.connectInstance();
        const response = {
            success: true,
            data: result,
            message: 'Bot reiniciado com sucesso'
        };
        res.json(response);
    }
    catch (error) {
        console.error('❌ Erro ao reiniciar bot:', error);
        const response = {
            success: false,
            error: error.message || 'Erro interno do servidor'
        };
        res.status(500).json(response);
    }
});
router.get('/config', (req, res) => {
    try {
        const config = {
            instance_name: process.env.EVOLUTION_INSTANCE_NAME,
            company_name: process.env.COMPANY_NAME,
            company_phone: process.env.COMPANY_PHONE,
            company_address: process.env.COMPANY_ADDRESS,
            business_hours: process.env.BUSINESS_HOURS,
            auto_reply_enabled: process.env.AUTO_REPLY_ENABLED === 'true',
            session_timeout_hours: parseInt(process.env.SESSION_TIMEOUT_HOURS || '24'),
            low_stock_threshold: parseInt(process.env.LOW_STOCK_THRESHOLD || '5')
        };
        const response = {
            success: true,
            data: config,
            message: 'Configurações do bot obtidas com sucesso'
        };
        res.json(response);
    }
    catch (error) {
        console.error('❌ Erro ao obter configurações:', error);
        const response = {
            success: false,
            error: error.message || 'Erro interno do servidor'
        };
        res.status(500).json(response);
    }
});
router.get('/health', async (req, res) => {
    try {
        let whatsappStatus = 'unknown';
        let whatsappError = null;
        try {
            const status = await evolutionApi_1.default.getInstanceStatus();
            whatsappStatus = status?.connectionStatus || 'disconnected';
        }
        catch (error) {
            whatsappError = error.message;
        }
        const health = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            whatsapp: {
                status: whatsappStatus,
                error: whatsappError
            },
            services: {
                database: 'connected',
                evolution_api: whatsappStatus !== 'unknown' ? 'connected' : 'error'
            }
        };
        const response = {
            success: true,
            data: health,
            message: 'Status de saúde do bot obtido com sucesso'
        };
        res.json(response);
    }
    catch (error) {
        console.error('❌ Erro ao verificar saúde do bot:', error);
        const response = {
            success: false,
            error: error.message || 'Erro interno do servidor'
        };
        res.status(500).json(response);
    }
});
exports.default = router;
//# sourceMappingURL=botRoutes.js.map