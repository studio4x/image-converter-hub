"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export type Operation = "Otimizar" | "Converter" | "Otimizar e Converter";
export type CompressionLevel = "10" | "30" | "60" | "80" | "100";
type Format = "JPG" | "PNG" | "WEBP";

interface ConversionSettingsProps {
  operation: Operation;
  setOperation: (op: Operation) => void;
  format: Format;
  setFormat: (format: Format) => void;
  compression: CompressionLevel;
  setCompression: (value: CompressionLevel) => void;
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
  setCompression 
}: ConversionSettingsProps) => {
  const formats: Format[] = ["JPG", "PNG", "WEBP"];

  return (
    <div className="space-y-8 pt-2">
      {/* 1. Escolha da Operação */}
      <div className="space-y-4">
        <label className="text-sm font-semibold text-foreground uppercase tracking-wider opacity-70">
          O que deseja fazer?
        </label>
        <RadioGroup 
          value={operation} 
          onValueChange={(value) => setOperation(value as Operation)}
          className="grid grid-cols-1 gap-3"
        >
          <div className={`flex items-center space-x-3 space-y-0 rounded-lg border p-3 transition-all ${operation === "Otimizar" ? "bg-primary/5 border-primary ring-1 ring-primary/20" : "bg-secondary/50 border-transparent hover:bg-secondary/80"}`}>
            <RadioGroupItem value="Otimizar" id="op1" />
            <Label htmlFor="op1" className="flex-1 cursor-pointer font-medium">Otimizar (Reduzir peso)</Label>
          </div>
          <div className={`flex items-center space-x-3 space-y-0 rounded-lg border p-3 transition-all ${operation === "Converter" ? "bg-primary/5 border-primary ring-1 ring-primary/20" : "bg-secondary/50 border-transparent hover:bg-secondary/80"}`}>
            <RadioGroupItem value="Converter" id="op2" />
            <Label htmlFor="op2" className="flex-1 cursor-pointer font-medium">Converter formato</Label>
          </div>
          <div className={`flex items-center space-x-3 space-y-0 rounded-lg border p-3 transition-all ${operation === "Otimizar e Converter" ? "bg-primary/5 border-primary ring-1 ring-primary/20" : "bg-secondary/50 border-transparent hover:bg-secondary/80"}`}>
            <RadioGroupItem value="Otimizar e Converter" id="op3" />
            <Label htmlFor="op3" className="flex-1 cursor-pointer font-medium">Otimizar e Converter</Label>
          </div>
        </RadioGroup>
      </div>

      {/* 2. Escolha do Formato de Saída */}
      <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
        <label className="text-sm font-semibold text-foreground uppercase tracking-wider opacity-70">
          Formato de saída desejado
        </label>
        <div className="flex gap-2">
          {formats.map((f) => (
            <button
              key={f}
              onClick={() => setFormat(f)}
              className={`
                flex-1 py-3 rounded-xl font-bold text-sm transition-all
                ${format === f
                  ? "bg-primary text-primary-foreground shadow-glow scale-[1.02]"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }
              `}
            >
              .{f.toLowerCase()}
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
          <label className="text-sm font-semibold text-foreground uppercase tracking-wider opacity-70">
            Qualidade final
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {compressionLevels.map((level) => (
              <button
                key={level.value}
                onClick={() => setCompression(level.value)}
                className={`
                  flex flex-col items-center py-2 sm:py-3 px-1 rounded-xl font-bold text-xs sm:text-sm transition-all
                  ${compression === level.value
                    ? "bg-primary text-primary-foreground shadow-glow scale-[1.02]"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }
                `}
              >
                <span>{level.label}</span>
                <span className={`text-[9px] sm:text-[10px] font-medium mt-0.5 ${compression === level.value ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                  {level.desc}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ConversionSettings;
