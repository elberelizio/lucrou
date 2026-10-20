const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Carregar variáveis de ambiente
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Variáveis de ambiente não encontradas');
  console.log('   Adicione SUPABASE_SERVICE_ROLE_KEY ao .env.local');
  process.exit(1);
}

async function verificarExpiracoes() {
  console.log('🔄 A verificar expirações de Premium...\n');

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  try {
    // Chamar função RPC para verificar e reverter expirações
    const { data, error } = await supabase.rpc('verificar_expiracoes_premium');

    if (error) {
      console.error('❌ Erro ao verificar expirações:', error.message);
      process.exit(1);
    }

    console.log(`✅ Verificação concluída! ${data || 0} utilizador(es) revertido(s) para gratuito.\n`);

  } catch (error: any) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

verificarExpiracoes();
