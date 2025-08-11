import express from 'express';
import productService from '../services/productService';
import { ApiResponse, Product } from '../types';

const router = express.Router();

// Listar todos os produtos
router.get('/', async (req, res) => {
  try {
    const products = await productService.getAllProducts();
    
    const response: ApiResponse<Product[]> = {
      success: true,
      data: products,
      message: `${products.length} produtos encontrados`
    };
    
    return res.json(response);
  } catch (error: any) {
    console.error('❌ Erro ao listar produtos:', error);
    
    const response: ApiResponse = {
      success: false,
      error: error.message || 'Erro interno do servidor'
    };
    
    return res.status(500).json(response);
  }
});

// Buscar produto por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const product = await productService.getProductById(id);
    
    if (!product) {
      const response: ApiResponse = {
        success: false,
        error: 'Produto não encontrado'
      };
      
      return res.status(404).json(response);
    }
    
    const response: ApiResponse<Product> = {
      success: true,
      data: product
    };
    
    return res.json(response);
  } catch (error: any) {
    console.error('❌ Erro ao buscar produto:', error);
    
    const response: ApiResponse = {
      success: false,
      error: error.message || 'Erro interno do servidor'
    };
    
    return res.status(500).json(response);
  }
});

// Buscar produtos por nome
router.get('/search/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const products = await productService.searchProductsByName(name);
    
    const response: ApiResponse<Product[]> = {
      success: true,
      data: products,
      message: `${products.length} produtos encontrados para "${name}"`
    };
    
    return res.json(response);
  } catch (error: any) {
    console.error('❌ Erro ao buscar produtos:', error);
    
    const response: ApiResponse = {
      success: false,
      error: error.message || 'Erro interno do servidor'
    };
    
    return res.status(500).json(response);
  }
});

// Buscar produtos por categoria
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const products = await productService.getProductsByCategory(category);
    
    const response: ApiResponse<Product[]> = {
      success: true,
      data: products,
      message: `${products.length} produtos encontrados na categoria "${category}"`
    };
    
    return res.json(response);
  } catch (error: any) {
    console.error('❌ Erro ao buscar produtos por categoria:', error);
    
    const response: ApiResponse = {
      success: false,
      error: error.message || 'Erro interno do servidor'
    };
    
    return res.status(500).json(response);
  }
});

// Listar todas as categorias
router.get('/categories/list', async (req, res) => {
  try {
    const categories = await productService.getCategories();
    
    const response: ApiResponse<string[]> = {
      success: true,
      data: categories,
      message: `${categories.length} categorias encontradas`
    };
    
    return res.json(response);
  } catch (error: any) {
    console.error('❌ Erro ao listar categorias:', error);
    
    const response: ApiResponse = {
      success: false,
      error: error.message || 'Erro interno do servidor'
    };
    
    return res.status(500).json(response);
  }
});

// Criar novo produto
router.post('/', async (req, res) => {
  try {
    const productData = req.body;
    
    // Validação básica
    if (!productData.name || !productData.price || productData.stock === undefined) {
      const response: ApiResponse = {
        success: false,
        error: 'Campos obrigatórios: name, price, stock'
      };
      
      return res.status(400).json(response);
    }
    
    // Garantir que campos obrigatórios estão definidos
    const newProductData = {
      name: productData.name,
      description: productData.description || '',
      price: parseFloat(productData.price),
      stock: parseInt(productData.stock),
      category: productData.category || null,
      image_url: productData.image_url || null,
      active: productData.active !== undefined ? productData.active : true
    };
    
    const product = await productService.createProduct(newProductData);
    
    if (!product) {
      const response: ApiResponse = {
        success: false,
        error: 'Erro ao criar produto'
      };
      
      return res.status(500).json(response);
    }
    
    const response: ApiResponse<Product> = {
      success: true,
      data: product,
      message: 'Produto criado com sucesso'
    };
    
    return res.status(201).json(response);
  } catch (error: any) {
    console.error('❌ Erro ao criar produto:', error);
    
    const response: ApiResponse = {
      success: false,
      error: error.message || 'Erro interno do servidor'
    };
    
    return res.status(500).json(response);
  }
});

