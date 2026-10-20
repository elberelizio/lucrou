# 📱 Como Testar no Celular (Modo Desenvolvimento)

## 🌐 Aceder à Aplicação no Celular

### Passo 1: Verificar que o servidor está a correr

No terminal do seu computador, deve ver:
```
▲ Next.js 16.1.6 (Turbopack)
- Local:        http://localhost:3000
- Network:      http://192.168.1.100:3000
```

### Passo 2: Conectar celular à mesma rede WiFi

**IMPORTANTE:** O celular e o computador devem estar na **mesma rede WiFi**.

1. No celular, vá para **Configurações** → **WiFi**
2. Conecte-se à **mesma rede WiFi** que o computador está usando

### Passo 3: Aceder à aplicação no celular

1. Abra o navegador no celular (Chrome, Safari, etc.)
2. Digite no endereço:
   ```
   http://192.168.1.100:3000
   ```
   
   **Substitua `192.168.1.100` pelo IP que aparece no terminal quando inicia o servidor!**

3. A aplicação deve carregar no celular

---

## 🔍 Como Descobrir o IP Correto

### No Windows (PowerShell):

```powershell
Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -like "192.168.*"} | Select-Object IPAddress
```

### Ou simplesmente:

Quando iniciar o servidor com `npm run dev`, o Next.js mostra automaticamente:
```
- Network:      http://192.168.X.X:3000
```

Use esse IP!

---

## ⚠️ Problemas Comuns

### Problema: "Não consegue conectar" ou "Página não carrega"

**Soluções:**
1. ✅ Verifique se celular e computador estão na mesma WiFi
2. ✅ Verifique se o firewall do Windows não está bloqueando
3. ✅ Verifique se o IP está correto (deve ser o que aparece no terminal)
4. ✅ Reinicie o servidor: Pare com `Ctrl+C` e inicie novamente com `npm run dev`

### Problema: Firewall bloqueando

**Solução:**
1. Abra **Windows Defender Firewall**
2. Clique em **"Permitir um aplicativo através do firewall"**
3. Procure por **Node.js** e marque **Privado** e **Público**
4. Ou temporariamente desative o firewall para testar

### Problema: IP muda constantemente

**Solução:**
1. Configure IP estático no router
2. Ou verifique o IP sempre que iniciar o servidor (aparece no terminal)

---

## 📝 Passo a Passo Rápido

1. **No computador:**
   ```bash
   npm run dev
   ```
   
2. **Copie o IP que aparece:**
   ```
   Network: http://192.168.1.100:3000
   ```

3. **No celular:**
   - Conecte à mesma WiFi
   - Abra navegador
   - Digite: `http://192.168.1.100:3000`
   - (Substitua pelo IP do seu computador)

4. **Teste todas as funcionalidades:**
   - Criar cálculo
   - Guardar produto
   - Navegar entre páginas

---

## 🎯 Dica

**Guarde o IP do seu computador** para não ter que descobrir sempre. Normalmente é algo como:
- `192.168.1.100`
- `192.168.0.100`
- `10.0.0.100`

O Next.js mostra automaticamente quando inicia o servidor! 🚀
