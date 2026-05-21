"use client";

import React from "react";
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
  { value: "10", label: "10%", desc: "Mínima" },
  { value: "30", label: "30%", desc: "Baixa" },
  { value: "60", label: "60%", desc: "Média" },
  { value: "80", label: "80%", desc: "Alta" },
  { value: "100", label: "100%", desc: "Máxima" },
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
  originalHeight
}: ConversionSettingsProps) => {
  const formats: Format[] = ["JPG", "PNG", "WEBP", "AVIF", "SVG"];

  const getResizeLabel = (value: ResizeScale) => {
    if (!originalWidth || !originalHeight) {
      if (value === "100") return "Original";
      if (value === "75") return "Reduzido";
      if (value === "50") return "Metade";
      return "Mínimo";
    }

    const factor = parseInt(value) / 100;
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
    <div className="space-y-8 pt-2">
      {/* 1. Escolha da Operação */}
      <div className="space-y-4">
        <label className="text-xl sm:text-sm font-black text-foreground uppercase tracking-tighter opacity-100">
          Ação Desejada
        </label>
        <RadioGroup 
          value={operation} 
          onValueChange={(value) => setOperation(value as Operation)}
          className="grid grid-cols-1 gap-4 sm:gap-3"
        >
          <div className={`flex items-center space-x-4 sm:space-x-3 space-y-0 rounded-2xl sm:rounded-xl border-2 p-5 sm:p-4 transition-all duration-300 ${operation === "Otimizar" ? "bg-primary/10 border-primary shadow-lg scale-[1.01]" : "bg-white/5 border-transparent hover:bg-white/10"}`}>
            <RadioGroupItem value="Otimizar" id="op1" className="w-6 h-6 sm:w-5 sm:h-5 border-2" />
            <div className="flex-1 cursor-pointer">
              <Label htmlFor="op1" className="block font-black text-xl sm:text-base leading-tight cursor-pointer">Otimizar</Label>
              <span className="text-sm sm:text-xs text-muted-foreground font-bold">Reduz o peso mantendo a qualidade</span>
            </div>
          </div>
          <div className={`flex items-center space-x-4 sm:space-x-3 space-y-0 rounded-2xl sm:rounded-xl border-2 p-5 sm:p-4 transition-all duration-300 ${operation === "Converter" ? "bg-primary/10 border-primary shadow-lg scale-[1.01]" : "bg-white/5 border-transparent hover:bg-white/10"}`}>
            <RadioGroupItem value="Converter" id="op2" className="w-6 h-6 sm:w-5 sm:h-5 border-2" />
            <div className="flex-1 cursor-pointer">
              <Label htmlFor="op2" className="block font-black text-xl sm:text-base leading-tight cursor-pointer">Converter</Label>
              <span className="text-sm sm:text-xs text-muted-foreground font-bold">Muda o formato do arquivo</span>
            </div>
          </div>
          <div className={`flex items-center space-x-4 sm:space-x-3 space-y-0 rounded-2xl sm:rounded-xl border-2 p-5 sm:p-4 transition-all duration-300 ${operation === "Otimizar e Converter" ? "bg-primary/10 border-primary shadow-lg scale-[1.01]" : "bg-white/5 border-transparent hover:bg-white/10"}`}>
            <RadioGroupItem value="Otimizar e Converter" id="op3" className="w-6 h-6 sm:w-5 sm:h-5 border-2" />
            <div className="flex-1 cursor-pointer">
              <Label htmlFor="op3" className="block font-black text-xl sm:text-base leading-tight cursor-pointer">Otimizar e Converter</Label>
              <span className="text-sm sm:text-xs text-muted-foreground font-bold">Melhor dos dois mundos</span>
            </div>
          </div>
        </RadioGroup>
      </div>

      {/* 2. Escolha do Formato de Saída */}
      <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
        <label className="text-xl sm:text-sm font-black text-foreground uppercase tracking-tighter opacity-100">
          Formato de Saída
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {formats.map((f) => (
            <button
              key={f}
              onClick={() => setFormat(f)}
              className={`
                py-4 sm:py-3 rounded-2xl sm:rounded-xl font-black text-xl sm:text-sm transition-all duration-300
                ${format === f
                  ? "bg-primary text-primary-foreground shadow-2xl scale-[1.02] ring-4 ring-primary/20"
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
            * Ao otimizar, o arquivo será processado para o formato selecionado acima.
          </p>
        )}
      </div>

      {/* 3. Qualidade / Compressão */}
      {operation !== "Converter" && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
          <label className="text-xl sm:text-sm font-black text-foreground uppercase tracking-tighter opacity-100">
            Nível de Qualidade
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 sm:gap-2">
            {compressionLevels.map((level) => (
              <button
                key={level.value}
                onClick={() => setCompression(level.value)}
                className={`
                  flex flex-col items-center py-3 sm:py-2 px-1 rounded-2xl sm:rounded-lg font-black text-base sm:text-sm transition-all duration-300
                  ${compression === level.value
                    ? "bg-primary text-primary-foreground shadow-2xl scale-[1.02] ring-4 ring-primary/20"
                    : "bg-white/5 text-foreground/70 hover:bg-white/10"
                  }
                `}
              >
                <span>{level.label}</span>
                <span className={`text-[10px] sm:text-[9px] font-bold mt-0.5 ${compression === level.value ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                  {level.desc}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 4. Reduzir Tamanho (Dimensões) */}
      <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
        <label className="text-xl sm:text-sm font-black text-foreground uppercase tracking-tighter opacity-100">
          Reduzir Tamanho (Dimensões)
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-2">
          {resizeLevels.map((level) => (
            <button
              key={level.value}
              onClick={() => setResizeScale(level.value)}
              className={`
                flex flex-col items-center py-3 sm:py-2 px-1 rounded-2xl sm:rounded-lg font-black text-base sm:text-sm transition-all duration-300
                ${resizeScale === level.value
                  ? "bg-primary text-primary-foreground shadow-2xl scale-[1.02] ring-4 ring-primary/20"
                  : "bg-white/5 text-foreground/70 hover:bg-white/10"
                }
              `}
            >
              <span>{level.label}</span>
              <span className={`text-[10px] sm:text-[9px] font-bold mt-0.5 ${resizeScale === level.value ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
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
