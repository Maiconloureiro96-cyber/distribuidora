import { supabase } from '../config/supabase';
import { Order, OrderItem, OrderStatus, Cart, CartItem } from '../types';
import productService from './productService';
import evolutionApi from './evolutionApi';

class OrderService {
  // Criar novo pedido
  async createOrder(cart: Cart, customerName?: string, deliveryAddress?: string, notes?: string): Promise<Order | null> {
    try {
      // Verificar estoque antes de criar o pedido
      for (const item of cart.items) {
        const hasStock = await productService.checkStock(item.product_id, item.quantity);
        if (!hasStock) {
          throw new Error(`Produto ${item.product_name} não possui estoque suficiente`);
        }
      }

      // Criar o pedido
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_phone: cart.phone,
          customer_name: customerName,
          status: OrderStatus.PENDING,
          delivery_address: deliveryAddress,
          notes: notes,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (orderError) {
        console.error('❌ Erro ao criar pedido:', orderError);
        throw orderError;
      }

      // Criar os itens do pedido
      const orderItems = cart.items.map(item => ({
        order_id: orderData.id,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('❌ Erro ao criar itens do pedido:', itemsError);
        // Reverter criação do pedido
        await supabase.from('orders').delete().eq('id', orderData.id);
        throw itemsError;
      }

      // Reduzir estoque dos produtos
      for (const item of cart.items) {
        await productService.reduceStock(item.product_id, item.quantity);
      }

      // Buscar o pedido completo com itens
      const completeOrder = await this.getOrderById(orderData.id);
      
      console.log('✅ Pedido criado com sucesso:', orderData.id);
      return completeOrder;
    } catch (error) {
      console.error('❌ Erro no serviço de pedidos:', error);
      throw error;
    }
  }

  // Buscar pedido por ID
  async getOrderById(id: string): Promise<Order | null> {
    try {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .single();

      if (orderError) {
        if (orderError.code === 'PGRST116') {
          return null; // Pedido não encontrado
        }
        console.error('❌ Erro ao buscar pedido:', orderError);
        throw orderError;
      }

      // Buscar itens do pedido
      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', id);

      if (itemsError) {
        console.error('❌ Erro ao buscar itens do pedido:', itemsError);
        throw itemsError;
      }

      return {
        ...orderData,
        items: itemsData || []
      };
    } catch (error) {
      console.error('❌ Erro no serviço de pedidos:', error);
      throw error;
    }
  }

  // Buscar pedidos por telefone do cliente
  async getOrdersByPhone(phone: string): Promise<Order[]> {
    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_phone', phone)
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.error('❌ Erro ao buscar pedidos por telefone:', ordersError);
        throw ordersError;
      }

      // Buscar itens para cada pedido
      const orders: Order[] = [];
      for (const order of ordersData || []) {
        const { data: itemsData } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', order.id);

        orders.push({
          ...order,
          items: itemsData || []
        });
      }

      return orders;
    } catch (error) {
      console.error('❌ Erro no serviço de pedidos:', error);
      throw error;
    }
  }

  // Atualizar status do pedido
  async updateOrderStatus(orderId: string, status: OrderStatus, notifyCustomer: boolean = true): Promise<boolean> {
    try {
      const updateData: any = {
        status: status,
        updated_at: new Date().toISOString()
      };

      // Se o status for entregue, adicionar timestamp de entrega
      if (status === OrderStatus.DELIVERED) {
        updateData.delivered_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) {
        console.error('❌ Erro ao atualizar status do pedido:', error);
        return false;
      }

      // Notificar cliente se solicitado
      if (notifyCustomer) {
        await this.notifyCustomerStatusUpdate(orderId, status);
      }

      console.log(`✅ Status do pedido ${orderId} atualizado para: ${status}`);
      return true;
    } catch (error) {
      console.error('❌ Erro no serviço de pedidos:', error);
      return false;
    }
  }

