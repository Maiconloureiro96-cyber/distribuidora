import { WhatsAppWebhookPayload } from '../types';
declare class BotController {
    processMessage(payload: WhatsAppWebhookPayload): Promise<void>;
    private handleUserIntent;
    private isSpecialCommand;
    private handleSpecialCommand;
    private handleGreeting;
    private handleViewMenu;
    private handleAddToCart;
    private handleViewCart;
    private handlePlaceOrder;
    private processCustomerInfo;
    private handleCheckOrderStatus;
    private handleHelp;
    private handleGoodbye;
    private handleUnknownIntent;
    private handleCustomerInfoInput;
    private extractPhoneNumber;
    private extractMessageText;
    private getOrderStatusText;
}
declare const _default: BotController;
export default _default;
//# sourceMappingURL=botController.d.ts.map