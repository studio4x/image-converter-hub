import { useState, useEffect } from "react";
import { ArrowLeftRight, Ruler } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface PresetRatio {
  id: string;
  label: string;
  value?: number;
}

export const PRESET_RATIOS: PresetRatio[] = [
  { id: "free", label: "Livre", value: undefined },
  { id: "1:1", label: "1:1", value: 1 },
  { id: "4:3", label: "4:3", value: 4 / 3 },
  { id: "16:9", label: "16:9", value: 16 / 9 },
  { id: "9:16", label: "9:16", value: 9 / 16 },
  { id: "3:2", label: "3:2", value: 3 / 2 },
  { id: "custom", label: "Dimensões", value: undefined },
];

export const QUICK_DIMENSIONS = [
  { label: "1200 × 630", width: "1200", height: "630", desc: "Social / OG" },
  { label: "1080 × 1080", width: "1080", height: "1080", desc: "Feed Quadrado" },
  { label: "1080 × 1920", width: "1080", height: "1920", desc: "Story / Reels" },
];

interface CropAspectSelectorProps {
  currentAspect?: number;
  onAspectChange: (aspect: number | undefined) => void;
  className?: string;
}

export const CropAspectSelector = ({
  currentAspect,
  onAspectChange,
  className = "",
}: CropAspectSelectorProps) => {
  const [selectedId, setSelectedId] = useState<string>("free");
  const [customWidth, setCustomWidth] = useState<string>("1200");
  const [customHeight, setCustomHeight] = useState<string>("630");

  // Atualiza o botão ativo com base no valor numérico de currentAspect recebido
  useEffect(() => {
    if (selectedId === "custom") return;

    if (currentAspect === undefined) {
      setSelectedId("free");
      return;
    }

    const match = PRESET_RATIOS.find(
      (ratio) => ratio.value !== undefined && Math.abs(ratio.value - currentAspect) < 0.001
    );

    if (match) {
      setSelectedId(match.id);
    } else {
      setSelectedId("custom");
    }
  }, [currentAspect, selectedId]);

  const handleSelectPreset = (ratio: PresetRatio) => {
    setSelectedId(ratio.id);

    if (ratio.id === "custom") {
      applyCustomDimensions(customWidth, customHeight);
    } else {
      onAspectChange(ratio.value);
    }
  };

  const applyCustomDimensions = (widthStr: string, heightStr: string) => {
    const w = parseFloat(widthStr);
    const h = parseFloat(heightStr);

    if (!isNaN(w) && !isNaN(h) && w > 0 && h > 0) {
      const calculatedAspect = w / h;
      onAspectChange(calculatedAspect);
    } else {
      onAspectChange(undefined);
    }
  };

  const handleWidthChange = (val: string) => {
    setCustomWidth(val);
    if (selectedId === "custom") {
      applyCustomDimensions(val, customHeight);
    }
  };

  const handleHeightChange = (val: string) => {
    setCustomHeight(val);
    if (selectedId === "custom") {
      applyCustomDimensions(customWidth, val);
    }
  };

  const handleSwapDimensions = () => {
    const nextW = customHeight;
    const nextH = customWidth;
    setCustomWidth(nextW);
    setCustomHeight(nextH);
    if (selectedId === "custom") {
      applyCustomDimensions(nextW, nextH);
    }
  };

  const handleApplyQuickDimension = (w: string, h: string) => {
    setCustomWidth(w);
    setCustomHeight(h);
    setSelectedId("custom");
    applyCustomDimensions(w, h);
  };

  const numericWidth = parseFloat(customWidth);
  const numericHeight = parseFloat(customHeight);
  const isValidCustom =
    !isNaN(numericWidth) &&
    !isNaN(numericHeight) &&
    numericWidth > 0 &&
    numericHeight > 0;
  const customRatioCalc = isValidCustom ? (numericWidth / numericHeight).toFixed(2) : null;

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-base sm:text-sm font-black text-foreground uppercase tracking-tighter flex items-center gap-1.5">
          <Ruler className="w-4 h-4 text-primary" />
          Proporção do Recorte
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        {PRESET_RATIOS.map((ratio) => (
          <Button
            key={ratio.id}
            type="button"
            variant={selectedId === ratio.id ? "default" : "outline"}
            onClick={() => handleSelectPreset(ratio)}
            className="font-black rounded-xl h-9 text-xs sm:text-sm"
          >
            {ratio.label}
          </Button>
        ))}
      </div>

      {selectedId === "custom" && (
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3 animate-in fade-in-50 duration-200">
          <div className="flex items-end gap-2 sm:gap-3">
            <div className="flex-1 space-y-1.5">
              <span className="text-[11px] font-black uppercase text-muted-foreground tracking-wider">
                Largura (px)
              </span>
              <Input
                type="number"
                min="1"
                placeholder="1200"
                value={customWidth}
                onChange={(e) => handleWidthChange(e.target.value)}
                className="font-mono font-bold h-10 rounded-xl bg-background/50 border-white/10"
              />
            </div>

            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleSwapDimensions}
              title="Inverter dimensões"
              className="h-10 w-10 shrink-0 rounded-xl border-white/10 hover:bg-primary/20 hover:text-primary transition-colors"
            >
              <ArrowLeftRight className="w-4 h-4" />
            </Button>

            <div className="flex-1 space-y-1.5">
              <span className="text-[11px] font-black uppercase text-muted-foreground tracking-wider">
                Altura (px)
              </span>
              <Input
                type="number"
                min="1"
                placeholder="630"
                value={customHeight}
                onChange={(e) => handleHeightChange(e.target.value)}
                className="font-mono font-bold h-10 rounded-xl bg-background/50 border-white/10"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1 border-t border-white/5">
            <span className="text-muted-foreground font-medium">Atalhos rápidos:</span>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_DIMENSIONS.map((qd) => (
                <button
                  key={qd.label}
                  type="button"
                  onClick={() => handleApplyQuickDimension(qd.width, qd.height)}
                  className="px-2 py-0.5 rounded-lg bg-white/5 hover:bg-primary/20 hover:text-primary text-[11px] font-mono font-bold transition-colors"
                  title={qd.desc}
                >
                  {qd.label}
                </button>
              ))}
            </div>
          </div>

          {isValidCustom && (
            <div className="text-[11px] text-muted-foreground font-medium text-right">
              Proporção calculada: <span className="font-mono font-bold text-primary">{numericWidth} × {numericHeight} px</span> (~{customRatioCalc}:1)
            </div>
          )}
        </div>
      )}
    </div>
  );
};
