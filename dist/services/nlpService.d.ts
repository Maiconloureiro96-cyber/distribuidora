import { Intent, IntentResult } from '../types';
declare class NLPService {
    private readonly intentKeywords;
    private readonly quantityKeywords;
    private readonly productSynonyms;
    processMessage(message: string): Promise<IntentResult>;
    private normalizeText;
    private identifyIntent;
    private extractEntities;
    private extractProducts;
    private calculateConfidence;
    extractQuantity(message: string): number;
    searchProducts(query: string): Promise<any[]>;
    generateContextualResponse(intent: Intent, entities: any): string;
}
declare const _default: NLPService;
export default _default;
//# sourceMappingURL=nlpService.d.ts.map