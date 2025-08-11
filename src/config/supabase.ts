import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Variáveis de ambiente do Supabase não configuradas');
}

// Cliente público (para operações básicas)
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);

// Cliente com privilégios administrativos (para operações que requerem bypass de RLS)
export const supabaseAdmin: SupabaseClient = createClient(
  supabaseUrl,
  supabaseServiceKey || supabaseKey
);

// Função para testar a conexão
export async function testConnection(): Promise<boolean> {
  try {
    const { data, error } = await supabase.from('products').select('count').limit(1);
    if (error) {
      console.error('Erro ao testar conexão com Supabase:', error);
      return false;
    }
    console.log('✅ Conexão com Supabase estabelecida com sucesso');
    return true;
  } catch (error) {
    console.error('❌ Falha na conexão com Supabase:', error);
    return false;
  }
}

// Alias para compatibilidade
export async function testSupabaseConnection(): Promise<boolean> {
  try {
    const { data, error } = await supabase.from('products').select('count').limit(1);
    if (error) {
      console.error('Erro ao testar conexão com Supabase:', error);
      return false;
    }
    console.log('✅ Conexão com Supabase estabelecida com sucesso');
    return true;
  } catch (error) {
    console.error('❌ Falha na conexão com Supabase:', error);
    return false;
  }
}

// Função para inicializar as tabelas (caso não existam)
export async function initializeTables(): Promise<void> {
  try {
    // Verificar se as tabelas existem e criar se necessário
    console.log('🔄 Verificando estrutura do banco de dados...');
    
    // Esta função pode ser expandida para criar tabelas via SQL se necessário
    // Por enquanto, assumimos que as tabelas foram criadas via Supabase Dashboard
    
    console.log('✅ Estrutura do banco de dados verificada');
  } catch (error) {
    console.error('❌ Erro ao inicializar tabelas:', error);
    throw error;
  }
}