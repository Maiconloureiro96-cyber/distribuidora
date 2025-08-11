"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supabase_1 = require("../config/supabase");
const types_1 = require("../types");
const moment_1 = __importDefault(require("moment"));
class ReportService {
    constructor() {
        this.getLowStockProducts = this.getLowStockReport;
        this.getTopCustomers = this.getTopCustomersReport;
    }
    async getDailySalesReport(date) {
        return this.getDailyReport(date);
    }
    async getDailyReport(date) {
        try {
            const targetDate = date || (0, moment_1.default)().format('YYYY-MM-DD');
            const startDate = `${targetDate} 00:00:00`;
            const endDate = `${targetDate} 23:59:59`;
            const { data: orders, error: ordersError } = await supabase_1.supabase
                .from('orders')
                .select(`
          id,
          total_amount,
          status,
          created_at,
          order_items (
            product_id,
            product_name,
            quantity,
            total_price
          )
        `)
                .gte('created_at', startDate)
                .lte('created_at', endDate)
                .in('status', [types_1.OrderStatus.CONFIRMED, types_1.OrderStatus.PREPARING, types_1.OrderStatus.OUT_FOR_DELIVERY, types_1.OrderStatus.DELIVERED]);
            if (ordersError) {
                console.error('❌ Erro ao buscar pedidos para relatório:', ordersError);
                throw ordersError;
            }
            const totalOrders = orders?.length || 0;
            const totalRevenue = orders?.reduce((sum, order) => sum + order.total_amount, 0) || 0;
            const productSales = {};
            orders?.forEach(order => {
                order.order_items?.forEach((item) => {
                    if (!productSales[item.product_id]) {
                        productSales[item.product_id] = {
                            name: item.product_name,
                            quantity: 0,
                            revenue: 0
                        };
                    }
                    productSales[item.product_id].quantity += item.quantity;
                    productSales[item.product_id].revenue += item.total_price;
                });
            });
            const topProducts = Object.entries(productSales)
                .map(([productId, data]) => ({
                product_id: productId,
                product_name: data.name,
                quantity_sold: data.quantity,
                revenue: data.revenue
            }))
                .sort((a, b) => b.quantity_sold - a.quantity_sold)
                .slice(0, 10);
            return {
                date: targetDate,
                total_orders: totalOrders,
                total_revenue: totalRevenue,
                top_products: topProducts
            };
        }
        catch (error) {
            console.error('❌ Erro ao gerar relatório diário:', error);
            throw error;
        }
    }
    async getMonthlySalesReport(year, month) {
        return this.getMonthlyReport(year, month);
    }
    async getMonthlyReport(year, month) {
        try {
            const startDate = (0, moment_1.default)({ year, month: month - 1, day: 1 }).format('YYYY-MM-DD HH:mm:ss');
            const endDate = (0, moment_1.default)({ year, month: month - 1, day: 1 }).endOf('month').format('YYYY-MM-DD HH:mm:ss');
            const { data: orders, error: ordersError } = await supabase_1.supabase
                .from('orders')
                .select(`
          id,
          total_amount,
          status,
          created_at,
          order_items (
            product_id,
            product_name,
            quantity,
            total_price
          )
        `)
                .gte('created_at', startDate)
                .lte('created_at', endDate)
                .in('status', [types_1.OrderStatus.CONFIRMED, types_1.OrderStatus.PREPARING, types_1.OrderStatus.OUT_FOR_DELIVERY, types_1.OrderStatus.DELIVERED]);
            if (ordersError) {
                console.error('❌ Erro ao buscar pedidos para relatório mensal:', ordersError);
                throw ordersError;
            }
            const totalOrders = orders?.length || 0;
            const totalRevenue = orders?.reduce((sum, order) => sum + order.total_amount, 0) || 0;
            const productSales = {};
            orders?.forEach(order => {
                order.order_items?.forEach((item) => {
                    if (!productSales[item.product_id]) {
                        productSales[item.product_id] = {
                            name: item.product_name,
                            quantity: 0,
                            revenue: 0
                        };
                    }
                    productSales[item.product_id].quantity += item.quantity;
                    productSales[item.product_id].revenue += item.total_price;
                });
            });
            const topProducts = Object.entries(productSales)
                .map(([productId, data]) => ({
                product_id: productId,
                product_name: data.name,
                quantity_sold: data.quantity,
                revenue: data.revenue
            }))
                .sort((a, b) => b.quantity_sold - a.quantity_sold)
                .slice(0, 10);
            return {
                date: `${year}-${month.toString().padStart(2, '0')}`,
                total_orders: totalOrders,
                total_revenue: totalRevenue,
                top_products: topProducts
            };
        }
        catch (error) {
            console.error('❌ Erro ao gerar relatório mensal:', error);
            throw error;
        }
    }
    async getSalesReportByPeriod(startDate, endDate) {
        return this.getPeriodReport(startDate, endDate);
    }
    async getPeriodReport(startDate, endDate) {
        try {
            const start = `${startDate} 00:00:00`;
            const end = `${endDate} 23:59:59`;
            const { data: orders, error: ordersError } = await supabase_1.supabase
                .from('orders')
                .select(`
          id,
          total_amount,
          status,
          created_at,
          order_items (
            product_id,
            product_name,
            quantity,
            total_price
          )
        `)
                .gte('created_at', start)
                .lte('created_at', end)
                .in('status', [types_1.OrderStatus.CONFIRMED, types_1.OrderStatus.PREPARING, types_1.OrderStatus.OUT_FOR_DELIVERY, types_1.OrderStatus.DELIVERED]);
            if (ordersError) {
                console.error('❌ Erro ao buscar pedidos para relatório por período:', ordersError);
                throw ordersError;
            }
            const totalOrders = orders?.length || 0;
            const totalRevenue = orders?.reduce((sum, order) => sum + order.total_amount, 0) || 0;
            const productSales = {};
            orders?.forEach(order => {
                order.order_items?.forEach((item) => {
                    if (!productSales[item.product_id]) {
                        productSales[item.product_id] = {
                            name: item.product_name,
                            quantity: 0,
                            revenue: 0
                        };
                    }
                    productSales[item.product_id].quantity += item.quantity;
                    productSales[item.product_id].revenue += item.total_price;
                });
            });
            const topProducts = Object.entries(productSales)
                .map(([productId, data]) => ({
                product_id: productId,
                product_name: data.name,
                quantity_sold: data.quantity,
                revenue: data.revenue
            }))
                .sort((a, b) => b.quantity_sold - a.quantity_sold)
                .slice(0, 10);
            return {
                date: `${startDate} a ${endDate}`,
                total_orders: totalOrders,
                total_revenue: totalRevenue,
                top_products: topProducts
            };
        }
        catch (error) {
            console.error('❌ Erro ao gerar relatório por período:', error);
            throw error;
        }
    }
    async getGeneralStats() {
        try {
            const { count: totalOrders, error: ordersError } = await supabase_1.supabase
                .from('orders')
                .select('*', { count: 'exact', head: true });
            if (ordersError) {
                console.error('❌ Erro ao contar pedidos:', ordersError);
                throw ordersError;
            }
            const { count: totalProducts, error: productsError } = await supabase_1.supabase
                .from('products')
                .select('*', { count: 'exact', head: true })
                .eq('active', true);
            if (productsError) {
                console.error('❌ Erro ao contar produtos:', productsError);
                throw productsError;
            }
            const { data: revenueData, error: revenueError } = await supabase_1.supabase
                .from('orders')
                .select('total_amount')
                .in('status', [types_1.OrderStatus.CONFIRMED, types_1.OrderStatus.PREPARING, types_1.OrderStatus.OUT_FOR_DELIVERY, types_1.OrderStatus.DELIVERED]);
            if (revenueError) {
                console.error('❌ Erro ao calcular receita:', revenueError);
                throw revenueError;
            }
            const totalRevenue = revenueData?.reduce((sum, order) => sum + order.total_amount, 0) || 0;
            const { data: statusData, error: statusError } = await supabase_1.supabase
                .from('orders')
                .select('status')
                .order('status');
            if (statusError) {
                console.error('❌ Erro ao buscar status dos pedidos:', statusError);
                throw statusError;
            }
            const ordersByStatus = {};
            statusData?.forEach(order => {
                ordersByStatus[order.status] = (ordersByStatus[order.status] || 0) + 1;
            });
            const averageTicket = (totalOrders && totalOrders > 0) ? totalRevenue / totalOrders : 0;
            return {
                total_orders: totalOrders || 0,
                total_products: totalProducts || 0,
                total_revenue: totalRevenue,
                average_ticket: averageTicket,
                orders_by_status: ordersByStatus
            };
        }
        catch (error) {
            console.error('❌ Erro ao gerar estatísticas gerais:', error);
            throw error;
        }
    }
    async getLowStockReport(threshold = 5) {
        try {
            const { data: products, error } = await supabase_1.supabase
                .from('products')
                .select('id, name, stock, price')
                .lte('stock', threshold)
                .eq('active', true)
                .order('stock', { ascending: true });
            if (error) {
                console.error('❌ Erro ao buscar produtos com baixo estoque:', error);
                throw error;
            }
            return products || [];
        }
        catch (error) {
            console.error('❌ Erro ao gerar relatório de baixo estoque:', error);
            throw error;
        }
    }
    async getTopCustomersReport(limit = 10) {
        try {
            const { data: customers, error } = await supabase_1.supabase
                .from('orders')
                .select('customer_phone, customer_name, total_amount')
                .in('status', [types_1.OrderStatus.CONFIRMED, types_1.OrderStatus.PREPARING, types_1.OrderStatus.OUT_FOR_DELIVERY, types_1.OrderStatus.DELIVERED]);
            if (error) {
                console.error('❌ Erro ao buscar dados de clientes:', error);
                throw error;
            }
            const customerStats = {};
            customers?.forEach(order => {
                if (!customerStats[order.customer_phone]) {
                    customerStats[order.customer_phone] = {
                        name: order.customer_name || 'Cliente',
                        orders: 0,
                        total_spent: 0
                    };
                }
                customerStats[order.customer_phone].orders += 1;
                customerStats[order.customer_phone].total_spent += order.total_amount;
            });
            const topCustomers = Object.entries(customerStats)
                .map(([phone, data]) => ({
                phone,
                name: data.name,
                total_orders: data.orders,
                total_spent: data.total_spent,
                average_order: data.total_spent / data.orders
            }))
                .sort((a, b) => b.total_spent - a.total_spent)
                .slice(0, limit);
            return topCustomers;
        }
        catch (error) {
            console.error('❌ Erro ao gerar relatório de clientes:', error);
            throw error;
        }
    }
    async getSalesByHour(date) {
        try {
            const targetDate = date || (0, moment_1.default)().format('YYYY-MM-DD');
            const startDate = `${targetDate} 00:00:00`;
            const endDate = `${targetDate} 23:59:59`;
            const { data: orders, error } = await supabase_1.supabase
                .from('orders')
                .select('created_at, total_amount')
                .gte('created_at', startDate)
                .lte('created_at', endDate)
                .in('status', [types_1.OrderStatus.CONFIRMED, types_1.OrderStatus.PREPARING, types_1.OrderStatus.OUT_FOR_DELIVERY, types_1.OrderStatus.DELIVERED]);
            if (error) {
                console.error('❌ Erro ao buscar vendas por hora:', error);
                throw error;
            }
            const salesByHour = {};
            for (let hour = 0; hour < 24; hour++) {
                salesByHour[hour] = { orders: 0, revenue: 0 };
            }
            orders?.forEach(order => {
                const hour = (0, moment_1.default)(order.created_at).hour();
                salesByHour[hour].orders += 1;
                salesByHour[hour].revenue += order.total_amount;
            });
            return Object.entries(salesByHour).map(([hour, data]) => ({
                hour: parseInt(hour),
                orders: data.orders,
                revenue: data.revenue
            }));
        }
        catch (error) {
            console.error('❌ Erro ao gerar relatório por hora:', error);
            throw error;
        }
    }
    formatSalesReport(report) {
        let formatted = `📊 *Relatório de Vendas - ${report.date}*\n\n`;
        formatted += `📦 Total de Pedidos: ${report.total_orders}\n`;
        formatted += `💰 Receita Total: R$ ${report.total_revenue.toFixed(2)}\n\n`;
        if (report.top_products.length > 0) {
            formatted += `🏆 *Produtos Mais Vendidos:*\n`;
            report.top_products.slice(0, 5).forEach((product, index) => {
                formatted += `${index + 1}. ${product.product_name}\n`;
                formatted += `   Vendidos: ${product.quantity_sold} | Receita: R$ ${product.revenue.toFixed(2)}\n\n`;
            });
        }
        return formatted;
    }
    async getHourlyAnalysis(date) {
        return [];
    }
}
exports.default = new ReportService();
//# sourceMappingURL=reportService.js.map