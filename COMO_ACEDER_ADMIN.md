# Como aceder ao Admin (Lucrou)

## URL

- Produção: https://lucrou.vercel.app/admin-secret
- Local: http://localhost:3000/admin-secret

## Senha correcta (importante)

A senha do admin **não fica no frontend** e **não** deve usar o prefixo `NEXT_PUBLIC_`.

Usa **só** esta variável de ambiente no servidor:

```
ADMIN_PASSWORD=sua_senha_forte_aqui
```

### Porquê não `NEXT_PUBLIC_ADMIN_PASSWORD`?

Qualquer variável `NEXT_PUBLIC_*` pode ir para o JavaScript do browser.
Isso significa que a senha ficaria visível no código do site — **incorrecto e inseguro**.

---

## Configurar na Vercel

Projecto único: o que serve **https://lucrou.vercel.app**

1. Abre esse projecto no [Vercel Dashboard](https://vercel.com/dashboard)
2. **Settings** → **Environment Variables**
3. Ambiente **Production** (não só Preview)
4. Cria / edita:
   - **Key:** `ADMIN_PASSWORD`
   - **Value:** a tua senha forte
5. Se existir `NEXT_PUBLIC_ADMIN_PASSWORD` → **apaga**
6. **Deployments** → último deploy → **Redeploy**
7. Entra em https://lucrou.vercel.app/admin-secret com essa senha

---

## Configurar em local (`.env.local`)

```
ADMIN_PASSWORD=sua_senha_forte_aqui
```

Reinicia o servidor (`npm run dev`) depois de alterar.

---

## Como funciona (sem senha no código)

1. Introduzes a senha no formulário
2. O browser envia-a só no pedido a `/api/admin/verify` (header)
3. O **servidor** compara com `ADMIN_PASSWORD` da Vercel
4. Se coincidir, o painel abre

Não há senha escrita em ficheiros `.tsx` / `.ts` do frontend.

---

## Se a senha “não funciona”

1. Confirma que abriste o projecto Vercel de **https://lucrou.vercel.app**
2. Variável exacta: `ADMIN_PASSWORD` (não `NEXT_PUBLIC_…`)
3. Ambiente **Production**
4. **Redeploy** depois de guardar/alterar a variável
5. Apaga `NEXT_PUBLIC_ADMIN_PASSWORD` se ainda existir
6. Se a UI disser que `ADMIN_PASSWORD` não está configurada → a variável falta nesse projecto
