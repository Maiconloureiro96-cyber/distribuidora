import { Product } from '../types';
declare class ProductService {
    getAllProducts(): Promise<Product[]>;
    getProductById(id: string): Promise<Product | null>;
    searchProductsByName(name: string): Promise<Product[]>;
    getProductsByCategory(category: string): Promise<Product[]>;
    checkStock(productId: string, quantity: number): Promise<boolean>;
    updateStock(productId: string, newStock: number): Promise<boolean>;
    reduceStock(productId: string, quantity: number): Promise<boolean>;
    createProduct(productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product | null>;
    updateProduct(id: string, productData: Partial<Product>): Promise<Product | null>;
    deactivateProduct(id: string): Promise<boolean>;
    getLowStockProducts(threshold?: number): Promise<Product[]>;
    getCategories(): Promise<string[]>;
}
declare const _default: ProductService;
export default _default;
//# sourceMappingURL=productService.d.ts.map