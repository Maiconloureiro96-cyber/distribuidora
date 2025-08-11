"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const routes_1 = __importDefault(require("./routes"));
const supabase_1 = require("./config/supabase");
const evolutionApi_1 = __importDefault(require("./services/evolutionApi"));
const cartService_1 = __importDefault(require("./services/cartService"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
        const bodyStr = JSON.stringify(req.body);
        if (bodyStr.length < 1000) {
            console.log(`[${timestamp}] Body:`, req.body);
        }
        else {
            console.log(`[${timestamp}] Body: [${bodyStr.length} caracteres]`);
        }
    }
    next();
});
app.use((err, req, res, next) => {
    console.error('❌ Erro não tratado:', err);
    res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Algo deu errado'
    });
});
app.use('/api', routes_1.default);
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Distribuidora WhatsApp Bot API',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        endpoints: {
            health: '/api/health',
            products: '/api/products',
            orders: '/api/orders',
            reports: '/api/reports',
            webhook: '/api/webhook',
            bot: '/api/bot'
        }
    });
});
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Rota não encontrada',
        message: `Endpoint ${req.method} ${req.originalUrl} não existe`,
        availableEndpoints: {
            health: '/api/health',
            products: '/api/products',
            orders: '/api/orders',
            reports: '/api/reports',
            webhook: '/api/webhook',
            bot: '/api/bot'
        }
    });
});
async function initializeServices() {
    console.log('🚀 Inicializando serviços...');
    try {
        console.log('📊 Testando conexão com Supabase...');
        await (0, supabase_1.testSupabaseConnection)();
        console.log('✅ Supabase conectado com sucesso!');
        console.log('📱 Inicializando Evolution API...');
        try {
            await evolutionApi_1.default.createInstance();
            console.log('✅ Evolution API inicializada!');
            console.log('🔗 Tentando conectar ao WhatsApp...');
            await evolutionApi_1.default.connectInstance();
            console.log('✅ Conexão com WhatsApp iniciada!');
        }
        catch (evolutionError) {
            console.log('⚠️ Erro na Evolution API (continuando):', evolutionError.message);
            console.log('💡 Você pode conectar manualmente via /api/bot/connect');
        }
        setInterval(async () => {
            try {
                console.log('🧹 Limpando sessões inativas...');
                const cleaned = cartService_1.default.cleanupInactiveSessions(24);
                if (cleaned > 0) {
                    console.log(`✅ ${cleaned} sessões inativas removidas`);
                }
            }
            catch (error) {
                console.error('❌ Erro na limpeza de sessões:', error.message);
            }
        }, 60 * 60 * 1000);
        console.log('🎉 Todos os serviços inicializados!');
    }
    catch (error) {
        console.error('❌ Erro ao inicializar serviços:', error);
        console.log('⚠️ Alguns serviços podem não estar funcionando corretamente');
    }
}
function setupGracefulShutdown() {
    const shutdown = async (signal) => {
        console.log(`\n🛑 Recebido sinal ${signal}. Iniciando shutdown graceful...`);
        try {
            console.log('📱 Desconectando Evolution API...');
            await evolutionApi_1.default.logoutInstance();
            console.log('✅ Evolution API desconectada');
        }
        catch (error) {
            console.error('❌ Erro no shutdown:', error.message);
        }
        console.log('👋 Shutdown concluído. Até logo!');
        process.exit(0);
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
}
async function startServer() {
    try {
        setupGracefulShutdown();
        await initializeServices();
        app.listen(PORT, () => {
            console.log('\n' + '='.repeat(50));
            console.log('🎉 DISTRIBUIDORA WHATSAPP BOT');
            console.log('='.repeat(50));
            console.log(`🚀 Servidor rodando na porta ${PORT}`);
            console.log(`🌐 URL: http://localhost:${PORT}`);
            console.log(`📚 API Docs: http://localhost:${PORT}/api/health`);
            console.log(`📱 Bot Status: http://localhost:${PORT}/api/bot/status`);
            console.log(`🔗 Webhook: http://localhost:${PORT}/api/webhook/whatsapp`);
            console.log('='.repeat(50));
            console.log('✅ Sistema pronto para uso!');
            console.log('='.repeat(50) + '\n');
        });
    }
    catch (error) {
        console.error('❌ Erro ao iniciar servidor:', error);
        process.exit(1);
    }
}
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
});
if (require.main === module) {
    startServer();
}
exports.default = app;
//# sourceMappingURL=server.js.map