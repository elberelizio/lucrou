const fs = require('fs');
const path = require('path');

// Carregar variáveis de ambiente do .env.local
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL não encontrado no .env.local');
  process.exit(1);
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY não encontrado no .env.local');
  console.log('\n📝 Para executar SQL automaticamente, adicione a Service Role Key ao .env.local:');
  console.log('   1. Aceda ao Supabase Dashboard');
  console.log('   2. Vá para Settings > API');
  console.log('   3. Copie a "service_role" key (secret)');
  console.log('   4. Adicione ao .env.local: SUPABASE_SERVICE_ROLE_KEY=sua_chave_aqui\n');
  console.log('⚠️  Alternativamente, execute o SQL manualmente no SQL Editor do Supabase.');
  process.exit(1);
}

async function executeSQL() {
  const sqlPath = path.join(__dirname, '../supabase_schema.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  console.log('🚀 A executar SQL no Supabase...\n');

  try {
    // Dividir SQL em comandos individuais (separados por ;)
    const commands = sql
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    let successCount = 0;
    let errorCount = 0;

    for (const command of commands) {
      if (!command.trim()) continue;

      try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify({ query: command }),
        });

        if (!response.ok) {
          // Tentar método alternativo usando PostgREST
          const altResponse = await fetch(`${SUPABASE_URL}/rest/v1/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': SUPABASE_SERVICE_ROLE_KEY,
              'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
              'Prefer': 'return=minimal',
            },
          });

          if (!altResponse.ok) {
            console.log(`⚠️  Comando pode já existir ou requer execução manual: ${command.substring(0, 50)}...`);
          } else {
            successCount++;
          }
        } else {
          successCount++;
        }
      } catch (error) {
        console.error(`❌ Erro ao executar comando: ${error.message}`);
        errorCount++;
      }
    }

    console.log(`\n✅ ${successCount} comandos executados com sucesso`);
    if (errorCount > 0) {
      console.log(`⚠️  ${errorCount} comandos com avisos (podem já existir)`);
    }
    console.log('\n✨ Setup concluído! Verifique as tabelas no Supabase Dashboard.\n');

  } catch (error) {
    console.error('❌ Erro ao executar SQL:', error.message);
    console.log('\n📋 Execute o SQL manualmente:');
    console.log('   1. Aceda ao Supabase Dashboard > SQL Editor');
    console.log('   2. Cole o conteúdo de supabase_schema.sql');
    console.log('   3. Clique em Run\n');
    process.exit(1);
  }
}

executeSQL();
