"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Intent = exports.ConversationStep = exports.OrderStatus = void 0;
var OrderStatus;
(function (OrderStatus) {
    OrderStatus["PENDING"] = "pending";
    OrderStatus["CONFIRMED"] = "confirmed";
    OrderStatus["PREPARING"] = "preparing";
    OrderStatus["OUT_FOR_DELIVERY"] = "out_for_delivery";
    OrderStatus["DELIVERED"] = "delivered";
    OrderStatus["CANCELLED"] = "cancelled";
})(OrderStatus || (exports.OrderStatus = OrderStatus = {}));
var ConversationStep;
(function (ConversationStep) {
    ConversationStep["GREETING"] = "greeting";
    ConversationStep["MENU"] = "menu";
    ConversationStep["BROWSING_PRODUCTS"] = "browsing_products";
    ConversationStep["ADDING_TO_CART"] = "adding_to_cart";
    ConversationStep["CART_REVIEW"] = "cart_review";
    ConversationStep["CUSTOMER_INFO"] = "customer_info";
    ConversationStep["ORDER_CONFIRMATION"] = "order_confirmation";
    ConversationStep["ORDER_STATUS"] = "order_status";
})(ConversationStep || (exports.ConversationStep = ConversationStep = {}));
var Intent;
(function (Intent) {
    Intent["GREETING"] = "greeting";
    Intent["VIEW_MENU"] = "view_menu";
    Intent["ADD_TO_CART"] = "add_to_cart";
    Intent["VIEW_CART"] = "view_cart";
    Intent["PLACE_ORDER"] = "place_order";
    Intent["CHECK_ORDER_STATUS"] = "check_order_status";
    Intent["HELP"] = "help";
    Intent["GOODBYE"] = "goodbye";
    Intent["UNKNOWN"] = "unknown";
})(Intent || (exports.Intent = Intent = {}));
//# sourceMappingURL=index.js.map