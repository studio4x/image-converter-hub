"use client";

import React from "react";
import { Upload } from "lucide-react";

interface UploadAreaProps {
  onFilesSelected: (files: FileList | File[]) => void;
  isDragging: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  maxFiles: number;
}

const UploadArea = ({ 
  onFilesSelected, 
  isDragging, 
  onDragOver, 
  onDragLeave, 
  onDrop,
  maxFiles 
}: UploadAreaProps) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={() => fileInputRef.current?.click()}
      className={`
        relative border-2 border-dashed rounded-xl p-6 sm:p-8 text-center cursor-pointer
        transition-all duration-300
        ${isDragging 
          ? "border-primary bg-primary/10 scale-[1.01]" 
          : "border-border hover:border-primary/50 hover:bg-primary/5"
        }
      `}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={(e) => e.target.files && onFilesSelected(e.target.files)}
        className="hidden"
      />
      <Upload className={`w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-6 transition-colors ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
      <p className="text-lg sm:text-xl text-foreground font-bold mb-2">
        Arraste imagens aqui ou clique para selecionar
      </p>
      <p className="text-sm sm:text-base text-muted-foreground font-medium">
        JPG, PNG ou WEBP (máximo {maxFiles} arquivos)
      </p>
    </div>
  );
};

export default UploadArea;