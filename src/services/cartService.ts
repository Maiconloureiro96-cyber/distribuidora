import { supabase } from '../config/supabase';
import { Cart, CartItem, ConversationSession, ConversationStep } from '../types';
import productService from './productService';

class CartService {
  // Cache em memória para sessões ativas (em produção, considere usar Redis)
  private sessions: Map<string, ConversationSession> = new Map();
  private carts: Map<string, Cart> = new Map();

  // Obter ou criar sessão de conversa
  getSession(phone: string): ConversationSession {
    if (!this.sessions.has(phone)) {
      this.sessions.set(phone, {
        phone,
        step: ConversationStep.GREETING,
        data: {},
        last_activity: new Date().toISOString()
      });
    }

    const session = this.sessions.get(phone)!;
    session.last_activity = new Date().toISOString();
    return session;
  }

  // Atualizar sessão de conversa
  updateSession(phone: string, step: ConversationStep, data?: any): void {
    const session = this.getSession(phone);
    session.step = step;
    if (data) {
      session.data = { ...session.data, ...data };
    }
    session.last_activity = new Date().toISOString();
  }

  // Limpar sessão
  clearSession(phone: string): void {
    this.sessions.delete(phone);
    this.carts.delete(phone);
  }

  // Obter ou criar carrinho
  getCart(phone: string): Cart {
    if (!this.carts.has(phone)) {
      this.carts.set(phone, {
        phone,
        items: [],
        total_amount: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }

    return this.carts.get(phone)!;
  }

  // Adicionar item ao carrinho
  async addToCart(phone: string, productId: string, quantity: number): Promise<{ success: boolean, message: string, cart?: Cart }> {
    try {
      const product = await productService.getProductById(productId);
      if (!product) {
        return {
          success: false,
          message: 'Produto não encontrado'
        };
      }

      // Verificar estoque
      const cart = this.getCart(phone);
      const existingItem = cart.items.find(item => item.product_id === productId);
      const currentQuantityInCart = existingItem ? existingItem.quantity : 0;
      const totalQuantity = currentQuantityInCart + quantity;

      if (product.stock < totalQuantity) {
        return {
          success: false,
          message: `Estoque insuficiente. Disponível: ${product.stock} unidades`
        };
      }

      // Adicionar ou atualizar item no carrinho
      if (existingItem) {
        existingItem.quantity = totalQuantity;
        existingItem.total_price = existingItem.quantity * existingItem.unit_price;
      } else {
        const newItem: CartItem = {
          product_id: productId,
          product_name: product.name,
          quantity: quantity,
          unit_price: product.price,
          total_price: quantity * product.price
        };
        cart.items.push(newItem);
      }

      // Recalcular total
      cart.total_amount = cart.items.reduce((total, item) => total + item.total_price, 0);
      cart.updated_at = new Date().toISOString();

      console.log(`✅ Produto adicionado ao carrinho: ${product.name} x${quantity}`);
      return {
        success: true,
        message: `${product.name} adicionado ao carrinho (${quantity}x)`,
        cart
      };
    } catch (error) {
      console.error('❌ Erro ao adicionar item ao carrinho:', error);
      return {
        success: false,
        message: 'Erro interno. Tente novamente.'
      };
    }
  }

  // Remover item do carrinho
  removeFromCart(phone: string, productId: string): { success: boolean, message: string, cart?: Cart } {
    try {
      const cart = this.getCart(phone);
      const itemIndex = cart.items.findIndex(item => item.product_id === productId);

      if (itemIndex === -1) {
        return {
          success: false,
          message: 'Item não encontrado no carrinho'
        };
      }

      const removedItem = cart.items[itemIndex];
      cart.items.splice(itemIndex, 1);

      // Recalcular total
      cart.total_amount = cart.items.reduce((total, item) => total + item.total_price, 0);
      cart.updated_at = new Date().toISOString();

      console.log(`✅ Produto removido do carrinho: ${removedItem.product_name}`);
      return {
        success: true,
        message: `${removedItem.product_name} removido do carrinho`,
        cart
      };
    } catch (error) {
      console.error('❌ Erro ao remover item do carrinho:', error);
      return {
        success: false,
        message: 'Erro interno. Tente novamente.'
      };
    }
  }

  // Atualizar quantidade de item no carrinho
  async updateCartItemQuantity(phone: string, productId: string, newQuantity: number): Promise<{ success: boolean, message: string, cart?: Cart }> {
    try {
      if (newQuantity <= 0) {
        return this.removeFromCart(phone, productId);
      }

      const product = await productService.getProductById(productId);
      if (!product) {
        return {
          success: false,
          message: 'Produto não encontrado'
        };
      }

      // Verificar estoque
      if (product.stock < newQuantity) {
        return {
          success: false,
          message: `Estoque insuficiente. Disponível: ${product.stock} unidades`
        };
      }

      const cart = this.getCart(phone);
      const item = cart.items.find(item => item.product_id === productId);

      if (!item) {
        return {
          success: false,
          message: 'Item não encontrado no carrinho'
        };
      }

      item.quantity = newQuantity;
      item.total_price = item.quantity * item.unit_price;

      // Recalcular total
      cart.total_amount = cart.items.reduce((total, item) => total + item.total_price, 0);
      cart.updated_at = new Date().toISOString();

      console.log(`✅ Quantidade atualizada: ${item.product_name} x${newQuantity}`);
      return {
        success: true,
        message: `Quantidade de ${item.product_name} atualizada para ${newQuantity}`,
        cart
      };
    } catch (error) {
      console.error('❌ Erro ao atualizar quantidade:', error);
      return {
        success: false,
        message: 'Erro interno. Tente novamente.'
      };
    }
  }

  // Limpar carrinho
  clearCart(phone: string): void {
    this.carts.delete(phone);
    console.log(`🗑️ Carrinho limpo para ${phone}`);
  }

  // Verificar se carrinho está vazio
  isCartEmpty(phone: string): boolean {
    const cart = this.getCart(phone);
    return cart.items.length === 0;
  }

  // Obter resumo do carrinho formatado
  getCartSummary(phone: string): string {
    const cart = this.getCart(phone);
    
    if (cart.items.length === 0) {
      return '🛒 Seu carrinho está vazio';
    }

    let summary = '🛒 *Seu Carrinho:*\n\n';
    
    cart.items.forEach((item, index) => {
      summary += `${index + 1}. *${item.product_name}*\n`;
      summary += `   Qtd: ${item.quantity}x | Preço: R$ ${item.unit_price.toFixed(2)}\n`;
      summary += `   Subtotal: R$ ${item.total_price.toFixed(2)}\n\n`;
    });

    summary += `💰 *Total: R$ ${cart.total_amount.toFixed(2)}*`;
    
    return summary;
  }

  // Validar carrinho antes de finalizar pedido
  async validateCart(phone: string): Promise<{ valid: boolean, message: string }> {
    try {
      const cart = this.getCart(phone);
      
      if (cart.items.length === 0) {
        return {
          valid: false,
          message: 'Carrinho está vazio'
        };
      }

      // Verificar estoque de todos os itens
      for (const item of cart.items) {
        const product = await productService.getProductById(item.product_id);
        if (!product) {
          return {
            valid: false,
            message: `Produto ${item.product_name} não está mais disponível`
          };
        }

        if (product.stock < item.quantity) {
          return {
            valid: false,
            message: `Estoque insuficiente para ${item.product_name}. Disponível: ${product.stock} unidades`
          };
        }

        // Verificar se o preço não mudou
        if (product.price !== item.unit_price) {
          // Atualizar preço no carrinho
          item.unit_price = product.price;
          item.total_price = item.quantity * product.price;
        }
      }

      // Recalcular total após possíveis atualizações de preço
      cart.total_amount = cart.items.reduce((total, item) => total + item.total_price, 0);
      cart.updated_at = new Date().toISOString();

      return {
        valid: true,
        message: 'Carrinho válido'
      };
    } catch (error) {
      console.error('❌ Erro ao validar carrinho:', error);
      return {
        valid: false,
        message: 'Erro ao validar carrinho. Tente novamente.'
      };
    }
  }

  // Limpar sessões inativas (executar periodicamente)
  cleanupInactiveSessions(maxInactiveMinutes: number = 30): number {
    const now = new Date();
    const cutoffTime = new Date(now.getTime() - maxInactiveMinutes * 60 * 1000);
    let cleanedCount = 0;

    for (const [phone, session] of this.sessions.entries()) {
      const lastActivity = new Date(session.last_activity);
      if (lastActivity < cutoffTime) {
        this.clearSession(phone);
        console.log(`🧹 Sessão inativa removida: ${phone}`);
        cleanedCount++;
      }
    }

    return cleanedCount;
  }

  // Obter estatísticas das sessões ativas
  getSessionStats(): { totalSessions: number, totalCarts: number, totalItemsInCarts: number } {
    let totalItemsInCarts = 0;
    
    for (const cart of this.carts.values()) {
      totalItemsInCarts += cart.items.length;
    }

    return {
      totalSessions: this.sessions.size,
      totalCarts: this.carts.size,
      totalItemsInCarts
    };
  }
}

export default new CartService();