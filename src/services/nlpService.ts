import { Intent, IntentResult } from '../types';
import productService from './productService';

class NLPService {
  // Palavras-chave para identificar intenções
  private readonly intentKeywords = {
    [Intent.GREETING]: [
      'oi', 'olá', 'ola', 'bom dia', 'boa tarde', 'boa noite', 'hey', 'e ai', 'eai',
      'salve', 'fala', 'hello', 'hi', 'oie', 'oii'
    ],
    [Intent.VIEW_MENU]: [
      'cardápio', 'cardapio', 'menu', 'produtos', 'bebidas', 'o que tem', 'que tem',
      'lista', 'catálogo', 'catalogo', 'opções', 'opcoes', 'disponível', 'disponivel',
      'tem o que', 'mostrar', 'ver produtos'
    ],
    [Intent.ADD_TO_CART]: [
      'quero', 'vou querer', 'me vê', 'me ve', 'coloca', 'adiciona', 'pega',
      'comprar', 'levar', 'pedir', 'solicitar', 'gostaria'
    ],
    [Intent.VIEW_CART]: [
      'carrinho', 'pedido', 'meu pedido', 'o que pedi', 'resumo', 'total',
      'quanto deu', 'quanto fica', 'valor total'
    ],
    [Intent.PLACE_ORDER]: [
      'finalizar', 'confirmar', 'fechar pedido', 'é isso', 'eh isso', 'pronto',
      'pode mandar', 'tá bom', 'ta bom', 'ok', 'beleza', 'confirma'
    ],
    [Intent.CHECK_ORDER_STATUS]: [
      'status', 'andamento', 'como está', 'como esta', 'chegou', 'entrega',
      'onde está', 'onde esta', 'saiu', 'a caminho'
    ],
    [Intent.HELP]: [
      'ajuda', 'help', 'socorro', 'não entendi', 'nao entendi', 'como funciona',
      'dúvida', 'duvida', 'informação', 'informacao'
    ],
    [Intent.GOODBYE]: [
      'tchau', 'bye', 'até logo', 'ate logo', 'falou', 'obrigado', 'obrigada',
      'valeu', 'thanks', 'vlw', 'flw'
    ]
  };

  // Palavras-chave para quantidades
  private readonly quantityKeywords = {
    'um': 1, 'uma': 1, '1': 1,
    'dois': 2, 'duas': 2, '2': 2,
    'três': 3, 'tres': 3, '3': 3,
    'quatro': 4, '4': 4,
    'cinco': 5, '5': 5,
    'seis': 6, '6': 6,
    'sete': 7, '7': 7,
    'oito': 8, '8': 8,
    'nove': 9, '9': 9,
    'dez': 10, '10': 10
  };

  // Sinônimos comuns para produtos
  private readonly productSynonyms = {
    'coca': ['coca-cola', 'coca cola', 'cocacola'],
    'pepsi': ['pepsi-cola', 'pepsi cola'],
    'guaraná': ['guarana', 'guaraná antarctica', 'guarana antarctica'],
    'cerveja': ['beer', 'gelada'],
    'skol': ['skolzinha'],
    'brahma': ['brahminha'],
    'heineken': ['heineken'],
    'água': ['agua', 'água mineral', 'agua mineral'],
    'energético': ['energetico', 'red bull', 'monster'],
    'suco': ['juice', 'del valle'],
    'litrão': ['litrao', 'cerveja 1l', 'cerveja litro'],
    'latinha': ['lata', 'cerveja lata', 'cerveja 350ml'],
    'garrafa': ['cerveja garrafa', 'cerveja 600ml']
  };

  // Processar mensagem e identificar intenção
  async processMessage(message: string): Promise<IntentResult> {
    const normalizedMessage = this.normalizeText(message);
    
    // Identificar intenção principal
    const intent = this.identifyIntent(normalizedMessage);
    
    // Extrair entidades (produtos, quantidades, etc.)
    const entities = await this.extractEntities(normalizedMessage);
    
    return {
      intent,
      confidence: this.calculateConfidence(normalizedMessage, intent),
      entities
    };
  }

