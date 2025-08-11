"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("../types");
const productService_1 = __importDefault(require("./productService"));
class CartService {
    constructor() {
        this.sessions = new Map();
        this.carts = new Map();
    }
    getSession(phone) {
        if (!this.sessions.has(phone)) {
            this.sessions.set(phone, {
                phone,
                step: types_1.ConversationStep.GREETING,
                data: {},
                last_activity: new Date().toISOString()
            });
        }
        const session = this.sessions.get(phone);
        session.last_activity = new Date().toISOString();
        return session;
    }
    updateSession(phone, step, data) {
        const session = this.getSession(phone);
        session.step = step;
        if (data) {
            session.data = { ...session.data, ...data };
        }
        session.last_activity = new Date().toISOString();
    }
    clearSession(phone) {
        this.sessions.delete(phone);
        this.carts.delete(phone);
    }
    getCart(phone) {
        if (!this.carts.has(phone)) {
            this.carts.set(phone, {
                phone,
                items: [],
                total_amount: 0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });
        }
        return this.carts.get(phone);
    }
    async addToCart(phone, productId, quantity) {
        try {
            const product = await productService_1.default.getProductById(productId);
            if (!product) {
                return {
                    success: false,
                    message: 'Produto não encontrado'
                };
            }
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
            if (existingItem) {
                existingItem.quantity = totalQuantity;
                existingItem.total_price = existingItem.quantity * existingItem.unit_price;
            }
            else {
                const newItem = {
                    product_id: productId,
                    product_name: product.name,
                    quantity: quantity,
                    unit_price: product.price,
                    total_price: quantity * product.price
                };
                cart.items.push(newItem);
            }
            cart.total_amount = cart.items.reduce((total, item) => total + item.total_price, 0);
            cart.updated_at = new Date().toISOString();
            console.log(`✅ Produto adicionado ao carrinho: ${product.name} x${quantity}`);
            return {
                success: true,
                message: `${product.name} adicionado ao carrinho (${quantity}x)`,
                cart
            };
        }
        catch (error) {
            console.error('❌ Erro ao adicionar item ao carrinho:', error);
            return {
                success: false,
                message: 'Erro interno. Tente novamente.'
            };
        }
    }
    removeFromCart(phone, productId) {
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
            cart.total_amount = cart.items.reduce((total, item) => total + item.total_price, 0);
            cart.updated_at = new Date().toISOString();
            console.log(`✅ Produto removido do carrinho: ${removedItem.product_name}`);
            return {
                success: true,
                message: `${removedItem.product_name} removido do carrinho`,
                cart
            };
        }
        catch (error) {
            console.error('❌ Erro ao remover item do carrinho:', error);
            return {
                success: false,
                message: 'Erro interno. Tente novamente.'
            };
        }
    }
    async updateCartItemQuantity(phone, productId, newQuantity) {
        try {
            if (newQuantity <= 0) {
                return this.removeFromCart(phone, productId);
            }
            const product = await productService_1.default.getProductById(productId);
            if (!product) {
                return {
                    success: false,
                    message: 'Produto não encontrado'
                };
            }
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
            cart.total_amount = cart.items.reduce((total, item) => total + item.total_price, 0);
            cart.updated_at = new Date().toISOString();
            console.log(`✅ Quantidade atualizada: ${item.product_name} x${newQuantity}`);
            return {
                success: true,
                message: `Quantidade de ${item.product_name} atualizada para ${newQuantity}`,
                cart
            };
        }
        catch (error) {
            console.error('❌ Erro ao atualizar quantidade:', error);
            return {
                success: false,
                message: 'Erro interno. Tente novamente.'
            };
        }
    }
    clearCart(phone) {
        this.carts.delete(phone);
        console.log(`🗑️ Carrinho limpo para ${phone}`);
    }
    isCartEmpty(phone) {
        const cart = this.getCart(phone);
        return cart.items.length === 0;
    }
    getCartSummary(phone) {
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
    async validateCart(phone) {
        try {
            const cart = this.getCart(phone);
            if (cart.items.length === 0) {
                return {
                    valid: false,
                    message: 'Carrinho está vazio'
                };
            }
            for (const item of cart.items) {
                const product = await productService_1.default.getProductById(item.product_id);
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
                if (product.price !== item.unit_price) {
                    item.unit_price = product.price;
                    item.total_price = item.quantity * product.price;
                }
            }
            cart.total_amount = cart.items.reduce((total, item) => total + item.total_price, 0);
            cart.updated_at = new Date().toISOString();
            return {
                valid: true,
                message: 'Carrinho válido'
            };
        }
        catch (error) {
            console.error('❌ Erro ao validar carrinho:', error);
            return {
                valid: false,
                message: 'Erro ao validar carrinho. Tente novamente.'
            };
        }
    }
    cleanupInactiveSessions(maxInactiveMinutes = 30) {
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
    getSessionStats() {
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
exports.default = new CartService();
//# sourceMappingURL=cartService.js.map