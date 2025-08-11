import { Order, OrderStatus, Cart } from '../types';
declare class OrderService {
    createOrder(cart: Cart, customerName?: string, deliveryAddress?: string, notes?: string): Promise<Order | null>;
    getOrderById(id: string): Promise<Order | null>;
    getOrdersByPhone(phone: string): Promise<Order[]>;
    updateOrderStatus(orderId: string, status: OrderStatus, notifyCustomer?: boolean): Promise<boolean>;
    private notifyCustomerStatusUpdate;
    getOrdersByStatus(status: OrderStatus): Promise<Order[]>;
    getAllOrders(page?: number, limit?: number): Promise<{
        orders: Order[];
        total: number;
    }>;
    cancelOrder(orderId: string, reason?: string): Promise<boolean>;
    getLastOrderByPhone(phone: string): Promise<Order | null>;
}
declare const _default: OrderService;
export default _default;
//# sourceMappingURL=orderService.d.ts.map