  // Normalizar texto (remover acentos, converter para minúsculas, etc.)
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9\s]/g, ' ') // Remove pontuação
      .replace(/\s+/g, ' ') // Remove espaços extras
      .trim();
  }

  // Identificar intenção principal
  private identifyIntent(message: string): Intent {
    const words = message.split(' ');
    const intentScores: { [key in Intent]: number } = {
      [Intent.GREETING]: 0,
      [Intent.VIEW_MENU]: 0,
      [Intent.ADD_TO_CART]: 0,
      [Intent.VIEW_CART]: 0,
      [Intent.PLACE_ORDER]: 0,
      [Intent.CHECK_ORDER_STATUS]: 0,
      [Intent.HELP]: 0,
      [Intent.GOODBYE]: 0,
      [Intent.UNKNOWN]: 0
    };

    // Calcular pontuação para cada intenção
    for (const [intent, keywords] of Object.entries(this.intentKeywords)) {
      for (const keyword of keywords) {
        if (message.includes(keyword)) {
          intentScores[intent as Intent] += 1;
        }
      }
    }

    // Encontrar intenção com maior pontuação
    let maxScore = 0;
    let bestIntent = Intent.UNKNOWN;

    for (const [intent, score] of Object.entries(intentScores)) {
      if (score > maxScore) {
        maxScore = score;
        bestIntent = intent as Intent;
      }
    }

    return bestIntent;
  }

  // Extrair entidades da mensagem
  private async extractEntities(message: string): Promise<any> {
    const entities: any = {
      products: [],
      quantities: [],
      numbers: []
    };

    // Extrair números e quantidades
    const words = message.split(' ');
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      
      // Verificar se é um número
      if (/^\d+$/.test(word)) {
        entities.numbers.push(parseInt(word));
      }
      
      // Verificar palavras de quantidade
      if (word in this.quantityKeywords) {
        entities.quantities.push(this.quantityKeywords[word as keyof typeof this.quantityKeywords]);
      }
    }

    // Extrair produtos mencionados
    entities.products = await this.extractProducts(message);

    return entities;
  }

  // Extrair produtos mencionados na mensagem
  private async extractProducts(message: string): Promise<any[]> {
    try {
      const allProducts = await productService.getAllProducts();
      const mentionedProducts = [];

      for (const product of allProducts) {
        const productName = this.normalizeText(product.name);
        
        // Verificar se o nome do produto está na mensagem
        if (message.includes(productName)) {
          mentionedProducts.push({
            id: product.id,
            name: product.name,
            price: product.price,
            stock: product.stock
          });
          continue;
        }

        // Verificar sinônimos
        for (const [synonym, variations] of Object.entries(this.productSynonyms)) {
          if (message.includes(synonym)) {
            // Verificar se alguma variação corresponde ao produto
            for (const variation of variations) {
              if (productName.includes(this.normalizeText(variation))) {
                mentionedProducts.push({
                  id: product.id,
                  name: product.name,
                  price: product.price,
                  stock: product.stock
                });
                break;
              }
            }
          }
        }
      }

      return mentionedProducts;
    } catch (error) {
      console.error('❌ Erro ao extrair produtos:', error);
      return [];
    }
  }

  // Calcular confiança da identificação da intenção
  private calculateConfidence(message: string, intent: Intent): number {
    if (intent === Intent.UNKNOWN) {
      return 0;
    }

    const keywords = this.intentKeywords[intent] || [];
    let matches = 0;
    
    for (const keyword of keywords) {
      if (message.includes(keyword)) {
        matches++;
      }
    }

    // Confiança baseada na proporção de palavras-chave encontradas
    const confidence = Math.min(matches / keywords.length * 2, 1);
    return Math.round(confidence * 100) / 100;
  }

  // Extrair quantidade de uma mensagem
  extractQuantity(message: string): number {
    const normalizedMessage = this.normalizeText(message);
    const words = normalizedMessage.split(' ');

    // Procurar por números primeiro
    for (const word of words) {
      if (/^\d+$/.test(word)) {
        const num = parseInt(word);
        if (num > 0 && num <= 100) { // Limite razoável
          return num;
        }
      }
    }

    // Procurar por palavras de quantidade
    for (const word of words) {
      if (word in this.quantityKeywords) {
        return this.quantityKeywords[word as keyof typeof this.quantityKeywords];
      }
    }

    // Padrões específicos
    if (normalizedMessage.includes('meia duzia')) return 6;
    if (normalizedMessage.includes('uma duzia')) return 12;
    if (normalizedMessage.includes('duzia')) return 12;

    return 1; // Quantidade padrão
  }

  // Buscar produtos por texto livre
  async searchProducts(query: string): Promise<any[]> {
    try {
      const normalizedQuery = this.normalizeText(query);
      const allProducts = await productService.getAllProducts();
      const results = [];

      for (const product of allProducts) {
        const productName = this.normalizeText(product.name);
        const productDescription = this.normalizeText(product.description || '');
        
        // Busca por nome
        if (productName.includes(normalizedQuery) || normalizedQuery.includes(productName)) {
          results.push({ ...product, relevance: 1.0 });
          continue;
        }

        // Busca por descrição
        if (productDescription.includes(normalizedQuery)) {
          results.push({ ...product, relevance: 0.8 });
          continue;
        }

        // Busca por sinônimos
        for (const [synonym, variations] of Object.entries(this.productSynonyms)) {
          if (normalizedQuery.includes(synonym)) {
            for (const variation of variations) {
              if (productName.includes(this.normalizeText(variation))) {
                results.push({ ...product, relevance: 0.9 });
                break;
              }
            }
          }
        }
      }

      // Ordenar por relevância
      return results.sort((a, b) => b.relevance - a.relevance);
    } catch (error) {
      console.error('❌ Erro ao buscar produtos:', error);
      return [];
    }
  }

  // Gerar resposta contextual baseada na intenção
  generateContextualResponse(intent: Intent, entities: any): string {
    switch (intent) {
      case Intent.GREETING:
        return '👋 Olá! Bem-vindo à nossa distribuidora! Como posso ajudá-lo hoje?\n\nDigite *menu* para ver nossos produtos ou me diga o que está procurando!';
      
      case Intent.VIEW_MENU:
        return '📋 Vou mostrar nosso cardápio para você!';
      
      case Intent.HELP:
        return `🤖 *Como posso ajudar:*\n\n• Digite *menu* para ver produtos\n• Me diga o que quer: "quero 2 coca"\n• Digite *carrinho* para ver seu pedido\n• Digite *status* para acompanhar entrega\n\nEstou aqui para facilitar seu pedido! 😊`;
      
      case Intent.GOODBYE:
        return '👋 Obrigado pela preferência! Volte sempre!\n\nSe precisar de algo, é só chamar! 😊';
      
      default:
        return '🤔 Não entendi muito bem. Pode repetir ou digitar *ajuda* para ver o que posso fazer?';
    }
  }
}

export default new NLPService();