"use client";

import React from "react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export type Operation = "Otimizar" | "Converter" | "Otimizar e Converter";
type Format = "JPG" | "PNG" | "WEBP";

interface ConversionSettingsProps {
  operation: Operation;
  setOperation: (op: Operation) => void;
  format: Format;
  setFormat: (format: Format) => void;
  compression: number;
  setCompression: (value: number) => void;
}

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
      {/* Seletor de Operação conforme o Switch do n8n */}
      <div className="space-y-4">
        <label className="text-sm font-semibold text-foreground uppercase tracking-wider opacity-70">
          O que deseja fazer?
        </label>
        <RadioGroup 
          value={operation} 
          onValueChange={(value) => setOperation(value as Operation)}
          className="grid grid-cols-1 gap-3"
        >
          <div className={`flex items-center space-x-3 space-y-0 rounded-lg border p-3 transition-colors ${operation === "Otimizar" ? "bg-primary/5 border-primary" : "bg-secondary/50 border-transparent"}`}>
            <RadioGroupItem value="Otimizar" id="op1" />
            <Label htmlFor="op1" className="flex-1 cursor-pointer font-medium">Otimizar (Reduzir peso)</Label>
          </div>
          <div className={`flex items-center space-x-3 space-y-0 rounded-lg border p-3 transition-colors ${operation === "Converter" ? "bg-primary/5 border-primary" : "bg-secondary/50 border-transparent"}`}>
            <RadioGroupItem value="Converter" id="op2" />
            <Label htmlFor="op2" className="flex-1 cursor-pointer font-medium">Converter formato</Label>
          </div>
          <div className={`flex items-center space-x-3 space-y-0 rounded-lg border p-3 transition-colors ${operation === "Otimizar e Converter" ? "bg-primary/5 border-primary" : "bg-secondary/50 border-transparent"}`}>
            <RadioGroupItem value="Otimizar e Converter" id="op3" />
            <Label htmlFor="op3" className="flex-1 cursor-pointer font-medium">Otimizar e Converter</Label>
          </div>
        </RadioGroup>
      </div>

      {/* Formato (esconde se for apenas otimizar) */}
      {operation !== "Otimizar" && (
        <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
          <label className="text-sm font-medium text-foreground">Formato de saída</label>
          <div className="flex gap-2">
            {formats.map((f) => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                className={`
                  flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all
                  ${format === f
                    ? "bg-primary text-primary-foreground shadow-glow"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }
                `}
              >
                .{f.toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Compressão (esconde se for apenas converter sem otimizar, caso faça sentido no seu fluxo) */}
      {operation !== "Converter" && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-foreground">Qualidade / Compressão</label>
            <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-1 rounded">
              {compression}%
            </span>
          </div>
          <Slider
            value={[compression]}
            onValueChange={([value]) => setCompression(value)}
            min={1}
            max={100}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-[10px] uppercase tracking-wider font-bold text-muted-foreground/60">
            <span>Menor arquivo</span>
            <span>Maior qualidade</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConversionSettings;