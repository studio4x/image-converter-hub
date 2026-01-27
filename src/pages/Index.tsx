import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { ImageIcon, ArrowRight, Loader2, CheckCircle2, Sparkles, Upload, X, FileImage } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { toast } from "@/hooks/use-toast";

const formats = [
  { id: "JPG", label: "JPG", description: "Formato universal, ótima compressão" },
  { id: "PNG", label: "PNG", description: "Alta qualidade, suporta transparência" },
  { id: "WEBP", label: "WEBP", description: "Moderno, menor tamanho" },
];

const Index = () => {
  const [selectedFormats, setSelectedFormats] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [compressionLevel, setCompressionLevel] = useState<number>(80);
  const [isConverting, setIsConverting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleFormatToggle = (format: string) => {
    setSelectedFormats((prev) =>
      prev.includes(format)
        ? prev.filter((f) => f !== format)
        : [...prev, format]
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      (file) => file.type.startsWith("image/")
    );
    if (droppedFiles.length > 0) {
      setFiles((prev) => [...prev, ...droppedFiles]);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConvert = async () => {
    if (selectedFormats.length === 0) {
      toast({
        title: "Selecione ao menos um formato",
        description: "Escolha para qual formato deseja converter suas imagens.",
        variant: "destructive",
      });
      return;
    }

    if (files.length === 0) {
      toast({
        title: "Selecione ao menos uma imagem",
        description: "Faça upload das imagens que deseja converter.",
        variant: "destructive",
      });
      return;
    }

    setIsConverting(true);

    try {
      const formData = new FormData();
      formData.append("Para qual formato de imagem você deseja converter?", JSON.stringify(selectedFormats));
      formData.append("De 0 a 100, qual o nível de compressão você deseja usar para reduzir as imagens?", compressionLevel.toString());
      
      files.forEach((file) => {
        formData.append("Suba aqui as imagens a serem convertidas", file);
      });

      const response = await fetch("https://n8n.agenciabzs.com.br/form/266e922f-b68d-451a-89ec-4d8e066db4ff", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        setIsComplete(true);
        toast({
          title: "Conversão iniciada!",
          description: "Suas imagens estão sendo processadas.",
        });
      } else {
        throw new Error("Erro ao iniciar conversão");
      }
    } catch (error) {
      toast({
        title: "Erro na conversão",
        description: "Não foi possível iniciar o processo. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsConverting(false);
    }
  };

  const resetForm = () => {
    setSelectedFormats([]);
    setFiles([]);
    setCompressionLevel(80);
    setIsComplete(false);
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
        className="w-full max-w-xl relative z-10"
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
        <Card className="p-8 bg-card/80 backdrop-blur-xl border-border/50 shadow-2xl">
          {isComplete ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/20 mb-6">
                <CheckCircle2 className="w-8 h-8 text-success" />
              </div>
              <h2 className="text-2xl font-semibold text-foreground mb-2">
                Conversão Iniciada!
              </h2>
              <p className="text-muted-foreground mb-6">
                Suas imagens estão sendo processadas. Você receberá as imagens convertidas em breve.
              </p>
              <Button onClick={resetForm} variant="outline" size="lg">
                Converter mais imagens
              </Button>
            </motion.div>
          ) : (
            <>
              {/* File Upload Area */}
              <div className="mb-6">
                <label className="text-sm font-medium text-foreground mb-4 block">
                  Selecione as imagens para converter
                </label>
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
                    isDragging
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                  }`}
                >
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="w-10 h-10 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-foreground font-medium mb-1">
                      Arraste suas imagens aqui
                    </p>
                    <p className="text-sm text-muted-foreground">
                      ou clique para selecionar (JPG, PNG, WEBP)
                    </p>
                  </label>
                </div>

                {/* File List */}
                {files.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-4 space-y-2"
                  >
                    {files.map((file, index) => (
                      <motion.div
                        key={`${file.name}-${index}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border"
                      >
                        <FileImage className="w-5 h-5 text-primary" />
                        <span className="flex-1 text-sm text-foreground truncate">
                          {file.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {(file.size / 1024).toFixed(1)} KB
                        </span>
                        <button
                          onClick={() => removeFile(index)}
                          className="p-1 hover:bg-destructive/20 rounded-md transition-colors"
                        >
                          <X className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                        </button>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </div>

              {/* Format Selection */}
              <div className="mb-6">
                <label className="text-sm font-medium text-foreground mb-4 block">
                  Para qual formato deseja converter?
                </label>
                <div className="space-y-3">
                  {formats.map((format, index) => (
                    <motion.div
                      key={format.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                    >
                      <label
                        className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                          selectedFormats.includes(format.id)
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-border hover:border-primary/50 hover:bg-muted/50"
                        }`}
                      >
                        <Checkbox
                          checked={selectedFormats.includes(format.id)}
                          onCheckedChange={() => handleFormatToggle(format.id)}
                          className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />
                        <div className="flex-1">
                          <span className="font-semibold text-foreground">
                            {format.label}
                          </span>
                          <p className="text-sm text-muted-foreground">
                            {format.description}
                          </p>
                        </div>
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                          <span className="text-xs font-bold text-primary">
                            .{format.id.toLowerCase()}
                          </span>
                        </div>
                      </label>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Compression Level */}
              <div className="mb-8">
                <label className="text-sm font-medium text-foreground mb-4 block">
                  Nível de compressão: <span className="text-primary font-bold">{compressionLevel}%</span>
                </label>
                <Slider
                  value={[compressionLevel]}
                  onValueChange={(value) => setCompressionLevel(value[0])}
                  max={100}
                  min={0}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <span>Menor tamanho</span>
                  <span>Maior qualidade</span>
                </div>
              </div>

              <Button
                onClick={handleConvert}
                disabled={isConverting || selectedFormats.length === 0 || files.length === 0}
                size="lg"
                className="w-full h-14 text-lg font-semibold group"
              >
                {isConverting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Converter {files.length > 0 ? `${files.length} imagen${files.length > 1 ? 's' : ''}` : 'Imagens'}
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </>
          )}
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
