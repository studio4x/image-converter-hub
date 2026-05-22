"use client";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Operation, CompressionLevel, Format, ResizeScale } from "@/lib/imageProcessor";

interface ConversionSettingsProps {
  operation: Operation;
  setOperation: (op: Operation) => void;
  format: Format;
  setFormat: (format: Format) => void;
  compression: CompressionLevel;
  setCompression: (value: CompressionLevel) => void;
  resizeScale: ResizeScale;
  setResizeScale: (value: ResizeScale) => void;
  originalWidth?: number;
  originalHeight?: number;
}

const compressionLevels: { value: CompressionLevel; label: string; desc: string }[] = [
  { value: "10", label: "10%", desc: "Minima" },
  { value: "30", label: "30%", desc: "Baixa" },
  { value: "60", label: "60%", desc: "Media" },
  { value: "80", label: "80%", desc: "Alta" },
  { value: "100", label: "100%", desc: "Maxima" },
];

const ConversionSettings = ({
  operation,
  setOperation,
  format,
  setFormat,
  compression,
  setCompression,
  resizeScale,
  setResizeScale,
  originalWidth,
  originalHeight,
}: ConversionSettingsProps) => {
  const formats: Format[] = ["JPG", "PNG", "WEBP", "AVIF", "SVG"];

  const getResizeLabel = (value: ResizeScale) => {
    if (!originalWidth || !originalHeight) {
      if (value === "100") return "Original";
      if (value === "75") return "Reduzido";
      if (value === "50") return "Metade";
      return "Minimo";
    }

    const factor = parseInt(value, 10) / 100;
    const w = Math.round(originalWidth * factor);
    const h = Math.round(originalHeight * factor);
    return `${w} x ${h} px`;
  };

  const resizeLevels: { value: ResizeScale; label: string; desc: string }[] = [
    { value: "100", label: "100%", desc: getResizeLabel("100") },
    { value: "75", label: "75%", desc: getResizeLabel("75") },
    { value: "50", label: "50%", desc: getResizeLabel("50") },
    { value: "25", label: "25%", desc: getResizeLabel("25") },
  ];

  return (
    <div className="space-y-6 pt-1">
      <div className="space-y-3">
        <label className="text-base sm:text-xs font-black text-foreground uppercase tracking-wider">Acao Desejada</label>
        <RadioGroup
          value={operation}
          onValueChange={(value) => setOperation(value as Operation)}
          className="grid grid-cols-1 gap-3"
        >
          <div
            className={`flex items-center space-x-3 space-y-0 rounded-2xl border-2 p-4 transition-all duration-300 ${
              operation === "Otimizar" ? "bg-primary/10 border-primary shadow-lg" : "bg-white/5 border-transparent hover:bg-white/10"
            }`}
          >
            <RadioGroupItem value="Otimizar" id="op1" className="w-5 h-5 border-2" />
            <div className="flex-1 cursor-pointer">
              <Label htmlFor="op1" className="block font-black text-base sm:text-sm leading-tight cursor-pointer">
                Otimizar
              </Label>
              <span className="text-xs text-muted-foreground font-bold">Reduz o peso mantendo qualidade</span>
            </div>
          </div>

          <div
            className={`flex items-center space-x-3 space-y-0 rounded-2xl border-2 p-4 transition-all duration-300 ${
              operation === "Converter" ? "bg-primary/10 border-primary shadow-lg" : "bg-white/5 border-transparent hover:bg-white/10"
            }`}
          >
            <RadioGroupItem value="Converter" id="op2" className="w-5 h-5 border-2" />
            <div className="flex-1 cursor-pointer">
              <Label htmlFor="op2" className="block font-black text-base sm:text-sm leading-tight cursor-pointer">
                Converter
              </Label>
              <span className="text-xs text-muted-foreground font-bold">Muda o formato do arquivo</span>
            </div>
          </div>

          <div
            className={`flex items-center space-x-3 space-y-0 rounded-2xl border-2 p-4 transition-all duration-300 ${
              operation === "Otimizar e Converter"
                ? "bg-primary/10 border-primary shadow-lg"
                : "bg-white/5 border-transparent hover:bg-white/10"
            }`}
          >
            <RadioGroupItem value="Otimizar e Converter" id="op3" className="w-5 h-5 border-2" />
            <div className="flex-1 cursor-pointer">
              <Label htmlFor="op3" className="block font-black text-base sm:text-sm leading-tight cursor-pointer">
                Otimizar e Converter
              </Label>
              <span className="text-xs text-muted-foreground font-bold">Une reducao de peso e troca de formato</span>
            </div>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
        <label className="text-base sm:text-xs font-black text-foreground uppercase tracking-wider">Formato de Saida</label>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {formats.map((f) => (
            <button
              key={f}
              onClick={() => setFormat(f)}
              className={`
                py-3 sm:py-2 rounded-xl font-black text-base sm:text-xs transition-all duration-300
                ${
                  format === f
                    ? "bg-primary text-primary-foreground shadow-xl scale-[1.02] ring-2 ring-primary/20"
                    : "bg-white/5 text-foreground/70 hover:bg-white/10"
                }
              `}
            >
              {f}
            </button>
          ))}
        </div>
        {operation === "Otimizar" && (
          <p className="text-[11px] text-muted-foreground italic">
            * Ao otimizar, o arquivo sera processado para o formato selecionado acima.
          </p>
        )}
      </div>

      {operation !== "Converter" && (
        <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
          <label className="text-base sm:text-xs font-black text-foreground uppercase tracking-wider">Nivel de Qualidade</label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {compressionLevels.map((level) => (
              <button
                key={level.value}
                onClick={() => setCompression(level.value)}
                className={`
                  flex flex-col items-center py-2.5 sm:py-2 px-1 rounded-xl font-black text-sm sm:text-xs transition-all duration-300
                  ${
                    compression === level.value
                      ? "bg-primary text-primary-foreground shadow-xl scale-[1.02] ring-2 ring-primary/20"
                      : "bg-white/5 text-foreground/70 hover:bg-white/10"
                  }
                `}
              >
                <span>{level.label}</span>
                <span
                  className={`text-[10px] sm:text-[9px] font-bold mt-0.5 ${
                    compression === level.value ? "text-primary-foreground/80" : "text-muted-foreground"
                  }`}
                >
                  {level.desc}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
        <label className="text-base sm:text-xs font-black text-foreground uppercase tracking-wider">Reduzir Tamanho (Dimensoes)</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {resizeLevels.map((level) => (
            <button
              key={level.value}
              onClick={() => setResizeScale(level.value)}
              className={`
                flex flex-col items-center py-2.5 sm:py-2 px-1 rounded-xl font-black text-sm sm:text-xs transition-all duration-300
                ${
                  resizeScale === level.value
                    ? "bg-primary text-primary-foreground shadow-xl scale-[1.02] ring-2 ring-primary/20"
                    : "bg-white/5 text-foreground/70 hover:bg-white/10"
                }
              `}
            >
              <span>{level.label}</span>
              <span
                className={`text-[10px] sm:text-[9px] font-bold mt-0.5 ${
                  resizeScale === level.value ? "text-primary-foreground/80" : "text-muted-foreground"
                }`}
              >
                {level.desc}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ConversionSettings;
