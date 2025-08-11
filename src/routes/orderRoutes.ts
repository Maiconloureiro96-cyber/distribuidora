import express from 'express';
import orderService from '../services/orderService';
import pdfService from '../services/pdfService';
import { ApiResponse, Order, OrderStatus } from '../types';

const router = express.Router();

// Listar todos os pedidos com paginação
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const orders = await orderService.getAllOrders(page, limit);
    
    const response: ApiResponse<{ orders: Order[], total: number }> = {
      success: true,
      data: orders,
      message: `${orders.orders.length} pedidos encontrados (página ${page})`
    };
    
    return res.json(response);
  } catch (error: any) {
    console.error('❌ Erro ao listar pedidos:', error);
    
    const response: ApiResponse = {
      success: false,
      error: error.message || 'Erro interno do servidor'
    };
    
    return res.status(500).json(response);
  }
});

// Buscar pedido por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const order = await orderService.getOrderById(id);
    
    if (!order) {
      const response: ApiResponse = {
        success: false,
        error: 'Pedido não encontrado'
      };
      
      return res.status(404).json(response);
    }
    
    const response: ApiResponse<Order> = {
      success: true,
      data: order
    };
    
    return res.json(response);
  } catch (error: any) {
    console.error('❌ Erro ao buscar pedido:', error);
    
    const response: ApiResponse = {
      success: false,
      error: error.message || 'Erro interno do servidor'
    };
    
    return res.status(500).json(response);
  }
});

// Buscar pedidos por telefone do cliente
router.get('/customer/:phone', async (req, res) => {
  try {
    const { phone } = req.params;
    const orders = await orderService.getOrdersByPhone(phone);
    
    const response: ApiResponse<Order[]> = {
      success: true,
      data: orders,
      message: `${orders.length} pedidos encontrados para o cliente ${phone}`
    };
    
    return res.json(response);
  } catch (error: any) {
    console.error('❌ Erro ao buscar pedidos do cliente:', error);
    
    const response: ApiResponse = {
      success: false,
      error: error.message || 'Erro interno do servidor'
    };
    
    return res.status(500).json(response);
  }
});

// Buscar último pedido de um cliente
router.get('/customer/:phone/last', async (req, res) => {
  try {
    const { phone } = req.params;
    const order = await orderService.getLastOrderByPhone(phone);
    
    if (!order) {
      const response: ApiResponse = {
        success: false,
        error: 'Nenhum pedido encontrado para este cliente'
      };
      
      return res.status(404).json(response);
    }
    
    const response: ApiResponse<Order> = {
      success: true,
      data: order,
      message: 'Último pedido do cliente encontrado'
    };
    
    return res.json(response);
  } catch (error: any) {
    console.error('❌ Erro ao buscar último pedido do cliente:', error);
    
    const response: ApiResponse = {
      success: false,
      error: error.message || 'Erro interno do servidor'
    };
    
    return res.status(500).json(response);
  }
});

// Listar pedidos por status
router.get('/status/:status', async (req, res) => {
  try {
    const { status } = req.params;
    
    // Validar status
    const validStatuses: OrderStatus[] = [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED, OrderStatus.CANCELLED];
    if (!validStatuses.includes(status as OrderStatus)) {
      const response: ApiResponse = {
        success: false,
        error: `Status inválido. Valores aceitos: ${validStatuses.join(', ')}`
      };
      
      return res.status(400).json(response);
    }
    
    const orders = await orderService.getOrdersByStatus(status as OrderStatus);
    
    const response: ApiResponse<Order[]> = {
      success: true,
      data: orders,
      message: `${orders.length} pedidos encontrados com status "${status}"`
    };
    
    return res.json(response);
  } catch (error: any) {
    console.error('❌ Erro ao buscar pedidos por status:', error);
    
    const response: ApiResponse = {
      success: false,
      error: error.message || 'Erro interno do servidor'
    };
    
    return res.status(500).json(response);
  }
});

// Criar novo pedido
router.post('/', async (req, res) => {
  try {
    const orderData = req.body;
    
    // Validação básica
    if (!orderData.customer_phone || !orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
      const response: ApiResponse = {
        success: false,
        error: 'Campos obrigatórios: customer_phone, items (array não vazio)'
      };
      
      return res.status(400).json(response);
    }
    
    // Validar itens do pedido
    for (const item of orderData.items) {
      if (!item.product_id || !item.quantity || item.quantity <= 0) {
        const response: ApiResponse = {
          success: false,
          error: 'Cada item deve ter product_id e quantity > 0'
        };
        
        return res.status(400).json(response);
      }
    }
    
    const order = await orderService.createOrder(orderData);
    
    if (!order) {
      const response: ApiResponse = {
        success: false,
        error: 'Erro ao criar pedido. Verifique se os produtos existem e há estoque suficiente'
      };
      
      return res.status(400).json(response);
    }
    
    const response: ApiResponse<Order> = {
      success: true,
      data: order,
      message: 'Pedido criado com sucesso'
    };
    
    return res.status(201).json(response);
  } catch (error: any) {
    console.error('❌ Erro ao criar pedido:', error);
    
    const response: ApiResponse = {
      success: false,
      error: error.message || 'Erro interno do servidor'
    };
    
    return res.status(500).json(response);
  }
});

