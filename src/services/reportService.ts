import { supabase } from '../config/supabase';
import { SalesReport, TopProduct, OrderStatus } from '../types';
import moment from 'moment';

class ReportService {
  // Obter relatório de vendas diário
  async getDailySalesReport(date: string): Promise<SalesReport> {
    return this.getDailyReport(date);
  }

  // Alias para compatibilidade
  async getDailyReport(date: string): Promise<SalesReport> {
    try {
      const targetDate = date || moment().format('YYYY-MM-DD');
      const startDate = `${targetDate} 00:00:00`;
      const endDate = `${targetDate} 23:59:59`;

      // Buscar pedidos do dia
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id,
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
        .lte('created_at', endDate);

      if (ordersError) {
        console.error('❌ Erro ao buscar pedidos para relatório:', ordersError);
        throw ordersError;
      }

      const totalOrders = orders?.length || 0;
      
      // Calcular receita total a partir dos itens dos pedidos
      let totalRevenue = 0;
      orders?.forEach(order => {
        order.order_items?.forEach((item: any) => {
          totalRevenue += item.total_price;
        });
      });

      // Calcular produtos mais vendidos
      const productSales: { [key: string]: { name: string, quantity: number, revenue: number } } = {};

      orders?.forEach(order => {
        order.order_items?.forEach((item: any) => {
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

      const topProducts: TopProduct[] = Object.entries(productSales)
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
    } catch (error) {
      console.error('❌ Erro ao gerar relatório diário:', error);
      throw error;
    }
  }

  // Obter relatório de vendas mensal
  async getMonthlySalesReport(year: number, month: number): Promise<SalesReport> {
    return this.getMonthlyReport(year, month);
  }

  // Alias para compatibilidade
  async getMonthlyReport(year: number, month: number): Promise<SalesReport> {
    try {
      const startDate = moment({ year, month: month - 1, day: 1 }).format('YYYY-MM-DD HH:mm:ss');
      const endDate = moment({ year, month: month - 1, day: 1 }).endOf('month').format('YYYY-MM-DD HH:mm:ss');

      // Buscar pedidos do mês
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id,
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
        .in('status', [OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED]);

      if (ordersError) {
        console.error('❌ Erro ao buscar pedidos para relatório mensal:', ordersError);
        throw ordersError;
      }

      const totalOrders = orders?.length || 0;
      // Calcular receita total a partir dos itens dos pedidos
      let totalRevenue = 0;
      orders?.forEach(order => {
        order.order_items?.forEach((item: any) => {
          totalRevenue += item.total_price;
        });
      });

      // Calcular produtos mais vendidos
      const productSales: { [key: string]: { name: string, quantity: number, revenue: number } } = {};

      orders?.forEach(order => {
          order.order_items?.forEach((item: any) => {
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

      const topProducts: TopProduct[] = Object.entries(productSales)
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
    } catch (error) {
      console.error('❌ Erro ao gerar relatório mensal:', error);
      throw error;
    }
  }

  // Obter vendas por período personalizado
  async getSalesReportByPeriod(startDate: string, endDate: string): Promise<SalesReport> {
    return this.getPeriodReport(startDate, endDate);
  }

  // Alias para compatibilidade
  async getPeriodReport(startDate: string, endDate: string): Promise<SalesReport> {
    try {
      const start = `${startDate} 00:00:00`;
      const end = `${endDate} 23:59:59`;

      // Buscar pedidos do período
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id,
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
        .in('status', [OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED]);

      if (ordersError) {
        console.error('❌ Erro ao buscar pedidos para relatório por período:', ordersError);
        throw ordersError;
      }

      const totalOrders = orders?.length || 0;
      // Calcular receita total a partir dos itens dos pedidos
      let totalRevenue = 0;
      orders?.forEach(order => {
        order.order_items?.forEach((item: any) => {
          totalRevenue += item.total_price;
        });
      });

      // Calcular produtos mais vendidos
      const productSales: { [key: string]: { name: string, quantity: number, revenue: number } } = {};

      orders?.forEach(order => {
        order.order_items?.forEach((item: any) => {
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

      const topProducts: TopProduct[] = Object.entries(productSales)
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
    } catch (error) {
      console.error('❌ Erro ao gerar relatório por período:', error);
      throw error;
    }
  }

  // Obter estatísticas gerais
  async getGeneralStats(): Promise<any> {
    try {
      // Total de pedidos
      const { count: totalOrders, error: ordersError } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });

      if (ordersError) {
        console.error('❌ Erro ao contar pedidos:', ordersError);
        throw ordersError;
      }

      // Total de produtos
      const { count: totalProducts, error: productsError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('active', true);

      if (productsError) {
        console.error('❌ Erro ao contar produtos:', productsError);
        throw productsError;
      }

      // Receita total - calcular a partir dos itens dos pedidos
      const { data: ordersWithItems, error: revenueError } = await supabase
        .from('orders')
        .select(`
          id,
          order_items (
            total_price
          )
        `)
        .in('status', [OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED]);

      if (revenueError) {
        console.error('❌ Erro ao calcular receita:', revenueError);
        throw revenueError;
      }

      let totalRevenue = 0;
      ordersWithItems?.forEach(order => {
        order.order_items?.forEach((item: any) => {
          totalRevenue += item.total_price;
        });
      });

      // Pedidos por status
      const { data: statusData, error: statusError } = await supabase
        .from('orders')
        .select('status')
        .order('status');

      if (statusError) {
        console.error('❌ Erro ao buscar status dos pedidos:', statusError);
        throw statusError;
      }

      const ordersByStatus: { [key: string]: number } = {};
      statusData?.forEach(order => {
        ordersByStatus[order.status] = (ordersByStatus[order.status] || 0) + 1;
      });

      // Ticket médio
      const averageTicket = (totalOrders && totalOrders > 0) ? totalRevenue / totalOrders : 0;

      return {
        total_orders: totalOrders || 0,
        total_products: totalProducts || 0,
        total_revenue: totalRevenue,
        average_ticket: averageTicket,
        orders_by_status: ordersByStatus
      };
    } catch (error) {
      console.error('❌ Erro ao gerar estatísticas gerais:', error);
      throw error;
    }
  }

  // Obter produtos com baixo estoque
  async getLowStockReport(threshold: number = 5): Promise<any[]> {
    try {
      const { data: products, error } = await supabase
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
    } catch (error) {
      console.error('❌ Erro ao gerar relatório de baixo estoque:', error);
      throw error;
    }
  }

  // Obter relatório de clientes mais ativos
  async getTopCustomersReport(limit: number = 10): Promise<any[]> {
    try {
      const { data: customers, error } = await supabase
        .from('orders')
        .select(`
          customer_phone,
          customer_name,
          order_items (
            total_price
          )
        `)
        .in('status', [OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED]);

      if (error) {
        console.error('❌ Erro ao buscar dados de clientes:', error);
        throw error;
      }

      // Agrupar por cliente
      const customerStats: { [key: string]: { name: string, orders: number, total_spent: number } } = {};

      customers?.forEach(order => {
        if (!customerStats[order.customer_phone]) {
          customerStats[order.customer_phone] = {
            name: order.customer_name || 'Cliente',
            orders: 0,
            total_spent: 0
          };
        }
        customerStats[order.customer_phone].orders += 1;
        // Calcular total gasto a partir dos itens do pedido
        order.order_items?.forEach((item: any) => {
          customerStats[order.customer_phone].total_spent += item.total_price;
        });
      });

      // Converter para array e ordenar
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
    } catch (error) {
      console.error('❌ Erro ao gerar relatório de clientes:', error);
      throw error;
    }
  }

  // Obter vendas por hora do dia
  async getSalesByHour(date?: string): Promise<any[]> {
    try {
      const targetDate = date || moment().format('YYYY-MM-DD');
      const startDate = `${targetDate} 00:00:00`;
      const endDate = `${targetDate} 23:59:59`;

      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          created_at,
          order_items (
            total_price
          )
        `)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .in('status', [OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED]);

      if (error) {
        console.error('❌ Erro ao buscar vendas por hora:', error);
        throw error;
      }

      // Agrupar por hora
      const salesByHour: { [key: number]: { orders: number, revenue: number } } = {};

      // Inicializar todas as horas
      for (let hour = 0; hour < 24; hour++) {
        salesByHour[hour] = { orders: 0, revenue: 0 };
      }

      orders?.forEach(order => {
        const hour = moment(order.created_at).hour();
        salesByHour[hour].orders += 1;
        // Calcular receita a partir dos itens do pedido
        order.order_items?.forEach((item: any) => {
          salesByHour[hour].revenue += item.total_price;
        });
      });

      // Converter para array
      return Object.entries(salesByHour).map(([hour, data]) => ({
        hour: parseInt(hour),
        orders: data.orders,
        revenue: data.revenue
      }));
    } catch (error) {
      console.error('❌ Erro ao gerar relatório por hora:', error);
      throw error;
    }
  }

  // Formatar relatório para exibição
  formatSalesReport(report: SalesReport): string {
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

  // Alias para compatibilidade
  getLowStockProducts = this.getLowStockReport;
  getTopCustomers = this.getTopCustomersReport;

  async getHourlyAnalysis(date: string) {
    // Implementação básica - retorna array vazio por enquanto
    return [];
  }
}

export default new ReportService();