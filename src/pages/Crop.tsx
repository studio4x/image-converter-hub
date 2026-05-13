import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Scissors, 
  Download, 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight,
  Layers
} from "lucide-react";
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import JSZip from "jszip";

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
  CropArea,
  MAX_FILES
} from "@/lib/imageProcessor";

interface ImageData {
  file: File;
  preview: string;
  crop?: Crop;
  completedCrop?: PixelCrop;
  aspect?: number | undefined;
  scaleX?: number;
  scaleY?: number;
}

const ASPECT_RATIOS = [
  { label: "Livre", value: undefined },
  { label: "1:1", value: 1 },
  { label: "4:3", value: 4 / 3 },
  { label: "16:9", value: 16 / 9 },
  { label: "9:16", value: 9 / 16 },
  { label: "3:2", value: 3 / 2 },
];

const CropPage = () => {
  const [images, setImages] = useState<ImageData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [operation, setOperation] = useState<Operation>("Otimizar e Converter");
  const [format, setFormat] = useState<Format>("JPG");
  const [compression, setCompression] = useState<CompressionLevel>("80");
  const [status, setStatus] = useState<Status>("idle");
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultFilename, setResultFilename] = useState<string>("");
  const [lastError, setLastError] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  
  const imgRef = useRef<HTMLImageElement>(null);

  // Estados temporários para o editor atual
  const [currentCrop, setCurrentCrop] = useState<Crop>();
  const [currentCompletedCrop, setCurrentCompletedCrop] = useState<PixelCrop>();
  const [currentAspect, setCurrentAspect] = useState<number | undefined>(undefined);

  const onSelectFiles = useCallback((newFiles: FileList | File[]) => {
    const validFiles = Array.from(newFiles).filter(file => 
      ACCEPTED_TYPES.includes(file.type)
    );

    if (validFiles.length === 0) {
      toast({
        title: "Formato inválido",
        description: "Apenas imagens JPG, PNG, WEBP e AVIF são aceitas.",
        variant: "destructive",
      });
      return;
    }

    if (images.length + validFiles.length > MAX_FILES) {
      toast({
        title: "Limite excedido",
        description: `Máximo de ${MAX_FILES} imagens permitidas.`,
        variant: "destructive",
      });
      return;
    }

    const newImagesData: ImageData[] = [];
    
    let loadedCount = 0;
    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        newImagesData.push({
          file,
          preview: e.target?.result as string,
        });
        loadedCount++;
        if (loadedCount === validFiles.length) {
          setImages(prev => [...prev, ...newImagesData]);
        }
      };
      reader.readAsDataURL(file);
    });

    setResultBlob(null);
    setStatus("idle");
  }, [images.length]);

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    
    // Se já tivermos dados salvos para esta imagem, usamos eles
    const existing = images[currentIndex];
    if (existing?.crop) {
      setCurrentCrop(existing.crop);
      setCurrentCompletedCrop(existing.completedCrop);
      setCurrentAspect(existing.aspect);
      return;
    }

    const initialCrop = centerCrop(
      makeAspectCrop(
        {
          unit: "%",
          width: 90,
        },
        currentAspect || 1,
        width,
        height
      ),
      width,
      height
    );
    setCurrentCrop(initialCrop);
  };

  const handleAspectChange = (newAspect: number | undefined) => {
    setCurrentAspect(newAspect);
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
      setCurrentCrop(newCrop);
    } else {
      setCurrentCrop(undefined);
    }
  };

  const saveCurrentState = useCallback(() => {
    if (images.length === 0 || !imgRef.current) return;
    
    const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
    const scaleY = imgRef.current.naturalHeight / imgRef.current.height;

    setImages(prev => {
      const updated = [...prev];
      updated[currentIndex] = {
        ...updated[currentIndex],
        crop: currentCrop,
        completedCrop: currentCompletedCrop,
        aspect: currentAspect,
        scaleX,
        scaleY,
      };
      return updated;
    });
  }, [currentIndex, currentCrop, currentCompletedCrop, currentAspect, images.length]);

  const goToNext = () => {
    saveCurrentState();
    if (currentIndex < images.length - 1) {
      setCurrentIndex(prev => prev + 1);
      // Os estados temporários serão resetados/atualizados pelo useEffect ou onImageLoad
    }
  };

  const goToPrev = () => {
    saveCurrentState();
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  // Sincronizar estados temporários quando o currentIndex muda
  useEffect(() => {
    if (images[currentIndex]) {
      setCurrentCrop(images[currentIndex].crop);
      setCurrentCompletedCrop(images[currentIndex].completedCrop);
      setCurrentAspect(images[currentIndex].aspect);
    }
  }, [currentIndex]);

  const handleProcessAll = async () => {
    // Salvar o estado da imagem atual antes de processar
    saveCurrentState();
    
    // Pequeno delay para garantir que o state foi atualizado (embora saveCurrentState use setImages que é assíncrono)
    // Vamos usar os valores atuais para a imagem corrente e o array para as outras
    const allImages = [...images];
    allImages[currentIndex] = {
      ...allImages[currentIndex],
      crop: currentCrop,
      completedCrop: currentCompletedCrop,
      aspect: currentAspect,
    };

    const uncropped = allImages.filter(img => !img.completedCrop);
    if (uncropped.length > 0) {
      toast({
        title: "Recorte pendente",
        description: `Você ainda não ajustou o recorte de ${uncropped.length} imagem(ns).`,
        variant: "destructive",
      });
      return;
    }

    setStatus("loading");
    setLastError("");

    try {
      const qualityNum = parseInt(compression);
      
      if (allImages.length === 1) {
        const img = allImages[0];
        const cropArea = calculateCropArea(img);
        const blob = await processImage(img.file, format, qualityNum, operation, cropArea);
        
        const originalName = img.file.name;
        const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
        const filename = `${nameWithoutExt}_cropped.${format.toLowerCase()}`;
        
        setResultBlob(blob);
        setResultFilename(filename);
        downloadFile(blob, filename);
      } else {
        const zip = new JSZip();
        for (const img of allImages) {
          const cropArea = calculateCropArea(img);
          const blob = await processImage(img.file, format, qualityNum, operation, cropArea);
          const originalName = img.file.name;
          const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
          zip.file(`${nameWithoutExt}_cropped.${format.toLowerCase()}`, blob);
        }
        
        const zipBlob = await zip.generateAsync({ type: "blob" });
        const filename = "imagens_recortadas_studio4x.zip";
        setResultBlob(zipBlob);
        setResultFilename(filename);
        downloadFile(zipBlob, filename);
      }

      setStatus("success");
      toast({
        title: "Sucesso!",
        description: "Todas as imagens foram processadas com sucesso.",
      });
    } catch (error: any) {
      console.error("Erro no processamento:", error);
      setStatus("error");
      setLastError(error.message);
      toast({
        title: "Erro no processamento",
        description: "Houve um problema ao processar as imagens.",
        variant: "destructive",
      });
    }
  };

  const calculateCropArea = (imgData: ImageData): CropArea => {
    if (!imgData.completedCrop || !imgData.scaleX || !imgData.scaleY) {
      throw new Error("Crop não definido para uma das imagens");
    }
    
    return {
      x: imgData.completedCrop.x * imgData.scaleX,
      y: imgData.completedCrop.y * imgData.scaleY,
      width: imgData.completedCrop.width * imgData.scaleX,
      height: imgData.completedCrop.height * imgData.scaleY,
    };
  };

  // Ajuste fino: o processImage agora aceita um CropArea que pode ser baseado no naturalSize
  // se fizermos a conta antes.
  
  const calculateRealCropArea = async (imgData: ImageData): Promise<CropArea> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        // Precisamos saber qual era o tamanho do elemento <img> quando o crop foi feito.
        // Como o ReactCrop trabalha com o elemento renderizado, vamos assumir o scale.
        // Vou usar o `completedCrop` que já está em pixels relativos à imagem renderizada.
        
        // Se o usuário mudou o zoom do browser ou o layout mudou, isso pode quebrar.
        // Mas geralmente o crop é feito e processado na mesma sessão.
        
        // No momento do crop, o `imgRef` aponta para a imagem.
        // Vou salvar o `scale` no `ImageData`.
        
        const scaleX = img.naturalWidth / (imgData.completedCrop?.width || 1) * (imgData.completedCrop?.width || 1); // placeholder
        // Na verdade, a forma correta é salvar o scale no momento que o crop é gerado.
        
        // Vou atualizar o ImageData para incluir `imageElementWidth` e `imageElementHeight`.
        resolve({
          x: imgData.completedCrop!.x,
          y: imgData.completedCrop!.y,
          width: imgData.completedCrop!.width,
          height: imgData.completedCrop!.height,
        });
      };
      img.src = imgData.preview;
    });
  };

  const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearAll = () => {
    setImages([]);
    setCurrentIndex(0);
    setCurrentCrop(undefined);
    setCurrentCompletedCrop(undefined);
    setCurrentAspect(undefined);
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
          <h1 className="text-5xl sm:text-7xl font-black tracking-tighter mb-4 bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/60 leading-none">Recortar Imagens</h1>
          <p className="text-lg sm:text-2xl text-muted-foreground font-bold max-w-[280px] sm:max-w-4xl mx-auto leading-tight opacity-90">Ajuste o enquadramento de múltiplos arquivos de uma vez</p>
        </div>

        <Card className="p-6 sm:p-10 bg-card/40 backdrop-blur-3xl border-0 sm:border border-white/10 shadow-none sm:shadow-2xl space-y-8 rounded-none sm:rounded-[3rem]">
          {images.length === 0 ? (
            <UploadArea 
              onFilesSelected={onSelectFiles}
              isDragging={isDragging}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
              onDrop={(e) => { e.preventDefault(); setIsDragging(false); onSelectFiles(e.dataTransfer.files); }}
              maxFiles={MAX_FILES}
            />
          ) : (
            <div className="space-y-8">
              {/* Barra de Progresso / Navegação */}
              <div className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Layers className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-black text-xl">Imagem {currentIndex + 1} de {images.length}</h3>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">{images[currentIndex].file.name}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={goToPrev} disabled={currentIndex === 0} className="rounded-xl border-2">
                    <ChevronLeft className="w-6 h-6" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={goToNext} disabled={currentIndex === images.length - 1} className="rounded-xl border-2">
                    <ChevronRight className="w-6 h-6" />
                  </Button>
                </div>
              </div>

              <div className="flex flex-col lg:flex-row gap-10">
                {/* Área de Crop */}
                <div className="flex-1 space-y-6">
                  <div className="flex items-center justify-between">
                    <label className="text-xl sm:text-sm font-black text-foreground uppercase tracking-tighter">Ajuste o Recorte</label>
                    <Button variant="ghost" size="sm" onClick={clearAll} className="font-bold text-muted-foreground hover:text-foreground">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Limpar Tudo
                    </Button>
                  </div>
                  
                  <div className="relative rounded-3xl overflow-hidden bg-black/20 border-2 border-white/5 flex items-center justify-center min-h-[300px] sm:min-h-[500px]">
                    <ReactCrop
                      crop={currentCrop}
                      onChange={(c) => setCurrentCrop(c)}
                      onComplete={(c) => setCurrentCompletedCrop(c)}
                      aspect={currentAspect}
                      className="max-h-[60vh]"
                    >
                      <img
                        key={images[currentIndex].preview} // Força re-render ao mudar imagem
                        ref={imgRef}
                        alt="Crop me"
                        src={images[currentIndex].preview}
                        onLoad={onImageLoad}
                        style={{ maxWidth: "100%", maxHeight: "60vh" }}
                      />
                    </ReactCrop>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                    <div className="space-y-4">
                      <label className="text-xl sm:text-sm font-black text-foreground uppercase tracking-tighter">Proporção</label>
                      <div className="flex flex-wrap gap-2">
                        {ASPECT_RATIOS.map((ratio) => (
                          <Button
                            key={ratio.label}
                            variant={currentAspect === ratio.value ? "default" : "outline"}
                            onClick={() => handleAspectChange(ratio.value)}
                            className="font-black rounded-xl"
                          >
                            {ratio.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                    {currentIndex < images.length - 1 && (
                      <Button
                        onClick={goToNext}
                        variant="secondary"
                        size="lg"
                        className="h-12 px-8 text-lg font-black rounded-xl border-2 border-primary/20 hover:border-primary/50 transition-all shadow-lg hover:shadow-primary/10 whitespace-nowrap"
                      >
                        Próxima Imagem <ChevronRight className="ml-2 w-5 h-5" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Configurações */}
                <div className="w-full lg:w-[400px] space-y-8">
                  <div className="bg-white/5 p-6 rounded-3xl border border-white/10 space-y-6">
                    <div className="flex items-center gap-3 text-primary">
                      <Scissors className="w-6 h-6" />
                      <span className="font-black text-lg">Configurações Finais</span>
                    </div>
                    <ConversionSettings 
                      operation={operation}
                      setOperation={setOperation}
                      format={format} 
                      setFormat={setFormat} 
                      compression={compression} 
                      setCompression={setCompression} 
                    />
                  </div>

                  <div className="pt-4">
                    {status === "success" && resultBlob ? (
                      <div className="grid grid-cols-1 gap-3">
                        <Button
                          onClick={() => downloadFile(resultBlob, resultFilename)}
                          size="lg"
                          className="w-full h-20 text-xl bg-green-600 hover:bg-green-700 text-white font-black rounded-2xl shadow-xl"
                        >
                          <Download className="w-6 h-6 mr-3" />
                          Baixar Arquivos
                        </Button>
                        <Button onClick={clearAll} variant="outline" size="lg" className="w-full h-16 text-xl font-black rounded-2xl border-2">
                          Novo Upload
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Button
                          onClick={handleProcessAll}
                          disabled={status === "loading"}
                          size="lg"
                          className="w-full h-20 text-xl sm:text-2xl font-black shadow-2xl rounded-2xl transition-all active:scale-95 bg-primary hover:bg-primary/90"
                        >
                          {status === "loading" ? (
                            <><Loader2 className="w-6 h-6 mr-3 animate-spin" /> Processando...</>
                          ) : (
                            <><CheckCircle className="w-6 h-6 mr-3" /> Finalizar e Processar Tudo</>
                          )}
                        </Button>
                      </div>
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
                <span className="text-lg sm:text-2xl font-black leading-tight">Todas as imagens processadas!</span>
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
