"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PreviewGridProps {
  previews: string[];
  onRemove: (index: number) => void;
  onClearAll: () => void;
}

const PreviewGrid = ({ previews, onRemove, onClearAll }: PreviewGridProps) => {
  if (previews.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-muted-foreground">
          Imagens selecionadas ({previews.length})
        </h3>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={(e) => {
            e.stopPropagation();
            onClearAll();
          }}
          className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 px-2"
        >
          <Trash2 className="w-4 h-4 mr-1" />
          Limpar tudo
        </Button>
      </div>
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
      >
        <AnimatePresence mode="popLayout">
          {previews.map((preview, index) => (
            <motion.div
              key={`${preview}-${index}`}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="relative aspect-square rounded-lg overflow-hidden bg-secondary group shadow-sm"
            >
              <img
                src={preview}
                alt={`Preview ${index + 1}`}
                className="w-full h-full object-cover transition-transform group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(index);
                  }}
                  className="p-2 rounded-full bg-destructive text-destructive-foreground hover:scale-110 transition-transform"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default PreviewGrid;