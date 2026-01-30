"use client";

import React from "react";
import { Slider } from "@/components/ui/slider";

type Format = "JPG" | "PNG" | "WEBP";

interface ConversionSettingsProps {
  format: Format;
  setFormat: (format: Format) => void;
  compression: number;
  setCompression: (value: number) => void;
}

const ConversionSettings = ({ format, setFormat, compression, setCompression }: ConversionSettingsProps) => {
  const formats: Format[] = ["JPG", "PNG", "WEBP"];

  return (
    <div className="space-y-6 pt-2">
      <div className="space-y-3">
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

      <div className="space-y-4">
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
    </div>
  );
};

export default ConversionSettings;