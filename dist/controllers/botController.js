"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("../types");
const evolutionApi_1 = __importDefault(require("../services/evolutionApi"));
const nlpService_1 = __importDefault(require("../services/nlpService"));
const productService_1 = __importDefault(require("../services/productService"));
const cartService_1 = __importDefault(require("../services/cartService"));
const orderService_1 = __importDefault(require("../services/orderService"));
const pdfService_1 = __importDefault(require("../services/pdfService"));
class BotController {
    async processMessage(payload) {
        try {
            const message = payload.data;
            const phone = this.extractPhoneNumber(message.key.remoteJid);
            const messageText = this.extractMessageText(message);
            const senderName = message.pushName || 'Cliente';
            if (message.key.fromMe) {
                return;
            }
            if (!messageText || messageText.trim() === '') {
                return;
            }
            console.log(`📱 Mensagem recebida de ${senderName} (${phone}): ${messageText}`);
            await evolutionApi_1.default.markMessageAsRead(message.key.id);
            const nlpResult = await nlpService_1.default.processMessage(messageText);
            console.log(`🧠 Intenção identificada: ${nlpResult.intent} (confiança: ${nlpResult.confidence})`);
            const session = cartService_1.default.getSession(phone);
            await this.handleUserIntent(phone, senderName, messageText, nlpResult, session.step);
        }
        catch (error) {
            console.error('❌ Erro ao processar mensagem:', error);
            try {
                const phone = this.extractPhoneNumber(payload.data.key.remoteJid);
                await evolutionApi_1.default.sendTextMessage(phone, '😅 Ops! Algo deu errado por aqui. Pode tentar novamente em alguns segundos?');
            }
            catch (sendError) {
                console.error('❌ Erro ao enviar mensagem de erro:', sendError);
            }
        }
    }
    async handleUserIntent(phone, senderName, messageText, nlpResult, currentStep) {
        const { intent, entities } = nlpResult;
        if (this.isSpecialCommand(messageText)) {
            await this.handleSpecialCommand(phone, messageText);
            return;
        }
        switch (intent) {
            case types_1.Intent.GREETING:
                await this.handleGreeting(phone, senderName);
                break;
            case types_1.Intent.VIEW_MENU:
                await this.handleViewMenu(phone);
                break;
            case types_1.Intent.ADD_TO_CART:
                await this.handleAddToCart(phone, messageText, entities);
                break;
            case types_1.Intent.VIEW_CART:
                await this.handleViewCart(phone);
                break;
            case types_1.Intent.PLACE_ORDER:
                await this.handlePlaceOrder(phone, currentStep);
                break;
            case types_1.Intent.CHECK_ORDER_STATUS:
                await this.handleCheckOrderStatus(phone);
                break;
            case types_1.Intent.HELP:
                await this.handleHelp(phone);
                break;
            case types_1.Intent.GOODBYE:
                await this.handleGoodbye(phone);
                break;
            default:
                await this.handleUnknownIntent(phone, messageText, currentStep);
                break;
        }
    }
    isSpecialCommand(message) {
        const normalizedMessage = message.toLowerCase().trim();
        const specialCommands = [
            'menu', 'cardápio', 'cardapio',
            'carrinho', 'pedido',
            'status', 'ajuda', 'help'
        ];
        return specialCommands.includes(normalizedMessage);
    }
    async handleSpecialCommand(phone, message) {
        const normalizedMessage = message.toLowerCase().trim();
        switch (normalizedMessage) {
            case 'menu':
            case 'cardápio':
            case 'cardapio':
                await this.handleViewMenu(phone);
                break;
            case 'carrinho':
            case 'pedido':
                await this.handleViewCart(phone);
                break;
            case 'status':
                await this.handleCheckOrderStatus(phone);
                break;
            case 'ajuda':
            case 'help':
                await this.handleHelp(phone);
                break;
        }
    }
    async handleGreeting(phone, senderName) {
        const companyName = process.env.COMPANY_NAME || 'Distribuidora de Bebidas';
        const greeting = `👋 Olá ${senderName}! Bem-vindo à ${companyName}!\n\n🍺 Somos especialistas em bebidas geladas e entregas rápidas!\n\n📋 Digite *menu* para ver nossos produtos\n🛒 Ou me diga o que está procurando\n\nComo posso ajudá-lo hoje? 😊`;
        await evolutionApi_1.default.sendTextMessage(phone, greeting);
        cartService_1.default.updateSession(phone, types_1.ConversationStep.MENU);
    }
    async handleViewMenu(phone) {
        try {
            const products = await productService_1.default.getAllProducts();
            if (products.length === 0) {
                await evolutionApi_1.default.sendTextMessage(phone, '😅 Desculpe, não temos produtos disponíveis no momento. Tente novamente mais tarde!');
                return;
            }
            const categories = await productService_1.default.getCategories();
            if (categories.length > 0) {
                let menuMessage = '📋 *NOSSO CARDÁPIO*\n\n';
                for (const category of categories) {
                    const categoryProducts = await productService_1.default.getProductsByCategory(category);
                    if (categoryProducts.length > 0) {
                        menuMessage += `🏷️ *${category.toUpperCase()}*\n`;
                        categoryProducts.forEach((product, index) => {
                            const stockInfo = product.stock > 0 ? `(${product.stock} disponíveis)` : '(Esgotado)';
                            menuMessage += `${index + 1}. *${product.name}* - R$ ${product.price.toFixed(2)} ${stockInfo}\n`;
                            if (product.description) {
                                menuMessage += `   ${product.description}\n`;
                            }
                        });
                        menuMessage += '\n';
                    }
                }
                menuMessage += '💬 *Como pedir:*\n';
                menuMessage += 'Digite algo como: "quero 2 coca cola"\n';
                menuMessage += 'Ou: "me vê 3 cerveja skol"\n\n';
                menuMessage += '🛒 Digite *carrinho* para ver seu pedido atual';
                await evolutionApi_1.default.sendTextMessage(phone, menuMessage);
            }
            else {
                let menuMessage = '📋 *NOSSOS PRODUTOS*\n\n';
                products.slice(0, 20).forEach((product, index) => {
                    const stockInfo = product.stock > 0 ? `(${product.stock} disponíveis)` : '(Esgotado)';
                    menuMessage += `${index + 1}. *${product.name}* - R$ ${product.price.toFixed(2)} ${stockInfo}\n`;
                });
                if (products.length > 20) {
                    menuMessage += `\n... e mais ${products.length - 20} produtos!\n`;
                }
                menuMessage += '\n💬 Digite o nome do produto que deseja!';
                await evolutionApi_1.default.sendTextMessage(phone, menuMessage);
            }
            cartService_1.default.updateSession(phone, types_1.ConversationStep.BROWSING_PRODUCTS);
        }
        catch (error) {
            console.error('❌ Erro ao mostrar menu:', error);
            await evolutionApi_1.default.sendTextMessage(phone, '😅 Erro ao carregar o cardápio. Tente novamente em alguns segundos!');
        }
    }
    async handleAddToCart(phone, messageText, entities) {
        try {
            const quantity = nlpService_1.default.extractQuantity(messageText);
            if (entities.products && entities.products.length > 0) {
                const product = entities.products[0];
                const result = await cartService_1.default.addToCart(phone, product.id, quantity);
                if (result.success) {
                    let response = `✅ ${result.message}\n\n`;
                    response += cartService_1.default.getCartSummary(phone);
                    response += '\n\n💬 Quer adicionar mais alguma coisa?\n';
                    response += '✅ Digite *finalizar* para confirmar o pedido';
                    await evolutionApi_1.default.sendTextMessage(phone, response);
                    cartService_1.default.updateSession(phone, types_1.ConversationStep.ADDING_TO_CART);
                }
                else {
                    await evolutionApi_1.default.sendTextMessage(phone, `❌ ${result.message}`);
                }
            }
            else {
                const searchResults = await nlpService_1.default.searchProducts(messageText);
                if (searchResults.length === 0) {
                    await evolutionApi_1.default.sendTextMessage(phone, '🤔 Não encontrei esse produto. Digite *menu* para ver o que temos disponível!');
                    return;
                }
                if (searchResults.length === 1) {
                    const product = searchResults[0];
                    const result = await cartService_1.default.addToCart(phone, product.id, quantity);
                    if (result.success) {
                        let response = `✅ ${result.message}\n\n`;
                        response += cartService_1.default.getCartSummary(phone);
                        response += '\n\n💬 Quer adicionar mais alguma coisa?\n';
                        response += '✅ Digite *finalizar* para confirmar o pedido';
                        await evolutionApi_1.default.sendTextMessage(phone, response);
                        cartService_1.default.updateSession(phone, types_1.ConversationStep.ADDING_TO_CART);
                    }
                    else {
                        await evolutionApi_1.default.sendTextMessage(phone, `❌ ${result.message}`);
                    }
                }
                else {
                    let response = '🔍 Encontrei alguns produtos similares:\n\n';
                    searchResults.slice(0, 5).forEach((product, index) => {
                        const stockInfo = product.stock > 0 ? `(${product.stock} disponíveis)` : '(Esgotado)';
                        response += `${index + 1}. *${product.name}* - R$ ${product.price.toFixed(2)} ${stockInfo}\n`;
                    });
                    response += '\n💬 Digite o nome completo do produto que deseja!';
                    await evolutionApi_1.default.sendTextMessage(phone, response);
                }
            }
        }
        catch (error) {
            console.error('❌ Erro ao adicionar ao carrinho:', error);
            await evolutionApi_1.default.sendTextMessage(phone, '😅 Erro ao adicionar produto. Tente novamente!');
        }
    }
    async handleViewCart(phone) {
        try {
            if (cartService_1.default.isCartEmpty(phone)) {
                await evolutionApi_1.default.sendTextMessage(phone, '🛒 Seu carrinho está vazio!\n\nDigite *menu* para ver nossos produtos e começar seu pedido! 😊');
                return;
            }
            let response = cartService_1.default.getCartSummary(phone);
            response += '\n\n🔧 *Opções:*\n';
            response += '✅ Digite *finalizar* para confirmar\n';
            response += '🗑️ Digite *limpar* para esvaziar\n';
            response += '➕ Continue adicionando produtos!';
            await evolutionApi_1.default.sendTextMessage(phone, response);
            cartService_1.default.updateSession(phone, types_1.ConversationStep.CART_REVIEW);
        }
        catch (error) {
            console.error('❌ Erro ao mostrar carrinho:', error);
            await evolutionApi_1.default.sendTextMessage(phone, '😅 Erro ao carregar carrinho. Tente novamente!');
        }
    }
    async handlePlaceOrder(phone, currentStep) {
        try {
            if (cartService_1.default.isCartEmpty(phone)) {
                await evolutionApi_1.default.sendTextMessage(phone, '🛒 Seu carrinho está vazio! Adicione alguns produtos primeiro.\n\nDigite *menu* para ver nossos produtos!');
                return;
            }
            const validation = await cartService_1.default.validateCart(phone);
            if (!validation.valid) {
                await evolutionApi_1.default.sendTextMessage(phone, `❌ ${validation.message}`);
                return;
            }
            if (currentStep !== types_1.ConversationStep.CUSTOMER_INFO) {
                await evolutionApi_1.default.sendTextMessage(phone, '📝 Para finalizar seu pedido, preciso de algumas informações:\n\n👤 Qual seu nome?');
                cartService_1.default.updateSession(phone, types_1.ConversationStep.CUSTOMER_INFO, { step: 'name' });
                return;
            }
            await this.processCustomerInfo(phone);
        }
        catch (error) {
            console.error('❌ Erro ao finalizar pedido:', error);
            await evolutionApi_1.default.sendTextMessage(phone, '😅 Erro ao processar pedido. Tente novamente!');
        }
    }
    async processCustomerInfo(phone) {
        try {
            const session = cartService_1.default.getSession(phone);
            const cart = cartService_1.default.getCart(phone);
            const order = await orderService_1.default.createOrder(cart, session.data.customerName, session.data.deliveryAddress, session.data.notes);
            if (!order) {
                await evolutionApi_1.default.sendTextMessage(phone, '❌ Erro ao criar pedido. Tente novamente!');
                return;
            }
            cartService_1.default.clearCart(phone);
            cartService_1.default.updateSession(phone, types_1.ConversationStep.ORDER_CONFIRMATION);
            let confirmationMessage = `🎉 *Pedido Confirmado!*\n\n`;
            confirmationMessage += `📋 Número: #${order.id.slice(-8)}\n`;
            confirmationMessage += `💰 Total: R$ ${order.total_amount.toFixed(2)}\n\n`;
            confirmationMessage += `📦 Seu pedido foi recebido e está sendo preparado!\n\n`;
            confirmationMessage += `📱 Você receberá atualizações sobre o status da entrega.\n\n`;
            confirmationMessage += `🙏 Obrigado pela preferência!`;
            await evolutionApi_1.default.sendTextMessage(phone, confirmationMessage);
            try {
                await pdfService_1.default.generateOrderPDF(order);
                console.log('✅ PDF do pedido gerado');
            }
            catch (pdfError) {
                console.error('❌ Erro ao gerar PDF:', pdfError);
            }
            console.log(`✅ Pedido criado: ${order.id} - Cliente: ${phone}`);
        }
        catch (error) {
            console.error('❌ Erro ao processar informações do cliente:', error);
            await evolutionApi_1.default.sendTextMessage(phone, '😅 Erro ao finalizar pedido. Tente novamente!');
        }
    }
    async handleCheckOrderStatus(phone) {
        try {
            const lastOrder = await orderService_1.default.getLastOrderByPhone(phone);
            if (!lastOrder) {
                await evolutionApi_1.default.sendTextMessage(phone, '📋 Você ainda não fez nenhum pedido conosco.\n\nDigite *menu* para fazer seu primeiro pedido! 😊');
                return;
            }
            const statusText = this.getOrderStatusText(lastOrder.status);
            let statusMessage = `📋 *Status do seu último pedido:*\n\n`;
            statusMessage += `🔢 Número: #${lastOrder.id.slice(-8)}\n`;
            statusMessage += `📅 Data: ${new Date(lastOrder.created_at).toLocaleString('pt-BR')}\n`;
            statusMessage += `📊 Status: ${statusText}\n`;
            statusMessage += `💰 Total: R$ ${lastOrder.total_amount.toFixed(2)}\n\n`;
            if (lastOrder.status === 'delivered' && lastOrder.delivered_at) {
                statusMessage += `✅ Entregue em: ${new Date(lastOrder.delivered_at).toLocaleString('pt-BR')}\n\n`;
            }
            statusMessage += `🙏 Obrigado pela preferência!`;
            await evolutionApi_1.default.sendTextMessage(phone, statusMessage);
        }
        catch (error) {
            console.error('❌ Erro ao verificar status:', error);
            await evolutionApi_1.default.sendTextMessage(phone, '😅 Erro ao consultar status. Tente novamente!');
        }
    }
    async handleHelp(phone) {
        const helpMessage = `🤖 *Como posso ajudar:*\n\n` +
            `📋 Digite *menu* para ver produtos\n` +
            `🛒 Digite *carrinho* para ver seu pedido\n` +
            `📊 Digite *status* para acompanhar entrega\n\n` +
            `💬 *Exemplos de como pedir:*\n` +
            `• "quero 2 coca cola"\n` +
            `• "me vê 3 cerveja skol"\n` +
            `• "adiciona 1 água"\n\n` +
            `✅ Digite *finalizar* quando terminar\n\n` +
            `Estou aqui para facilitar seu pedido! 😊`;
        await evolutionApi_1.default.sendTextMessage(phone, helpMessage);
    }
    async handleGoodbye(phone) {
        const companyName = process.env.COMPANY_NAME || 'Distribuidora';
        const goodbyeMessage = `👋 Obrigado pela preferência!\n\n🍺 Foi um prazer atendê-lo na ${companyName}!\n\nSe precisar de algo, é só chamar! Estamos sempre aqui! 😊\n\n🚚 Entregas rápidas e bebidas geladas! 🧊`;
        await evolutionApi_1.default.sendTextMessage(phone, goodbyeMessage);
        cartService_1.default.clearSession(phone);
    }
    async handleUnknownIntent(phone, messageText, currentStep) {
        if (currentStep === types_1.ConversationStep.CUSTOMER_INFO) {
            await this.handleCustomerInfoInput(phone, messageText);
            return;
        }
        const searchResults = await nlpService_1.default.searchProducts(messageText);
        if (searchResults.length > 0) {
            await this.handleAddToCart(phone, messageText, { products: searchResults });
            return;
        }
        const unknownMessage = `🤔 Não entendi muito bem...\n\n` +
            `💡 *Dicas:*\n` +
            `• Digite *menu* para ver produtos\n` +
            `• Digite *ajuda* para ver comandos\n` +
            `• Ou me diga o que está procurando!\n\n` +
            `Exemplo: "quero 2 coca cola" 😊`;
        await evolutionApi_1.default.sendTextMessage(phone, unknownMessage);
    }
    async handleCustomerInfoInput(phone, messageText) {
        const session = cartService_1.default.getSession(phone);
        const currentInfoStep = session.data.step;
        switch (currentInfoStep) {
            case 'name':
                cartService_1.default.updateSession(phone, types_1.ConversationStep.CUSTOMER_INFO, {
                    customerName: messageText.trim(),
                    step: 'address'
                });
                await evolutionApi_1.default.sendTextMessage(phone, `✅ Nome registrado: ${messageText.trim()}\n\n📍 Qual o endereço para entrega?\n(Ou digite "retirar" se for buscar no local)`);
                break;
            case 'address':
                const address = messageText.trim().toLowerCase();
                const deliveryAddress = address === 'retirar' ? null : messageText.trim();
                cartService_1.default.updateSession(phone, types_1.ConversationStep.CUSTOMER_INFO, {
                    deliveryAddress,
                    step: 'notes'
                });
                const addressConfirm = deliveryAddress
                    ? `✅ Endereço: ${deliveryAddress}`
                    : '✅ Retirada no local';
                await evolutionApi_1.default.sendTextMessage(phone, `${addressConfirm}\n\n📝 Alguma observação especial?\n(Ou digite "não" para finalizar)`);
                break;
            case 'notes':
                const notes = messageText.trim().toLowerCase() === 'não' ? null : messageText.trim();
                cartService_1.default.updateSession(phone, types_1.ConversationStep.CUSTOMER_INFO, {
                    notes,
                    step: 'complete'
                });
                const cart = cartService_1.default.getCart(phone);
                let finalSummary = `📋 *Resumo do Pedido:*\n\n`;
                finalSummary += cartService_1.default.getCartSummary(phone);
                finalSummary += `\n\n👤 Cliente: ${session.data.customerName}\n`;
                if (session.data.deliveryAddress) {
                    finalSummary += `📍 Entrega: ${session.data.deliveryAddress}\n`;
                }
                else {
                    finalSummary += `📍 Retirada no local\n`;
                }
                if (session.data.notes) {
                    finalSummary += `📝 Obs: ${session.data.notes}\n`;
                }
                finalSummary += `\n✅ Digite *confirmar* para finalizar o pedido!`;
                await evolutionApi_1.default.sendTextMessage(phone, finalSummary);
                break;
            case 'complete':
                if (messageText.toLowerCase().includes('confirmar')) {
                    await this.processCustomerInfo(phone);
                }
                else {
                    await evolutionApi_1.default.sendTextMessage(phone, '❓ Digite *confirmar* para finalizar seu pedido ou *cancelar* para voltar ao menu.');
                }
                break;
        }
    }
    extractPhoneNumber(remoteJid) {
        return remoteJid.replace('@s.whatsapp.net', '').replace('@g.us', '');
    }
    extractMessageText(message) {
        return message.message?.conversation ||
            message.message?.extendedTextMessage?.text ||
            '';
    }
    getOrderStatusText(status) {
        const statusMap = {
            'pending': '⏳ Pendente',
            'confirmed': '✅ Confirmado',
            'preparing': '👨‍🍳 Preparando',
            'out_for_delivery': '🚚 Saiu para entrega',
            'delivered': '✅ Entregue',
            'cancelled': '❌ Cancelado'
        };
        return statusMap[status] || status;
    }
}
exports.default = new BotController();
//# sourceMappingURL=botController.js.map