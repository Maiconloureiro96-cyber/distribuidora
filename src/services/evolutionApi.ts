import axios, { AxiosInstance } from 'axios';
import dotenv from 'dotenv';

dotenv.config();

class EvolutionApiService {
  private api: AxiosInstance;
  private instanceName: string;
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.EVOLUTION_API_URL || 'http://localhost:8080';
    this.apiKey = process.env.EVOLUTION_API_KEY || '';
    this.instanceName = process.env.EVOLUTION_INSTANCE_NAME || 'distribuidora_bot';

    this.api = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'apikey': this.apiKey
      },
      timeout: 30000
    });

    // Interceptor para logs
    this.api.interceptors.request.use(
      (config) => {
        console.log(`📤 Evolution API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('❌ Evolution API Request Error:', error);
        return Promise.reject(error);
      }
    );

    this.api.interceptors.response.use(
      (response) => {
        console.log(`📥 Evolution API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error('❌ Evolution API Response Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  // Criar instância do WhatsApp
  async createInstance(): Promise<any> {
    try {
      const response = await this.api.post('/instance/create', {
        instanceName: this.instanceName,
        token: this.apiKey,
        qrcode: true,
        webhook: process.env.WHATSAPP_WEBHOOK_URL,
        webhook_by_events: false,
        webhook_base64: false,
        events: [
          'APPLICATION_STARTUP',
          'QRCODE_UPDATED',
          'MESSAGES_UPSERT',
          'MESSAGES_UPDATE',
          'MESSAGES_DELETE',
          'SEND_MESSAGE',
          'CONTACTS_UPDATE',
          'CONTACTS_UPSERT',
          'PRESENCE_UPDATE',
          'CHATS_UPDATE',
          'CHATS_UPSERT',
          'CHATS_DELETE',
          'GROUPS_UPSERT',
          'GROUP_UPDATE',
          'GROUP_PARTICIPANTS_UPDATE',
          'CONNECTION_UPDATE'
        ]
      });
      
      console.log('✅ Instância do WhatsApp criada com sucesso');
      return response.data;
    } catch (error: any) {
      console.error('❌ Erro ao criar instância:', error.response?.data || error.message);
      throw error;
    }
  }

  // Conectar instância
  async connectInstance(): Promise<any> {
    try {
      const response = await this.api.get(`/instance/connect/${this.instanceName}`);
      console.log('✅ Instância conectada com sucesso');
      return response.data;
    } catch (error: any) {
      console.error('❌ Erro ao conectar instância:', error.response?.data || error.message);
      throw error;
    }
  }

  // Obter status da instância
  async getInstanceStatus(): Promise<any> {
    try {
      const response = await this.api.get(`/instance/connectionState/${this.instanceName}`);
      return response.data;
    } catch (error: any) {
      console.error('❌ Erro ao obter status da instância:', error.response?.data || error.message);
      throw error;
    }
  }

  // Enviar mensagem de texto
  async sendTextMessage(to: string, message: string): Promise<any> {
    try {
      const response = await this.api.post(`/message/sendText/${this.instanceName}`, {
        number: to,
        text: message
      });
      
      console.log(`📤 Mensagem enviada para ${to}`);
      return response.data;
    } catch (error: any) {
      console.error('❌ Erro ao enviar mensagem:', error.response?.data || error.message);
      throw error;
    }
  }

  // Enviar mensagem com botões
  async sendButtonMessage(to: string, message: string, buttons: any[]): Promise<any> {
    try {
      const response = await this.api.post(`/message/sendButtons/${this.instanceName}`, {
        number: to,
        text: message,
        buttons: buttons
      });
      
      console.log(`📤 Mensagem com botões enviada para ${to}`);
      return response.data;
    } catch (error: any) {
      console.error('❌ Erro ao enviar mensagem com botões:', error.response?.data || error.message);
      throw error;
    }
  }

  // Enviar lista interativa
  async sendListMessage(to: string, title: string, description: string, sections: any[]): Promise<any> {
    try {
      const response = await this.api.post(`/message/sendList/${this.instanceName}`, {
        number: to,
        title: title,
        description: description,
        sections: sections
      });
      
      console.log(`📤 Lista interativa enviada para ${to}`);
      return response.data;
    } catch (error: any) {
      console.error('❌ Erro ao enviar lista:', error.response?.data || error.message);
      throw error;
    }
  }

  // Marcar mensagem como lida
  async markMessageAsRead(messageId: string): Promise<any> {
    try {
      const response = await this.api.post(`/chat/markMessageAsRead/${this.instanceName}`, {
        read_messages: [{
          id: messageId,
          read: true
        }]
      });
      
      return response.data;
    } catch (error: any) {
      console.error('❌ Erro ao marcar mensagem como lida:', error.response?.data || error.message);
      throw error;
    }
  }

  // Obter QR Code
  async getQRCode(): Promise<any> {
    try {
      const response = await this.api.get(`/instance/qrcode/${this.instanceName}`);
      return response.data;
    } catch (error: any) {
      console.error('❌ Erro ao obter QR Code:', error.response?.data || error.message);
      throw error;
    }
  }

  // Logout da instância
  async logoutInstance(): Promise<any> {
    try {
      const response = await this.api.delete(`/instance/logout/${this.instanceName}`);
      console.log('✅ Logout realizado com sucesso');
      return response.data;
    } catch (error: any) {
      console.error('❌ Erro ao fazer logout:', error.response?.data || error.message);
      throw error;
    }
  }

  // Deletar instância
  async deleteInstance(): Promise<any> {
    try {
      const response = await this.api.delete(`/instance/delete/${this.instanceName}`);
      console.log('✅ Instância deletada com sucesso');
      return response.data;
    } catch (error: any) {
      console.error('❌ Erro ao deletar instância:', error.response?.data || error.message);
      throw error;
    }
  }
}

export default new EvolutionApiService();