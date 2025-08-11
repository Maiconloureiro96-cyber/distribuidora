import express from 'express';
import reportService from '../services/reportService';
import pdfService from '../services/pdfService';
import { ApiResponse, SalesReport } from '../types';
import moment from 'moment';

const router = express.Router();

// Relatório de vendas diário
router.get('/daily', async (req, res) => {
  try {
    const date = req.query.date as string || moment().format('YYYY-MM-DD');
    
    // Validar formato da data
    if (!moment(date, 'YYYY-MM-DD', true).isValid()) {
      const response: ApiResponse = {
        success: false,
        error: 'Formato de data inválido. Use YYYY-MM-DD'
      };
      
      return res.status(400).json(response);
    }
    
    const report = await reportService.getDailyReport(date);
    
    const response: ApiResponse<SalesReport> = {
      success: true,
      data: report,
      message: `Relatório diário de ${date} gerado com sucesso`
    };
    
    return res.json(response);
  } catch (error: any) {
    console.error('❌ Erro ao gerar relatório diário:', error);
    
    const response: ApiResponse = {
      success: false,
      error: error.message || 'Erro interno do servidor'
    };
    
    return res.status(500).json(response);
  }
});

// Relatório de vendas mensal
router.get('/monthly', async (req, res) => {
  try {
    const month = req.query.month as string || moment().format('YYYY-MM');
    
    // Validar formato do mês
    if (!moment(month, 'YYYY-MM', true).isValid()) {
      const response: ApiResponse = {
        success: false,
        error: 'Formato de mês inválido. Use YYYY-MM'
      };
      
      return res.status(400).json(response);
    }
    
    const year = new Date().getFullYear();
    const monthNumber = parseInt(month);
    const report = await reportService.getMonthlyReport(year, monthNumber);
    
    const response: ApiResponse<SalesReport> = {
      success: true,
      data: report,
      message: `Relatório mensal de ${month} gerado com sucesso`
    };
    
    return res.json(response);
  } catch (error: any) {
    console.error('❌ Erro ao gerar relatório mensal:', error);
    
    const response: ApiResponse = {
      success: false,
      error: error.message || 'Erro interno do servidor'
    };
    
    return res.status(500).json(response);
  }
});

// Relatório de vendas por período personalizado
router.get('/period', async (req, res) => {
  try {
    const startDate = req.query.start_date as string;
    const endDate = req.query.end_date as string;
    
    if (!startDate || !endDate) {
      const response: ApiResponse = {
        success: false,
        error: 'Parâmetros obrigatórios: start_date e end_date (formato YYYY-MM-DD)'
      };
      
      return res.status(400).json(response);
    }
    
    // Validar formato das datas
    if (!moment(startDate, 'YYYY-MM-DD', true).isValid() || !moment(endDate, 'YYYY-MM-DD', true).isValid()) {
      const response: ApiResponse = {
        success: false,
        error: 'Formato de data inválido. Use YYYY-MM-DD'
      };
      
      return res.status(400).json(response);
    }
    
    // Verificar se a data inicial é anterior à final
    if (moment(startDate).isAfter(moment(endDate))) {
      const response: ApiResponse = {
        success: false,
        error: 'Data inicial deve ser anterior à data final'
      };
      
      return res.status(400).json(response);
    }
    
    const report = await reportService.getPeriodReport(startDate, endDate);
    
    const response: ApiResponse<SalesReport> = {
      success: true,
      data: report,
      message: `Relatório do período ${startDate} a ${endDate} gerado com sucesso`
    };
    
    return res.json(response);
  } catch (error: any) {
    console.error('❌ Erro ao gerar relatório por período:', error);
    
    const response: ApiResponse = {
      success: false,
      error: error.message || 'Erro interno do servidor'
    };
    
    return res.status(500).json(response);
  }
});

// Estatísticas gerais
router.get('/stats', async (req, res) => {
  try {
    const stats = await reportService.getGeneralStats();
    
    const response: ApiResponse<any> = {
      success: true,
      data: stats,
      message: 'Estatísticas gerais obtidas com sucesso'
    };
    
    res.json(response);
  } catch (error: any) {
    console.error('❌ Erro ao obter estatísticas gerais:', error);
    
    const response: ApiResponse = {
      success: false,
      error: error.message || 'Erro interno do servidor'
    };
    
    res.status(500).json(response);
  }
});

// Produtos com baixo estoque
router.get('/low-stock', async (req, res) => {
  try {
    const threshold = parseInt(req.query.threshold as string) || 5;
    const products = await reportService.getLowStockProducts(threshold);
    
    const response: ApiResponse<any[]> = {
      success: true,
      data: products,
      message: `${products.length} produtos com estoque baixo (≤ ${threshold})`
    };
    
    res.json(response);
  } catch (error: any) {
    console.error('❌ Erro ao obter produtos com baixo estoque:', error);
    
    const response: ApiResponse = {
      success: false,
      error: error.message || 'Erro interno do servidor'
    };
    
    res.status(500).json(response);
  }
});

// Clientes mais ativos
router.get('/top-customers', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const customers = await reportService.getTopCustomers(limit);
    
    const response: ApiResponse<any[]> = {
      success: true,
      data: customers,
      message: `Top ${customers.length} clientes mais ativos`
    };
    
    res.json(response);
  } catch (error: any) {
    console.error('❌ Erro ao obter clientes mais ativos:', error);
    
    const response: ApiResponse = {
      success: false,
      error: error.message || 'Erro interno do servidor'
    };
    
    res.status(500).json(response);
  }
});

