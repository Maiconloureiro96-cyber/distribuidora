-- Distribuidora WhatsApp Bot - Schema do Banco de Dados
-- Execute este script no Supabase SQL Editor

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de produtos
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    category VARCHAR(100),
    image_url TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para produtos
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock);

-- Tabela de pedidos
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_name VARCHAR(255),
    customer_phone VARCHAR(20) NOT NULL,
    customer_address TEXT,
    total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para pedidos
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- Tabela de itens do pedido
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    product_name VARCHAR(255) NOT NULL, -- Snapshot do nome do produto
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
    total_price DECIMAL(10,2) NOT NULL CHECK (total_price >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para itens do pedido
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- Tabela de sessões de conversa
CREATE TABLE IF NOT EXISTS conversation_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_phone VARCHAR(20) NOT NULL UNIQUE,
    customer_name VARCHAR(255),
    current_step VARCHAR(50) DEFAULT 'greeting',
    cart_data JSONB DEFAULT '[]'::jsonb,
    context_data JSONB DEFAULT '{}'::jsonb,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para sessões
CREATE INDEX IF NOT EXISTS idx_sessions_customer_phone ON conversation_sessions(customer_phone);
CREATE INDEX IF NOT EXISTS idx_sessions_last_activity ON conversation_sessions(last_activity);
CREATE INDEX IF NOT EXISTS idx_sessions_current_step ON conversation_sessions(current_step);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON conversation_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para calcular total do pedido
CREATE OR REPLACE FUNCTION calculate_order_total(order_uuid UUID)
RETURNS DECIMAL(10,2) AS $$
DECLARE
    total DECIMAL(10,2);
BEGIN
    SELECT COALESCE(SUM(total_price), 0) INTO total
    FROM order_items
    WHERE order_id = order_uuid;
    
    RETURN total;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar total do pedido automaticamente
CREATE OR REPLACE FUNCTION update_order_total()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        UPDATE orders 
        SET total_amount = calculate_order_total(OLD.order_id),
            updated_at = NOW()
        WHERE id = OLD.order_id;
        RETURN OLD;
    ELSE
        UPDATE orders 
        SET total_amount = calculate_order_total(NEW.order_id),
            updated_at = NOW()
        WHERE id = NEW.order_id;
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_order_total
    AFTER INSERT OR UPDATE OR DELETE ON order_items
    FOR EACH ROW EXECUTE FUNCTION update_order_total();

-- View para relatórios de vendas
CREATE OR REPLACE VIEW sales_summary AS
SELECT 
    DATE(o.created_at) as sale_date,
    COUNT(o.id) as total_orders,
    SUM(o.total_amount) as total_revenue,
    AVG(o.total_amount) as average_order_value,
    COUNT(CASE WHEN o.status = 'delivered' THEN 1 END) as delivered_orders,
    COUNT(CASE WHEN o.status = 'cancelled' THEN 1 END) as cancelled_orders
FROM orders o
GROUP BY DATE(o.created_at)
ORDER BY sale_date DESC;

-- View para produtos mais vendidos
CREATE OR REPLACE VIEW top_selling_products AS
SELECT 
    oi.product_id,
    oi.product_name,
    SUM(oi.quantity) as total_quantity_sold,
    SUM(oi.total_price) as total_revenue,
    COUNT(DISTINCT oi.order_id) as times_ordered,
    AVG(oi.unit_price) as average_price
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
WHERE o.status != 'cancelled'
GROUP BY oi.product_id, oi.product_name
ORDER BY total_quantity_sold DESC;

-- View para análise de clientes
CREATE OR REPLACE VIEW customer_analysis AS
SELECT 
    o.customer_phone,
    o.customer_name,
    COUNT(o.id) as total_orders,
    SUM(o.total_amount) as total_spent,
    AVG(o.total_amount) as average_order_value,
    MAX(o.created_at) as last_order_date,
    MIN(o.created_at) as first_order_date
FROM orders o
WHERE o.status != 'cancelled'
GROUP BY o.customer_phone, o.customer_name
ORDER BY total_spent DESC;

-- Inserir alguns produtos de exemplo
INSERT INTO products (name, description, price, stock, category) VALUES
('Coca-Cola 2L', 'Refrigerante Coca-Cola 2 litros', 8.50, 50, 'Refrigerantes'),
('Coca-Cola Lata 350ml', 'Refrigerante Coca-Cola lata 350ml', 3.50, 100, 'Refrigerantes'),
('Pepsi 2L', 'Refrigerante Pepsi 2 litros', 7.90, 30, 'Refrigerantes'),
('Guaraná Antarctica 2L', 'Refrigerante Guaraná Antarctica 2 litros', 7.50, 40, 'Refrigerantes'),
('Skol Lata 350ml', 'Cerveja Skol lata 350ml', 2.80, 200, 'Cervejas'),
('Brahma Lata 350ml', 'Cerveja Brahma lata 350ml', 2.90, 150, 'Cervejas'),
('Heineken Lata 350ml', 'Cerveja Heineken lata 350ml', 4.50, 80, 'Cervejas'),
('Água Mineral 500ml', 'Água mineral natural 500ml', 1.50, 300, 'Águas'),
('Água com Gás 500ml', 'Água mineral com gás 500ml', 2.00, 100, 'Águas'),
('Suco de Laranja 1L', 'Suco natural de laranja 1 litro', 6.50, 25, 'Sucos'),
('Energético Red Bull', 'Energético Red Bull 250ml', 8.90, 60, 'Energéticos'),
('Gelo 2kg', 'Saco de gelo 2kg', 4.00, 20, 'Gelo')
ON CONFLICT DO NOTHING;

-- Comentários nas tabelas
COMMENT ON TABLE products IS 'Tabela de produtos da distribuidora';
COMMENT ON TABLE orders IS 'Tabela de pedidos dos clientes';
COMMENT ON TABLE order_items IS 'Itens individuais de cada pedido';
COMMENT ON TABLE conversation_sessions IS 'Sessões de conversa do WhatsApp Bot';

-- Comentários nas colunas importantes
COMMENT ON COLUMN products.stock IS 'Quantidade em estoque (não pode ser negativo)';
COMMENT ON COLUMN products.active IS 'Produto ativo/inativo para venda';
COMMENT ON COLUMN orders.status IS 'Status do pedido: pending, confirmed, preparing, out_for_delivery, delivered, cancelled';
COMMENT ON COLUMN conversation_sessions.cart_data IS 'Dados do carrinho em formato JSON';
COMMENT ON COLUMN conversation_sessions.context_data IS 'Contexto da conversa em formato JSON';

-- Políticas de segurança RLS (Row Level Security) - Opcional
-- Descomente se quiser usar autenticação
-- ALTER TABLE products ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE conversation_sessions ENABLE ROW LEVEL SECURITY;

PRINT 'Schema do banco de dados criado com sucesso!';
PRINT 'Produtos de exemplo inseridos.';
PRINT 'Sistema pronto para uso!';