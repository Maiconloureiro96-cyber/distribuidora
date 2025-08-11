"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pdfkit_1 = __importDefault(require("pdfkit"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const moment_1 = __importDefault(require("moment"));
class PDFService {
    constructor() {
        this.outputDir = path_1.default.join(process.cwd(), 'pdfs');
        this.ensureOutputDirectory();
    }
    ensureOutputDirectory() {
        if (!fs_1.default.existsSync(this.outputDir)) {
            fs_1.default.mkdirSync(this.outputDir, { recursive: true });
            console.log('📁 Diretório de PDFs criado:', this.outputDir);
        }
    }
    async generateOrderPDF(order) {
        return new Promise((resolve, reject) => {
            try {
                const fileName = `pedido_${order.id.slice(-8)}_${(0, moment_1.default)().format('YYYYMMDD_HHmmss')}.pdf`;
                const filePath = path_1.default.join(this.outputDir, fileName);
                const doc = new pdfkit_1.default({ margin: 50 });
                const stream = fs_1.default.createWriteStream(filePath);
                doc.pipe(stream);
                this.addCompanyHeader(doc);
                this.addOrderInfo(doc, order);
                this.addCustomerInfo(doc, order);
                this.addOrderItems(doc, order);
                this.addOrderTotal(doc, order);
                this.addFooter(doc);
                doc.end();
                stream.on('finish', () => {
                    console.log('✅ PDF gerado com sucesso:', fileName);
                    resolve(filePath);
                });
                stream.on('error', (error) => {
                    console.error('❌ Erro ao gerar PDF:', error);
                    reject(error);
                });
            }
            catch (error) {
                console.error('❌ Erro ao criar PDF:', error);
                reject(error);
            }
        });
    }
    addCompanyHeader(doc) {
        const companyName = process.env.COMPANY_NAME || 'Distribuidora de Bebidas';
        const companyPhone = process.env.COMPANY_PHONE || '(11) 99999-9999';
        const companyAddress = process.env.COMPANY_ADDRESS || 'Endereço da empresa';
        doc.fontSize(20)
            .font('Helvetica-Bold')
            .text(companyName, 50, 50, { align: 'center' });
        doc.fontSize(12)
            .font('Helvetica')
            .text(companyPhone, 50, 80, { align: 'center' })
            .text(companyAddress, 50, 95, { align: 'center' });
        doc.moveTo(50, 120)
            .lineTo(550, 120)
            .stroke();
    }
    addOrderInfo(doc, order) {
        const startY = 140;
        doc.fontSize(16)
            .font('Helvetica-Bold')
            .text('PEDIDO', 50, startY);
        doc.fontSize(12)
            .font('Helvetica')
            .text(`Número: #${order.id.slice(-8)}`, 50, startY + 25)
            .text(`Data: ${(0, moment_1.default)(order.created_at).format('DD/MM/YYYY HH:mm')}`, 50, startY + 40)
            .text(`Status: ${this.getStatusText(order.status)}`, 50, startY + 55);
        if (order.delivered_at) {
            doc.text(`Entregue em: ${(0, moment_1.default)(order.delivered_at).format('DD/MM/YYYY HH:mm')}`, 50, startY + 70);
        }
    }
    addCustomerInfo(doc, order) {
        const startY = 240;
        doc.fontSize(14)
            .font('Helvetica-Bold')
            .text('CLIENTE', 50, startY);
        doc.fontSize(12)
            .font('Helvetica')
            .text(`Nome: ${order.customer_name || 'Não informado'}`, 50, startY + 20)
            .text(`Telefone: ${order.customer_phone}`, 50, startY + 35);
        if (order.delivery_address) {
            doc.text(`Endereço: ${order.delivery_address}`, 50, startY + 50);
        }
        if (order.notes) {
            doc.text(`Observações: ${order.notes}`, 50, startY + 65);
        }
    }
    addOrderItems(doc, order) {
        const startY = 360;
        let currentY = startY;
        doc.fontSize(14)
            .font('Helvetica-Bold')
            .text('ITENS DO PEDIDO', 50, currentY);
        currentY += 30;
        doc.fontSize(10)
            .font('Helvetica-Bold')
            .text('PRODUTO', 50, currentY)
            .text('QTD', 300, currentY)
            .text('PREÇO UNIT.', 350, currentY)
            .text('TOTAL', 450, currentY);
        currentY += 15;
        doc.moveTo(50, currentY)
            .lineTo(550, currentY)
            .stroke();
        currentY += 10;
        doc.font('Helvetica');
        order.items.forEach((item) => {
            doc.text(item.product_name, 50, currentY, { width: 240 })
                .text(item.quantity.toString(), 300, currentY)
                .text(`R$ ${item.unit_price.toFixed(2)}`, 350, currentY)
                .text(`R$ ${item.total_price.toFixed(2)}`, 450, currentY);
            currentY += 20;
            if (currentY > 700) {
                doc.addPage();
                currentY = 50;
            }
        });
        currentY += 10;
        doc.moveTo(50, currentY)
            .lineTo(550, currentY)
            .stroke();
    }
    addOrderTotal(doc, order) {
        const pageHeight = doc.page.height;
        const currentY = Math.max(doc.y + 20, pageHeight - 150);
        doc.fontSize(14)
            .font('Helvetica-Bold')
            .text(`TOTAL DO PEDIDO: R$ ${order.total_amount.toFixed(2)}`, 350, currentY, {
            align: 'right',
            width: 150
        });
    }
    addFooter(doc) {
        const pageHeight = doc.page.height;
        const footerY = pageHeight - 100;
        doc.fontSize(10)
            .font('Helvetica')
            .text('Obrigado pela preferência!', 50, footerY, { align: 'center' })
            .text(`Documento gerado em ${(0, moment_1.default)().format('DD/MM/YYYY HH:mm')}`, 50, footerY + 15, { align: 'center' });
    }
    getStatusText(status) {
        const statusMap = {
            'pending': 'Pendente',
            'confirmed': 'Confirmado',
            'preparing': 'Preparando',
            'out_for_delivery': 'Saiu para entrega',
            'delivered': 'Entregue',
            'cancelled': 'Cancelado'
        };
        return statusMap[status] || status;
    }
    async generateSalesReportPDF(reportData, period) {
        return new Promise((resolve, reject) => {
            try {
                const fileName = `relatorio_vendas_${period.replace(/[^a-zA-Z0-9]/g, '_')}_${(0, moment_1.default)().format('YYYYMMDD_HHmmss')}.pdf`;
                const filePath = path_1.default.join(this.outputDir, fileName);
                const doc = new pdfkit_1.default({ margin: 50 });
                const stream = fs_1.default.createWriteStream(filePath);
                doc.pipe(stream);
                this.addCompanyHeader(doc);
                doc.fontSize(18)
                    .font('Helvetica-Bold')
                    .text('RELATÓRIO DE VENDAS', 50, 140, { align: 'center' });
                doc.fontSize(14)
                    .font('Helvetica')
                    .text(`Período: ${period}`, 50, 170, { align: 'center' });
                let currentY = 210;
                doc.fontSize(14)
                    .font('Helvetica-Bold')
                    .text('RESUMO GERAL', 50, currentY);
                currentY += 25;
                doc.fontSize(12)
                    .font('Helvetica')
                    .text(`Total de Pedidos: ${reportData.total_orders}`, 50, currentY)
                    .text(`Receita Total: R$ ${reportData.total_revenue.toFixed(2)}`, 50, currentY + 15);
                if (reportData.average_ticket) {
                    doc.text(`Ticket Médio: R$ ${reportData.average_ticket.toFixed(2)}`, 50, currentY + 30);
                    currentY += 45;
                }
                else {
                    currentY += 30;
                }
                if (reportData.top_products && reportData.top_products.length > 0) {
                    currentY += 20;
                    doc.fontSize(14)
                        .font('Helvetica-Bold')
                        .text('PRODUTOS MAIS VENDIDOS', 50, currentY);
                    currentY += 25;
                    doc.fontSize(10)
                        .font('Helvetica-Bold')
                        .text('PRODUTO', 50, currentY)
                        .text('QTD VENDIDA', 300, currentY)
                        .text('RECEITA', 450, currentY);
                    currentY += 15;
                    doc.moveTo(50, currentY)
                        .lineTo(550, currentY)
                        .stroke();
                    currentY += 10;
                    doc.font('Helvetica');
                    reportData.top_products.slice(0, 10).forEach((product, index) => {
                        doc.text(`${index + 1}. ${product.product_name}`, 50, currentY)
                            .text(product.quantity_sold.toString(), 300, currentY)
                            .text(`R$ ${product.revenue.toFixed(2)}`, 450, currentY);
                        currentY += 15;
                        if (currentY > 700) {
                            doc.addPage();
                            currentY = 50;
                        }
                    });
                }
                this.addFooter(doc);
                doc.end();
                stream.on('finish', () => {
                    console.log('✅ PDF de relatório gerado com sucesso:', fileName);
                    resolve(filePath);
                });
                stream.on('error', (error) => {
                    console.error('❌ Erro ao gerar PDF de relatório:', error);
                    reject(error);
                });
            }
            catch (error) {
                console.error('❌ Erro ao criar PDF de relatório:', error);
                reject(error);
            }
        });
    }
    listGeneratedPDFs() {
        try {
            const files = fs_1.default.readdirSync(this.outputDir)
                .filter(file => file.endsWith('.pdf'))
                .sort((a, b) => {
                const statA = fs_1.default.statSync(path_1.default.join(this.outputDir, a));
                const statB = fs_1.default.statSync(path_1.default.join(this.outputDir, b));
                return statB.mtime.getTime() - statA.mtime.getTime();
            });
            return files.map(file => path_1.default.join(this.outputDir, file));
        }
        catch (error) {
            console.error('❌ Erro ao listar PDFs:', error);
            return [];
        }
    }
    cleanupOldPDFs(daysOld = 30) {
        try {
            const files = fs_1.default.readdirSync(this.outputDir);
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysOld);
            let deletedCount = 0;
            files.forEach(file => {
                const filePath = path_1.default.join(this.outputDir, file);
                const stats = fs_1.default.statSync(filePath);
                if (stats.mtime < cutoffDate) {
                    fs_1.default.unlinkSync(filePath);
                    deletedCount++;
                }
            });
            if (deletedCount > 0) {
                console.log(`🗑️ ${deletedCount} PDFs antigos removidos`);
            }
        }
        catch (error) {
            console.error('❌ Erro ao limpar PDFs antigos:', error);
        }
    }
    getOutputDirectory() {
        return this.outputDir;
    }
}
exports.default = new PDFService();
//# sourceMappingURL=pdfService.js.map