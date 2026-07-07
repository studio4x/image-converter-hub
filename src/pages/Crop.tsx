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
  Layers,
  Check,
  RotateCcw,
  RotateCw,
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
import ToolInstructionsGrid from "@/components/ToolInstructionsGrid";
import {
  processImage,
  Format,
  Operation,
  CompressionLevel,
  ResizeScale,
  Status,
  createPreviewDataUrl,
  isSupportedImageFile,
  CropArea,
  MAX_FILES,
} from "@/lib/imageProcessor";
import { TOOL_ITEMS } from "@/lib/toolMeta";

interface ImageData {
  file: File;
  preview: string;
  crop?: Crop;
  completedCrop?: PixelCrop;
  rotation?: number;
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

const normalizeRotation = (rotation: number) => ((rotation % 360) + 360) % 360;

const CropPage = () => {
  const [images, setImages] = useState<ImageData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [operation, setOperation] = useState<Operation>("Otimizar e Converter");
  const [format, setFormat] = useState<Format>("JPG");
  const [compression, setCompression] = useState<CompressionLevel>("80");
  const [resizeScale, setResizeScale] = useState<ResizeScale>("100");
  const [status, setStatus] = useState<Status>("idle");
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultFilename, setResultFilename] = useState<string>("");
  const [lastError, setLastError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);

  const imgRef = useRef<HTMLImageElement>(null);

  const [currentCrop, setCurrentCrop] = useState<Crop>();
  const [currentCompletedCrop, setCurrentCompletedCrop] = useState<PixelCrop>();
  const [currentAspect, setCurrentAspect] = useState<number | undefined>(undefined);
  const [currentRotation, setCurrentRotation] = useState(0);

  const toolMeta = TOOL_ITEMS.find((tool) => tool.key === "crop");

  const getRotatedDimensions = useCallback((rotation: number) => {
    if (!imgRef.current) return null;

    const normalizedRotation = normalizeRotation(rotation);
    const sourceWidth = imgRef.current.naturalWidth;
    const sourceHeight = imgRef.current.naturalHeight;

    if (normalizedRotation === 90 || normalizedRotation === 270) {
      return {
        width: sourceHeight,
        height: sourceWidth,
      };
    }

    return {
      width: sourceWidth,
      height: sourceHeight,
    };
  }, []);

  const getRenderedDimensions = useCallback(() => {
    if (!imgRef.current) return null;

    const rect = imgRef.current.getBoundingClientRect();
    return {
      width: rect.width,
      height: rect.height,
    };
  }, []);