// Atualizar produto
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Verificar se produto existe
    const existingProduct = await productService.getProductById(id);
    if (!existingProduct) {
      const response: ApiResponse = {
        success: false,
        error: 'Produto não encontrado'
      };
      
      return res.status(404).json(response);
    }
    
    // Converter tipos se necessário
    if (updateData.price) {
      updateData.price = parseFloat(updateData.price);
    }
    if (updateData.stock !== undefined) {
      updateData.stock = parseInt(updateData.stock);
    }
    
    const product = await productService.updateProduct(id, updateData);
    
    if (!product) {
      const response: ApiResponse = {
        success: false,
        error: 'Erro ao atualizar produto'
      };
      
      return res.status(500).json(response);
    }
    
    const response: ApiResponse<Product> = {
      success: true,
      data: product,
      message: 'Produto atualizado com sucesso'
    };
    
    return res.json(response);
  } catch (error: any) {
    console.error('❌ Erro ao atualizar produto:', error);
    
    const response: ApiResponse = {
      success: false,
      error: error.message || 'Erro interno do servidor'
    };
    
    return res.status(500).json(response);
  }
});

// Atualizar estoque do produto
router.patch('/:id/stock', async (req, res) => {
  try {
    const { id } = req.params;
    const { stock } = req.body;
    
    if (stock === undefined || stock < 0) {
      const response: ApiResponse = {
        success: false,
        error: 'Estoque deve ser um número maior ou igual a 0'
      };
      
      return res.status(400).json(response);
    }
    
    const success = await productService.updateStock(id, parseInt(stock));
    
    if (!success) {
      const response: ApiResponse = {
        success: false,
        error: 'Erro ao atualizar estoque ou produto não encontrado'
      };
      
      return res.status(404).json(response);
    }
    
    const response: ApiResponse = {
      success: true,
      message: `Estoque atualizado para ${stock} unidades`
    };
    
    return res.json(response);
  } catch (error: any) {
    console.error('❌ Erro ao atualizar estoque:', error);
    
    const response: ApiResponse = {
      success: false,
      error: error.message || 'Erro interno do servidor'
    };
    
    return res.status(500).json(response);
  }
});

// Desativar produto (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const success = await productService.deactivateProduct(id);
    
    if (!success) {
      const response: ApiResponse = {
        success: false,
        error: 'Erro ao desativar produto ou produto não encontrado'
      };
      
      return res.status(404).json(response);
    }
    
    const response: ApiResponse = {
      success: true,
      message: 'Produto desativado com sucesso'
    };
    
    return res.json(response);
  } catch (error: any) {
    console.error('❌ Erro ao desativar produto:', error);
    
    const response: ApiResponse = {
      success: false,
      error: error.message || 'Erro interno do servidor'
    };
    
    return res.status(500).json(response);
  }
});

// Listar produtos com baixo estoque
router.get('/stock/low', async (req, res) => {
  try {
    const threshold = parseInt(req.query.threshold as string) || 5;
    const products = await productService.getLowStockProducts(threshold);
    
    const response: ApiResponse<Product[]> = {
      success: true,
      data: products,
      message: `${products.length} produtos com estoque baixo (≤ ${threshold})`
    };
    
    return res.json(response);
  } catch (error: any) {
    console.error('❌ Erro ao buscar produtos com baixo estoque:', error);
    
    const response: ApiResponse = {
      success: false,
      error: error.message || 'Erro interno do servidor'
    };
    
    return res.status(500).json(response);
  }
});

// Verificar disponibilidade de estoque
router.post('/:id/check-stock', async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    
    if (!quantity || quantity <= 0) {
      const response: ApiResponse = {
        success: false,
        error: 'Quantidade deve ser maior que 0'
      };
      
      return res.status(400).json(response);
    }
    
    const available = await productService.checkStock(id, parseInt(quantity));
    
    const response: ApiResponse<{ available: boolean }> = {
      success: true,
      data: { available },
      message: available 
        ? `Estoque disponível para ${quantity} unidades`
        : `Estoque insuficiente para ${quantity} unidades`
    };
    
    return res.json(response);
  } catch (error: any) {
    console.error('❌ Erro ao verificar estoque:', error);
    
    const response: ApiResponse = {
      success: false,
      error: error.message || 'Erro interno do servidor'
    };
    
    return res.status(500).json(response);
  }
});

export default router;