
# Plano: Conversor de Imagens Integrado na Landing Page

## Visão Geral

Transformar a landing page atual em uma ferramenta completa de conversão de imagens, com upload, seleção de formato, ajuste de compressão e download - tudo sem sair da página.

## Análise do Workflow n8n

O webhook que você criou precisa receber:
- **files**: Arquivos de imagem (binários)
- **format**: Formato de saída (JPG, PNG ou WEBP)  
- **compression**: Nível de compressão (0-100)

**URLs disponíveis:**
- Teste: `https://n8n.studio4x.com.br/webhook-test/converter-imagem`
- Produção: `https://webhook.studio4x.com.br/webhook/converter-imagem`

## Funcionalidades da Nova Interface

1. **Área de Upload**
   - Drag-and-drop de imagens
   - Clique para selecionar arquivos
   - Suporte a múltiplos arquivos
   - Preview das imagens selecionadas
   - Botão para remover imagens

2. **Seleção de Formato**
   - Opções: JPG, PNG, WEBP
   - Apenas um formato por vez (conforme workflow)

3. **Controle de Compressão**
   - Slider de 0 a 100
   - Exibição do valor atual

4. **Estados da Conversão**
   - Idle: Formulário pronto
   - Loading: Processando (com indicador)
   - Sucesso: Download disponível
   - Erro: Mensagem de erro

5. **Download do Resultado**
   - Arquivo único: Download direto
   - Múltiplos arquivos: Download do ZIP

## Fluxo de Dados

```text
+------------------+     +-------------------+     +------------------+
|  Upload Imagens  | --> | Selecionar Formato| --> | Ajustar Compressão|
+------------------+     +-------------------+     +------------------+
                                                           |
                                                           v
+------------------+     +-------------------+     +------------------+
| Download Arquivo | <-- |  n8n Processa     | <-- | Enviar FormData  |
+------------------+     +-------------------+     +------------------+
```

## Alterações Necessárias

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/pages/Index.tsx` | Modificar | Adicionar toda a lógica de upload, conversão e download |

## Seção Tecnica

### Estrutura do FormData

```typescript
const formData = new FormData();
formData.append('format', 'JPG'); // ou PNG, WEBP
formData.append('compression', '80');
files.forEach(file => formData.append('files', file));
```

### Requisicao ao Webhook

```typescript
const response = await fetch(WEBHOOK_URL, {
  method: 'POST',
  body: formData,
});

// Resposta esperada: binary (imagem ou ZIP)
const blob = await response.blob();
```

### Estados do Componente

```typescript
interface State {
  files: File[];
  previews: string[];
  format: 'JPG' | 'PNG' | 'WEBP';
  compression: number;
  status: 'idle' | 'loading' | 'success' | 'error';
  resultBlob: Blob | null;
  errorMessage: string;
}
```

### Tratamento de Resposta

O webhook pode retornar:
- **Imagem única**: `Content-Type: image/jpeg` (ou png/webp)
- **ZIP com multiplas imagens**: `Content-Type: application/zip`

O frontend detectara o tipo e oferecera o download apropriado.

## Consideracoes Importantes

1. **CORS**: O webhook deve estar configurado para aceitar requisicoes de `https://id-preview--3c9e85a8-5a7b-4c45-b5ad-0fe1c75c2ecf.lovable.app` e do dominio de producao quando publicar

2. **Timeout**: Conversoes de muitas imagens podem demorar - usaremos indicadores de progresso

3. **Validacao**: Verificar tipos de arquivo antes do upload (jpg, png, webp, jpeg)

4. **Limite de Arquivos**: Definir um limite razoavel (ex: 10 arquivos)

## Proximos Passos Apos Aprovacao

1. Implementar a nova interface em `src/pages/Index.tsx`
2. Testar com a URL de teste do webhook
3. Verificar se o CORS esta configurado no n8n
4. Ajustar para URL de producao quando tudo funcionar
