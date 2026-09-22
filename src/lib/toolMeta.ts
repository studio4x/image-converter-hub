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
    hoverTitle: "Conversão inteligente",
    hoverDescription: "Fluxo rápido para reduzir peso e mudar o formato localmente no navegador.",
    hoverSteps: [
      "Envie uma ou várias imagens.",
      "Escolha ação, formato e qualidade.",
      "Processe e baixe arquivo único ou ZIP.",
    ],
    pageSteps: [
      "Adicione suas imagens por clique ou arraste.",
      "Escolha se deseja otimizar, converter, ou ambos.",
      "Defina formato final, qualidade e dimensões.",
      "Processe e baixe automaticamente no dispositivo.",
    ],
    icon: Repeat,
  },
  {
    key: "crop",
    route: "/crop",
    label: "Cortar",
    shortDescription: "Ajuste enquadramento por imagem.",
    hoverTitle: "Crop em lote",
    hoverDescription: "Defina enquadramento por arquivo com controle de proporção e processamento final.",
    hoverSteps: [
      "Envie as imagens que deseja recortar.",
      "Ajuste crop e proporção em cada item.",
      "Aplique conversão/otimização e baixe no fim.",
    ],
    pageSteps: [
      "Faça upload de uma ou várias imagens.",
      "Ajuste o recorte de cada arquivo no editor.",
      "Escolha proporção e confirme os enquadramentos.",
      "Finalize com otimizar/converter e baixe tudo.",
    ],
    icon: Scissors,
  },
  {
    key: "remove-background",
    route: "/remove-background",
    label: "Remover Fundo",
    shortDescription: "Elimine o fundo com ajuste fino.",
    hoverTitle: "Removedor de fundo",
    hoverDescription: "Remoção local com ajuste de sensibilidade, refinamento e crop opcional.",
    hoverSteps: [
      "Envie a imagem e ajuste a remoção.",
      "Use o ajuste fino para remover mais ou preservar mais.",
      "Opcionalmente recorte e exporte no formato desejado.",
    ],
    pageSteps: [
      "Adicione as imagens que terão o fundo removido.",
      "Ajuste sensibilidade, suavidade e ajuste fino de remoção.",
      "Opcionalmente aplique crop por imagem.",
      "Finalize com otimizar/converter e baixe os resultados.",
    ],
    icon: Wand2,
  },
];

