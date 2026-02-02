import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ImageIcon, Download, Loader2, CheckCircle, AlertCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { APP_VERSION } from "@/lib/version";

import UploadArea from "@/components/converter/UploadArea";
import PreviewGrid from "@/components/converter/PreviewGrid";
import ConversionSettings from "@/components/converter/ConversionSettings";

type Format = "JPG" | "PNG" | "WEBP";
type Status = "idle" | "loading" | "success" | "error";

const WEBHOOK_URL = "https://n8n.studio4x.com.br/webhook/conversor-imagens-lp";
const MAX_FILES = 10;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const Index = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [format, setFormat] = useState<Format>("JPG");
  const [compression, setCompression] = useState(80);
  const [status, setStatus] = useState<Status>("idle");
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultFilename, setResultFilename] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const [lastError, setLastError] = useState<string>("");

  const handleFiles = useCallback((newFiles: FileList | File[]) => {
    const validFiles = Array.from(newFiles).filter(file => 
      ACCEPTED_TYPES.includes(file.type)
    );

    if (validFiles.length === 0) {
      toast({
        title: "Formato inválido",
        description: "Apenas imagens JPG, PNG e WEBP são aceitas.",
        variant: "destructive",
      });
      return;
    }

    if (files.length + validFiles.length > MAX_FILES) {
      toast({
        title: "Limite excedido",
        description: `Máximo de ${MAX_FILES} imagens permitidas.`,
        variant: "destructive",
      });
      return;
    }

    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviews(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });

    setFiles(prev => [...prev, ...validFiles]);
    setStatus("idle");
    setResultBlob(null);
  }, [files.length]);

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
    setStatus("idle");
    setResultBlob(null);
  };

  const clearAll = () => {
    setFiles([]);
    setPreviews([]);
    setStatus("idle");
    setResultBlob(null);
  };

  const handleConvert = async () => {
    if (files.length === 0) return;

    setStatus("loading");
    setLastError("");
    
    // Log para debug no console (F12)
    const lowerFormat = format.toLowerCase();
    console.log("Enviando solicitação para o n8n...");
    console.log("Formato:", lowerFormat);
    console.log("Compressão:", compression);
    console.log("Quantidade de arquivos:", files.length);

    try {
      const formData = new FormData();
      // Enviando em minúsculo para facilitar a regra no Switch do n8n
      formData.append('format', lowerFormat);
      formData.append('compression', compression.toString());
      files.forEach(file => formData.append('files', file));

      const response = await fetch(WEBHOOK_URL, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Erro desconhecido");
        throw new Error(`Status ${response.status}: ${errorText}`);
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = files.length > 1 ? "imagens_convertidas.zip" : `imagem_convertida.${lowerFormat}`;
      
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?(.+)"?/);
        if (match) filename = match[1];
      }

      setResultBlob(blob);
      setResultFilename(filename);
      setStatus("success");

      toast({
        title: "Sucesso!",
        description: "Imagens convertidas com sucesso.",
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

    } catch (error: any) {
      console.error("Erro detalhado na conversão:", error);
      setStatus("error");
      setLastError(error.message);
      
      toast({
        title: "Erro na conversão",
        description: "A requisição chegou ao n8n, mas houve um erro no processamento.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-radial from-primary/5 via-transparent to-transparent" />
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl relative z-10"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-4 shadow-glow"
          >
            <ImageIcon className="w-8 h-8 text-primary-foreground" />
          </motion.div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">ImageConverter</h1>
          <p className="text-muted-foreground">Converta e comprima imagens instantaneamente</p>
        </div>

        <Card className="p-6 bg-card/50 backdrop-blur-xl border-border/50 shadow-2xl space-y-6">
          <UploadArea 
            onFilesSelected={handleFiles}
            isDragging={isDragging}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files); }}
            maxFiles={MAX_FILES}
          />

          <PreviewGrid 
            previews={previews} 
            onRemove={removeFile} 
            onClearAll={clearAll} 
          />

          {files.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="space-y-6"
            >
              <ConversionSettings 
                format={format} 
                setFormat={setFormat} 
                compression={compression} 
                setCompression={setCompression} 
              />

              <div className="pt-2">
                {status === "success" && resultBlob ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Button
                      onClick={() => {
                        const url = URL.createObjectURL(resultBlob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = resultFilename;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      size="lg"
                      className="w-full h-12 bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Download className="w-5 h-5 mr-2" />
                      Baixar novamente
                    </Button>
                    <Button onClick={clearAll} variant="outline" size="lg" className="w-full h-12">
                      Novo upload
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={handleConvert}
                    disabled={status === "loading"}
                    size="lg"
                    className="w-full h-14 text-lg font-bold shadow-glow"
                  >
                    {status === "loading" ? (
                      <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Processando...</>
                    ) : (
                      <>Converter {files.length} {files.length === 1 ? 'imagem' : 'imagens'}</>
                    )}
                  </Button>
                )}
              </div>
            </motion.div>
          )}

          <AnimatePresence>
            {status === "success" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-500"
              >
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Conversão finalizada com sucesso!</span>
              </motion.div>
            )}

            {status === "error" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-4 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive"
              >
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">Erro no processamento do n8n.</span>
                </div>
                
                <div className="space-y-3 bg-background/50 p-3 rounded-lg border border-destructive/10">
                  <p className="text-xs font-semibold uppercase opacity-70 flex items-center gap-1">
                    <Info className="w-3 h-3" /> Verificações no n8n:
                  </p>
                  <ul className="text-[11px] list-disc pl-4 space-y-1">
                    <li>O nó <b>Switch</b> está configurado para ler de <code>body.format</code>?</li>
                    <li>As condições do Switch batem com <b>"jpg"</b>, <b>"png"</b> ou <b>"webp"</b>? (agora enviamos minúsculo)</li>
                    <li>O Webhook está configurado para responder com o <b>binário final</b>?</li>
                  </ul>
                  <div className="pt-2 border-t border-destructive/10">
                    <p className="text-[10px] font-mono break-all opacity-70">
                      Log: {lastError}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>

        <footer className="mt-8 text-center space-y-1">
          <p className="text-xs text-muted-foreground/60 uppercase tracking-widest font-bold">
            Powered by n8n & Studio4x
          </p>
          <p className="text-[10px] text-muted-foreground/40 font-mono">
            v{APP_VERSION}
          </p>
        </footer>
      </motion.div>
    </div>
  );
};

export default Index;