// Análise de vendas por hora
router.get('/hourly-analysis', async (req, res) => {
  try {
    const date = req.query.date as string || moment().format('YYYY-MM-DD');
    
    // Validar formato da data
    if (!moment(date, 'YYYY-MM-DD', true).isValid()) {
      const response: ApiResponse = {
        success: false,
        error: 'Formato de data inválido. Use YYYY-MM-DD'
      };
      
      return res.status(400).json(response);
    }
    
    const analysis = await reportService.getHourlyAnalysis(date);
    
    const response: ApiResponse<any> = {
      success: true,
      data: analysis,
      message: `Análise de vendas por hora do dia ${date}`
    };
    
    return res.json(response);
  } catch (error: any) {
    console.error('❌ Erro ao obter análise por hora:', error);
    
    const response: ApiResponse = {
      success: false,
      error: error.message || 'Erro interno do servidor'
    };
    
    return res.status(500).json(response);
  }
});

// Gerar PDF do relatório diário
router.get('/daily/pdf', async (req, res) => {
  try {
    const date = req.query.date as string || moment().format('YYYY-MM-DD');
    
    // Validar formato da data
    if (!moment(date, 'YYYY-MM-DD', true).isValid()) {
      const response: ApiResponse = {
        success: false,
        error: 'Formato de data inválido. Use YYYY-MM-DD'
      };
      
      return res.status(400).json(response);
    }
    
    // Gerar relatório
    const report = await reportService.getDailyReport(date);
    
    // Gerar PDF
    const pdfPath = await pdfService.generateSalesReportPDF(report, `Diário - ${date}`);
    
    if (!pdfPath) {
      const response: ApiResponse = {
        success: false,
        error: 'Erro ao gerar PDF do relatório'
      };
      
      return res.status(500).json(response);
    }
    
    // Enviar o arquivo PDF
    return res.download(pdfPath, `relatorio-vendas-${date}.pdf`, (err) => {
      if (err) {
        console.error('❌ Erro ao enviar PDF:', err);
      }
    });
  } catch (error: any) {
    console.error('❌ Erro ao gerar PDF do relatório:', error);
    
    const response: ApiResponse = {
      success: false,
      error: error.message || 'Erro interno do servidor'
    };
    
    return res.status(500).json(response);
  }
});

// Gerar PDF do relatório mensal
router.get('/monthly/pdf', async (req, res) => {
  try {
    const month = req.query.month as string || moment().format('YYYY-MM');
    
    // Validar formato do mês
    if (!moment(month, 'YYYY-MM', true).isValid()) {
      const response: ApiResponse = {
        success: false,
        error: 'Formato de mês inválido. Use YYYY-MM'
      };
      
      return res.status(400).json(response);
    }
    
    // Gerar relatório
    const year = new Date().getFullYear();
    const monthNumber = parseInt(month);
    const report = await reportService.getMonthlyReport(year, monthNumber);
    
    // Gerar PDF
    const pdfPath = await pdfService.generateSalesReportPDF(report, `Mensal - ${month}`);
    
    if (!pdfPath) {
      const response: ApiResponse = {
        success: false,
        error: 'Erro ao gerar PDF do relatório'
      };
      
      return res.status(500).json(response);
    }
    
    // Enviar o arquivo PDF
    return res.download(pdfPath, `relatorio-vendas-${month}.pdf`, (err) => {
      if (err) {
        console.error('❌ Erro ao enviar PDF:', err);
      }
    });
  } catch (error: any) {
    console.error('❌ Erro ao gerar PDF do relatório:', error);
    
    const response: ApiResponse = {
      success: false,
      error: error.message || 'Erro interno do servidor'
    };
    
    res.status(500).json(response);
  }
});

// Gerar PDF do relatório por período
router.get('/period/pdf', async (req, res) => {
  try {
    const startDate = req.query.start_date as string;
    const endDate = req.query.end_date as string;
    
    if (!startDate || !endDate) {
      const response: ApiResponse = {
        success: false,
        error: 'Parâmetros obrigatórios: start_date e end_date (formato YYYY-MM-DD)'
      };
      
      return res.status(400).json(response);
    }
    
    // Validar formato das datas
    if (!moment(startDate, 'YYYY-MM-DD', true).isValid() || !moment(endDate, 'YYYY-MM-DD', true).isValid()) {
      const response: ApiResponse = {
        success: false,
        error: 'Formato de data inválido. Use YYYY-MM-DD'
      };
      
      return res.status(400).json(response);
    }
    
    // Verificar se a data inicial é anterior à final
    if (moment(startDate).isAfter(moment(endDate))) {
      const response: ApiResponse = {
        success: false,
        error: 'Data inicial deve ser anterior à data final'
      };
      
      return res.status(400).json(response);
    }
    
    // Gerar relatório
    const report = await reportService.getPeriodReport(startDate, endDate);
    
    // Gerar PDF
    const pdfPath = await pdfService.generateSalesReportPDF(report, `Período - ${startDate} a ${endDate}`);
    
    if (!pdfPath) {
      const response: ApiResponse = {
        success: false,
        error: 'Erro ao gerar PDF do relatório'
      };
      
      return res.status(500).json(response);
    }
    
    // Enviar o arquivo PDF
    return res.download(pdfPath, `relatorio-vendas-${startDate}-${endDate}.pdf`, (err) => {
      if (err) {
        console.error('❌ Erro ao enviar PDF:', err);
      }
    });
  } catch (error: any) {
    console.error('❌ Erro ao gerar PDF do relatório:', error);
    
    const response: ApiResponse = {
      success: false,
      error: error.message || 'Erro interno do servidor'
    };
    
    res.status(500).json(response);
  }
});

export default router;