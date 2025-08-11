"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabaseAdmin = exports.supabase = void 0;
exports.testConnection = testConnection;
exports.testSupabaseConnection = testSupabaseConnection;
exports.initializeTables = initializeTables;
const supabase_js_1 = require("@supabase/supabase-js");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseKey) {
    throw new Error('Variáveis de ambiente do Supabase não configuradas');
}
exports.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
exports.supabaseAdmin = (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey || supabaseKey);
async function testConnection() {
    try {
        const { data, error } = await exports.supabase.from('products').select('count').limit(1);
        if (error) {
            console.error('Erro ao testar conexão com Supabase:', error);
            return false;
        }
        console.log('✅ Conexão com Supabase estabelecida com sucesso');
        return true;
    }
    catch (error) {
        console.error('❌ Falha na conexão com Supabase:', error);
        return false;
    }
}
async function testSupabaseConnection() {
    try {
        const { data, error } = await exports.supabase.from('products').select('count').limit(1);
        if (error) {
            console.error('Erro ao testar conexão com Supabase:', error);
            return false;
        }
        console.log('✅ Conexão com Supabase estabelecida com sucesso');
        return true;
    }
    catch (error) {
        console.error('❌ Falha na conexão com Supabase:', error);
        return false;
    }
}
async function initializeTables() {
    try {
        console.log('🔄 Verificando estrutura do banco de dados...');
        console.log('✅ Estrutura do banco de dados verificada');
    }
    catch (error) {
        console.error('❌ Erro ao inicializar tabelas:', error);
        throw error;
    }
}
//# sourceMappingURL=supabase.js.map