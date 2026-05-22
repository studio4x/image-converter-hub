import { Repeat, Scissors, Wand2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type ToolKey = "converter" | "crop" | "remove-background";

export interface ToolMeta {
  key: ToolKey;
  route: string;
  label: string;
  shortDescription: string;
  hoverTitle: string;
  hoverDescription: string;
  hoverSteps: string[];
  pageSteps: string[];
  icon: LucideIcon;
}

export const TOOL_ITEMS: ToolMeta[] = [
  {
    key: "converter",
    route: "/",
    label: "Converter",
    shortDescription: "Otimize e converta imagens em lote.",
    hoverTitle: "Conversao inteligente",
    hoverDescription: "Fluxo rapido para reduzir peso e mudar formato localmente no navegador.",
    hoverSteps: [
      "Envie uma ou varias imagens.",
      "Escolha acao, formato e qualidade.",
      "Processe e baixe arquivo unico ou ZIP.",
    ],
    pageSteps: [
      "Adicione suas imagens por clique ou arraste.",
      "Escolha se deseja otimizar, converter, ou ambos.",
      "Defina formato final, qualidade e dimensoes.",
      "Processar e baixar automaticamente no dispositivo.",
    ],
    icon: Repeat,
  },
  {
    key: "crop",
    route: "/crop",
    label: "Cortar",
    shortDescription: "Ajuste enquadramento por imagem.",
    hoverTitle: "Crop em lote",
    hoverDescription: "Defina enquadramento por arquivo com controle de proporcao e processamento final.",
    hoverSteps: [
      "Envie as imagens que deseja recortar.",
      "Ajuste crop e proporcao em cada item.",
      "Aplique conversao/otimizacao e baixe no fim.",
    ],
    pageSteps: [
      "Faça upload de uma ou varias imagens.",
      "Ajuste o recorte de cada arquivo no editor.",
      "Escolha proporcao e confirme os enquadramentos.",
      "Finalize com otimizar/converter e baixe tudo.",
    ],
    icon: Scissors,
  },
  {
    key: "remove-background",
    route: "/remove-background",
    label: "Remover Fundo",
    shortDescription: "Elimine fundo com ajuste fino.",
    hoverTitle: "Removedor de fundo",
    hoverDescription: "Remocao local com ajuste de sensibilidade, refinamento e crop opcional.",
    hoverSteps: [
      "Envie a imagem e ajuste a remocao.",
      "Use o ajuste fino para remover mais ou preservar mais.",
      "Opcionalmente recorte e exporte no formato desejado.",
    ],
    pageSteps: [
      "Adicione as imagens que terao o fundo removido.",
      "Ajuste sensibilidade, suavidade e ajuste fino de remocao.",
      "Opcionalmente aplique crop por imagem.",
      "Finalize com otimizar/converter e baixe os resultados.",
    ],
    icon: Wand2,
  },
];
