import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import routes from './routes';
import { testSupabaseConnection } from './config/supabase';
import evolutionApiService from './services/evolutionApi';
import cartService from './services/cartService';

// Carregar variáveis de ambiente
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de log de requisições
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  
  // Log do body apenas para POST/PUT/PATCH e se não for muito grande
  if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
    const bodyStr = JSON.stringify(req.body);
    if (bodyStr.length < 1000) {
      console.log(`[${timestamp}] Body:`, req.body);
    } else {
      console.log(`[${timestamp}] Body: [${bodyStr.length} caracteres]`);
    }
  }
  
  next();
});

// Middleware de tratamento de erros
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Erro não tratado:', err);
  
  res.status(500).json({
    success: false,
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Algo deu errado'
  });
});

// Servir arquivos estáticos da interface web
app.use(express.static(path.join(__dirname, 'public')));

// Rotas principais da API
app.use('/api', routes);

// Rota para API info
app.get('/api', (req, res) => {
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

// Rota raiz - redirecionar para o dashboard
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Middleware para rotas não encontradas
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

// Função para inicializar serviços
async function initializeServices() {
  console.log('🚀 Inicializando serviços...');
  
  try {
    // Testar conexão com Supabase
    console.log('📊 Testando conexão com Supabase...');
    await testSupabaseConnection();
    console.log('✅ Supabase conectado com sucesso!');
    
    // Inicializar Evolution API
    console.log('📱 Inicializando Evolution API...');
    try {
      await evolutionApiService.createInstance();
      console.log('✅ Evolution API inicializada!');
      
      // Tentar conectar automaticamente
      console.log('🔗 Tentando conectar ao WhatsApp...');
      await evolutionApiService.connectInstance();
      console.log('✅ Conexão com WhatsApp iniciada!');
      
    } catch (evolutionError: any) {
      console.log('⚠️ Erro na Evolution API (continuando):', evolutionError.message);
      console.log('💡 Você pode conectar manualmente via /api/bot/connect');
    }
    
    // Limpeza automática de sessões inativas (a cada hora)
    setInterval(async () => {
      try {
        console.log('🧹 Limpando sessões inativas...');
        const cleaned = cartService.cleanupInactiveSessions(24);
        if (cleaned > 0) {
          console.log(`✅ ${cleaned} sessões inativas removidas`);
        }
      } catch (error: any) {
        console.error('❌ Erro na limpeza de sessões:', error.message);
      }
    }, 60 * 60 * 1000); // 1 hora
    
    console.log('🎉 Todos os serviços inicializados!');
    
  } catch (error: any) {
    console.error('❌ Erro ao inicializar serviços:', error);
    console.log('⚠️ Alguns serviços podem não estar funcionando corretamente');
  }
}

// Função para graceful shutdown
function setupGracefulShutdown() {
  const shutdown = async (signal: string) => {
    console.log(`\n🛑 Recebido sinal ${signal}. Iniciando shutdown graceful...`);
    
    try {
      // Desconectar Evolution API
      console.log('📱 Desconectando Evolution API...');
      await evolutionApiService.logoutInstance();
      console.log('✅ Evolution API desconectada');
      
    } catch (error: any) {
      console.error('❌ Erro no shutdown:', error.message);
    }
    
    console.log('👋 Shutdown concluído. Até logo!');
    process.exit(0);
  };
  
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

// Iniciar servidor
export async function startServer() {
  try {
    // Configurar graceful shutdown
    setupGracefulShutdown();
    
    // Inicializar serviços
    await initializeServices();
    
    // Iniciar servidor HTTP
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
    
  } catch (error: any) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

// Tratamento de erros não capturados
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Iniciar aplicação
if (require.main === module) {
  startServer();
}

export default app;