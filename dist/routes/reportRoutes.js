"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const reportService_1 = __importDefault(require("../services/reportService"));
const pdfService_1 = __importDefault(require("../services/pdfService"));
const moment_1 = __importDefault(require("moment"));
const router = express_1.default.Router();
router.get('/daily', async (req, res) => {
    try {
        const date = req.query.date || (0, moment_1.default)().format('YYYY-MM-DD');
        if (!(0, moment_1.default)(date, 'YYYY-MM-DD', true).isValid()) {
            const response = {
                success: false,
                error: 'Formato de data inválido. Use YYYY-MM-DD'
            };
            return res.status(400).json(response);
        }
        const report = await reportService_1.default.getDailyReport(date);
        const response = {
            success: true,
            data: report,
            message: `Relatório diário de ${date} gerado com sucesso`
        };
        return res.json(response);
    }
    catch (error) {
        console.error('❌ Erro ao gerar relatório diário:', error);
        const response = {
            success: false,
            error: error.message || 'Erro interno do servidor'
        };
        return res.status(500).json(response);
    }
});
router.get('/monthly', async (req, res) => {
    try {
        const month = req.query.month || (0, moment_1.default)().format('YYYY-MM');
        if (!(0, moment_1.default)(month, 'YYYY-MM', true).isValid()) {
            const response = {
                success: false,
                error: 'Formato de mês inválido. Use YYYY-MM'
            };
            return res.status(400).json(response);
        }
        const year = new Date().getFullYear();
        const monthNumber = parseInt(month);
        const report = await reportService_1.default.getMonthlyReport(year, monthNumber);
        const response = {
            success: true,
            data: report,
            message: `Relatório mensal de ${month} gerado com sucesso`
        };
        return res.json(response);
    }
    catch (error) {
        console.error('❌ Erro ao gerar relatório mensal:', error);
        const response = {
            success: false,
            error: error.message || 'Erro interno do servidor'
        };
        return res.status(500).json(response);
    }
});
router.get('/period', async (req, res) => {
    try {
        const startDate = req.query.start_date;
        const endDate = req.query.end_date;
        if (!startDate || !endDate) {
            const response = {
                success: false,
                error: 'Parâmetros obrigatórios: start_date e end_date (formato YYYY-MM-DD)'
            };
            return res.status(400).json(response);
        }
        if (!(0, moment_1.default)(startDate, 'YYYY-MM-DD', true).isValid() || !(0, moment_1.default)(endDate, 'YYYY-MM-DD', true).isValid()) {
            const response = {
                success: false,
                error: 'Formato de data inválido. Use YYYY-MM-DD'
            };
            return res.status(400).json(response);
        }
        if ((0, moment_1.default)(startDate).isAfter((0, moment_1.default)(endDate))) {
            const response = {
                success: false,
                error: 'Data inicial deve ser anterior à data final'
            };
            return res.status(400).json(response);
        }
        const report = await reportService_1.default.getPeriodReport(startDate, endDate);
        const response = {
            success: true,
            data: report,
            message: `Relatório do período ${startDate} a ${endDate} gerado com sucesso`
        };
        return res.json(response);
    }
    catch (error) {
        console.error('❌ Erro ao gerar relatório por período:', error);
        const response = {
            success: false,
            error: error.message || 'Erro interno do servidor'
        };
        return res.status(500).json(response);
    }
});
router.get('/stats', async (req, res) => {
    try {
        const stats = await reportService_1.default.getGeneralStats();
        const response = {
            success: true,
            data: stats,
            message: 'Estatísticas gerais obtidas com sucesso'
        };
        res.json(response);
    }
    catch (error) {
        console.error('❌ Erro ao obter estatísticas gerais:', error);
        const response = {
            success: false,
            error: error.message || 'Erro interno do servidor'
        };
        res.status(500).json(response);
    }
});
router.get('/low-stock', async (req, res) => {
    try {
        const threshold = parseInt(req.query.threshold) || 5;
        const products = await reportService_1.default.getLowStockProducts(threshold);
        const response = {
            success: true,
            data: products,
            message: `${products.length} produtos com estoque baixo (≤ ${threshold})`
        };
        res.json(response);
    }
    catch (error) {
        console.error('❌ Erro ao obter produtos com baixo estoque:', error);
        const response = {
            success: false,
            error: error.message || 'Erro interno do servidor'
        };
        res.status(500).json(response);
    }
});
router.get('/top-customers', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const customers = await reportService_1.default.getTopCustomers(limit);
        const response = {
            success: true,
            data: customers,
            message: `Top ${customers.length} clientes mais ativos`
        };
        res.json(response);
    }
    catch (error) {
        console.error('❌ Erro ao obter clientes mais ativos:', error);
        const response = {
            success: false,
            error: error.message || 'Erro interno do servidor'
        };
        res.status(500).json(response);
    }
});
router.get('/hourly-analysis', async (req, res) => {
    try {
        const date = req.query.date || (0, moment_1.default)().format('YYYY-MM-DD');
        if (!(0, moment_1.default)(date, 'YYYY-MM-DD', true).isValid()) {
            const response = {
                success: false,
                error: 'Formato de data inválido. Use YYYY-MM-DD'
            };
            return res.status(400).json(response);
        }
        const analysis = await reportService_1.default.getHourlyAnalysis(date);
        const response = {
            success: true,
            data: analysis,
            message: `Análise de vendas por hora do dia ${date}`
        };
        return res.json(response);
    }
    catch (error) {
        console.error('❌ Erro ao obter análise por hora:', error);
        const response = {
            success: false,
            error: error.message || 'Erro interno do servidor'
        };
        return res.status(500).json(response);
    }
});
router.get('/daily/pdf', async (req, res) => {
    try {
        const date = req.query.date || (0, moment_1.default)().format('YYYY-MM-DD');
        if (!(0, moment_1.default)(date, 'YYYY-MM-DD', true).isValid()) {
            const response = {
                success: false,
                error: 'Formato de data inválido. Use YYYY-MM-DD'
            };
            return res.status(400).json(response);
        }
        const report = await reportService_1.default.getDailyReport(date);
        const pdfPath = await pdfService_1.default.generateSalesReportPDF(report, `Diário - ${date}`);
        if (!pdfPath) {
            const response = {
                success: false,
                error: 'Erro ao gerar PDF do relatório'
            };
            return res.status(500).json(response);
        }
        return res.download(pdfPath, `relatorio-vendas-${date}.pdf`, (err) => {
            if (err) {
                console.error('❌ Erro ao enviar PDF:', err);
            }
        });
    }
    catch (error) {
        console.error('❌ Erro ao gerar PDF do relatório:', error);
        const response = {
            success: false,
            error: error.message || 'Erro interno do servidor'
        };
        return res.status(500).json(response);
    }
});
router.get('/monthly/pdf', async (req, res) => {
    try {
        const month = req.query.month || (0, moment_1.default)().format('YYYY-MM');
        if (!(0, moment_1.default)(month, 'YYYY-MM', true).isValid()) {
            const response = {
                success: false,
                error: 'Formato de mês inválido. Use YYYY-MM'
            };
            return res.status(400).json(response);
        }
        const year = new Date().getFullYear();
        const monthNumber = parseInt(month);
        const report = await reportService_1.default.getMonthlyReport(year, monthNumber);
        const pdfPath = await pdfService_1.default.generateSalesReportPDF(report, `Mensal - ${month}`);
        if (!pdfPath) {
            const response = {
                success: false,
                error: 'Erro ao gerar PDF do relatório'
            };
            return res.status(500).json(response);
        }
        return res.download(pdfPath, `relatorio-vendas-${month}.pdf`, (err) => {
            if (err) {
                console.error('❌ Erro ao enviar PDF:', err);
            }
        });
    }
    catch (error) {
        console.error('❌ Erro ao gerar PDF do relatório:', error);
        const response = {
            success: false,
            error: error.message || 'Erro interno do servidor'
        };
        res.status(500).json(response);
    }
});
router.get('/period/pdf', async (req, res) => {
    try {
        const startDate = req.query.start_date;
        const endDate = req.query.end_date;
        if (!startDate || !endDate) {
            const response = {
                success: false,
                error: 'Parâmetros obrigatórios: start_date e end_date (formato YYYY-MM-DD)'
            };
            return res.status(400).json(response);
        }
        if (!(0, moment_1.default)(startDate, 'YYYY-MM-DD', true).isValid() || !(0, moment_1.default)(endDate, 'YYYY-MM-DD', true).isValid()) {
            const response = {
                success: false,
                error: 'Formato de data inválido. Use YYYY-MM-DD'
            };
            return res.status(400).json(response);
        }
        if ((0, moment_1.default)(startDate).isAfter((0, moment_1.default)(endDate))) {
            const response = {
                success: false,
                error: 'Data inicial deve ser anterior à data final'
            };
            return res.status(400).json(response);
        }
        const report = await reportService_1.default.getPeriodReport(startDate, endDate);
        const pdfPath = await pdfService_1.default.generateSalesReportPDF(report, `Período - ${startDate} a ${endDate}`);
        if (!pdfPath) {
            const response = {
                success: false,
                error: 'Erro ao gerar PDF do relatório'
            };
            return res.status(500).json(response);
        }
        return res.download(pdfPath, `relatorio-vendas-${startDate}-${endDate}.pdf`, (err) => {
            if (err) {
                console.error('❌ Erro ao enviar PDF:', err);
            }
        });
    }
    catch (error) {
        console.error('❌ Erro ao gerar PDF do relatório:', error);
        const response = {
            success: false,
            error: error.message || 'Erro interno do servidor'
        };
        res.status(500).json(response);
    }
});
exports.default = router;
//# sourceMappingURL=reportRoutes.js.map