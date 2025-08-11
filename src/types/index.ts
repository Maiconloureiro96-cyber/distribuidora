// Tipos para produtos
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category?: string;
  image_url?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

// Tipos para pedidos
export interface Order {
  id: string;
  customer_phone: string;
  customer_name?: string;
  items: OrderItem[];
  total_amount: number;
  status: OrderStatus;
  delivery_address?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  delivered_at?: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PREPARING = 'preparing',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled'
}

// Tipos para mensagens do WhatsApp
export interface WhatsAppMessage {
  key: {
    remoteJid: string;
    fromMe: boolean;
    id: string;
  };
  message: {
    conversation?: string;
    extendedTextMessage?: {
      text: string;
    };
  };
  messageTimestamp: number;
  pushName?: string;
}

export interface WhatsAppWebhookPayload {
  instance: string;
  event?: string;
  data: WhatsAppMessage;
  destination: string;
  date_time: string;
}

export interface WhatsAppWebhookBatchPayload {
  instance: string;
  event?: string;
  data: {
    messages: WhatsAppMessage[];
  };
  destination: string;
  date_time: string;
}

// Tipos para sessões de conversa
export interface ConversationSession {
  phone: string;
  step: ConversationStep;
  data: any;
  last_activity: string;
}

export enum ConversationStep {
  GREETING = 'greeting',
  MENU = 'menu',
  BROWSING_PRODUCTS = 'browsing_products',
  ADDING_TO_CART = 'adding_to_cart',
  CART_REVIEW = 'cart_review',
  CUSTOMER_INFO = 'customer_info',
  ORDER_CONFIRMATION = 'order_confirmation',
  ORDER_STATUS = 'order_status'
}

// Tipos para carrinho de compras
export interface CartItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface Cart {
  phone: string;
  items: CartItem[];
  total_amount: number;
  created_at: string;
  updated_at: string;
}

// Tipos para relatórios
export interface SalesReport {
  date: string;
  total_orders: number;
  total_revenue: number;
  top_products: TopProduct[];
}

export interface TopProduct {
  product_id: string;
  product_name: string;
  quantity_sold: number;
  revenue: number;
}

// Tipos para configurações
export interface BotConfig {
  company_name: string;
  company_phone: string;
  company_address: string;
  greeting_message: string;
  menu_message: string;
  order_confirmation_message: string;
  delivery_notification_message: string;
}

// Tipos para respostas da API
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Tipos para processamento de linguagem natural
export interface IntentResult {
  intent: Intent;
  confidence: number;
  entities?: any;
}

export enum Intent {
  GREETING = 'greeting',
  VIEW_MENU = 'view_menu',
  ADD_TO_CART = 'add_to_cart',
  VIEW_CART = 'view_cart',
  PLACE_ORDER = 'place_order',
  CHECK_ORDER_STATUS = 'check_order_status',
  HELP = 'help',
  GOODBYE = 'goodbye',
  UNKNOWN = 'unknown'
}