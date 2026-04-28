# AGENTS.md — Image Converter Hub

## Função deste arquivo

Este arquivo orienta agentes de IA e desenvolvedores dentro do repositório **Image Converter Hub**. 
Ele define a arquitetura, as regras de design e os padrões de execução para manter a integridade do projeto.

O Codex deve tratar este projeto como uma ferramenta de alta performance em produção, focada em privacidade (processamento local) e excelência visual.

---

## Projeto

O **Image Converter Hub** é uma ferramenta 100% client-side para otimização e conversão de imagens. 
Diferente de outros conversores, ele processa tudo no navegador do usuário, garantindo privacidade total e velocidade instantânea.

**Stack Principal:**
- **Frontend**: React + TypeScript + Vite
- **Estilização**: Tailwind CSS (Utility-first)
- **Componentes**: shadcn/ui + Lucide React
- **Animações**: Framer Motion
- **Processamento**: Canvas API (Nativo do Navegador)
- **Arquivos**: JSZip (para downloads em lote)
- **Deploy**: Vercel

---

## Pilares do Projeto

### 1. Processamento Local (Zero Backend)
- **Nunca** introduza dependências de backend ou webhooks (ex: n8n) para o processamento de imagens.
- Toda a lógica de conversão deve residir em `src/pages/Index.tsx` usando a `Canvas API`.
- **Transparência**: Manter canal alpha em PNG/WEBP. Para JPG, forçar fundo branco (`#FFFFFF`).

### 2. UI/UX "App-Like" Imersiva
- **Mobile-First**: O app deve parecer um aplicativo nativo no celular.
- **Full-Width**: No desktop, o conteúdo se expande até `1400px` para máxima produtividade.
- **Acessibilidade Giga**: Usar fontes grandes e elementos táteis generosos no mobile para evitar a necessidade de zoom.
- **Estética Premium**: Glassmorphism, bordas arredondadas largas (`rounded-[2rem]`), sombras suaves e gradientes dinâmicos.

### 3. Gestão de Versão
- A versão atual é controlada em `src/lib/version.ts`. 
- **Sempre** incremente a versão ao realizar melhorias significativas de layout ou funcionalidade.

---

## Regras de Execução

1. **Vínculo Git**: 
   - Repositório Oficial: `https://github.com/studio4x/image-converter-hub`
   - Branch Única: `main`
   - Identidade Autorizada: `Agencia Studio 4X <agenciastudio4x@gmail.com>` (Configuração LOCAL obrigatória).

2. **Refatoração de Layout**:
   - Sempre use prefixos responsivos (`sm:`, `md:`, `lg:`) para equilibrar o visual entre mobile (tamanhos grandes) e desktop (tamanhos profissionais).

3. **Inclusão de Novas Funcionalidades**:
   - Priorizar performance. Evite bibliotecas pesadas se puder ser resolvido com APIs nativas.

---

## Comandos Úteis

- `npm run dev`: Iniciar ambiente de desenvolvimento.
- `npm run build`: Validar build de produção (Vite).
- `git push origin main`: Enviar alterações para produção na Vercel.

---
*Este documento deve ser a primeira referência para qualquer agente que atue neste repositório.*
