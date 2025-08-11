# 🍺 Distribuidora WhatsApp Bot

Assistente virtual inteligente para distribuidoras de bebidas, integrado ao WhatsApp via Evolution API e utilizando Supabase como banco de dados.

## 🎯 Funcionalidades

### 🤖 Bot WhatsApp
- ✅ Recebimento automático de mensagens
- ✅ Processamento de linguagem natural
- ✅ Identificação de intenções do cliente
- ✅ Gerenciamento de carrinho de compras
- ✅ Finalização de pedidos
- ✅ Notificações automáticas de status
- ✅ Operação 24/7

### 📦 Gestão de Produtos
- ✅ Cadastro, edição e exclusão de produtos
- ✅ Controle de estoque em tempo real
- ✅ Categorização de produtos
- ✅ Consulta de disponibilidade
- ✅ Alertas de estoque baixo

### 📋 Gestão de Pedidos
- ✅ Criação automática de pedidos
- ✅ Controle de status (pendente → entregue)
- ✅ Histórico completo de pedidos
- ✅ Geração de PDF para impressão
- ✅ Cancelamento com restauração de estoque

### 📊 Relatórios e Analytics
- ✅ Relatórios diários e mensais
- ✅ Produtos mais vendidos
- ✅ Análise de clientes
- ✅ Estatísticas de vendas
- ✅ Exportação em PDF

## 🛠️ Tecnologias Utilizadas

- **Backend**: Node.js + TypeScript + Express
- **Banco de Dados**: Supabase (PostgreSQL)
- **WhatsApp**: Evolution API
- **PDF**: PDFKit
- **NLP**: Natural (processamento de linguagem)
- **Outros**: Moment.js, Axios, CORS

## 📋 Pré-requisitos

- Node.js 18+ instalado
- Conta no Supabase
- Evolution API configurada
- WhatsApp Business (recomendado)

## 🚀 Instalação

### 1. Clone o repositório
```bash
git clone <seu-repositorio>
cd distribuidora
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure o banco de dados (Supabase)

1. Acesse [supabase.com](https://supabase.com) e crie um projeto
2. Vá em **SQL Editor** e execute o script `database/init.sql`
3. Anote a **URL** e **anon key** do projeto

### 4. Configure as variáveis de ambiente

1. Copie o arquivo de exemplo:
```bash
cp .env.example .env
```

2. Edite o arquivo `.env` com suas configurações:

```env
# Servidor
PORT=3000
NODE_ENV=development
CORS_ORIGIN=*

# Supabase
SUPABASE_URL=sua_url_do_supabase
SUPABASE_ANON_KEY=sua_chave_anonima
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role

# Evolution API
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=sua_api_key
EVOLUTION_INSTANCE_NAME=distribuidora_bot

# WhatsApp
WHATSAPP_WEBHOOK_URL=http://localhost:3000/api/webhook/whatsapp

# Empresa
COMPANY_NAME=Sua Distribuidora
COMPANY_PHONE=5511999999999
COMPANY_ADDRESS=Seu endereço completo
BUSINESS_HOURS=Segunda a Sexta: 8h às 18h, Sábado: 8h às 12h
```

### 5. Configure a Evolution API

1. Instale e configure a Evolution API seguindo a [documentação oficial](https://doc.evolution-api.com/)
2. Configure o webhook para apontar para: `http://seu-servidor:3000/api/webhook/whatsapp`

### 6. Inicie o servidor

```bash
# Desenvolvimento
npm run dev

# Produção
npm run build
npm start
```

## 📱 Configuração do WhatsApp

### 1. Conectar o WhatsApp

1. Acesse: `http://localhost:3000/api/bot/qrcode`
2. Escaneie o QR Code com seu WhatsApp
3. Aguarde a confirmação de conexão

### 2. Testar o bot

1. Envie uma mensagem para o número conectado
2. O bot deve responder automaticamente
3. Teste comandos como "oi", "cardápio", "quero 2 coca"

## 🔧 API Endpoints

### 🏥 Saúde do Sistema
```http
GET /api/health
GET /api/bot/status
GET /api/bot/health
```

### 📦 Produtos
```http
GET    /api/products              # Listar produtos
GET    /api/products/:id          # Buscar por ID
GET    /api/products/search/:name # Buscar por nome
POST   /api/products              # Criar produto
PUT    /api/products/:id          # Atualizar produto
DELETE /api/products/:id          # Desativar produto
```

### 📋 Pedidos
```http
GET    /api/orders                # Listar pedidos
GET    /api/orders/:id            # Buscar por ID
GET    /api/orders/customer/:phone # Pedidos do cliente
POST   /api/orders                # Criar pedido
PATCH  /api/orders/:id/status     # Atualizar status
GET    /api/orders/:id/pdf        # Gerar PDF
```

### 📊 Relatórios
```http
GET /api/reports/daily           # Relatório diário
GET /api/reports/monthly         # Relatório mensal
GET /api/reports/period          # Período customizado
GET /api/reports/stats           # Estatísticas gerais
GET /api/reports/daily/pdf       # PDF diário
```

