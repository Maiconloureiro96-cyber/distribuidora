"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("../types");
const productService_1 = __importDefault(require("./productService"));
class NLPService {
    constructor() {
        this.intentKeywords = {
            [types_1.Intent.GREETING]: [
                'oi', 'olá', 'ola', 'bom dia', 'boa tarde', 'boa noite', 'hey', 'e ai', 'eai',
                'salve', 'fala', 'hello', 'hi', 'oie', 'oii'
            ],
            [types_1.Intent.VIEW_MENU]: [
                'cardápio', 'cardapio', 'menu', 'produtos', 'bebidas', 'o que tem', 'que tem',
                'lista', 'catálogo', 'catalogo', 'opções', 'opcoes', 'disponível', 'disponivel',
                'tem o que', 'mostrar', 'ver produtos'
            ],
            [types_1.Intent.ADD_TO_CART]: [
                'quero', 'vou querer', 'me vê', 'me ve', 'coloca', 'adiciona', 'pega',
                'comprar', 'levar', 'pedir', 'solicitar', 'gostaria'
            ],
            [types_1.Intent.VIEW_CART]: [
                'carrinho', 'pedido', 'meu pedido', 'o que pedi', 'resumo', 'total',
                'quanto deu', 'quanto fica', 'valor total'
            ],
            [types_1.Intent.PLACE_ORDER]: [
                'finalizar', 'confirmar', 'fechar pedido', 'é isso', 'eh isso', 'pronto',
                'pode mandar', 'tá bom', 'ta bom', 'ok', 'beleza', 'confirma'
            ],
            [types_1.Intent.CHECK_ORDER_STATUS]: [
                'status', 'andamento', 'como está', 'como esta', 'chegou', 'entrega',
                'onde está', 'onde esta', 'saiu', 'a caminho'
            ],
            [types_1.Intent.HELP]: [
                'ajuda', 'help', 'socorro', 'não entendi', 'nao entendi', 'como funciona',
                'dúvida', 'duvida', 'informação', 'informacao'
            ],
            [types_1.Intent.GOODBYE]: [
                'tchau', 'bye', 'até logo', 'ate logo', 'falou', 'obrigado', 'obrigada',
                'valeu', 'thanks', 'vlw', 'flw'
            ]
        };
        this.quantityKeywords = {
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
        this.productSynonyms = {
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
    }
    async processMessage(message) {
        const normalizedMessage = this.normalizeText(message);
        const intent = this.identifyIntent(normalizedMessage);
        const entities = await this.extractEntities(normalizedMessage);
        return {
            intent,
            confidence: this.calculateConfidence(normalizedMessage, intent),
            entities
        };
    }
    normalizeText(text) {
        return text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9\s]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }
    identifyIntent(message) {
        const words = message.split(' ');
        const intentScores = {
            [types_1.Intent.GREETING]: 0,
            [types_1.Intent.VIEW_MENU]: 0,
            [types_1.Intent.ADD_TO_CART]: 0,
            [types_1.Intent.VIEW_CART]: 0,
            [types_1.Intent.PLACE_ORDER]: 0,
            [types_1.Intent.CHECK_ORDER_STATUS]: 0,
            [types_1.Intent.HELP]: 0,
            [types_1.Intent.GOODBYE]: 0,
            [types_1.Intent.UNKNOWN]: 0
        };
        for (const [intent, keywords] of Object.entries(this.intentKeywords)) {
            for (const keyword of keywords) {
                if (message.includes(keyword)) {
                    intentScores[intent] += 1;
                }
            }
        }
        let maxScore = 0;
        let bestIntent = types_1.Intent.UNKNOWN;
        for (const [intent, score] of Object.entries(intentScores)) {
            if (score > maxScore) {
                maxScore = score;
                bestIntent = intent;
            }
        }
        return bestIntent;
    }
    async extractEntities(message) {
        const entities = {
            products: [],
            quantities: [],
            numbers: []
        };
        const words = message.split(' ');
        for (let i = 0; i < words.length; i++) {
            const word = words[i];
            if (/^\d+$/.test(word)) {
                entities.numbers.push(parseInt(word));
            }
            if (word in this.quantityKeywords) {
                entities.quantities.push(this.quantityKeywords[word]);
            }
        }
        entities.products = await this.extractProducts(message);
        return entities;
    }
    async extractProducts(message) {
        try {
            const allProducts = await productService_1.default.getAllProducts();
            const mentionedProducts = [];
            for (const product of allProducts) {
                const productName = this.normalizeText(product.name);
                if (message.includes(productName)) {
                    mentionedProducts.push({
                        id: product.id,
                        name: product.name,
                        price: product.price,
                        stock: product.stock
                    });
                    continue;
                }
                for (const [synonym, variations] of Object.entries(this.productSynonyms)) {
                    if (message.includes(synonym)) {
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
        }
        catch (error) {
            console.error('❌ Erro ao extrair produtos:', error);
            return [];
        }
    }
    calculateConfidence(message, intent) {
        if (intent === types_1.Intent.UNKNOWN) {
            return 0;
        }
        const keywords = this.intentKeywords[intent] || [];
        let matches = 0;
        for (const keyword of keywords) {
            if (message.includes(keyword)) {
                matches++;
            }
        }
        const confidence = Math.min(matches / keywords.length * 2, 1);
        return Math.round(confidence * 100) / 100;
    }
    extractQuantity(message) {
        const normalizedMessage = this.normalizeText(message);
        const words = normalizedMessage.split(' ');
        for (const word of words) {
            if (/^\d+$/.test(word)) {
                const num = parseInt(word);
                if (num > 0 && num <= 100) {
                    return num;
                }
            }
        }
        for (const word of words) {
            if (word in this.quantityKeywords) {
                return this.quantityKeywords[word];
            }
        }
        if (normalizedMessage.includes('meia duzia'))
            return 6;
        if (normalizedMessage.includes('uma duzia'))
            return 12;
        if (normalizedMessage.includes('duzia'))
            return 12;
        return 1;
    }
    async searchProducts(query) {
        try {
            const normalizedQuery = this.normalizeText(query);
            const allProducts = await productService_1.default.getAllProducts();
            const results = [];
            for (const product of allProducts) {
                const productName = this.normalizeText(product.name);
                const productDescription = this.normalizeText(product.description || '');
                if (productName.includes(normalizedQuery) || normalizedQuery.includes(productName)) {
                    results.push({ ...product, relevance: 1.0 });
                    continue;
                }
                if (productDescription.includes(normalizedQuery)) {
                    results.push({ ...product, relevance: 0.8 });
                    continue;
                }
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
            return results.sort((a, b) => b.relevance - a.relevance);
        }
        catch (error) {
            console.error('❌ Erro ao buscar produtos:', error);
            return [];
        }
    }
    generateContextualResponse(intent, entities) {
        switch (intent) {
            case types_1.Intent.GREETING:
                return '👋 Olá! Bem-vindo à nossa distribuidora! Como posso ajudá-lo hoje?\n\nDigite *menu* para ver nossos produtos ou me diga o que está procurando!';
            case types_1.Intent.VIEW_MENU:
                return '📋 Vou mostrar nosso cardápio para você!';
            case types_1.Intent.HELP:
                return `🤖 *Como posso ajudar:*\n\n• Digite *menu* para ver produtos\n• Me diga o que quer: "quero 2 coca"\n• Digite *carrinho* para ver seu pedido\n• Digite *status* para acompanhar entrega\n\nEstou aqui para facilitar seu pedido! 😊`;
            case types_1.Intent.GOODBYE:
                return '👋 Obrigado pela preferência! Volte sempre!\n\nSe precisar de algo, é só chamar! 😊';
            default:
                return '🤔 Não entendi muito bem. Pode repetir ou digitar *ajuda* para ver o que posso fazer?';
        }
    }
}
exports.default = new NLPService();
//# sourceMappingURL=nlpService.js.map