  const initializeCurrentCrop = useCallback(() => {
    if (!imgRef.current) return;

    const renderedDimensions = getRenderedDimensions();
    if (!renderedDimensions) return;

    const { width, height } = renderedDimensions;
    const nextCrop = centerCrop(
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

    setCurrentCrop(nextCrop);
  }, [currentAspect, getRenderedDimensions]);

  const handleRotation = useCallback(
    (delta: number) => {
      setCurrentCompletedCrop(undefined);
      setCurrentCrop(undefined);

      setCurrentRotation((previousRotation) => {
        const nextRotation = normalizeRotation(previousRotation + delta);

        window.requestAnimationFrame(() => {
          initializeCurrentCrop();
        });

        return nextRotation;
      });
    },
    [initializeCurrentCrop]
  );

  const onSelectFiles = useCallback(
    (newFiles: FileList | File[]) => {
      const validFiles = Array.from(newFiles).filter(isSupportedImageFile);

      if (validFiles.length === 0) {
        toast({
          title: "Formato inválido",
          description: "Apenas imagens JPG, PNG, WEBP, AVIF, HEIC e HEIF são aceitas.",
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

      setResultBlob(null);
      setStatus("idle");
      setProcessedCount(0);

      Promise.all(
        validFiles.map(async (file) => ({
          file,
          preview: await createPreviewDataUrl(file),
        }))
      )
        .then((newImagesData) => {
          setImages((prev) => [...prev, ...newImagesData]);
        })
        .catch((error) => {
          console.error("Erro ao gerar prévias:", error);
          toast({
            title: "Erro ao carregar imagem",
            description: "Não foi possível gerar a prévia de um ou mais arquivos.",
            variant: "destructive",
          });
        });
    },
    [images.length]
  );

  const onImageLoad = () => {
    const existing = images[currentIndex];
    if (existing?.crop) {
      setCurrentCrop(existing.crop);
      setCurrentCompletedCrop(existing.completedCrop);
      setCurrentRotation(existing.rotation ?? 0);
      return;
    }

    window.requestAnimationFrame(() => {
      initializeCurrentCrop();
    });
  };

  const handleAspectChange = (newAspect: number | undefined) => {
    setCurrentAspect(newAspect);
    if (!newAspect) {
      setCurrentCrop(undefined);
      setCurrentCompletedCrop(undefined);
      return;
    }

    setCurrentCompletedCrop(undefined);
    window.requestAnimationFrame(() => {
      initializeCurrentCrop();
    });
  };

  const saveCurrentState = useCallback(() => {
    if (images.length === 0 || !imgRef.current) return;

    const renderedDimensions = getRenderedDimensions();
    const rotatedDimensions = getRotatedDimensions(currentRotation);
    if (!renderedDimensions || !rotatedDimensions) return;

    const scaleX = rotatedDimensions.width / renderedDimensions.width;
    const scaleY = rotatedDimensions.height / renderedDimensions.height;

    setImages((prev) => {
      const updated = [...prev];
      updated[currentIndex] = {
        ...updated[currentIndex],
        crop: currentCrop,
        completedCrop: currentCompletedCrop,
        rotation: currentRotation,
        scaleX,
        scaleY,
      };
      return updated;
    });
  }, [
    currentAspect,
    currentCompletedCrop,
    currentCrop,
    currentIndex,
    currentRotation,
    getRenderedDimensions,
    getRotatedDimensions,
    images.length,
  ]);

  const goToNext = () => {
    saveCurrentState();
    if (currentIndex < images.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const goToPrev = () => {
    saveCurrentState();
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  useEffect(() => {
    if (images[currentIndex]) {
      setCurrentCrop(images[currentIndex].crop);
      setCurrentCompletedCrop(images[currentIndex].completedCrop);
      setCurrentRotation(images[currentIndex].rotation ?? 0);
    }
  }, [currentIndex, images]);

  const getActiveCropDimensions = () => {
    if (!imgRef.current) return null;

    if (!currentCompletedCrop || currentCompletedCrop.width === 0 || currentCompletedCrop.height === 0) {
      const rotatedDimensions = getRotatedDimensions(currentRotation);
      return rotatedDimensions;
    }

    const renderedDimensions = getRenderedDimensions();
    const rotatedDimensions = getRotatedDimensions(currentRotation);
    if (!renderedDimensions || !rotatedDimensions) return null;

    const scaleX = rotatedDimensions.width / renderedDimensions.width;
    const scaleY = rotatedDimensions.height / renderedDimensions.height;

    return {
      width: Math.round(currentCompletedCrop.width * scaleX),
      height: Math.round(currentCompletedCrop.height * scaleY),
    };
  };

  const cropDimensions = getActiveCropDimensions();

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

  const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleProcessAll = async () => {
    saveCurrentState();

    const allImages = [...images];
    allImages[currentIndex] = {
      ...allImages[currentIndex],
      crop: currentCrop,
      completedCrop: currentCompletedCrop,
      rotation: currentRotation,
    };

    const uncropped = allImages.filter((image) => !image.completedCrop);
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
    setProcessedCount(0);

    try {
      const qualityNum = parseInt(compression, 10);

      if (allImages.length === 1) {
        const image = allImages[0];
        const cropArea = calculateCropArea(image);
        const blob = await processImage(image.file, format, qualityNum, operation, cropArea, resizeScale, image.rotation ?? 0);

        const originalName = image.file.name;
        const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf(".")) || originalName;
        const filename = `${nameWithoutExt}_convertida.${format.toLowerCase()}`;

        setResultBlob(blob);
        setResultFilename(filename);
        setProcessedCount(1);
        downloadFile(blob, filename);
      } else {
        const zip = new JSZip();
        const failedFiles: string[] = [];

        for (const [index, image] of allImages.entries()) {
          try {
            const cropArea = calculateCropArea(image);
            const blob = await processImage(image.file, format, qualityNum, operation, cropArea, resizeScale, image.rotation ?? 0);
            const originalName = image.file.name;
            const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf(".")) || originalName;
            zip.file(`${nameWithoutExt}_convertida.${format.toLowerCase()}`, blob);
          } catch (fileError) {
            console.error(`Erro ao processar ${image.file.name}:`, fileError);
            failedFiles.push(image.file.name);
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

  const clearAll = () => {
    setImages([]);
    setCurrentIndex(0);
    setCurrentCrop(undefined);
    setCurrentCompletedCrop(undefined);
    setCurrentAspect(undefined);
    setCurrentRotation(0);
    setStatus("idle");
    setResultBlob(null);
    setProcessedCount(0);
  };

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-start p-0 sm:p-4 pt-24 sm:pt-28 relative overflow-x-hidden">
      <div className="fixed inset-0 bg-gradient-to-b from-primary/10 via-background to-background pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[1400px] relative z-10 py-8 px-4 sm:px-8"
      >
        <div className="text-center mb-8 sm:mb-10">
          <h1 className="text-4xl sm:text-6xl font-black tracking-tighter mb-3 bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/60 leading-none">
            Recortar Imagens
          </h1>
          <p className="text-base sm:text-xl text-muted-foreground font-bold max-w-[280px] sm:max-w-4xl mx-auto leading-tight opacity-90">
            Ajuste o enquadramento de múltiplos arquivos de uma vez
          </p>
        </div>

        {toolMeta && (
          <ToolInstructionsGrid
            title="Passo a passo da ferramenta"
            subtitle={toolMeta.shortDescription}
            steps={toolMeta.pageSteps}
          />
        )}

        <Card className="p-5 sm:p-8 bg-card/40 backdrop-blur-3xl border-0 sm:border border-white/10 shadow-none sm:shadow-2xl space-y-6 rounded-none sm:rounded-[2.25rem]">
          {images.length === 0 ? (
            <UploadArea
              onFilesSelected={onSelectFiles}
              isDragging={isDragging}
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={(event) => {
                event.preventDefault();
                setIsDragging(false);
              }}
              onDrop={(event) => {
                event.preventDefault();
                setIsDragging(false);
                onSelectFiles(event.dataTransfer.files);
              }}
              maxFiles={MAX_FILES}
            />
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-white/5 p-3 sm:p-4 rounded-2xl border border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Layers className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-black text-base sm:text-lg">
                      Imagem {currentIndex + 1} de {images.length}
                    </h3>
                    <p className="text-[10px] sm:text-xs text-muted-foreground font-bold uppercase tracking-widest truncate max-w-[180px] sm:max-w-[320px]">
                      {images[currentIndex].file.name}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={goToPrev} disabled={currentIndex === 0} className="rounded-xl border-2">
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={goToNext}
                    disabled={currentIndex === images.length - 1}
                    className="rounded-xl border-2"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              <div className="flex flex-col lg:flex-row gap-7">
                <div className="flex-1 space-y-5">
                  <div className="flex items-center justify-between">
                    <label className="text-base sm:text-sm font-black text-foreground uppercase tracking-tighter">Ajuste o Recorte</label>
                    <Button variant="ghost" size="sm" onClick={clearAll} className="font-bold text-muted-foreground hover:text-foreground">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Limpar Tudo
                    </Button>
                  </div>

                  <div className="relative rounded-3xl overflow-hidden bg-black/20 border-2 border-white/5 flex items-center justify-center min-h-[300px] sm:min-h-[450px]">
                    <ReactCrop
                      crop={currentCrop}
                      onChange={(crop) => setCurrentCrop(crop)}
                      onComplete={(crop) => setCurrentCompletedCrop(crop)}
                      aspect={currentAspect}
                      className="max-h-[60vh]"
                    >
                      <img
                        key={images[currentIndex].preview}
                        ref={imgRef}
                        alt="Crop me"
                        src={images[currentIndex].preview}
                        onLoad={onImageLoad}
                        style={{
                          maxWidth: "100%",
                          maxHeight: "60vh",
                          transform: `rotate(${currentRotation}deg)`,
                          transformOrigin: "center center",
                          transition: "transform 160ms ease",
                        }}
                      />
                    </ReactCrop>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5">
                    <div className="space-y-4">
                      <div className="space-y-3">
                        <label className="text-base sm:text-sm font-black text-foreground uppercase tracking-tighter">Proporção</label>
                        <div className="flex flex-wrap gap-2">
                          {ASPECT_RATIOS.map((ratio) => (
                            <Button
                              key={ratio.label}
                              variant={currentAspect === ratio.value ? "default" : "outline"}
                              onClick={() => handleAspectChange(ratio.value)}
                              className="font-black rounded-xl h-9"
                            >
                              {ratio.label}
                            </Button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-base sm:text-sm font-black text-foreground uppercase tracking-tighter">Girar a Área</label>
                        <div className="flex items-center flex-wrap gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRotation(-90)}
                            className="font-black rounded-xl h-9 px-3 border-2"
                          >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Esquerda
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRotation(90)}
                            className="font-black rounded-xl h-9 px-3 border-2"
                          >
                            <RotateCw className="w-4 h-4 mr-2" />
                            Direita
                          </Button>
                          <span className="text-xs sm:text-sm font-black text-muted-foreground uppercase tracking-widest">
                            {normalizeRotation(currentRotation)}°
                          </span>
                        </div>
                      </div>
                    </div>
                    {currentIndex < images.length - 1 ? (
                      <Button
                        onClick={() => {
                          saveCurrentState();
                          toast({
                            title: "Ajuste confirmado",
                            description: `Enquadramento da imagem ${currentIndex + 1} salvo com sucesso.`,
                          });
                          goToNext();
                        }}
                        className="h-11 px-6 text-base font-black rounded-xl bg-green-600 hover:bg-green-700 text-white transition-all shadow-lg whitespace-nowrap"
                      >
                        Confirmar e Avançar <ChevronRight className="ml-2 w-4 h-4" />
                      </Button>
                    ) : (
                      <Button
                        onClick={() => {
                          saveCurrentState();
                          toast({
                            title: "Ajustes concluídos",
                            description: "Todos os enquadramentos foram salvos. Agora você já pode processar as imagens.",
                          });
                        }}
                        className="h-11 px-6 text-base font-black rounded-xl bg-green-600 hover:bg-green-700 text-white transition-all shadow-lg whitespace-nowrap"
                      >
                        Confirmar Enquadramento <Check className="ml-2 w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="w-full lg:w-[390px] space-y-6">
                  <div className="bg-white/5 p-5 rounded-3xl border border-white/10 space-y-5">
                    <div className="flex items-center gap-2 text-primary">
                      <Scissors className="w-5 h-5" />
                      <span className="font-black text-base">Configurações Finais</span>
                    </div>
                    <ConversionSettings
                      operation={operation}
                      setOperation={setOperation}
                      format={format}
                      setFormat={setFormat}
                      compression={compression}
                      setCompression={setCompression}
                      resizeScale={resizeScale}
                      setResizeScale={setResizeScale}
                      originalWidth={cropDimensions?.width}
                      originalHeight={cropDimensions?.height}
                    />
                  </div>

                  <div className="pt-2">
                    {status === "success" && resultBlob ? (
                      <div className="grid grid-cols-1 gap-3">
                        <Button
                          onClick={() => downloadFile(resultBlob, resultFilename)}
                          size="lg"
                          className="w-full h-16 text-base bg-green-600 hover:bg-green-700 text-white font-black rounded-2xl shadow-xl"
                        >
                          <Download className="w-5 h-5 mr-3" />
                          Baixar Arquivos
                        </Button>
                        <Button onClick={handleProcessAll} size="lg" className="w-full h-14 text-base font-black rounded-2xl">
                          Processar Novamente
                        </Button>
                        <Button onClick={clearAll} variant="outline" size="lg" className="w-full h-14 text-base font-black rounded-2xl border-2">
                          Novo Upload
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Button
                          onClick={handleProcessAll}
                          disabled={status === "loading"}
                          size="lg"
                          className="w-full h-16 text-base sm:text-xl font-black shadow-2xl rounded-2xl transition-all active:scale-95 bg-primary hover:bg-primary/90"
                        >
                          {status === "loading" ? (
                            <>
                              <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                              Processando... ({processedCount}/{images.length})
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-5 h-5 mr-3" /> Finalizar e Processar Tudo
                            </>
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
                className="flex items-center gap-3 p-5 rounded-2xl bg-green-500/10 border-2 border-green-500/20 text-green-500"
              >
                <CheckCircle className="w-7 h-7 shrink-0" />
                <span className="text-base sm:text-xl font-black leading-tight">Todas as imagens processadas!</span>
              </motion.div>
            )}

            {status === "error" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-4 p-6 rounded-2xl bg-destructive/10 border-2 border-destructive/20 text-destructive"
              >
                <div className="flex items-center gap-4">
                  <AlertCircle className="w-7 h-7" />
                  <span className="text-lg sm:text-2xl font-black leading-tight">Erro no processamento.</span>
                </div>
                <p className="text-sm sm:text-lg font-bold opacity-80 break-all leading-relaxed">{lastError}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>

        <footer className="mt-7 text-center space-y-1">
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

export default CropPage;
