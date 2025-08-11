import { WhatsAppMessage, WhatsAppWebhookPayload, ConversationStep, Intent, Order } from '../types';
import evolutionApi from '../services/evolutionApi';
import nlpService from '../services/nlpService';
import productService from '../services/productService';
import cartService from '../services/cartService';
import orderService from '../services/orderService';
import pdfService from '../services/pdfService';

class BotController {
  // Processar mensagem recebida do webhook
  async processMessage(payload: WhatsAppWebhookPayload): Promise<void> {
    try {
      const message = payload.data;
      const phone = this.extractPhoneNumber(message.key.remoteJid);
      const messageText = this.extractMessageText(message);
      const senderName = message.pushName || 'Cliente';

      // Ignorar mensagens enviadas pelo bot
      if (message.key.fromMe) {
        return;
      }

      // Ignorar mensagens vazias
      if (!messageText || messageText.trim() === '') {
        return;
      }

      console.log(`📱 Mensagem recebida de ${senderName} (${phone}): ${messageText}`);

      // Marcar mensagem como lida
      await evolutionApi.markMessageAsRead(message.key.id);

      // Processar mensagem com NLP
      const nlpResult = await nlpService.processMessage(messageText);
      console.log(`🧠 Intenção identificada: ${nlpResult.intent} (confiança: ${nlpResult.confidence})`);

      // Obter sessão atual do usuário
      const session = cartService.getSession(phone);

      // Processar baseado na intenção e contexto da conversa
      await this.handleUserIntent(phone, senderName, messageText, nlpResult, session.step);

    } catch (error) {
      console.error('❌ Erro ao processar mensagem:', error);
      // Enviar mensagem de erro genérica
      try {
        const phone = this.extractPhoneNumber(payload.data.key.remoteJid);
        await evolutionApi.sendTextMessage(
          phone,
          '😅 Ops! Algo deu errado por aqui. Pode tentar novamente em alguns segundos?'
        );
      } catch (sendError) {
        console.error('❌ Erro ao enviar mensagem de erro:', sendError);
      }
    }
  }

  // Gerenciar intenções do usuário
  private async handleUserIntent(
    phone: string,
    senderName: string,
    messageText: string,
    nlpResult: any,
    currentStep: ConversationStep
  ): Promise<void> {
    const { intent, entities } = nlpResult;

    // Comandos especiais que funcionam em qualquer contexto
    if (this.isSpecialCommand(messageText)) {
      await this.handleSpecialCommand(phone, messageText);
      return;
    }

    // Processar baseado na intenção principal
    switch (intent) {
      case Intent.GREETING:
        await this.handleGreeting(phone, senderName);
        break;

      case Intent.VIEW_MENU:
        await this.handleViewMenu(phone);
        break;

      case Intent.ADD_TO_CART:
        await this.handleAddToCart(phone, messageText, entities);
        break;

      case Intent.VIEW_CART:
        await this.handleViewCart(phone);
        break;

      case Intent.PLACE_ORDER:
        await this.handlePlaceOrder(phone, currentStep);
        break;

      case Intent.CHECK_ORDER_STATUS:
        await this.handleCheckOrderStatus(phone);
        break;

      case Intent.HELP:
        await this.handleHelp(phone);
        break;

      case Intent.GOODBYE:
        await this.handleGoodbye(phone);
        break;

      default:
        await this.handleUnknownIntent(phone, messageText, currentStep);
        break;
    }
  }

  // Verificar se é um comando especial
  private isSpecialCommand(message: string): boolean {
    const normalizedMessage = message.toLowerCase().trim();
    const specialCommands = [
      'menu', 'cardápio', 'cardapio',
      'carrinho', 'pedido',
      'status', 'ajuda', 'help'
    ];
    
    return specialCommands.includes(normalizedMessage);
  }

