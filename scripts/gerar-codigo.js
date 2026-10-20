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

// Gerar código aleatório (sem I, O, 0, 1 para evitar confusão)
function gerarCodigo(tamanho = 8) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let codigo = '';
  for (let i = 0; i < tamanho; i++) {
    codigo += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return codigo;
}

async function criarCodigo() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // Gerar código único
  let codigo;
  let tentativas = 0;
  const maxTentativas = 10;

  do {
    codigo = gerarCodigo();
    tentativas++;

    // Verificar se já existe
    const { data: existente } = await supabase
      .from('codigos_ativacao')
      .select('codigo')
      .eq('codigo', codigo)
      .single();

    if (!existente) {
      break; // Código único encontrado
    }

    if (tentativas >= maxTentativas) {
      console.error('❌ Não foi possível gerar código único após várias tentativas');
      process.exit(1);
    }
  } while (true);

  // Criar código com expiração de 7 dias
  const expiraEm = new Date();
  expiraEm.setDate(expiraEm.getDate() + 7);

  const { data, error } = await supabase
    .from('codigos_ativacao')
    .insert([{
      codigo,
      expira_em: expiraEm.toISOString(),
    }])
    .select()
    .single();

  if (error) {
    console.error('❌ Erro ao criar código:', error.message);
    process.exit(1);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Código de ativação criado com sucesso!');
  console.log('\n📋 Código:', codigo);
  console.log('📅 Expira em:', expiraEm.toLocaleDateString('pt-MZ'));
  console.log('\n💡 Envie este código ao cliente após receber o pagamento M-Pesa');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

criarCodigo();
