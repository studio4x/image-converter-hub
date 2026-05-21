import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { APP_VERSION } from "@/lib/version";

import UploadArea from "@/components/converter/UploadArea";
import PreviewGrid from "@/components/converter/PreviewGrid";
import ConversionSettings from "@/components/converter/ConversionSettings";
import {
  processImage,
  Format,
  Operation,
  CompressionLevel,
  ResizeScale,
  Status,
  ACCEPTED_TYPES,
  MAX_FILES,
} from "@/lib/imageProcessor";
import JSZip from "jszip";

const Index = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [operation, setOperation] = useState<Operation>("Otimizar e Converter");
  const [format, setFormat] = useState<Format>("JPG");
  const [compression, setCompression] = useState<CompressionLevel>("80");
  const [resizeScale, setResizeScale] = useState<ResizeScale>("100");
  const [activeImageDimensions, setActiveImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultFilename, setResultFilename] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const [lastError, setLastError] = useState<string>("");
  const [processedCount, setProcessedCount] = useState(0);

  useEffect(() => {
    if (files.length > 0) {
      const file = files[0];
      const img = new Image();
      img.onload = () => {
        setActiveImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.src = URL.createObjectURL(file);
      return () => {
        URL.revokeObjectURL(img.src);
      };
    }

    setActiveImageDimensions(null);
  }, [files]);

  const handleFiles = useCallback(
    (newFiles: FileList | File[]) => {
      const validFiles = Array.from(newFiles).filter((file) => ACCEPTED_TYPES.includes(file.type));

      if (validFiles.length === 0) {
        toast({
          title: "Formato invalido",
          description: "Apenas imagens JPG, PNG, WEBP e AVIF sao aceitas.",
          variant: "destructive",
        });
        return;
      }

      if (files.length + validFiles.length > MAX_FILES) {
        toast({
          title: "Limite excedido",
          description: `Maximo de ${MAX_FILES} imagens permitidas.`,
          variant: "destructive",
        });
        return;
      }

      validFiles.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreviews((prev) => [...prev, e.target?.result as string]);
        };
        reader.readAsDataURL(file);
      });

      setFiles((prev) => [...prev, ...validFiles]);
      setStatus("idle");
      setResultBlob(null);
      setProcessedCount(0);
    },
    [files.length]
  );

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
    setStatus("idle");
    setResultBlob(null);
    setProcessedCount(0);
  };

  const clearAll = () => {
    setFiles([]);
    setPreviews([]);
    setStatus("idle");
    setResultBlob(null);
    setProcessedCount(0);
  };

  const handleConvert = async () => {
    if (files.length === 0) return;

    setStatus("loading");
    setLastError("");
    setProcessedCount(0);

    try {
      const qualityNum = parseInt(compression, 10);

      if (files.length === 1) {
        const file = files[0];
        const blob = await processImage(file, format, qualityNum, operation, undefined, resizeScale);

        const originalName = file.name;
        const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf(".")) || originalName;
        const filename = `${nameWithoutExt}_convertida.${format.toLowerCase()}`;

        setResultBlob(blob);
        setResultFilename(filename);
        setProcessedCount(1);

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const zip = new JSZip();
        const failedFiles: string[] = [];

        for (const [index, file] of files.entries()) {
          try {
            const blob = await processImage(file, format, qualityNum, operation, undefined, resizeScale);
            const originalName = file.name;
            const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf(".")) || originalName;
            zip.file(`${nameWithoutExt}_convertida.${format.toLowerCase()}`, blob);
          } catch (fileError) {
            console.error(`Erro ao processar ${file.name}:`, fileError);
            failedFiles.push(file.name);
          } finally {
            setProcessedCount(index + 1);
            await new Promise((resolve) => setTimeout(resolve, 0));
          }
        }

        if (Object.keys(zip.files).length === 0) {
          throw new Error("Nenhuma imagem foi processada com sucesso.");
        }

        if (failedFiles.length > 0) {
          setLastError(`Falha em ${failedFiles.length} arquivo(s): ${failedFiles.join(", ")}`);
          toast({
            title: "Processamento parcial",
            description: `${failedFiles.length} arquivo(s) falharam e foram ignorados no ZIP.`,
            variant: "destructive",
          });
        }

        const zipBlob = await zip.generateAsync({ type: "blob" });
        const filename = "imagens_convertidas_studio4x.zip";

        setResultBlob(zipBlob);
        setResultFilename(filename);

        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      }

      setStatus("success");
      toast({
        title: "Sucesso!",
        description: "Processamento concluido com sucesso.",
      });
    } catch (error: any) {
      console.error("Erro na conversao:", error);
      setStatus("error");
      setLastError(error.message);

      toast({
        title: "Erro no processamento",
        description: "Houve um problema ao processar as imagens localmente.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-start sm:justify-center p-0 sm:p-4 relative overflow-x-hidden">
      <div className="fixed inset-0 bg-gradient-to-b from-primary/10 via-background to-background pointer-events-none" />
      <div className="fixed -top-24 -left-24 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-50 pointer-events-none" />
      <div className="fixed -bottom-24 -right-24 w-96 h-96 bg-accent/20 rounded-full blur-3xl opacity-50 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[1400px] relative z-10 py-10 sm:py-16 px-4 sm:px-8"
      >
        <div className="text-center mt-10 sm:mt-14 mb-12 sm:mb-20">
          <motion.img
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            src="/logo.svg"
            alt="Studio 4X Logo"
            className="w-24 h-24 sm:w-28 sm:h-28 mx-auto mb-8 sm:mb-10 object-contain"
          />
          <h1 className="text-5xl sm:text-7xl font-black tracking-tighter mb-4 sm:mb-6 bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/60 leading-none">
            Conversor e Otimizador de Imagens
          </h1>
          <p className="text-lg sm:text-2xl text-muted-foreground font-bold max-w-[280px] sm:max-w-4xl mx-auto leading-tight opacity-90">
            Otimizacao e conversao de alta performance
          </p>
        </div>

        <Card className="p-6 sm:p-10 bg-card/40 backdrop-blur-3xl border-0 sm:border border-white/10 shadow-none sm:shadow-2xl space-y-8 sm:space-y-10 rounded-none sm:rounded-[3rem]">
          <UploadArea
            onFilesSelected={handleFiles}
            isDragging={isDragging}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setIsDragging(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              handleFiles(e.dataTransfer.files);
            }}
            maxFiles={MAX_FILES}
          />

          <PreviewGrid previews={previews} onRemove={removeFile} onClearAll={clearAll} />

          {files.length > 0 && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-6">
              <ConversionSettings
                operation={operation}
                setOperation={setOperation}
                format={format}
                setFormat={setFormat}
                compression={compression}
                setCompression={setCompression}
                resizeScale={resizeScale}
                setResizeScale={setResizeScale}
                originalWidth={activeImageDimensions?.width}
                originalHeight={activeImageDimensions?.height}
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
                      className="w-full h-20 sm:h-14 text-xl sm:text-xl bg-green-600 hover:bg-green-700 text-white font-black rounded-2xl"
                    >
                      <Download className="w-6 h-6 mr-3" />
                      Baixar Novamente
                    </Button>
                    <Button
                      onClick={clearAll}
                      variant="outline"
                      size="lg"
                      className="w-full h-20 sm:h-14 text-xl sm:text-xl font-black rounded-2xl border-2"
                    >
                      Novo Upload
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={handleConvert}
                    disabled={status === "loading"}
                    size="lg"
                    className="w-full h-20 sm:h-16 text-xl sm:text-2xl font-black shadow-2xl rounded-2xl sm:rounded-xl transition-all active:scale-95"
                  >
                    {status === "loading" ? (
                      <>
                        <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                        Processando... ({processedCount}/{files.length})
                      </>
                    ) : (
                      <>
                        Processar {files.length} {files.length === 1 ? "Imagem" : "Imagens"}
                      </>
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
                className="flex items-center gap-4 sm:gap-5 p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] bg-green-500/10 border-2 border-green-500/20 text-green-500"
              >
                <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 shrink-0" />
                <span className="text-lg sm:text-2xl font-black leading-tight">Processamento finalizado com sucesso!</span>
              </motion.div>
            )}

            {status === "error" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-6 p-8 rounded-[2rem] bg-destructive/10 border-2 border-destructive/20 text-destructive"
              >
                <div className="flex items-center gap-5">
                  <AlertCircle className="w-10 h-10" />
                  <span className="text-xl sm:text-3xl font-black leading-tight">Erro no processamento.</span>
                </div>
                <p className="text-lg sm:text-2xl font-bold opacity-80 break-all leading-relaxed">{lastError}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>

        <footer className="mt-8 text-center space-y-1">
          <a
            href="https://studio4x.com.br"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-muted-foreground/60 uppercase tracking-widest font-bold hover:text-primary transition-colors"
          >
            Powered by 4X
          </a>
          <p className="text-[10px] text-muted-foreground/40 font-mono">v{APP_VERSION}</p>
        </footer>
      </motion.div>
    </div>
  );
};

export default Index;
