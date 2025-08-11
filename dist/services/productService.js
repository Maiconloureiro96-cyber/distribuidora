"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const supabase_1 = require("../config/supabase");
class ProductService {
    async getAllProducts() {
        try {
            const { data, error } = await supabase_1.supabase
                .from('products')
                .select('*')
                .eq('active', true)
                .order('name', { ascending: true });
            if (error) {
                console.error('❌ Erro ao buscar produtos:', error);
                throw error;
            }
            return data || [];
        }
        catch (error) {
            console.error('❌ Erro no serviço de produtos:', error);
            throw error;
        }
    }
    async getProductById(id) {
        try {
            const { data, error } = await supabase_1.supabase
                .from('products')
                .select('*')
                .eq('id', id)
                .eq('active', true)
                .single();
            if (error) {
                if (error.code === 'PGRST116') {
                    return null;
                }
                console.error('❌ Erro ao buscar produto por ID:', error);
                throw error;
            }
            return data;
        }
        catch (error) {
            console.error('❌ Erro no serviço de produtos:', error);
            throw error;
        }
    }
    async searchProductsByName(name) {
        try {
            const { data, error } = await supabase_1.supabase
                .from('products')
                .select('*')
                .ilike('name', `%${name}%`)
                .eq('active', true)
                .order('name', { ascending: true });
            if (error) {
                console.error('❌ Erro ao buscar produtos por nome:', error);
                throw error;
            }
            return data || [];
        }
        catch (error) {
            console.error('❌ Erro no serviço de produtos:', error);
            throw error;
        }
    }
    async getProductsByCategory(category) {
        try {
            const { data, error } = await supabase_1.supabase
                .from('products')
                .select('*')
                .eq('category', category)
                .eq('active', true)
                .order('name', { ascending: true });
            if (error) {
                console.error('❌ Erro ao buscar produtos por categoria:', error);
                throw error;
            }
            return data || [];
        }
        catch (error) {
            console.error('❌ Erro no serviço de produtos:', error);
            throw error;
        }
    }
    async checkStock(productId, quantity) {
        try {
            const product = await this.getProductById(productId);
            if (!product) {
                return false;
            }
            return product.stock >= quantity;
        }
        catch (error) {
            console.error('❌ Erro ao verificar estoque:', error);
            return false;
        }
    }
    async updateStock(productId, newStock) {
        try {
            const { error } = await supabase_1.supabase
                .from('products')
                .update({
                stock: newStock,
                updated_at: new Date().toISOString()
            })
                .eq('id', productId);
            if (error) {
                console.error('❌ Erro ao atualizar estoque:', error);
                return false;
            }
            console.log(`✅ Estoque atualizado para produto ${productId}: ${newStock}`);
            return true;
        }
        catch (error) {
            console.error('❌ Erro no serviço de produtos:', error);
            return false;
        }
    }
    async reduceStock(productId, quantity) {
        try {
            const product = await this.getProductById(productId);
            if (!product) {
                console.error('❌ Produto não encontrado para reduzir estoque');
                return false;
            }
            if (product.stock < quantity) {
                console.error('❌ Estoque insuficiente');
                return false;
            }
            const newStock = product.stock - quantity;
            return await this.updateStock(productId, newStock);
        }
        catch (error) {
            console.error('❌ Erro ao reduzir estoque:', error);
            return false;
        }
    }
    async createProduct(productData) {
        try {
            const { data, error } = await supabase_1.supabase
                .from('products')
                .insert({
                ...productData,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
                .select()
                .single();
            if (error) {
                console.error('❌ Erro ao criar produto:', error);
                throw error;
            }
            console.log('✅ Produto criado com sucesso:', data.name);
            return data;
        }
        catch (error) {
            console.error('❌ Erro no serviço de produtos:', error);
            throw error;
        }
    }
    async updateProduct(id, productData) {
        try {
            const { data, error } = await supabase_1.supabase
                .from('products')
                .update({
                ...productData,
                updated_at: new Date().toISOString()
            })
                .eq('id', id)
                .select()
                .single();
            if (error) {
                console.error('❌ Erro ao atualizar produto:', error);
                throw error;
            }
            console.log('✅ Produto atualizado com sucesso:', data.name);
            return data;
        }
        catch (error) {
            console.error('❌ Erro no serviço de produtos:', error);
            throw error;
        }
    }
    async deactivateProduct(id) {
        try {
            const { error } = await supabase_1.supabase
                .from('products')
                .update({
                active: false,
                updated_at: new Date().toISOString()
            })
                .eq('id', id);
            if (error) {
                console.error('❌ Erro ao desativar produto:', error);
                return false;
            }
            console.log('✅ Produto desativado com sucesso');
            return true;
        }
        catch (error) {
            console.error('❌ Erro no serviço de produtos:', error);
            return false;
        }
    }
    async getLowStockProducts(threshold = 5) {
        try {
            const { data, error } = await supabase_1.supabase
                .from('products')
                .select('*')
                .lte('stock', threshold)
                .eq('active', true)
                .order('stock', { ascending: true });
            if (error) {
                console.error('❌ Erro ao buscar produtos com baixo estoque:', error);
                throw error;
            }
            return data || [];
        }
        catch (error) {
            console.error('❌ Erro no serviço de produtos:', error);
            throw error;
        }
    }
    async getCategories() {
        try {
            const { data, error } = await supabase_1.supabase
                .from('products')
                .select('category')
                .eq('active', true)
                .not('category', 'is', null);
            if (error) {
                console.error('❌ Erro ao buscar categorias:', error);
                throw error;
            }
            const categories = [...new Set(data?.map(item => item.category).filter(Boolean))];
            return categories.sort();
        }
        catch (error) {
            console.error('❌ Erro no serviço de produtos:', error);
            throw error;
        }
    }
}
exports.default = new ProductService();
//# sourceMappingURL=productService.js.map