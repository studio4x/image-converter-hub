# Diretrizes de Versionamento - ImageConverter

Este arquivo serve como memória persistente para a IA sobre como gerenciar as versões deste projeto.

## Regra Principal
**Toda e qualquer alteração no código solicitada pelo usuário deve vir acompanhada de um incremento na versão do projeto.**

## Como atualizar
1. A versão atual está armazenada em `src/lib/version.ts`.
2. Use o padrão Semantic Versioning (SemVer):
   - **Patch (0.0.X)**: Pequenos ajustes, correções de bugs ou mudanças de texto.
   - **Minor (0.X.0)**: Novas funcionalidades ou mudanças visuais significativas.
   - **Major (X.0.0)**: Reformulação completa ou mudanças que quebram compatibilidade.
3. Após alterar qualquer arquivo, atualize a constante `APP_VERSION` em `src/lib/version.ts`.

## Exibição
A versão é exibida no rodapé da página inicial (`src/pages/Index.tsx`), logo abaixo dos créditos.