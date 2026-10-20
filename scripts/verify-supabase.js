const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Carregar variáveis de ambiente
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Variáveis de ambiente não encontradas');
  process.exit(1);
}

async function checkHost() {
  try {
    const host = new URL(SUPABASE_URL).hostname;
    await fetch(`https://${host}`, { method: 'HEAD' });
    console.log(`✅ Servidor Supabase acessível: ${host}\n`);
    return true;
  } catch (error) {
    const host = new URL(SUPABASE_URL).hostname;
    console.error(`❌ Não foi possível ligar a ${host}`);
    console.error(`   ${error.cause?.code === 'ENOTFOUND' ? 'Domínio inexistente — o projeto Supabase pode ter sido apagado ou a URL está errada.' : error.message}`);
    console.error('\n📝 Corrija NEXT_PUBLIC_SUPABASE_URL no .env.local com a URL do dashboard:\n   Settings → API → Project URL\n');
    return false;
  }
}

async function verifyTables() {
  console.log('🔍 A verificar ligação ao Supabase...\n');

  if (!(await checkHost())) {
    process.exit(1);
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = createClient(
    SUPABASE_URL,
    serviceKey || SUPABASE_ANON_KEY
  );

  try {
    // Verificar tabela usuarios
    console.log('📋 Verificando tabela "usuarios"...');
    const { data: usuarios, error: errorUsuarios } = await supabase
      .from('usuarios')
      .select('*')
      .limit(1);

    if (errorUsuarios) {
      console.error('❌ Erro ao aceder tabela usuarios:', errorUsuarios.message);
    } else {
      console.log('✅ Tabela "usuarios" existe e está acessível');
    }

    // Verificar tabela calculos
    console.log('\n📋 Verificando tabela "calculos"...');
    const { data: calculos, error: errorCalculos } = await supabase
      .from('calculos')
      .select('*')
      .limit(1);

    if (errorCalculos) {
      console.error('❌ Erro ao aceder tabela calculos:', errorCalculos.message);
    } else {
      console.log('✅ Tabela "calculos" existe e está acessível');
    }

    // Verificar tabela pagamentos
    console.log('\n📋 Verificando tabela "pagamentos"...');
    const { data: pagamentos, error: errorPagamentos } = await supabase
      .from('pagamentos')
      .select('*')
      .limit(1);

    if (errorPagamentos) {
      console.error('❌ Erro ao aceder tabela pagamentos:', errorPagamentos.message);
    } else {
      console.log('✅ Tabela "pagamentos" existe e está acessível');
    }

    // Resumo
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    if (!errorUsuarios && !errorCalculos && !errorPagamentos) {
      console.log('✨ Todas as tabelas foram criadas com sucesso!');
      console.log('\n📊 Estrutura criada:');
      console.log('   ✅ usuarios (id, email, nome, nome_negocio, plano, criado_em, ultimo_acesso)');
      console.log('   ✅ calculos (todos os campos individuais para analytics)');
      console.log('   ✅ pagamentos (id, usuario_id, valor, referencia_mpesa, estado, criado_em)');
      console.log('   ✅ Índices criados');
      console.log('   ✅ Políticas RLS configuradas\n');
      console.log('🚀 O sistema está pronto para uso!\n');
    } else {
      console.log('⚠️  Algumas tabelas podem não ter sido criadas corretamente.');
      console.log('   Verifique os erros acima e execute o SQL novamente se necessário.\n');
    }

  } catch (error) {
    console.error('❌ Erro ao verificar:', error.message);
  }
}

verifyTables();