  // Notificar cliente sobre atualização de status
  private async notifyCustomerStatusUpdate(orderId: string, status: OrderStatus): Promise<void> {
    try {
      const order = await this.getOrderById(orderId);
      if (!order) {
        console.error('❌ Pedido não encontrado para notificação');
        return;
      }

      let message = '';
      const companyName = process.env.COMPANY_NAME || 'Distribuidora';

      switch (status) {
        case OrderStatus.CONFIRMED:
          // Calcular total a partir dos itens do pedido
          let totalAmount = 0;
          if (order.items) {
            order.items.forEach((item: any) => {
              totalAmount += item.total_price;
            });
          }
          message = `🎉 *Pedido Confirmado!*\n\nSeu pedido #${orderId.slice(-8)} foi confirmado e está sendo preparado.\n\n📦 Total: R$ ${totalAmount.toFixed(2)}\n\nObrigado por escolher ${companyName}!`;
          break;
        case OrderStatus.PREPARING:
          message = `👨‍🍳 *Preparando seu Pedido*\n\nSeu pedido #${orderId.slice(-8)} está sendo preparado com carinho.\n\nEm breve sairá para entrega! 🚚`;
          break;
        case OrderStatus.OUT_FOR_DELIVERY:
          message = `🚚 *Saiu para Entrega!*\n\nSeu pedido #${orderId.slice(-8)} saiu para entrega!\n\nNosso entregador está a caminho. 📍`;
          break;
        case OrderStatus.DELIVERED:
          message = `✅ *Pedido Entregue!*\n\nSeu pedido #${orderId.slice(-8)} foi entregue com sucesso!\n\nObrigado pela preferência! Volte sempre! 🙏`;
          break;
        case OrderStatus.CANCELLED:
          message = `❌ *Pedido Cancelado*\n\nInfelizmente seu pedido #${orderId.slice(-8)} foi cancelado.\n\nSe tiver dúvidas, entre em contato conosco.`;
          break;
      }

      if (message) {
        await evolutionApi.sendTextMessage(order.customer_phone, message);
      }
    } catch (error) {
      console.error('❌ Erro ao notificar cliente:', error);
    }
  }

  // Listar pedidos por status
  async getOrdersByStatus(status: OrderStatus): Promise<Order[]> {
    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.error('❌ Erro ao buscar pedidos por status:', ordersError);
        throw ordersError;
      }

      // Buscar itens para cada pedido
      const orders: Order[] = [];
      for (const order of ordersData || []) {
        const { data: itemsData } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', order.id);

        orders.push({
          ...order,
          items: itemsData || []
        });
      }

      return orders;
    } catch (error) {
      console.error('❌ Erro no serviço de pedidos:', error);
      throw error;
    }
  }

  // Listar todos os pedidos com paginação
  async getAllOrders(page: number = 1, limit: number = 50): Promise<{ orders: Order[], total: number }> {
    try {
      const offset = (page - 1) * limit;

      // Contar total de pedidos
      const { count, error: countError } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        console.error('❌ Erro ao contar pedidos:', countError);
        throw countError;
      }

      // Buscar pedidos com paginação
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (ordersError) {
        console.error('❌ Erro ao buscar pedidos:', ordersError);
        throw ordersError;
      }

      // Buscar itens para cada pedido
      const orders: Order[] = [];
      for (const order of ordersData || []) {
        const { data: itemsData } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', order.id);

        orders.push({
          ...order,
          items: itemsData || []
        });
      }

      return {
        orders,
        total: count || 0
      };
    } catch (error) {
      console.error('❌ Erro no serviço de pedidos:', error);
      throw error;
    }
  }

  // Cancelar pedido
  async cancelOrder(orderId: string, reason?: string): Promise<boolean> {
    try {
      const order = await this.getOrderById(orderId);
      if (!order) {
        console.error('❌ Pedido não encontrado para cancelamento');
        return false;
      }

      // Só permite cancelar pedidos que ainda não saíram para entrega
      if (order.status === OrderStatus.OUT_FOR_DELIVERY || order.status === OrderStatus.DELIVERED) {
        console.error('❌ Não é possível cancelar pedido que já saiu para entrega');
        return false;
      }

      // Restaurar estoque dos produtos
      for (const item of order.items) {
        const product = await productService.getProductById(item.product_id);
        if (product) {
          await productService.updateStock(item.product_id, product.stock + item.quantity);
        }
      }

      // Atualizar status para cancelado
      const success = await this.updateOrderStatus(orderId, OrderStatus.CANCELLED, true);
      
      if (success && reason) {
        // Enviar motivo do cancelamento
        await evolutionApi.sendTextMessage(
          order.customer_phone,
          `📝 *Motivo do cancelamento:*\n${reason}`
        );
      }

      return success;
    } catch (error) {
      console.error('❌ Erro ao cancelar pedido:', error);
      return false;
    }
  }

  // Buscar último pedido do cliente
  async getLastOrderByPhone(phone: string): Promise<Order | null> {
    try {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_phone', phone)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (orderError) {
        if (orderError.code === 'PGRST116') {
          return null; // Nenhum pedido encontrado
        }
        console.error('❌ Erro ao buscar último pedido:', orderError);
        throw orderError;
      }

      // Buscar itens do pedido
      const { data: itemsData } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderData.id);

      return {
        ...orderData,
        items: itemsData || []
      };
    } catch (error) {
      console.error('❌ Erro no serviço de pedidos:', error);
      throw error;
    }
  }
}

export default new OrderService();