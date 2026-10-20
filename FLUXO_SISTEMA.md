# Fluxo do Sistema Lucrou

## 1. Início - Pop-up de Boas-vindas
- **Primeira vez**: Pop-up com logo Lucrou aparece por **7 segundos**
- **Transições**: Pop-up aparece por **3.8 segundos** sempre que muda de página
- Mostra logo, slogan e loading spinner

## 2. Página Inicial (/)
- **TopBar**: Logo Lucrou + badge do plano (Gratuito/Básico/Completo)
- **HeroCard**: Card verde com:
  - Título: "Calcula o preço certo e vende sempre com lucro"
  - Botão principal: **"Calcular o meu preço"** → vai para `/calcular`
  - Botão secundário: **"Ver os meus produtos"** → vai para `/produtos`
  - Contador: mostra quantas pessoas já calcularam
- **BottomNav**: Navegação inferior com 4 opções (Início, Calcular, Produtos, Conta)

## 3. Escolher Modo de Cálculo (/calcular)
- Pergunta: "Qual é a tua situação?"
- **Opção A**: "Fui comprar para revender"
  - Descrição: Acabei de comprar produtos e quero saber quanto cobrar
  - Vai para `/calculador?modo=modoA`
- **Opção B**: "Já vendo, quero verificar"
  - Descrição: Quero saber se o preço que cobro está correcto
  - Vai para `/calculador?modo=modoB`

## 4. Formulário de Cálculo (/calculador)
### Modo A - Fui comprar para revender
- Campos obrigatórios:
  - Nome do produto
  - Total pago
  - Unidades compradas
- Campos opcionais:
  - Transporte
  - Outros custos (pode adicionar vários)
- Seleção de lucro: 20%, 30%, 40%, 50% ou personalizado
- Botão: **"Ver o preço certo →"**
- Ao calcular → vai para `/resultado`

### Modo B - Já vendo, quero verificar
- Campos obrigatórios:
  - Nome do produto
  - Preço por unidade (fornecedor)
  - Preço actual de venda
- Campo opcional:
  - Custos adicionais
- Botão: **"Verificar preço"**
- Ao calcular → vai para `/resultado`

## 5. Resultado do Cálculo (/resultado)
- Mostra:
  - **Status**: BOM / Prejuízo / Limite
  - **Preço recomendado**: valor calculado
  - **Margem de lucro**: percentagem
  - **Decomposição de custos**: breakdown detalhado
  - **Banner de lucro total**: destaque visual
- Botões disponíveis:
  - **"Guardar produto"**: salva na lista (pode requerer upgrade)
  - **"Compartilhar"**: abre WhatsApp com resultado formatado
  - **"Recalcular"**: volta ao formulário com dados preenchidos
- Se não houver resultado → redireciona para `/calcular`

## 6. Lista de Produtos (/produtos)
- Mostra todos os produtos guardados
- Cada produto mostra:
  - Nome
  - Preço recomendado
  - Status (BOM/Limite/Prejuízo)
  - Data da última actualização
- Ações por produto:
  - **Recalcular**: volta ao calculador com dados do produto
  - **Eliminar**: remove o produto
- Se não houver produtos → mostra mensagem e botão para calcular
- Pode mostrar banner de upgrade se necessário

## 7. Navegação Inferior (BottomNav)
Sempre visível em todas as páginas:
- **🏠 Início** → `/`
- **🧮 Calcular** → `/calcular`
- **📦 Produtos** → `/produtos`
- **⚙️ Conta** → `/ativar`

## 8. Página de Conta (/ativar)
- Gerencia o plano do utilizador
- Opções de upgrade (Gratuito → Básico → Completo)

---

## Fluxo Completo Simplificado

```
1. Abre app → Pop-up (7s) → Página Inicial
2. Clica "Calcular" → Escolhe Modo (A ou B)
3. Preenche formulário → Clica "Calcular"
4. Vê resultado → Pode guardar ou compartilhar
5. Produtos guardados ficam em "Ver os meus produtos"
6. Pode recalcular qualquer produto a qualquer momento
```

## Transições entre Páginas
- **Sempre**: Pop-up aparece por 3.8 segundos em cada mudança de página
- **Navegação**: Pode usar botões ou menu inferior
- **Dados**: Formulários mantêm dados para recalcular
