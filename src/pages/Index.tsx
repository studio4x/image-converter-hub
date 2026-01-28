import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ImageIcon, Upload, X, Download, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { toast } from "@/hooks/use-toast";

type Format = "JPG" | "PNG" | "WEBP";
type Status = "idle" | "loading" | "success" | "error";

const WEBHOOK_URL = "https://webhook.studio4x.com.br/webhook/converter-imagem";
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
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    const totalFiles = files.length + validFiles.length;
    if (totalFiles > MAX_FILES) {
      toast({
        title: "Limite excedido",
        description: `Máximo de ${MAX_FILES} imagens permitidas.`,
        variant: "destructive",
      });
      return;
    }

    // Create previews
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleConvert = async () => {
    if (files.length === 0) {
      toast({
        title: "Nenhuma imagem",
        description: "Selecione pelo menos uma imagem para converter.",
        variant: "destructive",
      });
      return;
    }

    setStatus("loading");

    try {
      const formData = new FormData();
      formData.append("format", format);
      formData.append("compression", compression.toString());
      files.forEach(file => formData.append("files", file));

      const response = await fetch(WEBHOOK_URL, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Erro na conversão: ${response.status}`);
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = files.length > 1 ? "imagens_convertidas.zip" : `imagem_convertida.${format.toLowerCase()}`;
      
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?(.+)"?/);
        if (match) filename = match[1];
      }

      setResultBlob(blob);
      setResultFilename(filename);
      setStatus("success");

      toast({
        title: "Conversão concluída!",
        description: "Clique em 'Baixar' para salvar o resultado.",
      });
    } catch (error) {
      console.error("Erro na conversão:", error);
      setStatus("error");
      toast({
        title: "Erro na conversão",
        description: error instanceof Error ? error.message : "Tente novamente mais tarde.",
        variant: "destructive",
      });
    }
  };

  const handleDownload = () => {
    if (!resultBlob) return;

    const url = URL.createObjectURL(resultBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = resultFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const resetConverter = () => {
    setFiles([]);
    setPreviews([]);
    setStatus("idle");
    setResultBlob(null);
    setResultFilename("");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-radial from-accent/20 via-transparent to-transparent" />
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-2xl relative z-10"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent mb-6 shadow-glow"
          >
            <ImageIcon className="w-10 h-10 text-primary-foreground" />
          </motion.div>
          <h1 className="text-4xl font-bold text-foreground mb-3 tracking-tight">
            Conversor de Imagens
          </h1>
          <p className="text-muted-foreground text-lg">
            Converta suas imagens para diferentes formatos em segundos
          </p>
        </div>

        {/* Main Card */}
        <Card className="p-6 bg-card/80 backdrop-blur-xl border-border/50 shadow-2xl space-y-6">
          {/* Upload Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
              transition-all duration-300
              ${isDragging 
                ? "border-primary bg-primary/10" 
                : "border-border hover:border-primary/50 hover:bg-primary/5"
              }
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
              className="hidden"
            />
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-foreground font-medium mb-1">
              Arraste imagens aqui ou clique para selecionar
            </p>
            <p className="text-sm text-muted-foreground">
              JPG, PNG ou WEBP (máximo {MAX_FILES} arquivos)
            </p>
          </div>

          {/* Image Previews */}
          <AnimatePresence>
            {previews.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-4 gap-3"
              >
                {previews.map((preview, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="relative aspect-square rounded-lg overflow-hidden bg-secondary group"
                  >
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(index);
                      }}
                      className="absolute top-1 right-1 p-1 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Format Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">Formato de saída</label>
            <div className="flex gap-3">
              {(["JPG", "PNG", "WEBP"] as Format[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={`
                    flex-1 py-3 rounded-lg font-semibold text-sm transition-all
                    ${format === f
                      ? "bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-glow"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    }
                  `}
                >
                  .{f.toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Compression Slider */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-foreground">Compressão</label>
              <span className="text-sm font-bold text-primary">{compression}%</span>
            </div>
            <Slider
              value={[compression]}
              onValueChange={([value]) => setCompression(value)}
              min={0}
              max={100}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Menor arquivo</span>
              <span>Maior qualidade</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {status === "success" && resultBlob ? (
              <div className="space-y-3">
                <Button
                  onClick={handleDownload}
                  size="lg"
                  className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Baixar {files.length > 1 ? "ZIP" : "Imagem"}
                </Button>
                <Button
                  onClick={resetConverter}
                  variant="outline"
                  size="lg"
                  className="w-full"
                >
                  Converter mais imagens
                </Button>
              </div>
            ) : (
              <Button
                onClick={handleConvert}
                disabled={files.length === 0 || status === "loading"}
                size="lg"
                className="w-full h-14 text-lg font-semibold"
              >
                {status === "loading" ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Convertendo...
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-5 h-5 mr-2" />
                    Converter {files.length > 0 ? `(${files.length})` : ""}
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Status Messages */}
          <AnimatePresence>
            {status === "success" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/30"
              >
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-sm text-green-500 font-medium">
                  Conversão concluída com sucesso!
                </span>
              </motion.div>
            )}

            {status === "error" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30"
              >
                <AlertCircle className="w-5 h-5 text-destructive" />
                <span className="text-sm text-destructive font-medium">
                  Erro na conversão. Verifique se o servidor está ativo.
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>

        {/* Footer info */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          Powered by n8n automation
        </p>
      </motion.div>
    </div>
  );
};

export default Index;
