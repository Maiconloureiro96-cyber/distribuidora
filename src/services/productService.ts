import { supabase } from '../config/supabase';
import { Product } from '../types';

class ProductService {
  // Listar todos os produtos ativos
  async getAllProducts(): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('active', true)
        .order('name', { ascending: true });

      if (error) {
        console.error('❌ Erro ao buscar produtos:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('❌ Erro no serviço de produtos:', error);
      throw error;
    }
  }

  // Buscar produto por ID
  async getProductById(id: string): Promise<Product | null> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .eq('active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Produto não encontrado
        }
        console.error('❌ Erro ao buscar produto por ID:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('❌ Erro no serviço de produtos:', error);
      throw error;
    }
  }

  // Buscar produtos por nome (busca parcial)
  async searchProductsByName(name: string): Promise<Product[]> {
    try {
      const { data, error } = await supabase
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
    } catch (error) {
      console.error('❌ Erro no serviço de produtos:', error);
      throw error;
    }
  }

  // Buscar produtos por categoria
  async getProductsByCategory(category: string): Promise<Product[]> {
    try {
      const { data, error } = await supabase
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
    } catch (error) {
      console.error('❌ Erro no serviço de produtos:', error);
      throw error;
    }
  }

  // Verificar disponibilidade em estoque
  async checkStock(productId: string, quantity: number): Promise<boolean> {
    try {
      const product = await this.getProductById(productId);
      if (!product) {
        return false;
      }

      return product.stock >= quantity;
    } catch (error) {
      console.error('❌ Erro ao verificar estoque:', error);
      return false;
    }
  }

  // Atualizar estoque do produto
  async updateStock(productId: string, newStock: number): Promise<boolean> {
    try {
      const { error } = await supabase
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
    } catch (error) {
      console.error('❌ Erro no serviço de produtos:', error);
      return false;
    }
  }

  // Reduzir estoque após venda
  async reduceStock(productId: string, quantity: number): Promise<boolean> {
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
    } catch (error) {
      console.error('❌ Erro ao reduzir estoque:', error);
      return false;
    }
  }

  // Criar novo produto
  async createProduct(productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product | null> {
    try {
      const { data, error } = await supabase
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
    } catch (error) {
      console.error('❌ Erro no serviço de produtos:', error);
      throw error;
    }
  }

  // Atualizar produto
  async updateProduct(id: string, productData: Partial<Product>): Promise<Product | null> {
    try {
      const { data, error } = await supabase
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
    } catch (error) {
      console.error('❌ Erro no serviço de produtos:', error);
      throw error;
    }
  }

  // Desativar produto (soft delete)
  async deactivateProduct(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
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
    } catch (error) {
      console.error('❌ Erro no serviço de produtos:', error);
      return false;
    }
  }

  // Obter produtos com baixo estoque
  async getLowStockProducts(threshold: number = 5): Promise<Product[]> {
    try {
      const { data, error } = await supabase
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
    } catch (error) {
      console.error('❌ Erro no serviço de produtos:', error);
      throw error;
    }
  }

  // Obter todas as categorias disponíveis
  async getCategories(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('category')
        .eq('active', true)
        .not('category', 'is', null);

      if (error) {
        console.error('❌ Erro ao buscar categorias:', error);
        throw error;
      }

      // Remover duplicatas e valores nulos
      const categories = [...new Set(data?.map(item => item.category).filter(Boolean))];
      return categories.sort();
    } catch (error) {
      console.error('❌ Erro no serviço de produtos:', error);
      throw error;
    }
  }
}

export default new ProductService();