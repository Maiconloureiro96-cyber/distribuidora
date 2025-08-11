import { Order } from '../types';
declare class PDFService {
    private readonly outputDir;
    constructor();
    private ensureOutputDirectory;
    generateOrderPDF(order: Order): Promise<string>;
    private addCompanyHeader;
    private addOrderInfo;
    private addCustomerInfo;
    private addOrderItems;
    private addOrderTotal;
    private addFooter;
    private getStatusText;
    generateSalesReportPDF(reportData: any, period: string): Promise<string>;
    listGeneratedPDFs(): string[];
    cleanupOldPDFs(daysOld?: number): void;
    getOutputDirectory(): string;
}
declare const _default: PDFService;
export default _default;
//# sourceMappingURL=pdfService.d.ts.map