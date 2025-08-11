import { SupabaseClient } from '@supabase/supabase-js';
export declare const supabase: SupabaseClient;
export declare const supabaseAdmin: SupabaseClient;
export declare function testConnection(): Promise<boolean>;
export declare function testSupabaseConnection(): Promise<boolean>;
export declare function initializeTables(): Promise<void>;
//# sourceMappingURL=supabase.d.ts.map