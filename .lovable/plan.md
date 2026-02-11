

# Plano: Alinhar Frontend com o Workflow n8n

## Problemas Encontrados

Ao analisar o workflow "CONVERSOR DE IMAGENS" (ID: `gnTZEVXIWL0kgE8XC7CbU`), identifiquei as seguintes incompatibilidades com o frontend atual:

### 1. URL do Webhook incorreta
- **Atual no codigo**: `https://n8n.studio4x.com.br/webhook/conversor-imagens-lp`
- **Correta (producao)**: `https://webhook.studio4x.com.br/webhook/converter-imagem`

### 2. Nomes dos campos incorretos
O workflow espera campos com nomes EXATOS (vindos do Form Trigger). O frontend envia nomes diferentes:

| Campo no Workflow | Campo no Frontend Atual |
|---|---|
| `Você quer otimizar ou convertes suas imagens?` | `Você quer otimizar ou converter suas imagens?` (note: "convertes" vs "converter") |
| `Para qual formato de imagem você deseja converter?` | `format` |
| `Suba aqui as imagens a serem otimizadas/convertidas` | `files` |
| `Qual o nível de qualidade você quer a sua imagem ao final do processo? Quanto maior o número, maior o tamanho do arquivo.` | `compression` |

### 3. Valores de compressao incompativeis
- **Workflow espera**: valores discretos via radio: `"10"`, `"30"`, `"60"`, `"80"`, `"100"`
- **Frontend envia**: slider livre de 0 a 100

### 4. Tipo de Trigger (Alerta Importante)
O workflow ainda usa **Form Trigger** (nao Webhook Trigger). Isso significa que ele foi projetado para receber dados do formulario nativo do n8n e responde com paginas HTML (Form completion), nao com dados binarios puros. Para a integracao via `fetch` funcionar retornando o arquivo binario diretamente, o ideal seria trocar no n8n:
- **Trigger**: de Form Trigger para Webhook (POST, binary data habilitado)
- **Resposta**: de Form completion para Respond to Webhook (binary)

Porem, vou alinhar o frontend com os nomes e valores exatos do workflow para maximizar a compatibilidade.

## Alteracoes Planejadas

### Arquivo: `src/pages/Index.tsx`
1. Corrigir a constante `WEBHOOK_URL` para a URL de producao correta
2. Atualizar `handleConvert` para enviar os campos com os nomes exatos do workflow:
   - `"Você quer otimizar ou convertes suas imagens?"` (com o typo do workflow)
   - `"Para qual formato de imagem você deseja converter?"`
   - `"Suba aqui as imagens a serem otimizadas/convertidas"` (para os arquivos)
   - `"Qual o nível de qualidade você quer a sua imagem ao final do processo? Quanto maior o número, maior o tamanho do arquivo."`

### Arquivo: `src/components/converter/ConversionSettings.tsx`
1. Substituir o slider de compressao (0-100) por botoes de selecao com os 5 niveis que o workflow aceita: **10, 30, 60, 80, 100**
2. Alterar o tipo de `compression` de `number` para `string` (para enviar "10", "30", etc.)

## Secao Tecnica

### Novo FormData em handleConvert

```typescript
const formData = new FormData();

// Nomes EXATOS do Form Trigger do n8n
formData.append(
  'Você quer otimizar ou convertes suas imagens?',
  operation
);
formData.append(
  'Para qual formato de imagem você deseja converter?',
  format
);
formData.append(
  'Qual o nível de qualidade você quer a sua imagem ao final do processo? Quanto maior o número, maior o tamanho do arquivo.',
  compression
);
files.forEach(file =>
  formData.append(
    'Suba aqui as imagens a serem otimizadas/convertidas',
    file
  )
);
```

### Novos niveis de qualidade

```typescript
type CompressionLevel = "10" | "30" | "60" | "80" | "100";

// Exibidos como botoes selecionaveis ao inves de slider
const levels = [
  { value: "10", label: "10%", desc: "Minima" },
  { value: "30", label: "30%", desc: "Baixa" },
  { value: "60", label: "60%", desc: "Media" },
  { value: "80", label: "80%", desc: "Alta" },
  { value: "100", label: "100%", desc: "Maxima" },
];
```

### URL corrigida

```typescript
const WEBHOOK_URL = "https://webhook.studio4x.com.br/webhook/converter-imagem";
```

## Nota sobre compatibilidade

Mesmo com todas essas correcoes, o workflow usa **Form Trigger** que retorna **paginas HTML** (Form completion pages) em vez de dados binarios puros. Isso pode fazer com que o `fetch` receba HTML ao inves do arquivo convertido. Se isso acontecer, sera necessario alterar o workflow no n8n para usar nodes **Webhook** e **Respond to Webhook** em vez de Form Trigger e Form completion.

