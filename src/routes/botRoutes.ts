import express from 'express';
import evolutionApiService from '../services/evolutionApi';
import cartService from '../services/cartService';
import { ApiResponse } from '../types';

const router = express.Router();

// Status do bot
router.get('/status', async (req, res) => {
  try {
    const status = await evolutionApiService.getInstanceStatus();
    
    const response: ApiResponse<any> = {
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
    
    return res.json(response);
  } catch (error: any) {
    console.error('❌ Erro ao obter status do bot:', error);
    
    const response: ApiResponse = {
      success: false,
      error: error.message || 'Erro interno do servidor'
    };
    
    return res.status(500).json(response);
  }
});

// Conectar bot ao WhatsApp
router.post('/connect', async (req, res) => {
  try {
    const result = await evolutionApiService.connectInstance();
    
    const response: ApiResponse<any> = {
      success: true,
      data: result,
      message: 'Tentativa de conexão iniciada'
    };
    
    res.json(response);
  } catch (error: any) {
    console.error('❌ Erro ao conectar bot:', error);
    
    const response: ApiResponse = {
      success: false,
      error: error.message || 'Erro interno do servidor'
    };
    
    res.status(500).json(response);
  }
});

// Desconectar bot do WhatsApp
router.post('/disconnect', async (req, res) => {
  try {
    const result = await evolutionApiService.logoutInstance();
    
    const response: ApiResponse<any> = {
      success: true,
      data: result,
      message: 'Bot desconectado com sucesso'
    };
    
    return res.json(response);
  } catch (error: any) {
    console.error('❌ Erro ao obter configurações:', error);
    
    const response: ApiResponse = {
      success: false,
      error: error.message || 'Erro interno do servidor'
    };
    
    return res.status(500).json(response);
  }
});

// Obter QR Code para conexão
router.get('/qrcode', async (req, res) => {
  try {
    const qrCode = await evolutionApiService.getQRCode();
    
    if (!qrCode) {
      const response: ApiResponse = {
        success: false,
        error: 'QR Code não disponível. Verifique se a instância está desconectada.'
      };
      
      return res.status(404).json(response);
    }
    
    const response: ApiResponse<any> = {
      success: true,
      data: { qrCode },
      message: 'QR Code obtido com sucesso'
    };
    
    return res.json(response);
  } catch (error: any) {
    console.error('❌ Erro ao obter sessão:', error);
    
    const response: ApiResponse = {
      success: false,
      error: error.message || 'Erro interno do servidor'
    };
    
    return res.status(500).json(response);
  }
});

// Enviar mensagem de teste
router.post('/send-test', async (req, res) => {
  try {
    const { phone, message } = req.body;
    
    if (!phone || !message) {
      const response: ApiResponse = {
        success: false,
        error: 'Campos obrigatórios: phone, message'
      };
      
      return res.status(400).json(response);
    }
    
    // Formatar número de telefone
    const formattedPhone = phone.includes('@') ? phone : `${phone}@s.whatsapp.net`;
    
    const result = await evolutionApiService.sendTextMessage(formattedPhone, message);
    
    const response: ApiResponse<any> = {
      success: true,
      data: result,
      message: 'Mensagem de teste enviada com sucesso'
    };
    
    return res.json(response);
  } catch (error: any) {
    console.error('❌ Erro ao enviar mensagem de teste:', error);
    
    const response: ApiResponse = {
      success: false,
      error: error.message || 'Erro interno do servidor'
    };
    
    return res.status(500).json(response);
  }
});

// Estatísticas das sessões de conversa
router.get('/sessions/stats', async (req, res) => {
  try {
    const stats = await cartService.getSessionStats();
    
    const response: ApiResponse<any> = {
      success: true,
      data: stats,
      message: 'Estatísticas das sessões obtidas com sucesso'
    };
    
    return res.json(response);
  } catch (error: any) {
    console.error('❌ Erro ao obter estatísticas das sessões:', error);
    
    const response: ApiResponse = {
      success: false,
      error: error.message || 'Erro interno do servidor'
    };
    
    return res.status(500).json(response);
  }
});

// Limpar sessões inativas
router.post('/sessions/cleanup', async (req, res) => {
  try {
    const hoursOld = parseInt(req.body.hours) || 24;
    const cleanedCount = cartService.cleanupInactiveSessions(hoursOld);
    
    const response: ApiResponse<any> = {
      success: true,
      data: { cleanedCount },
      message: `${cleanedCount} sessões inativas removidas (mais de ${hoursOld} horas)`
    };
    
    return res.json(response);
  } catch (error: any) {
    console.error('❌ Erro ao limpar sessão:', error);
    
    const response: ApiResponse = {
      success: false,
      error: error.message || 'Erro interno do servidor'
    };
    
    return res.status(500).json(response);
  }
});

// Obter sessão de um cliente específico
router.get('/sessions/:phone', async (req, res) => {
  try {
    const { phone } = req.params;
    const session = await cartService.getSession(phone);
    
    if (!session) {
      const response: ApiResponse = {
        success: false,
        error: 'Sessão não encontrada para este cliente'
      };
      
      return res.status(404).json(response);
    }
    
    const response: ApiResponse<any> = {
      success: true,
      data: session,
      message: 'Sessão do cliente obtida com sucesso'
    };
    
    return res.json(response);
  } catch (error: any) {
    console.error('❌ Erro ao obter todas as sessões:', error);
    
    const response: ApiResponse = {
      success: false,
      error: error.message || 'Erro interno do servidor'
    };
    
    return res.status(500).json(response);
  }
});

// Limpar carrinho de um cliente específico
router.delete('/sessions/:phone/cart', async (req, res) => {
  try {
    const { phone } = req.params;
    await cartService.clearCart(phone);
    
    const response: ApiResponse = {
      success: true,
      message: 'Carrinho do cliente limpo com sucesso'
    };
    
    res.json(response);
  } catch (error: any) {
    console.error('❌ Erro ao limpar carrinho:', error);
    
    const response: ApiResponse = {
      success: false,
      error: error.message || 'Erro interno do servidor'
    };
    
    res.status(500).json(response);
  }
});

// Reiniciar instância do bot
router.post('/restart', async (req, res) => {
  try {
    // Primeiro desconectar
    await evolutionApiService.logoutInstance();
    
    // Aguardar um pouco
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Reconectar
    const result = await evolutionApiService.connectInstance();
    
    const response: ApiResponse<any> = {
      success: true,
      data: result,
      message: 'Bot reiniciado com sucesso'
    };
    
    res.json(response);
  } catch (error: any) {
    console.error('❌ Erro ao reiniciar bot:', error);
    
    const response: ApiResponse = {
      success: false,
      error: error.message || 'Erro interno do servidor'
    };
    
    res.status(500).json(response);
  }
});

// Configurações do bot
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
    
    const response: ApiResponse<any> = {
      success: true,
      data: config,
      message: 'Configurações do bot obtidas com sucesso'
    };
    
    return res.json(response);
  } catch (error: any) {
    console.error('❌ Erro ao atualizar configurações do bot:', error);
    
    const response: ApiResponse = {
      success: false,
      error: error.message || 'Erro interno do servidor'
    };
    
    return res.status(500).json(response);
  }
});

// Saúde do bot
router.get('/health', async (req, res) => {
  try {
    let whatsappStatus = 'unknown';
    let whatsappError = null;
    
    try {
      const status = await evolutionApiService.getInstanceStatus();
      whatsappStatus = status?.connectionStatus || 'disconnected';
    } catch (error: any) {
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
        database: 'connected', // Assumindo que está conectado se chegou até aqui
        evolution_api: whatsappStatus !== 'unknown' ? 'connected' : 'error'
      }
    };
    
    const response: ApiResponse<any> = {
      success: true,
      data: health,
      message: 'Status de saúde do bot obtido com sucesso'
    };
    
    res.json(response);
  } catch (error: any) {
    console.error('❌ Erro ao verificar saúde do bot:', error);
    
    const response: ApiResponse = {
      success: false,
      error: error.message || 'Erro interno do servidor'
    };
    
    res.status(500).json(response);
  }
});

export default router;