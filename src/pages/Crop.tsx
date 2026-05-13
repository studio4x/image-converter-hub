import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Scissors, Download, Loader2, CheckCircle, AlertCircle, RefreshCw, Maximize2 } from "lucide-react";
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { APP_VERSION } from "@/lib/version";
import UploadArea from "@/components/converter/UploadArea";
import ConversionSettings from "@/components/converter/ConversionSettings";
import { 
  processImage, 
  Format, 
  Operation, 
  CompressionLevel, 
  Status, 
  ACCEPTED_TYPES,
  CropArea
} from "@/lib/imageProcessor";

const ASPECT_RATIOS = [
  { label: "Livre", value: undefined },
  { label: "1:1", value: 1 },
  { label: "4:3", value: 4 / 3 },
  { label: "16:9", value: 16 / 9 },
  { label: "9:16", value: 9 / 16 },
  { label: "3:2", value: 3 / 2 },
];

const CropPage = () => {
  const [imgSrc, setImgSrc] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [aspect, setAspect] = useState<number | undefined>(undefined);
  const [operation, setOperation] = useState<Operation>("Otimizar e Converter");
  const [format, setFormat] = useState<Format>("JPG");
  const [compression, setCompression] = useState<CompressionLevel>("80");
  const [status, setStatus] = useState<Status>("idle");
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultFilename, setResultFilename] = useState<string>("");
  const [lastError, setLastError] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  
  const imgRef = useRef<HTMLImageElement>(null);

  const onSelectFile = useCallback((files: FileList | File[]) => {
    const selectedFile = Array.from(files)[0];
    if (!selectedFile) return;

    if (!ACCEPTED_TYPES.includes(selectedFile.type)) {
      toast({
        title: "Formato inválido",
        description: "Apenas imagens JPG, PNG, WEBP e AVIF são aceitas.",
        variant: "destructive",
      });
      return;
    }

    setFile(selectedFile);
    setResultBlob(null);
    setStatus("idle");

    const reader = new FileReader();
    reader.addEventListener("load", () =>
      setImgSrc(reader.result?.toString() || "")
    );
    reader.readAsDataURL(selectedFile);
  }, []);

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const initialCrop = centerCrop(
      makeAspectCrop(
        {
          unit: "%",
          width: 90,
        },
        aspect || 1,
        width,
        height
      ),
      width,
      height
    );
    setCrop(initialCrop);
  };

  const handleAspectChange = (newAspect: number | undefined) => {
    setAspect(newAspect);
    if (imgRef.current && newAspect) {
      const { width, height } = imgRef.current;
      const newCrop = centerCrop(
        makeAspectCrop(
          {
            unit: "%",
            width: 90,
          },
          newAspect,
          width,
          height
        ),
        width,
        height
      );
      setCrop(newCrop);
    } else {
      setCrop(undefined);
    }
  };

  const handleProcess = async () => {
    if (!file || !completedCrop || !imgRef.current) return;

    setStatus("loading");
    setLastError("");

    try {
      const qualityNum = parseInt(compression);
      
      // Calcular proporção real vs exibida
      const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
      const scaleY = imgRef.current.naturalHeight / imgRef.current.height;

      const cropArea: CropArea = {
        x: completedCrop.x * scaleX,
        y: completedCrop.y * scaleY,
        width: completedCrop.width * scaleX,
        height: completedCrop.height * scaleY,
      };

      const blob = await processImage(file, format, qualityNum, operation, cropArea);
      
      const originalName = file.name;
      const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
      const filename = `${nameWithoutExt}_cropped.${format.toLowerCase()}`;
      
      setResultBlob(blob);
      setResultFilename(filename);
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      setStatus("success");
      toast({
        title: "Sucesso!",
        description: "Imagem recortada e processada com sucesso.",
      });
    } catch (error: any) {
      console.error("Erro no processamento:", error);
      setStatus("error");
      setLastError(error.message);
      toast({
        title: "Erro no processamento",
        description: "Houve um problema ao recortar a imagem.",
        variant: "destructive",
      });
    }
  };

  const clearAll = () => {
    setImgSrc("");
    setFile(null);
    setCrop(undefined);
    setCompletedCrop(undefined);
    setStatus("idle");
    setResultBlob(null);
  };

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-start p-0 sm:p-4 pt-24 sm:pt-32 relative overflow-x-hidden">
      <div className="fixed inset-0 bg-gradient-to-b from-primary/10 via-background to-background pointer-events-none" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[1400px] relative z-10 py-10 px-4 sm:px-8"
      >
        <div className="text-center mb-12 sm:mb-16">
          <h1 className="text-5xl sm:text-7xl font-black tracking-tighter mb-4 bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/60 leading-none">Recortar Imagem</h1>
          <p className="text-lg sm:text-2xl text-muted-foreground font-bold max-w-[280px] sm:max-w-4xl mx-auto leading-tight opacity-90">Ajuste o enquadramento perfeito com precisão</p>
        </div>

        <Card className="p-6 sm:p-10 bg-card/40 backdrop-blur-3xl border-0 sm:border border-white/10 shadow-none sm:shadow-2xl space-y-8 rounded-none sm:rounded-[3rem]">
          {!imgSrc ? (
            <UploadArea 
              onFilesSelected={onSelectFile}
              isDragging={isDragging}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
              onDrop={(e) => { e.preventDefault(); setIsDragging(false); onSelectFile(e.dataTransfer.files); }}
              maxFiles={1}
            />
          ) : (
            <div className="space-y-8">
              <div className="flex flex-col lg:flex-row gap-10">
                {/* Área de Crop */}
                <div className="flex-1 space-y-6">
                  <div className="flex items-center justify-between">
                    <label className="text-xl sm:text-sm font-black text-foreground uppercase tracking-tighter">Ajuste o Recorte</label>
                    <Button variant="ghost" size="sm" onClick={clearAll} className="font-bold text-muted-foreground hover:text-foreground">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Trocar Imagem
                    </Button>
                  </div>
                  
                  <div className="relative rounded-3xl overflow-hidden bg-black/20 border-2 border-white/5 flex items-center justify-center min-h-[300px] sm:min-h-[500px]">
                    <ReactCrop
                      crop={crop}
                      onChange={(c) => setCrop(c)}
                      onComplete={(c) => setCompletedCrop(c)}
                      aspect={aspect}
                      className="max-h-[70vh]"
                    >
                      <img
                        ref={imgRef}
                        alt="Crop me"
                        src={imgSrc}
                        onLoad={onImageLoad}
                        style={{ maxWidth: "100%", maxHeight: "70vh" }}
                      />
                    </ReactCrop>
                  </div>

                  <div className="space-y-4">
                    <label className="text-xl sm:text-sm font-black text-foreground uppercase tracking-tighter">Proporção</label>
                    <div className="flex flex-wrap gap-2">
                      {ASPECT_RATIOS.map((ratio) => (
                        <Button
                          key={ratio.label}
                          variant={aspect === ratio.value ? "default" : "outline"}
                          onClick={() => handleAspectChange(ratio.value)}
                          className="font-black rounded-xl"
                        >
                          {ratio.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Configurações */}
                <div className="w-full lg:w-[400px] space-y-8">
                  <ConversionSettings 
                    operation={operation}
                    setOperation={setOperation}
                    format={format} 
                    setFormat={setFormat} 
                    compression={compression} 
                    setCompression={setCompression} 
                  />

                  <div className="pt-4">
                    {status === "success" && resultBlob ? (
                      <div className="grid grid-cols-1 gap-3">
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
                          className="w-full h-20 text-xl bg-green-600 hover:bg-green-700 text-white font-black rounded-2xl"
                        >
                          <Download className="w-6 h-6 mr-3" />
                          Baixar Recorte
                        </Button>
                        <Button onClick={clearAll} variant="outline" size="lg" className="w-full h-16 text-xl font-black rounded-2xl border-2">
                          Novo Recorte
                        </Button>
                      </div>
                    ) : (
                      <Button
                        onClick={handleProcess}
                        disabled={status === "loading" || !completedCrop}
                        size="lg"
                        className="w-full h-20 text-xl sm:text-2xl font-black shadow-2xl rounded-2xl transition-all active:scale-95"
                      >
                        {status === "loading" ? (
                          <><Loader2 className="w-6 h-6 mr-3 animate-spin" /> Processando...</>
                        ) : (
                          <><Scissors className="w-6 h-6 mr-3" /> Recortar e Processar</>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <AnimatePresence>
            {status === "success" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-4 p-6 rounded-[2rem] bg-green-500/10 border-2 border-green-500/20 text-green-500"
              >
                <CheckCircle className="w-8 h-8 shrink-0" />
                <span className="text-lg sm:text-2xl font-black leading-tight">Imagem recortada com sucesso!</span>
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
                  <span className="text-xl sm:text-3xl font-black leading-tight">Erro no recorte.</span>
                </div>
                <p className="text-lg sm:text-2xl font-bold opacity-80 break-all leading-relaxed">{lastError}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>

        <footer className="mt-8 text-center space-y-1">
          <p className="text-xs text-muted-foreground/60 uppercase tracking-widest font-bold">
            Powered by Studio4x
          </p>
          <p className="text-[10px] text-muted-foreground/40 font-mono">
            v{APP_VERSION}
          </p>
        </footer>
      </motion.div>
    </div>
  );
};

export default CropPage;
