import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { Order } from '../types';
import moment from 'moment';

class PDFService {
  private readonly outputDir: string;

  constructor() {
    this.outputDir = path.join(process.cwd(), 'pdfs');
    this.ensureOutputDirectory();
  }

  // Garantir que o diretório de saída existe
  private ensureOutputDirectory(): void {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
      console.log('📁 Diretório de PDFs criado:', this.outputDir);
    }
  }

  // Gerar PDF do pedido
  async generateOrderPDF(order: Order): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const fileName = `pedido_${order.id.slice(-8)}_${moment().format('YYYYMMDD_HHmmss')}.pdf`;
        const filePath = path.join(this.outputDir, fileName);
        
        const doc = new PDFDocument({ margin: 50 });
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // Cabeçalho da empresa
        this.addCompanyHeader(doc);
        
        // Informações do pedido
        this.addOrderInfo(doc, order);
        
        // Informações do cliente
        this.addCustomerInfo(doc, order);
        
        // Itens do pedido
        this.addOrderItems(doc, order);
        
        // Total
        this.addOrderTotal(doc, order);
        
        // Rodapé
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
      } catch (error) {
        console.error('❌ Erro ao criar PDF:', error);
        reject(error);
      }
    });
  }

  // Adicionar cabeçalho da empresa
  private addCompanyHeader(doc: PDFKit.PDFDocument): void {
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
    
    // Linha separadora
    doc.moveTo(50, 120)
       .lineTo(550, 120)
       .stroke();
  }

  // Adicionar informações do pedido
  private addOrderInfo(doc: PDFKit.PDFDocument, order: Order): void {
    const startY = 140;
    
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .text('PEDIDO', 50, startY);
    
    doc.fontSize(12)
       .font('Helvetica')
       .text(`Número: #${order.id.slice(-8)}`, 50, startY + 25)
       .text(`Data: ${moment(order.created_at).format('DD/MM/YYYY HH:mm')}`, 50, startY + 40)
       .text(`Status: ${this.getStatusText(order.status)}`, 50, startY + 55);
    
    if (order.delivered_at) {
      doc.text(`Entregue em: ${moment(order.delivered_at).format('DD/MM/YYYY HH:mm')}`, 50, startY + 70);
    }
  }

  // Adicionar informações do cliente
  private addCustomerInfo(doc: PDFKit.PDFDocument, order: Order): void {
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

  // Adicionar itens do pedido
  private addOrderItems(doc: PDFKit.PDFDocument, order: Order): void {
    const startY = 360;
    let currentY = startY;
    
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text('ITENS DO PEDIDO', 50, currentY);
    
    currentY += 30;
    
    // Cabeçalho da tabela
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .text('PRODUTO', 50, currentY)
       .text('QTD', 300, currentY)
       .text('PREÇO UNIT.', 350, currentY)
       .text('TOTAL', 450, currentY);
    
    currentY += 15;
    
    // Linha separadora
    doc.moveTo(50, currentY)
       .lineTo(550, currentY)
       .stroke();
    
    currentY += 10;
    
    // Itens
    doc.font('Helvetica');
    order.items.forEach((item) => {
      doc.text(item.product_name, 50, currentY, { width: 240 })
         .text(item.quantity.toString(), 300, currentY)
         .text(`R$ ${item.unit_price.toFixed(2)}`, 350, currentY)
         .text(`R$ ${item.total_price.toFixed(2)}`, 450, currentY);
      
      currentY += 20;
      
      // Verificar se precisa de nova página
      if (currentY > 700) {
        doc.addPage();
        currentY = 50;
      }
    });
    
    // Linha separadora final
    currentY += 10;
    doc.moveTo(50, currentY)
       .lineTo(550, currentY)
       .stroke();
  }

  // Adicionar total do pedido
  private addOrderTotal(doc: PDFKit.PDFDocument, order: Order): void {
    const pageHeight = doc.page.height;
    const currentY = Math.max(doc.y + 20, pageHeight - 150);
    
    // Calcular total a partir dos itens do pedido
    let totalAmount = 0;
    if (order.items) {
      order.items.forEach((item: any) => {
        totalAmount += item.total_price;
      });
    }
    
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text(`TOTAL DO PEDIDO: R$ ${totalAmount.toFixed(2)}`, 350, currentY, {
         align: 'right',
         width: 150
       });
  }

  // Adicionar rodapé
  private addFooter(doc: PDFKit.PDFDocument): void {
    const pageHeight = doc.page.height;
    const footerY = pageHeight - 100;
    
    doc.fontSize(10)
       .font('Helvetica')
       .text('Obrigado pela preferência!', 50, footerY, { align: 'center' })
       .text(`Documento gerado em ${moment().format('DD/MM/YYYY HH:mm')}`, 50, footerY + 15, { align: 'center' });
  }

  // Converter status para texto legível
  private getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'Pendente',
      'confirmed': 'Confirmado',
      'preparing': 'Preparando',
      'out_for_delivery': 'Saiu para entrega',
      'delivered': 'Entregue',
      'cancelled': 'Cancelado'
    };
    
    return statusMap[status] || status;
  }

  // Gerar PDF de relatório de vendas
  async generateSalesReportPDF(reportData: any, period: string): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const fileName = `relatorio_vendas_${period.replace(/[^a-zA-Z0-9]/g, '_')}_${moment().format('YYYYMMDD_HHmmss')}.pdf`;
        const filePath = path.join(this.outputDir, fileName);
        
        const doc = new PDFDocument({ margin: 50 });
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // Cabeçalho
        this.addCompanyHeader(doc);
        
        // Título do relatório
        doc.fontSize(18)
           .font('Helvetica-Bold')
           .text('RELATÓRIO DE VENDAS', 50, 140, { align: 'center' });
        
        doc.fontSize(14)
           .font('Helvetica')
           .text(`Período: ${period}`, 50, 170, { align: 'center' });
        
        let currentY = 210;
        
        // Resumo geral
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
        } else {
          currentY += 30;
        }
        
        // Produtos mais vendidos
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
          reportData.top_products.slice(0, 10).forEach((product: any, index: number) => {
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
        
        // Rodapé
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
      } catch (error) {
        console.error('❌ Erro ao criar PDF de relatório:', error);
        reject(error);
      }
    });
  }

  // Listar PDFs gerados
  listGeneratedPDFs(): string[] {
    try {
      const files = fs.readdirSync(this.outputDir)
        .filter(file => file.endsWith('.pdf'))
        .sort((a, b) => {
          const statA = fs.statSync(path.join(this.outputDir, a));
          const statB = fs.statSync(path.join(this.outputDir, b));
          return statB.mtime.getTime() - statA.mtime.getTime();
        });
      
      return files.map(file => path.join(this.outputDir, file));
    } catch (error) {
      console.error('❌ Erro ao listar PDFs:', error);
      return [];
    }
  }

  // Limpar PDFs antigos
  cleanupOldPDFs(daysOld: number = 30): number {
    try {
      const files = fs.readdirSync(this.outputDir);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      let deletedCount = 0;
      
      files.forEach(file => {
        const filePath = path.join(this.outputDir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.mtime < cutoffDate) {
          fs.unlinkSync(filePath);
          deletedCount++;
        }
      });
      
      if (deletedCount > 0) {
        console.log(`🗑️ ${deletedCount} PDFs antigos removidos`);
      }
      
      return deletedCount;
    } catch (error) {
      console.error('❌ Erro ao limpar PDFs antigos:', error);
      return 0;
    }
  }

  // Obter caminho do diretório de PDFs
  getOutputDirectory(): string {
    return this.outputDir;
  }
}

export default new PDFService();