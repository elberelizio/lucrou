# Dois clientes Supabase: público e servidor

## O problema que vamos resolver agora

Actualmente o projecto tem só um cliente Supabase — o público.
Isso significa que o servidor e o browser usam a mesma chave.

É como usar a mesma chave para abrir a porta da frente e o cofre do banco.

## A solução: dois clientes com dois níveis de acesso

```
BROWSER (utilizador)          SERVIDOR (Next.js API routes)
      |                                    |
   supabase                          supabaseAdmin
   (anon key)                       (service_role key)
   Respeita RLS                      Bypassa RLS
   Pode autenticar                   Pode ler/escrever tudo
   Não pode escrever dados           Nunca vai para o browser
```

## O ficheiro que vamos criar/editar: lib/supabase.ts

Por convenção, ficheiros em `lib/` são utilitários — ferramentas reutilizáveis
que não são nem páginas nem componentes visuais.

## Regra crítica

supabaseAdmin NUNCA deve aparecer em ficheiros que começam com 'use client'
nem em nenhum ficheiro dentro de /components ou /hooks.

Se o supabaseAdmin chegar ao browser, a service_role key fica exposta
e qualquer pessoa pode ler/escrever toda a base de dados.

## Variáveis de ambiente

As variáveis de ambiente são configurações que vivem fora do código.

NEXT_PUBLIC_* → vai para o browser (qualquer pessoa vê)
sem NEXT_PUBLIC_ → fica só no servidor (seguro)

Exemplos:
NEXT_PUBLIC_SUPABASE_URL        → ok no browser (URL do projecto)
NEXT_PUBLIC_SUPABASE_ANON_KEY   → ok no browser (chave pública por design)
SUPABASE_SERVICE_ROLE_KEY       → NUNCA no browser (chave do servidor)
ADMIN_PASSWORD                  → NUNCA no browser (senha do admin)

## Onde ficam estas variáveis

Em desenvolvimento: ficheiro .env.local (nunca vai para o git)
Em produção (Vercel): Settings → Environment Variables no dashboard
