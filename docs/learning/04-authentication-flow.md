# Como funciona a nova autenticação

## O problema anterior

O sistema anterior guardava o email do utilizador no localStorage:
  localStorage.setItem('lucrou_email', 'joao@gmail.com')

Problema: qualquer pessoa abre o browser, vai a:
  DevTools → Application → Local Storage → muda o email
E pronto — está a fingir ser outra pessoa.

## A nova solução: Supabase Auth Sessions

O Supabase tem um sistema de autenticação real.
Quando o utilizador entra, o Supabase gera um token seguro (JWT).

Este token:
- É assinado criptograficamente (não pode ser falsificado)
- Expira automaticamente
- É renovado automaticamente enquanto o utilizador usa a app
- Está guardado em cookies seguros, não no localStorage

## Dois tipos de login

1. MAGIC LINK (utilizadores gratuitos)
   - Utilizador insere só o email
   - Supabase envia um link para o email
   - Utilizador clica no link → fica autenticado automaticamente
   - Não precisa de senha

2. EMAIL + PASSWORD (utilizadores premium)
   - Utilizador cria conta com email e senha
   - Faz login com email + senha
   - Sessão mais robusta para quem paga

## O hook useAuth

Um hook em React é uma função especial que:
- Começa sempre com "use" (useAuth, useState, useEffect...)
- Guarda estado que persiste enquanto o componente existe
- Pode reagir a mudanças (ex: quando o utilizador faz login)

O nosso useAuth:
- Ouve mudanças de sessão do Supabase em tempo real
- Quando detecta login → busca dados do utilizador via API route
- Quando detecta logout → limpa todos os dados
- Expõe funções: enviarMagicLink, criarContaPremium, ativarCodigoPremium, logout

## O ficheiro app/auth/callback/route.ts

Quando o utilizador clica no Magic Link, o Supabase redireciona para:
  https://lucrou.vercel.app/auth/callback?code=xxxxx

Este ficheiro processa o código e cria a sessão.
Depois redireciona o utilizador para a página certa.

## Fluxo completo do Magic Link

1. Utilizador clica "Guardar produto" na página de resultado
2. Não está autenticado → aparece modal a pedir email
3. Insere email → app chama enviarMagicLink()
4. Supabase envia email com link para joao@gmail.com
5. Utilizador clica no link → browser vai para /auth/callback?code=xxx
6. Servidor processa o código → cria sessão segura
7. Redireciona para /resultado
8. useAuth detecta a nova sessão → carrega dados
9. Utilizador está autenticado → pode guardar o produto
