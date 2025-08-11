import { Cart, ConversationSession, ConversationStep } from '../types';
declare class CartService {
    private sessions;
    private carts;
    getSession(phone: string): ConversationSession;
    updateSession(phone: string, step: ConversationStep, data?: any): void;
    clearSession(phone: string): void;
    getCart(phone: string): Cart;
    addToCart(phone: string, productId: string, quantity: number): Promise<{
        success: boolean;
        message: string;
        cart?: Cart;
    }>;
    removeFromCart(phone: string, productId: string): {
        success: boolean;
        message: string;
        cart?: Cart;
    };
    updateCartItemQuantity(phone: string, productId: string, newQuantity: number): Promise<{
        success: boolean;
        message: string;
        cart?: Cart;
    }>;
    clearCart(phone: string): void;
    isCartEmpty(phone: string): boolean;
    getCartSummary(phone: string): string;
    validateCart(phone: string): Promise<{
        valid: boolean;
        message: string;
    }>;
    cleanupInactiveSessions(maxInactiveMinutes?: number): number;
    getSessionStats(): {
        totalSessions: number;
        totalCarts: number;
        totalItemsInCarts: number;
    };
}
declare const _default: CartService;
export default _default;
//# sourceMappingURL=cartService.d.ts.map