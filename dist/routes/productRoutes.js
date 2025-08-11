"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const productService_1 = __importDefault(require("../services/productService"));
const router = express_1.default.Router();
router.get('/', async (req, res) => {
    try {
        const products = await productService_1.default.getAllProducts();
        const response = {
            success: true,
            data: products,
            message: `${products.length} produtos encontrados`
        };
        res.json(response);
    }
    catch (error) {
        console.error('❌ Erro ao listar produtos:', error);
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
        const product = await productService_1.default.getProductById(id);
        if (!product) {
            const response = {
                success: false,
                error: 'Produto não encontrado'
            };
            return res.status(404).json(response);
        }
        const response = {
            success: true,
            data: product
        };
        res.json(response);
    }
    catch (error) {
        console.error('❌ Erro ao buscar produto:', error);
        const response = {
            success: false,
            error: error.message || 'Erro interno do servidor'
        };
        res.status(500).json(response);
    }
});
router.get('/search/:name', async (req, res) => {
    try {
        const { name } = req.params;
        const products = await productService_1.default.searchProductsByName(name);
        const response = {
            success: true,
            data: products,
            message: `${products.length} produtos encontrados para "${name}"`
        };
        res.json(response);
    }
    catch (error) {
        console.error('❌ Erro ao buscar produtos:', error);
        const response = {
            success: false,
            error: error.message || 'Erro interno do servidor'
        };
        res.status(500).json(response);
    }
});
router.get('/category/:category', async (req, res) => {
    try {
        const { category } = req.params;
        const products = await productService_1.default.getProductsByCategory(category);
        const response = {
            success: true,
            data: products,
            message: `${products.length} produtos encontrados na categoria "${category}"`
        };
        res.json(response);
    }
    catch (error) {
        console.error('❌ Erro ao buscar produtos por categoria:', error);
        const response = {
            success: false,
            error: error.message || 'Erro interno do servidor'
        };
        res.status(500).json(response);
    }
});
router.get('/categories/list', async (req, res) => {
    try {
        const categories = await productService_1.default.getCategories();
        const response = {
            success: true,
            data: categories,
            message: `${categories.length} categorias encontradas`
        };
        res.json(response);
    }
    catch (error) {
        console.error('❌ Erro ao listar categorias:', error);
        const response = {
            success: false,
            error: error.message || 'Erro interno do servidor'
        };
        res.status(500).json(response);
    }
});
router.post('/', async (req, res) => {
    try {
        const productData = req.body;
        if (!productData.name || !productData.price || productData.stock === undefined) {
            const response = {
                success: false,
                error: 'Campos obrigatórios: name, price, stock'
            };
            return res.status(400).json(response);
        }
        const newProductData = {
            name: productData.name,
            description: productData.description || '',
            price: parseFloat(productData.price),
            stock: parseInt(productData.stock),
            category: productData.category || null,
            image_url: productData.image_url || null,
            active: productData.active !== undefined ? productData.active : true
        };
        const product = await productService_1.default.createProduct(newProductData);
        if (!product) {
            const response = {
                success: false,
                error: 'Erro ao criar produto'
            };
            return res.status(500).json(response);
        }
        const response = {
            success: true,
            data: product,
            message: 'Produto criado com sucesso'
        };
        res.status(201).json(response);
    }
    catch (error) {
        console.error('❌ Erro ao criar produto:', error);
        const response = {
            success: false,
            error: error.message || 'Erro interno do servidor'
        };
        res.status(500).json(response);
    }
});
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const existingProduct = await productService_1.default.getProductById(id);
        if (!existingProduct) {
            const response = {
                success: false,
                error: 'Produto não encontrado'
            };
            return res.status(404).json(response);
        }
        if (updateData.price) {
            updateData.price = parseFloat(updateData.price);
        }
        if (updateData.stock !== undefined) {
            updateData.stock = parseInt(updateData.stock);
        }
        const product = await productService_1.default.updateProduct(id, updateData);
        if (!product) {
            const response = {
                success: false,
                error: 'Erro ao atualizar produto'
            };
            return res.status(500).json(response);
        }
        const response = {
            success: true,
            data: product,
            message: 'Produto atualizado com sucesso'
        };
        res.json(response);
    }
    catch (error) {
        console.error('❌ Erro ao atualizar produto:', error);
        const response = {
            success: false,
            error: error.message || 'Erro interno do servidor'
        };
        res.status(500).json(response);
    }
});
router.patch('/:id/stock', async (req, res) => {
    try {
        const { id } = req.params;
        const { stock } = req.body;
        if (stock === undefined || stock < 0) {
            const response = {
                success: false,
                error: 'Estoque deve ser um número maior ou igual a 0'
            };
            return res.status(400).json(response);
        }
        const success = await productService_1.default.updateStock(id, parseInt(stock));
        if (!success) {
            const response = {
                success: false,
                error: 'Erro ao atualizar estoque ou produto não encontrado'
            };
            return res.status(404).json(response);
        }
        const response = {
            success: true,
            message: `Estoque atualizado para ${stock} unidades`
        };
        res.json(response);
    }
    catch (error) {
        console.error('❌ Erro ao atualizar estoque:', error);
        const response = {
            success: false,
            error: error.message || 'Erro interno do servidor'
        };
        res.status(500).json(response);
    }
});
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const success = await productService_1.default.deactivateProduct(id);
        if (!success) {
            const response = {
                success: false,
                error: 'Erro ao desativar produto ou produto não encontrado'
            };
            return res.status(404).json(response);
        }
        const response = {
            success: true,
            message: 'Produto desativado com sucesso'
        };
        res.json(response);
    }
    catch (error) {
        console.error('❌ Erro ao desativar produto:', error);
        const response = {
            success: false,
            error: error.message || 'Erro interno do servidor'
        };
        res.status(500).json(response);
    }
});
router.get('/stock/low', async (req, res) => {
    try {
        const threshold = parseInt(req.query.threshold) || 5;
        const products = await productService_1.default.getLowStockProducts(threshold);
        const response = {
            success: true,
            data: products,
            message: `${products.length} produtos com estoque baixo (≤ ${threshold})`
        };
        res.json(response);
    }
    catch (error) {
        console.error('❌ Erro ao buscar produtos com baixo estoque:', error);
        const response = {
            success: false,
            error: error.message || 'Erro interno do servidor'
        };
        res.status(500).json(response);
    }
});
router.post('/:id/check-stock', async (req, res) => {
    try {
        const { id } = req.params;
        const { quantity } = req.body;
        if (!quantity || quantity <= 0) {
            const response = {
                success: false,
                error: 'Quantidade deve ser maior que 0'
            };
            return res.status(400).json(response);
        }
        const available = await productService_1.default.checkStock(id, parseInt(quantity));
        const response = {
            success: true,
            data: { available },
            message: available
                ? `Estoque disponível para ${quantity} unidades`
                : `Estoque insuficiente para ${quantity} unidades`
        };
        res.json(response);
    }
    catch (error) {
        console.error('❌ Erro ao verificar estoque:', error);
        const response = {
            success: false,
            error: error.message || 'Erro interno do servidor'
        };
        res.status(500).json(response);
    }
});
exports.default = router;
//# sourceMappingURL=productRoutes.js.map