### 🤖 Bot
```http
GET  /api/bot/status              # Status do bot
POST /api/bot/connect             # Conectar WhatsApp
POST /api/bot/disconnect          # Desconectar
GET  /api/bot/qrcode              # Obter QR Code
POST /api/bot/send-test           # Enviar mensagem teste
```

## 💬 Como o Bot Funciona

### Fluxo de Conversa

1. **Cliente envia mensagem** → Bot identifica intenção
2. **Saudação** → Bot apresenta opções do menu
3. **Consulta produtos** → Bot lista produtos disponíveis
4. **Adiciona ao carrinho** → "quero 2 coca", "me vê 3 skol"
5. **Finaliza pedido** → Bot coleta dados e confirma
6. **Pedido salvo** → Sistema reduz estoque automaticamente
7. **Acompanhamento** → Cliente recebe updates de status

### Comandos Reconhecidos

- **Saudações**: "oi", "olá", "bom dia", "boa tarde"
- **Menu**: "cardápio", "produtos", "o que tem"
- **Pedidos**: "quero 2 coca", "me vê 3 skol", "adicionar cerveja"
- **Carrinho**: "meu carrinho", "ver pedido", "total"
- **Finalizar**: "finalizar", "confirmar", "fechar pedido"
- **Cancelar**: "cancelar", "limpar carrinho", "começar de novo"
- **Status**: "meu pedido", "status", "onde está"

## 🎨 Personalização

### Adicionar Novos Produtos

```bash
# Via API
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Cerveja Heineken 600ml",
    "description": "Cerveja Heineken long neck 600ml",
    "price": 6.50,
    "stock": 100,
    "category": "Cervejas"
  }'
```

### Personalizar Mensagens do Bot

Edite o arquivo `src/controllers/botController.ts` para customizar as respostas:

```typescript
// Mensagem de boas-vindas
const welcomeMessage = `Olá! 👋 Bem-vindo à ${process.env.COMPANY_NAME}!`;

// Mensagem do cardápio
const menuMessage = `📋 *NOSSO CARDÁPIO*\n\n${productList}`;
```

### Adicionar Novas Intenções

No arquivo `src/services/nlpService.ts`:

```typescript
// Adicionar nova intenção
if (this.containsWords(normalizedText, ['promoção', 'oferta', 'desconto'])) {
  return { intent: 'check_promotions', confidence: 0.9 };
}
```

## 📊 Monitoramento

### Logs do Sistema

O sistema gera logs detalhados:

```bash
# Ver logs em tempo real
npm run dev

# Logs incluem:
# 📨 Mensagens recebidas
# 🤖 Processamento do bot
# 📦 Operações de estoque
# 📋 Criação de pedidos
# ❌ Erros e exceções
```

### Métricas Importantes

- **Sessões ativas**: `GET /api/bot/sessions/stats`
- **Produtos baixo estoque**: `GET /api/reports/low-stock`
- **Top clientes**: `GET /api/reports/top-customers`
- **Vendas por hora**: `GET /api/reports/hourly-analysis`

## 🔒 Segurança

### Boas Práticas Implementadas

- ✅ Validação de entrada em todas as rotas
- ✅ Sanitização de dados do usuário
- ✅ Rate limiting (recomendado para produção)
- ✅ CORS configurado
- ✅ Logs de segurança
- ✅ Variáveis de ambiente para secrets

### Para Produção

1. **Configure HTTPS**
2. **Use um proxy reverso** (Nginx)
3. **Configure rate limiting**
4. **Monitore logs de erro**
5. **Faça backup do banco regularmente**

## 🚀 Deploy

### Heroku

```bash
# Instalar Heroku CLI
npm install -g heroku

# Login e criar app
heroku login
heroku create sua-distribuidora-bot

# Configurar variáveis
heroku config:set SUPABASE_URL=sua_url
heroku config:set SUPABASE_ANON_KEY=sua_key
# ... outras variáveis

# Deploy
git push heroku main
```

### VPS/Servidor Próprio

```bash
# Instalar PM2
npm install -g pm2

# Iniciar aplicação
pm2 start dist/server.js --name "distribuidora-bot"

# Configurar auto-restart
pm2 startup
pm2 save
```

## 🆘 Solução de Problemas

### Bot não responde

1. Verifique se a Evolution API está rodando
2. Confirme se o webhook está configurado
3. Teste a conexão: `GET /api/bot/status`
4. Verifique os logs do servidor

### Erro de banco de dados

1. Confirme as credenciais do Supabase
2. Teste a conexão: `GET /api/health`
3. Verifique se as tabelas foram criadas
4. Execute novamente o `init.sql` se necessário

### Produtos não aparecem

1. Verifique se há produtos cadastrados
2. Confirme se estão ativos (`active: true`)
3. Teste a API: `GET /api/products`

### Estoque não atualiza

1. Verifique os logs de criação de pedidos
2. Confirme se os produtos existem
3. Teste manualmente: `POST /api/orders`

## 📞 Suporte

Para dúvidas e suporte:

- 📧 Email: seu-email@exemplo.com
- 💬 WhatsApp: (11) 99999-9999
- 🐛 Issues: GitHub Issues

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

---

**Desenvolvido com ❤️ para distribuidoras que querem modernizar seu atendimento!**

🍺 **Sua distribuidora, agora no WhatsApp!** 🚀