// Atualizar status do pedido
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Validar status
    const validStatuses: OrderStatus[] = [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED, OrderStatus.CANCELLED];
    if (!validStatuses.includes(status)) {
      const response: ApiResponse = {
        success: false,
        error: `Status inválido. Valores aceitos: ${validStatuses.join(', ')}`
      };
      
      return res.status(400).json(response);
    }
    
    const success = await orderService.updateOrderStatus(id, status);
    
    if (!success) {
      const response: ApiResponse = {
        success: false,
        error: 'Erro ao atualizar status ou pedido não encontrado'
      };
      
      return res.status(404).json(response);
    }
    
    const response: ApiResponse = {
      success: true,
      message: `Status do pedido atualizado para "${status}"`
    };
    
    return res.json(response);
  } catch (error: any) {
    console.error('❌ Erro ao atualizar status do pedido:', error);
    
    const response: ApiResponse = {
      success: false,
      error: error.message || 'Erro interno do servidor'
    };
    
    return res.status(500).json(response);
  }
});

// Cancelar pedido
router.patch('/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const success = await orderService.cancelOrder(id, reason);
    
    if (!success) {
      const response: ApiResponse = {
        success: false,
        error: 'Erro ao cancelar pedido ou pedido não encontrado'
      };
      
      return res.status(404).json(response);
    }
    
    const response: ApiResponse = {
      success: true,
      message: 'Pedido cancelado com sucesso. Estoque restaurado.'
    };
    
    return res.json(response);
  } catch (error: any) {
    console.error('❌ Erro ao cancelar pedido:', error);
    
    const response: ApiResponse = {
      success: false,
      error: error.message || 'Erro interno do servidor'
    };
    
    return res.status(500).json(response);
  }
});

// Gerar PDF do pedido
router.get('/:id/pdf', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Buscar o pedido
    const order = await orderService.getOrderById(id);
    
    if (!order) {
      const response: ApiResponse = {
        success: false,
        error: 'Pedido não encontrado'
      };
      
      return res.status(404).json(response);
    }
    
    // Gerar PDF
    const pdfPath = await pdfService.generateOrderPDF(order);
    
    if (!pdfPath) {
      const response: ApiResponse = {
        success: false,
        error: 'Erro ao gerar PDF do pedido'
      };
      
      return res.status(500).json(response);
    }
    
    // Enviar o arquivo PDF
    res.download(pdfPath, `pedido-${order.id}.pdf`, (err) => {
      if (err) {
        console.error('❌ Erro ao enviar PDF:', err);
        
        const response: ApiResponse = {
          success: false,
          error: 'Erro ao enviar PDF'
        };
        
        res.status(500).json(response);
      }
    });
    
    return;
  } catch (error: any) {
    console.error('❌ Erro ao gerar PDF do pedido:', error);
    
    const response: ApiResponse = {
      success: false,
      error: error.message || 'Erro interno do servidor'
    };
    
    return res.status(500).json(response);
  }
});

// Listar PDFs gerados
router.get('/pdfs/list', async (req, res) => {
  try {
    const pdfs = await pdfService.listGeneratedPDFs();
    
    const response: ApiResponse<string[]> = {
      success: true,
      data: pdfs,
      message: `${pdfs.length} PDFs encontrados`
    };
    
    res.json(response);
  } catch (error: any) {
    console.error('❌ Erro ao listar PDFs:', error);
    
    const response: ApiResponse = {
      success: false,
      error: error.message || 'Erro interno do servidor'
    };
    
    res.status(500).json(response);
  }
});

// Limpar PDFs antigos
router.delete('/pdfs/cleanup', async (req, res) => {
  try {
    const daysOld = parseInt(req.query.days as string) || 7;
    const deletedCount = await pdfService.cleanupOldPDFs(daysOld);
    
    const response: ApiResponse<{ deletedCount: number }> = {
      success: true,
      data: { deletedCount },
      message: `${deletedCount} PDFs antigos removidos (mais de ${daysOld} dias)`
    };
    
    return res.json(response);
  } catch (error: any) {
    console.error('❌ Erro ao limpar PDFs:', error);
    
    const response: ApiResponse = {
      success: false,
      error: error.message || 'Erro interno do servidor'
    };
    
    return res.status(500).json(response);
  }
});

export default router;