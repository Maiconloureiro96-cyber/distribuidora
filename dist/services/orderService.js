"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supabase_1 = require("../config/supabase");
const types_1 = require("../types");
const productService_1 = __importDefault(require("./productService"));
const evolutionApi_1 = __importDefault(require("./evolutionApi"));
class OrderService {
    async createOrder(cart, customerName, deliveryAddress, notes) {
        try {
            for (const item of cart.items) {
                const hasStock = await productService_1.default.checkStock(item.product_id, item.quantity);
                if (!hasStock) {
                    throw new Error(`Produto ${item.product_name} não possui estoque suficiente`);
                }
            }
            const { data: orderData, error: orderError } = await supabase_1.supabase
                .from('orders')
                .insert({
                customer_phone: cart.phone,
                customer_name: customerName,
                total_amount: cart.total_amount,
                status: types_1.OrderStatus.PENDING,
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
            const orderItems = cart.items.map(item => ({
                order_id: orderData.id,
                product_id: item.product_id,
                product_name: item.product_name,
                quantity: item.quantity,
                unit_price: item.unit_price,
                total_price: item.total_price
            }));
            const { error: itemsError } = await supabase_1.supabase
                .from('order_items')
                .insert(orderItems);
            if (itemsError) {
                console.error('❌ Erro ao criar itens do pedido:', itemsError);
                await supabase_1.supabase.from('orders').delete().eq('id', orderData.id);
                throw itemsError;
            }
            for (const item of cart.items) {
                await productService_1.default.reduceStock(item.product_id, item.quantity);
            }
            const completeOrder = await this.getOrderById(orderData.id);
            console.log('✅ Pedido criado com sucesso:', orderData.id);
            return completeOrder;
        }
        catch (error) {
            console.error('❌ Erro no serviço de pedidos:', error);
            throw error;
        }
    }
    async getOrderById(id) {
        try {
            const { data: orderData, error: orderError } = await supabase_1.supabase
                .from('orders')
                .select('*')
                .eq('id', id)
                .single();
            if (orderError) {
                if (orderError.code === 'PGRST116') {
                    return null;
                }
                console.error('❌ Erro ao buscar pedido:', orderError);
                throw orderError;
            }
            const { data: itemsData, error: itemsError } = await supabase_1.supabase
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
        }
        catch (error) {
            console.error('❌ Erro no serviço de pedidos:', error);
            throw error;
        }
    }
    async getOrdersByPhone(phone) {
        try {
            const { data: ordersData, error: ordersError } = await supabase_1.supabase
                .from('orders')
                .select('*')
                .eq('customer_phone', phone)
                .order('created_at', { ascending: false });
            if (ordersError) {
                console.error('❌ Erro ao buscar pedidos por telefone:', ordersError);
                throw ordersError;
            }
            const orders = [];
            for (const order of ordersData || []) {
                const { data: itemsData } = await supabase_1.supabase
                    .from('order_items')
                    .select('*')
                    .eq('order_id', order.id);
                orders.push({
                    ...order,
                    items: itemsData || []
                });
            }
            return orders;
        }
        catch (error) {
            console.error('❌ Erro no serviço de pedidos:', error);
            throw error;
        }
    }
    async updateOrderStatus(orderId, status, notifyCustomer = true) {
        try {
            const updateData = {
                status: status,
                updated_at: new Date().toISOString()
            };
            if (status === types_1.OrderStatus.DELIVERED) {
                updateData.delivered_at = new Date().toISOString();
            }
            const { error } = await supabase_1.supabase
                .from('orders')
                .update(updateData)
                .eq('id', orderId);
            if (error) {
                console.error('❌ Erro ao atualizar status do pedido:', error);
                return false;
            }
            if (notifyCustomer) {
                await this.notifyCustomerStatusUpdate(orderId, status);
            }
            console.log(`✅ Status do pedido ${orderId} atualizado para: ${status}`);
            return true;
        }
        catch (error) {
            console.error('❌ Erro no serviço de pedidos:', error);
            return false;
        }
    }
    async notifyCustomerStatusUpdate(orderId, status) {
        try {
            const order = await this.getOrderById(orderId);
            if (!order) {
                console.error('❌ Pedido não encontrado para notificação');
                return;
            }
            let message = '';
            const companyName = process.env.COMPANY_NAME || 'Distribuidora';
            switch (status) {
                case types_1.OrderStatus.CONFIRMED:
                    message = `🎉 *Pedido Confirmado!*\n\nSeu pedido #${orderId.slice(-8)} foi confirmado e está sendo preparado.\n\n📦 Total: R$ ${order.total_amount.toFixed(2)}\n\nObrigado por escolher ${companyName}!`;
                    break;
                case types_1.OrderStatus.PREPARING:
                    message = `👨‍🍳 *Preparando seu Pedido*\n\nSeu pedido #${orderId.slice(-8)} está sendo preparado com carinho.\n\nEm breve sairá para entrega! 🚚`;
                    break;
                case types_1.OrderStatus.OUT_FOR_DELIVERY:
                    message = `🚚 *Saiu para Entrega!*\n\nSeu pedido #${orderId.slice(-8)} saiu para entrega!\n\nNosso entregador está a caminho. 📍`;
                    break;
                case types_1.OrderStatus.DELIVERED:
                    message = `✅ *Pedido Entregue!*\n\nSeu pedido #${orderId.slice(-8)} foi entregue com sucesso!\n\nObrigado pela preferência! Volte sempre! 🙏`;
                    break;
                case types_1.OrderStatus.CANCELLED:
                    message = `❌ *Pedido Cancelado*\n\nInfelizmente seu pedido #${orderId.slice(-8)} foi cancelado.\n\nSe tiver dúvidas, entre em contato conosco.`;
                    break;
            }
            if (message) {
                await evolutionApi_1.default.sendTextMessage(order.customer_phone, message);
            }
        }
        catch (error) {
            console.error('❌ Erro ao notificar cliente:', error);
        }
    }
    async getOrdersByStatus(status) {
        try {
            const { data: ordersData, error: ordersError } = await supabase_1.supabase
                .from('orders')
                .select('*')
                .eq('status', status)
                .order('created_at', { ascending: false });
            if (ordersError) {
                console.error('❌ Erro ao buscar pedidos por status:', ordersError);
                throw ordersError;
            }
            const orders = [];
            for (const order of ordersData || []) {
                const { data: itemsData } = await supabase_1.supabase
                    .from('order_items')
                    .select('*')
                    .eq('order_id', order.id);
                orders.push({
                    ...order,
                    items: itemsData || []
                });
            }
            return orders;
        }
        catch (error) {
            console.error('❌ Erro no serviço de pedidos:', error);
            throw error;
        }
    }
    async getAllOrders(page = 1, limit = 50) {
        try {
            const offset = (page - 1) * limit;
            const { count, error: countError } = await supabase_1.supabase
                .from('orders')
                .select('*', { count: 'exact', head: true });
            if (countError) {
                console.error('❌ Erro ao contar pedidos:', countError);
                throw countError;
            }
            const { data: ordersData, error: ordersError } = await supabase_1.supabase
                .from('orders')
                .select('*')
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);
            if (ordersError) {
                console.error('❌ Erro ao buscar pedidos:', ordersError);
                throw ordersError;
            }
            const orders = [];
            for (const order of ordersData || []) {
                const { data: itemsData } = await supabase_1.supabase
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
        }
        catch (error) {
            console.error('❌ Erro no serviço de pedidos:', error);
            throw error;
        }
    }
    async cancelOrder(orderId, reason) {
        try {
            const order = await this.getOrderById(orderId);
            if (!order) {
                console.error('❌ Pedido não encontrado para cancelamento');
                return false;
            }
            if (order.status === types_1.OrderStatus.OUT_FOR_DELIVERY || order.status === types_1.OrderStatus.DELIVERED) {
                console.error('❌ Não é possível cancelar pedido que já saiu para entrega');
                return false;
            }
            for (const item of order.items) {
                const product = await productService_1.default.getProductById(item.product_id);
                if (product) {
                    await productService_1.default.updateStock(item.product_id, product.stock + item.quantity);
                }
            }
            const success = await this.updateOrderStatus(orderId, types_1.OrderStatus.CANCELLED, true);
            if (success && reason) {
                await evolutionApi_1.default.sendTextMessage(order.customer_phone, `📝 *Motivo do cancelamento:*\n${reason}`);
            }
            return success;
        }
        catch (error) {
            console.error('❌ Erro ao cancelar pedido:', error);
            return false;
        }
    }
    async getLastOrderByPhone(phone) {
        try {
            const { data: orderData, error: orderError } = await supabase_1.supabase
                .from('orders')
                .select('*')
                .eq('customer_phone', phone)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();
            if (orderError) {
                if (orderError.code === 'PGRST116') {
                    return null;
                }
                console.error('❌ Erro ao buscar último pedido:', orderError);
                throw orderError;
            }
            const { data: itemsData } = await supabase_1.supabase
                .from('order_items')
                .select('*')
                .eq('order_id', orderData.id);
            return {
                ...orderData,
                items: itemsData || []
            };
        }
        catch (error) {
            console.error('❌ Erro no serviço de pedidos:', error);
            throw error;
        }
    }
}
exports.default = new OrderService();
//# sourceMappingURL=orderService.js.map