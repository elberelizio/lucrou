const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Carregar variáveis de ambiente
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const sqlPath = path.join(__dirname, '../supabase_schema.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');

async function openSupabaseSQL() {
  console.log('🚀 A abrir Supabase Dashboard...\n');

  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });

  try {
    const page = await browser.newPage();
    
    // URL do SQL Editor do Supabase (ajuste o project-ref)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
      console.error('❌ NEXT_PUBLIC_SUPABASE_URL não encontrado');
      await browser.close();
      return;
    }

    // Extrair project ref da URL
    const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
    
    if (!projectRef) {
      console.error('❌ Não foi possível extrair project ref da URL');
      await browser.close();
      return;
    }

    const sqlEditorUrl = `https://supabase.com/dashboard/project/${projectRef}/sql/new`;
    
    console.log(`📋 Abrindo: ${sqlEditorUrl}\n`);
    console.log('⚠️  Será necessário fazer login manualmente no Supabase.\n');
    
    await page.goto(sqlEditorUrl, { waitUntil: 'networkidle2' });
    
    // Aguardar um pouco para o utilizador fazer login se necessário
    console.log('⏳ Aguardando login... (faça login se necessário)\n');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Tentar encontrar o editor SQL
    try {
      // Aguardar o editor estar disponível
      await page.waitForSelector('textarea, [contenteditable="true"], .monaco-editor', { 
        timeout: 10000 
      });

      console.log('✅ Editor SQL encontrado!\n');
      console.log('📋 Colando SQL...\n');

      // Tentar colar o SQL no editor
      // O Supabase usa Monaco Editor, então precisamos encontrar o elemento correto
      await page.evaluate((sqlContent) => {
        // Tentar diferentes seletores para o editor
        const selectors = [
          'textarea',
          '[contenteditable="true"]',
          '.monaco-editor textarea',
          '.cm-editor textarea',
        ];

        for (const selector of selectors) {
          const element = document.querySelector(selector);
          if (element) {
            element.focus();
            element.value = sqlContent;
            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new Event('change', { bubbles: true }));
            return true;
          }
        }

        // Se não encontrar, copiar para clipboard
        navigator.clipboard.writeText(sqlContent).then(() => {
          console.log('SQL copiado para clipboard! Cole no editor (Ctrl+V)');
        });
        return false;
      }, sql);

      console.log('✅ SQL preparado!\n');
      console.log('📝 Próximos passos:');
      console.log('   1. Se o SQL não foi colado automaticamente, pressione Ctrl+V');
      console.log('   2. Revise o SQL no editor');
      console.log('   3. Clique em "Run" ou pressione Ctrl+Enter para executar\n');

      // Manter o browser aberto
      console.log('💡 O browser ficará aberto. Feche quando terminar.\n');

    } catch (error) {
      console.log('⚠️  Não foi possível encontrar o editor automaticamente.');
      console.log('📋 SQL copiado para clipboard!\n');
      console.log('📝 Passos manuais:');
      console.log('   1. Cole o SQL no editor (Ctrl+V)');
      console.log('   2. Clique em "Run" para executar\n');
      
      // Copiar para clipboard usando Node.js
      const { exec } = require('child_process');
      const platform = process.platform;
      let command;
      
      if (platform === 'win32') {
        // Windows
        const { spawn } = require('child_process');
        const echo = spawn('echo', [sql.replace(/'/g, "''")]);
        const clip = spawn('clip');
        echo.stdout.pipe(clip.stdin);
      } else if (platform === 'darwin') {
        // macOS
        exec(`echo "${sql.replace(/"/g, '\\"')}" | pbcopy`);
      } else {
        // Linux
        exec(`echo "${sql.replace(/"/g, '\\"')}" | xclip -selection clipboard`);
      }
    }

    // Não fechar o browser automaticamente - deixar o utilizador fechar
    console.log('⏸️  Browser mantido aberto. Feche quando terminar.\n');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.log('\n📋 Execute manualmente:');
    console.log('   1. Aceda ao Supabase Dashboard');
    console.log('   2. Vá para SQL Editor');
    console.log('   3. Cole o conteúdo de supabase_schema.sql\n');
    await browser.close();
  }
}

// Executar
openSupabaseSQL().catch(console.error);