  // Processar comandos especiais
  private async handleSpecialCommand(phone: string, message: string): Promise<void> {
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

  // Processar saudação
  private async handleGreeting(phone: string, senderName: string): Promise<void> {
    const companyName = process.env.COMPANY_NAME || 'Distribuidora de Bebidas';
    const greeting = `👋 Olá ${senderName}! Bem-vindo à ${companyName}!\n\n🍺 Somos especialistas em bebidas geladas e entregas rápidas!\n\n📋 Digite *menu* para ver nossos produtos\n🛒 Ou me diga o que está procurando\n\nComo posso ajudá-lo hoje? 😊`;
    
    await evolutionApi.sendTextMessage(phone, greeting);
    cartService.updateSession(phone, ConversationStep.MENU);
  }

  // Mostrar menu de produtos
  private async handleViewMenu(phone: string): Promise<void> {
    try {
      const products = await productService.getAllProducts();
      
      if (products.length === 0) {
        await evolutionApi.sendTextMessage(
          phone,
          '😅 Desculpe, não temos produtos disponíveis no momento. Tente novamente mais tarde!'
        );
        return;
      }

      // Agrupar produtos por categoria
      const categories = await productService.getCategories();
      
      if (categories.length > 0) {
        let menuMessage = '📋 *NOSSO CARDÁPIO*\n\n';
        
        for (const category of categories) {
          const categoryProducts = await productService.getProductsByCategory(category);
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
        
        await evolutionApi.sendTextMessage(phone, menuMessage);
      } else {
        // Se não há categorias, mostrar lista simples
        let menuMessage = '📋 *NOSSOS PRODUTOS*\n\n';
        
        products.slice(0, 20).forEach((product, index) => {
          const stockInfo = product.stock > 0 ? `(${product.stock} disponíveis)` : '(Esgotado)';
          menuMessage += `${index + 1}. *${product.name}* - R$ ${product.price.toFixed(2)} ${stockInfo}\n`;
        });
        
        if (products.length > 20) {
          menuMessage += `\n... e mais ${products.length - 20} produtos!\n`;
        }
        
        menuMessage += '\n💬 Digite o nome do produto que deseja!';
        
        await evolutionApi.sendTextMessage(phone, menuMessage);
      }
      
      cartService.updateSession(phone, ConversationStep.BROWSING_PRODUCTS);
    } catch (error) {
      console.error('❌ Erro ao mostrar menu:', error);
      await evolutionApi.sendTextMessage(
        phone,
        '😅 Erro ao carregar o cardápio. Tente novamente em alguns segundos!'
      );
    }
  }

  // Adicionar produto ao carrinho
  private async handleAddToCart(phone: string, messageText: string, entities: any): Promise<void> {
    try {
      // Extrair quantidade da mensagem
      const quantity = nlpService.extractQuantity(messageText);
      
      // Se produtos foram identificados pelo NLP
      if (entities.products && entities.products.length > 0) {
        const product = entities.products[0]; // Pegar o primeiro produto encontrado
        
        const result = await cartService.addToCart(phone, product.id, quantity);
        
        if (result.success) {
          let response = `✅ ${result.message}\n\n`;
          response += cartService.getCartSummary(phone);
          response += '\n\n💬 Quer adicionar mais alguma coisa?\n';
          response += '✅ Digite *finalizar* para confirmar o pedido';
          
          await evolutionApi.sendTextMessage(phone, response);
          cartService.updateSession(phone, ConversationStep.ADDING_TO_CART);
        } else {
          await evolutionApi.sendTextMessage(phone, `❌ ${result.message}`);
        }
      } else {
        // Tentar buscar produtos por texto livre
        const searchResults = await nlpService.searchProducts(messageText);
        
        if (searchResults.length === 0) {
          await evolutionApi.sendTextMessage(
            phone,
            '🤔 Não encontrei esse produto. Digite *menu* para ver o que temos disponível!'
          );
          return;
        }
        
        if (searchResults.length === 1) {
          // Produto único encontrado
          const product = searchResults[0];
          const result = await cartService.addToCart(phone, product.id, quantity);
          
          if (result.success) {
            let response = `✅ ${result.message}\n\n`;
            response += cartService.getCartSummary(phone);
            response += '\n\n💬 Quer adicionar mais alguma coisa?\n';
            response += '✅ Digite *finalizar* para confirmar o pedido';
            
            await evolutionApi.sendTextMessage(phone, response);
            cartService.updateSession(phone, ConversationStep.ADDING_TO_CART);
          } else {
            await evolutionApi.sendTextMessage(phone, `❌ ${result.message}`);
          }
        } else {
          // Múltiplos produtos encontrados
          let response = '🔍 Encontrei alguns produtos similares:\n\n';
          
          searchResults.slice(0, 5).forEach((product, index) => {
            const stockInfo = product.stock > 0 ? `(${product.stock} disponíveis)` : '(Esgotado)';
            response += `${index + 1}. *${product.name}* - R$ ${product.price.toFixed(2)} ${stockInfo}\n`;
          });
          
          response += '\n💬 Digite o nome completo do produto que deseja!';
          
          await evolutionApi.sendTextMessage(phone, response);
        }
      }
    } catch (error) {
      console.error('❌ Erro ao adicionar ao carrinho:', error);
      await evolutionApi.sendTextMessage(
        phone,
        '😅 Erro ao adicionar produto. Tente novamente!'
      );
    }
  }

  // Mostrar carrinho
  private async handleViewCart(phone: string): Promise<void> {
    try {
      if (cartService.isCartEmpty(phone)) {
        await evolutionApi.sendTextMessage(
          phone,
          '🛒 Seu carrinho está vazio!\n\nDigite *menu* para ver nossos produtos e começar seu pedido! 😊'
        );
        return;
      }
      
      let response = cartService.getCartSummary(phone);
      response += '\n\n🔧 *Opções:*\n';
      response += '✅ Digite *finalizar* para confirmar\n';
      response += '🗑️ Digite *limpar* para esvaziar\n';
      response += '➕ Continue adicionando produtos!';
      
      await evolutionApi.sendTextMessage(phone, response);
      cartService.updateSession(phone, ConversationStep.CART_REVIEW);
    } catch (error) {
      console.error('❌ Erro ao mostrar carrinho:', error);
      await evolutionApi.sendTextMessage(
        phone,
        '😅 Erro ao carregar carrinho. Tente novamente!'
      );
    }
  }

  // Finalizar pedido
  private async handlePlaceOrder(phone: string, currentStep: ConversationStep): Promise<void> {
    try {
      if (cartService.isCartEmpty(phone)) {
        await evolutionApi.sendTextMessage(
          phone,
          '🛒 Seu carrinho está vazio! Adicione alguns produtos primeiro.\n\nDigite *menu* para ver nossos produtos!'
        );
        return;
      }
      
      // Validar carrinho
      const validation = await cartService.validateCart(phone);
      if (!validation.valid) {
        await evolutionApi.sendTextMessage(phone, `❌ ${validation.message}`);
        return;
      }
      
      // Solicitar informações do cliente se necessário
      if (currentStep !== ConversationStep.CUSTOMER_INFO) {
        await evolutionApi.sendTextMessage(
          phone,
          '📝 Para finalizar seu pedido, preciso de algumas informações:\n\n👤 Qual seu nome?'
        );
        cartService.updateSession(phone, ConversationStep.CUSTOMER_INFO, { step: 'name' });
        return;
      }
      
      // Processar informações do cliente
      await this.processCustomerInfo(phone);
    } catch (error) {
      console.error('❌ Erro ao finalizar pedido:', error);
      await evolutionApi.sendTextMessage(
        phone,
        '😅 Erro ao processar pedido. Tente novamente!'
      );
    }
  }

  // Processar informações do cliente
  private async processCustomerInfo(phone: string): Promise<void> {
    try {
      const session = cartService.getSession(phone);
      const cart = cartService.getCart(phone);
      
      // Criar pedido
      const order = await orderService.createOrder(
        cart,
        session.data.customerName,
        session.data.deliveryAddress,
        session.data.notes
      );
      
      if (!order) {
        await evolutionApi.sendTextMessage(
          phone,
          '❌ Erro ao criar pedido. Tente novamente!'
        );
        return;
      }
      
      // Limpar carrinho e sessão
      cartService.clearCart(phone);
      cartService.updateSession(phone, ConversationStep.ORDER_CONFIRMATION);
      
      // Enviar confirmação
      let confirmationMessage = `🎉 *Pedido Confirmado!*\n\n`;
      confirmationMessage += `📋 Número: #${order.id.slice(-8)}\n`;
      confirmationMessage += `💰 Total: R$ ${order.total_amount.toFixed(2)}\n\n`;
      confirmationMessage += `📦 Seu pedido foi recebido e está sendo preparado!\n\n`;
      confirmationMessage += `📱 Você receberá atualizações sobre o status da entrega.\n\n`;
      confirmationMessage += `🙏 Obrigado pela preferência!`;
      
      await evolutionApi.sendTextMessage(phone, confirmationMessage);
      
      // Enviar sugestões de produtos adicionais
      setTimeout(async () => {
        await this.sendProductSuggestions(phone, order);
      }, 2000); // Aguarda 2 segundos antes de enviar sugestões
      
      // Gerar PDF do pedido
      try {
        await pdfService.generateOrderPDF(order);
        console.log('✅ PDF do pedido gerado');
      } catch (pdfError) {
        console.error('❌ Erro ao gerar PDF:', pdfError);
      }
      
      console.log(`✅ Pedido criado: ${order.id} - Cliente: ${phone}`);
    } catch (error) {
      console.error('❌ Erro ao processar informações do cliente:', error);
      await evolutionApi.sendTextMessage(
        phone,
        '😅 Erro ao finalizar pedido. Tente novamente!'
      );
    }
  }

  // Verificar status do pedido
  private async handleCheckOrderStatus(phone: string): Promise<void> {
    try {
      const lastOrder = await orderService.getLastOrderByPhone(phone);
      
      if (!lastOrder) {
        await evolutionApi.sendTextMessage(
          phone,
          '📋 Você ainda não fez nenhum pedido conosco.\n\nDigite *menu* para fazer seu primeiro pedido! 😊'
        );
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
      
      await evolutionApi.sendTextMessage(phone, statusMessage);
    } catch (error) {
      console.error('❌ Erro ao verificar status:', error);
      await evolutionApi.sendTextMessage(
        phone,
        '😅 Erro ao consultar status. Tente novamente!'
      );
    }
  }

  // Mostrar ajuda
  private async handleHelp(phone: string): Promise<void> {
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
    
    await evolutionApi.sendTextMessage(phone, helpMessage);
  }

  // Processar despedida
  private async handleGoodbye(phone: string): Promise<void> {
    const companyName = process.env.COMPANY_NAME || 'Distribuidora';
    const goodbyeMessage = `👋 Obrigado pela preferência!\n\n🍺 Foi um prazer atendê-lo na ${companyName}!\n\nSe precisar de algo, é só chamar! Estamos sempre aqui! 😊\n\n🚚 Entregas rápidas e bebidas geladas! 🧊`;
    
    await evolutionApi.sendTextMessage(phone, goodbyeMessage);
    cartService.clearSession(phone);
  }

  // Processar intenção desconhecida
  private async handleUnknownIntent(phone: string, messageText: string, currentStep: ConversationStep): Promise<void> {
    // Se estamos coletando informações do cliente
    if (currentStep === ConversationStep.CUSTOMER_INFO) {
      await this.handleCustomerInfoInput(phone, messageText);
      return;
    }
    
    // Tentar buscar produtos na mensagem
    const searchResults = await nlpService.searchProducts(messageText);
    
    if (searchResults.length > 0) {
      await this.handleAddToCart(phone, messageText, { products: searchResults });
      return;
    }
    
    // Resposta padrão para mensagens não compreendidas
    const unknownMessage = `🤔 Não entendi muito bem...\n\n` +
      `💡 *Dicas:*\n` +
      `• Digite *menu* para ver produtos\n` +
      `• Digite *ajuda* para ver comandos\n` +
      `• Ou me diga o que está procurando!\n\n` +
      `Exemplo: "quero 2 coca cola" 😊`;
    
    await evolutionApi.sendTextMessage(phone, unknownMessage);
  }

  // Processar entrada de informações do cliente
  private async handleCustomerInfoInput(phone: string, messageText: string): Promise<void> {
    const session = cartService.getSession(phone);
    const currentInfoStep = session.data.step;
    
    switch (currentInfoStep) {
      case 'name':
        cartService.updateSession(phone, ConversationStep.CUSTOMER_INFO, {
          customerName: messageText.trim(),
          step: 'address'
        });
        
        await evolutionApi.sendTextMessage(
          phone,
          `✅ Nome registrado: ${messageText.trim()}\n\n📍 Qual o endereço para entrega?\n(Ou digite "retirar" se for buscar no local)`
        );
        break;
        
      case 'address':
        const address = messageText.trim().toLowerCase();
        const deliveryAddress = address === 'retirar' ? null : messageText.trim();
        
        cartService.updateSession(phone, ConversationStep.CUSTOMER_INFO, {
          deliveryAddress,
          step: 'notes'
        });
        
        const addressConfirm = deliveryAddress 
          ? `✅ Endereço: ${deliveryAddress}` 
          : '✅ Retirada no local';
        
        await evolutionApi.sendTextMessage(
          phone,
          `${addressConfirm}\n\n📝 Alguma observação especial?\n(Ou digite "não" para finalizar)`
        );
        break;
        
      case 'notes':
        const notes = messageText.trim().toLowerCase() === 'não' ? null : messageText.trim();
        
        cartService.updateSession(phone, ConversationStep.CUSTOMER_INFO, {
          notes,
          step: 'complete'
        });
        
        // Mostrar resumo final
        const cart = cartService.getCart(phone);
        let finalSummary = `📋 *Resumo do Pedido:*\n\n`;
        finalSummary += cartService.getCartSummary(phone);
        finalSummary += `\n\n👤 Cliente: ${session.data.customerName}\n`;
        
        if (session.data.deliveryAddress) {
          finalSummary += `📍 Entrega: ${session.data.deliveryAddress}\n`;
        } else {
          finalSummary += `📍 Retirada no local\n`;
        }
        
        if (session.data.notes) {
          finalSummary += `📝 Obs: ${session.data.notes}\n`;
        }
        
        finalSummary += `\n✅ Digite *confirmar* para finalizar o pedido!`;
        
        await evolutionApi.sendTextMessage(phone, finalSummary);
        break;
        
      case 'complete':
        if (messageText.toLowerCase().includes('confirmar')) {
          await this.processCustomerInfo(phone);
        } else {
          await evolutionApi.sendTextMessage(
            phone,
            '❓ Digite *confirmar* para finalizar seu pedido ou *cancelar* para voltar ao menu.'
          );
        }
        break;
    }
  }

  // Extrair número de telefone
  private extractPhoneNumber(remoteJid: string): string {
    return remoteJid.replace('@s.whatsapp.net', '').replace('@g.us', '');
  }

  // Extrair texto da mensagem
  private extractMessageText(message: WhatsAppMessage): string {
    return message.message?.conversation || 
           message.message?.extendedTextMessage?.text || 
           '';
  }

  // Enviar sugestões de produtos adicionais
  private async sendProductSuggestions(phone: string, order: Order): Promise<void> {
    try {
      // Verificar se o pedido já contém gelo
      const hasIce = order.items.some((item: any) => 
        item.product_name.toLowerCase().includes('gelo')
      );
      
      // Verificar se o pedido contém bebidas
      const hasBeverages = order.items.some((item: any) => {
        const name = item.product_name.toLowerCase();
        return name.includes('coca') || name.includes('pepsi') || 
               name.includes('guaraná') || name.includes('cerveja') ||
               name.includes('refrigerante') || name.includes('bebida');
      });
      
      let suggestionMessage = '💡 *Que tal complementar seu pedido?*\n\n';
      let hasSuggestions = false;
      
      // Sugerir gelo se não tiver e tiver bebidas
      if (!hasIce && hasBeverages) {
        try {
          const iceProducts = await productService.searchProductsByName('gelo');
          if (iceProducts.length > 0) {
            const ice = iceProducts[0];
            if (ice.stock > 0) {
              suggestionMessage += `🧊 *${ice.name}* - R$ ${ice.price.toFixed(2)}\n`;
              suggestionMessage += `   Perfeito para manter suas bebidas geladas!\n\n`;
              hasSuggestions = true;
            }
          }
        } catch (error) {
          console.error('❌ Erro ao buscar gelo:', error);
        }
      }
      
      // Sugerir água se não tiver
      const hasWater = order.items.some((item: any) => 
        item.product_name.toLowerCase().includes('água')
      );
      
      if (!hasWater) {
        try {
          const waterProducts = await productService.searchProductsByName('água');
          if (waterProducts.length > 0) {
            const water = waterProducts[0];
            if (water.stock > 0) {
              suggestionMessage += `💧 *${water.name}* - R$ ${water.price.toFixed(2)}\n`;
              suggestionMessage += `   Sempre bom ter água por perto!\n\n`;
              hasSuggestions = true;
            }
          }
        } catch (error) {
          console.error('❌ Erro ao buscar água:', error);
        }
      }
      
      // Sugerir energético se tiver muitas bebidas
      if (hasBeverages && order.items.length >= 3) {
        const hasEnergy = order.items.some((item: any) => 
          item.product_name.toLowerCase().includes('energético') ||
          item.product_name.toLowerCase().includes('red bull')
        );
        
        if (!hasEnergy) {
          try {
            const energyProducts = await productService.searchProductsByName('energético');
            if (energyProducts.length > 0) {
              const energy = energyProducts[0];
              if (energy.stock > 0) {
                suggestionMessage += `⚡ *${energy.name}* - R$ ${energy.price.toFixed(2)}\n`;
                suggestionMessage += `   Para dar aquela energia extra!\n\n`;
                hasSuggestions = true;
              }
            }
          } catch (error) {
            console.error('❌ Erro ao buscar energético:', error);
          }
        }
      }
      
      if (hasSuggestions) {
        suggestionMessage += '💬 *Quer adicionar algo mais?*\n';
        suggestionMessage += 'Digite algo como: "quero 1 gelo" ou "não, obrigado"\n\n';
        suggestionMessage += '✅ Seu pedido principal já está confirmado!';
        
        await evolutionApi.sendTextMessage(phone, suggestionMessage);
        
        // Atualizar sessão para aceitar produtos adicionais
        cartService.updateSession(phone, ConversationStep.BROWSING_PRODUCTS);
      }
    } catch (error) {
      console.error('❌ Erro ao enviar sugestões:', error);
    }
  }

  // Converter status do pedido para texto legível
  private getOrderStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
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

export default new BotController();