import express from 'express';
import botController from '../controllers/botController';
import { WhatsAppWebhookPayload, WhatsAppWebhookBatchPayload, ApiResponse } from '../types';

const router = express.Router();

// Webhook para receber mensagens do WhatsApp via Evolution API
router.post('/whatsapp', async (req, res) => {
  try {
    console.log('📨 Webhook recebido:', JSON.stringify(req.body, null, 2));
    
    const webhookData: WhatsAppWebhookBatchPayload = req.body;
    
    // Validação básica do webhook
    if (!webhookData || !webhookData.data) {
      console.log('⚠️ Webhook inválido: dados ausentes');
      
      const response: ApiResponse = {
        success: false,
        error: 'Dados do webhook ausentes'
      };
      
      return res.status(400).json(response);
    }
    
    // Verificar se é uma mensagem
    if (webhookData.event !== 'messages.upsert') {
      console.log(`ℹ️ Evento ignorado: ${webhookData.event}`);
      
      const response: ApiResponse = {
        success: true,
        message: `Evento ${webhookData.event} ignorado`
      };
      
      return res.json(response);
    }
    
    // Verificar se há mensagens no payload
    if (!webhookData.data.messages || !Array.isArray(webhookData.data.messages) || webhookData.data.messages.length === 0) {
      console.log('⚠️ Nenhuma mensagem encontrada no webhook');
      
      const response: ApiResponse = {
        success: true,
        message: 'Nenhuma mensagem para processar'
      };
      
      return res.json(response);
    }
    
    // Processar cada mensagem
    for (const message of webhookData.data.messages) {
      try {
        // Ignorar mensagens enviadas pelo próprio bot
        if (message.key.fromMe) {
          console.log('ℹ️ Mensagem própria ignorada');
          continue;
        }
        
        // Ignorar mensagens de status
        if (message.key.remoteJid?.includes('@broadcast')) {
          console.log('ℹ️ Mensagem de status ignorada');
          continue;
        }
        
        // Processar mensagem através do bot controller
        console.log(`🤖 Processando mensagem de ${message.key.remoteJid}`);
        const messagePayload: WhatsAppWebhookPayload = {
          instance: webhookData.instance,
          event: webhookData.event,
          data: message,
          destination: webhookData.destination,
          date_time: webhookData.date_time
        };
        await botController.processMessage(messagePayload);
        
      } catch (messageError: any) {
        console.error('❌ Erro ao processar mensagem individual:', messageError);
        // Continuar processando outras mensagens mesmo se uma falhar
      }
    }
    
    const response: ApiResponse = {
      success: true,
      message: `${webhookData.data.messages.length} mensagem(ns) processada(s)`
    };
    
    return res.json(response);
    
  } catch (error: any) {
    console.error('❌ Erro no webhook do WhatsApp:', error);
    
    const response: ApiResponse = {
      success: false,
      error: error.message || 'Erro interno do servidor'
    };
    
    return res.status(500).json(response);
  }
});

// Webhook para eventos de conexão
router.post('/connection', async (req, res) => {
  try {
    console.log('🔗 Evento de conexão recebido:', JSON.stringify(req.body, null, 2));
    
    const connectionData = req.body;
    
    // Log do status da conexão
    if (connectionData.event === 'connection.update') {
      const status = connectionData.data?.state;
      console.log(`📱 Status da conexão: ${status}`);
      
      switch (status) {
        case 'open':
          console.log('✅ WhatsApp conectado com sucesso!');
          break;
        case 'close':
          console.log('❌ Conexão do WhatsApp fechada');
          break;
        case 'connecting':
          console.log('🔄 Conectando ao WhatsApp...');
          break;
        default:
          console.log(`ℹ️ Status desconhecido: ${status}`);
      }
    }
    
    const response: ApiResponse = {
      success: true,
      message: 'Evento de conexão processado'
    };
    
    res.json(response);
    
  } catch (error: any) {
    console.error('❌ Erro no webhook de conexão:', error);
    
    const response: ApiResponse = {
      success: false,
      error: error.message || 'Erro interno do servidor'
    };
    
    res.status(500).json(response);
  }
});

// Webhook para eventos de QR Code
router.post('/qrcode', async (req, res) => {
  try {
    console.log('📱 QR Code recebido:', JSON.stringify(req.body, null, 2));
    
    const qrData = req.body;
    
    if (qrData.event === 'qrcode.updated' && qrData.data?.qrcode) {
      console.log('📱 Novo QR Code disponível para escaneamento');
      console.log('QR Code:', qrData.data.qrcode);
    }
    
    const response: ApiResponse = {
      success: true,
      message: 'QR Code processado'
    };
    
    res.json(response);
    
  } catch (error: any) {
    console.error('❌ Erro no webhook de QR Code:', error);
    
    const response: ApiResponse = {
      success: false,
      error: error.message || 'Erro interno do servidor'
    };
    
    res.status(500).json(response);
  }
});

// Webhook genérico para outros eventos
router.post('/events', async (req, res) => {
  try {
    console.log('📡 Evento genérico recebido:', JSON.stringify(req.body, null, 2));
    
    const eventData = req.body;
    
    // Log de eventos importantes
    switch (eventData.event) {
      case 'messages.delete':
        console.log('🗑️ Mensagem deletada');
        break;
      case 'messages.update':
        console.log('✏️ Mensagem atualizada');
        break;
      case 'presence.update':
        console.log('👁️ Status de presença atualizado');
        break;
      case 'chats.upsert':
        console.log('💬 Chat criado/atualizado');
        break;
      case 'chats.update':
        console.log('💬 Chat atualizado');
        break;
      case 'chats.delete':
        console.log('🗑️ Chat deletado');
        break;
      case 'contacts.upsert':
        console.log('👤 Contato criado/atualizado');
        break;
      case 'contacts.update':
        console.log('👤 Contato atualizado');
        break;
      default:
        console.log(`ℹ️ Evento não tratado: ${eventData.event}`);
    }
    
    const response: ApiResponse = {
      success: true,
      message: `Evento ${eventData.event} processado`
    };
    
    res.json(response);
    
  } catch (error: any) {
    console.error('❌ Erro no webhook de eventos:', error);
    
    const response: ApiResponse = {
      success: false,
      error: error.message || 'Erro interno do servidor'
    };
    
    res.status(500).json(response);
  }
});

// Endpoint para testar o webhook
router.get('/test', (req, res) => {
  const response: ApiResponse = {
    success: true,
    message: 'Webhook está funcionando',
    data: {
      timestamp: new Date().toISOString(),
      server: 'Distribuidora WhatsApp Bot',
      version: '1.0.0'
    }
  };
  
  res.json(response);
});

// Endpoint para verificar saúde do webhook
router.get('/health', (req, res) => {
  const response: ApiResponse = {
    success: true,
    message: 'Webhook saudável',
    data: {
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      memory: process.memoryUsage()
    }
  };
  
  res.json(response);
});

export default router;