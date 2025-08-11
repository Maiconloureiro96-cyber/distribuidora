"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const orderService_1 = __importDefault(require("../services/orderService"));
const pdfService_1 = __importDefault(require("../services/pdfService"));
const router = express_1.default.Router();
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const orders = await orderService_1.default.getAllOrders(page, limit);
        const response = {
            success: true,
            data: orders,
            message: `${orders.length} pedidos encontrados (página ${page})`
        };
        res.json(response);
    }
    catch (error) {
        console.error('❌ Erro ao listar pedidos:', error);
        const response = {
            success: false,
            error: error.message || 'Erro interno do servidor'
        };
        res.status(500).json(response);
    }
});
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const order = await orderService_1.default.getOrderById(id);
        if (!order) {
            const response = {
                success: false,
                error: 'Pedido não encontrado'
            };
            return res.status(404).json(response);
        }
        const response = {
            success: true,
            data: order
        };
        res.json(response);
    }
    catch (error) {
        console.error('❌ Erro ao buscar pedido:', error);
        const response = {
            success: false,
            error: error.message || 'Erro interno do servidor'
        };
        res.status(500).json(response);
    }
});
router.get('/customer/:phone', async (req, res) => {
    try {
        const { phone } = req.params;
        const orders = await orderService_1.default.getOrdersByCustomerPhone(phone);
        const response = {
            success: true,
            data: orders,
            message: `${orders.length} pedidos encontrados para o cliente ${phone}`
        };
        res.json(response);
    }
    catch (error) {
        console.error('❌ Erro ao buscar pedidos do cliente:', error);
        const response = {
            success: false,
            error: error.message || 'Erro interno do servidor'
        };
        res.status(500).json(response);
    }
});
router.get('/customer/:phone/last', async (req, res) => {
    try {
        const { phone } = req.params;
        const order = await orderService_1.default.getLastOrderByCustomer(phone);
        if (!order) {
            const response = {
                success: false,
                error: 'Nenhum pedido encontrado para este cliente'
            };
            return res.status(404).json(response);
        }
        const response = {
            success: true,
            data: order,
            message: 'Último pedido do cliente encontrado'
        };
        res.json(response);
    }
    catch (error) {
        console.error('❌ Erro ao buscar último pedido:', error);
        const response = {
            success: false,
            error: error.message || 'Erro interno do servidor'
        };
        res.status(500).json(response);
    }
});
router.get('/status/:status', async (req, res) => {
    try {
        const { status } = req.params;
        const validStatuses = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            const response = {
                success: false,
                error: `Status inválido. Valores aceitos: ${validStatuses.join(', ')}`
            };
            return res.status(400).json(response);
        }
        const orders = await orderService_1.default.getOrdersByStatus(status);
        const response = {
            success: true,
            data: orders,
            message: `${orders.length} pedidos encontrados com status "${status}"`
        };
        res.json(response);
    }
    catch (error) {
        console.error('❌ Erro ao buscar pedidos por status:', error);
        const response = {
            success: false,
            error: error.message || 'Erro interno do servidor'
        };
        res.status(500).json(response);
    }
});
router.post('/', async (req, res) => {
    try {
        const orderData = req.body;
        if (!orderData.customer_phone || !orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
            const response = {
                success: false,
                error: 'Campos obrigatórios: customer_phone, items (array não vazio)'
            };
            return res.status(400).json(response);
        }
        for (const item of orderData.items) {
            if (!item.product_id || !item.quantity || item.quantity <= 0) {
                const response = {
                    success: false,
                    error: 'Cada item deve ter product_id e quantity > 0'
                };
                return res.status(400).json(response);
            }
        }
        const order = await orderService_1.default.createOrder(orderData);
        if (!order) {
            const response = {
                success: false,
                error: 'Erro ao criar pedido. Verifique se os produtos existem e há estoque suficiente'
            };
            return res.status(400).json(response);
        }
        const response = {
            success: true,
            data: order,
            message: 'Pedido criado com sucesso'
        };
        res.status(201).json(response);
    }
    catch (error) {
        console.error('❌ Erro ao criar pedido:', error);
        const response = {
            success: false,
            error: error.message || 'Erro interno do servidor'
        };
        res.status(500).json(response);
    }
});
router.patch('/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const validStatuses = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            const response = {
                success: false,
                error: `Status inválido. Valores aceitos: ${validStatuses.join(', ')}`
            };
            return res.status(400).json(response);
        }
        const success = await orderService_1.default.updateOrderStatus(id, status);
        if (!success) {
            const response = {
                success: false,
                error: 'Erro ao atualizar status ou pedido não encontrado'
            };
            return res.status(404).json(response);
        }
        const response = {
            success: true,
            message: `Status do pedido atualizado para "${status}"`
        };
        res.json(response);
    }
    catch (error) {
        console.error('❌ Erro ao atualizar status do pedido:', error);
        const response = {
            success: false,
            error: error.message || 'Erro interno do servidor'
        };
        res.status(500).json(response);
    }
});
router.patch('/:id/cancel', async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const success = await orderService_1.default.cancelOrder(id, reason);
        if (!success) {
            const response = {
                success: false,
                error: 'Erro ao cancelar pedido ou pedido não encontrado'
            };
            return res.status(404).json(response);
        }
        const response = {
            success: true,
            message: 'Pedido cancelado com sucesso. Estoque restaurado.'
        };
        res.json(response);
    }
    catch (error) {
        console.error('❌ Erro ao cancelar pedido:', error);
        const response = {
            success: false,
            error: error.message || 'Erro interno do servidor'
        };
        res.status(500).json(response);
    }
});
router.get('/:id/pdf', async (req, res) => {
    try {
        const { id } = req.params;
        const order = await orderService_1.default.getOrderById(id);
        if (!order) {
            const response = {
                success: false,
                error: 'Pedido não encontrado'
            };
            return res.status(404).json(response);
        }
        const pdfPath = await pdfService_1.default.generateOrderPDF(order);
        if (!pdfPath) {
            const response = {
                success: false,
                error: 'Erro ao gerar PDF do pedido'
            };
            return res.status(500).json(response);
        }
        res.download(pdfPath, `pedido-${order.id}.pdf`, (err) => {
            if (err) {
                console.error('❌ Erro ao enviar PDF:', err);
                const response = {
                    success: false,
                    error: 'Erro ao enviar PDF'
                };
                res.status(500).json(response);
            }
        });
    }
    catch (error) {
        console.error('❌ Erro ao gerar PDF do pedido:', error);
        const response = {
            success: false,
            error: error.message || 'Erro interno do servidor'
        };
        res.status(500).json(response);
    }
});
router.get('/pdfs/list', async (req, res) => {
    try {
        const pdfs = await pdfService_1.default.listGeneratedPDFs();
        const response = {
            success: true,
            data: pdfs,
            message: `${pdfs.length} PDFs encontrados`
        };
        res.json(response);
    }
    catch (error) {
        console.error('❌ Erro ao listar PDFs:', error);
        const response = {
            success: false,
            error: error.message || 'Erro interno do servidor'
        };
        res.status(500).json(response);
    }
});
router.delete('/pdfs/cleanup', async (req, res) => {
    try {
        const daysOld = parseInt(req.query.days) || 7;
        const deletedCount = await pdfService_1.default.cleanupOldPDFs(daysOld);
        const response = {
            success: true,
            data: { deletedCount },
            message: `${deletedCount} PDFs antigos removidos (mais de ${daysOld} dias)`
        };
        res.json(response);
    }
    catch (error) {
        console.error('❌ Erro ao limpar PDFs:', error);
        const response = {
            success: false,
            error: error.message || 'Erro interno do servidor'
        };
        res.status(500).json(response);
    }
});
exports.default = router;
//# sourceMappingURL=orderRoutes.js.map