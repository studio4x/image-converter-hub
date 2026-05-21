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
        relative border-2 border-dashed rounded-[2rem] p-10 sm:p-14 text-center cursor-pointer
        transition-all duration-500 group
        ${isDragging 
          ? "border-primary bg-primary/10 scale-[1.02] shadow-2xl" 
          : "border-white/10 bg-white/5 hover:border-primary/40 hover:bg-white/10"
        }
      `}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        multiple
        onChange={(e) => e.target.files && onFilesSelected(e.target.files)}
        className="hidden"
      />
      <div className="relative mb-6 sm:mb-8">
        <Upload className={`w-16 h-16 sm:w-20 sm:h-20 mx-auto transition-all duration-500 ${isDragging ? "text-primary scale-110" : "text-muted-foreground group-hover:text-primary/70"}`} />
        <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <p className="text-xl sm:text-2xl text-foreground font-black mb-2 sm:mb-3 tracking-tighter">
        Adicionar Imagens
      </p>
      <p className="text-sm sm:text-base text-muted-foreground font-bold opacity-70">
        Toque para selecionar ou arraste arquivos
      </p>
    </div>
  );
};

export default UploadArea;
