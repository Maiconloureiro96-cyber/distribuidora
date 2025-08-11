import { SalesReport } from '../types';
declare class ReportService {
    getDailySalesReport(date: string): Promise<SalesReport>;
    getDailyReport(date: string): Promise<SalesReport>;
    getMonthlySalesReport(year: number, month: number): Promise<SalesReport>;
    getMonthlyReport(year: number, month: number): Promise<SalesReport>;
    getSalesReportByPeriod(startDate: string, endDate: string): Promise<SalesReport>;
    getPeriodReport(startDate: string, endDate: string): Promise<SalesReport>;
    getGeneralStats(): Promise<any>;
    getLowStockReport(threshold?: number): Promise<any[]>;
    getTopCustomersReport(limit?: number): Promise<any[]>;
    getSalesByHour(date?: string): Promise<any[]>;
    formatSalesReport(report: SalesReport): string;
    getLowStockProducts: (threshold?: number) => Promise<any[]>;
    getTopCustomers: (limit?: number) => Promise<any[]>;
    getHourlyAnalysis(date: string): Promise<never[]>;
}
declare const _default: ReportService;
export default _default;
//# sourceMappingURL=reportService.d.ts.map