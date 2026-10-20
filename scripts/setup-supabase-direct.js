const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Carregar variáveis de ambiente
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL não encontrado no .env.local');
  process.exit(1);
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY não encontrado no .env.local');
  console.log('\n📝 Para executar SQL automaticamente:');
  console.log('   1. Aceda ao Supabase Dashboard: https://supabase.com/dashboard');
  console.log('   2. Selecione o seu projeto');
  console.log('   3. Vá para Settings > API');
  console.log('   4. Copie a "service_role" key (secret, não a anon key)');
  console.log('   5. Adicione ao .env.local: SUPABASE_SERVICE_ROLE_KEY=sua_chave_aqui');
  console.log('\n⚠️  Alternativamente, execute manualmente:');
  console.log('   - Abra o SQL Editor no Supabase Dashboard');
  console.log('   - Cole o conteúdo de supabase_schema.sql');
  console.log('   - Clique em Run\n');
  process.exit(1);
}

async function executeSQL() {
  const sqlPath = path.join(__dirname, '../supabase_schema.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  console.log('🚀 A executar SQL no Supabase...\n');

  // Criar cliente com service role (tem permissões administrativas)
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  try {
    // Dividir SQL em comandos individuais
    const commands = sql
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => {
        const trimmed = cmd.trim();
        return trimmed.length > 0 && 
               !trimmed.startsWith('--') && 
               trimmed !== '';
      });

    console.log(`📋 Encontrados ${commands.length} comandos SQL\n`);

    // Executar cada comando usando RPC ou query direta
    // Nota: Supabase não permite executar SQL arbitrário via REST API
    // Precisamos usar o Management API ou executar manualmente
    
    console.log('⚠️  O Supabase não permite executar SQL arbitrário via REST API.');
    console.log('📋 Execute o SQL manualmente no SQL Editor:\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(sql);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('📝 Passos para executar:');
    console.log('   1. Aceda: https://supabase.com/dashboard');
    console.log('   2. Selecione o seu projeto');
    console.log('   3. Vá para SQL Editor (menu lateral)');
    console.log('   4. Cole o SQL acima');
    console.log('   5. Clique em "Run" ou pressione Ctrl+Enter\n');

    // Tentar criar tabelas via API REST (método alternativo)
    console.log('🔄 Tentando criar tabelas via API REST...\n');
    
    try {
      // Criar tabela usuarios
      const usuariosTable = {
        id: 'uuid',
        email: 'text',
        nome: 'text',
        nome_negocio: 'text',
        plano: 'text',
        criado_em: 'timestamp',
        ultimo_acesso: 'timestamp',
      };

      // Nota: A criação de tabelas via REST API não é suportada diretamente
      // Precisamos usar migrations ou SQL Editor
      
      console.log('✅ Para executar automaticamente, use o Supabase CLI:');
      console.log('   npx supabase db push\n');
      
    } catch (error) {
      console.log('ℹ️  Execução automática não disponível. Use o SQL Editor.\n');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.log('\n📋 Execute o SQL manualmente no SQL Editor do Supabase.\n');
  }
}

executeSQL();
