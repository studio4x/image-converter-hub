import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wand2,
  Download,
  Loader2,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Layers,
  Check,
  Eraser,
} from "lucide-react";
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import JSZip from "jszip";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { toast } from "@/hooks/use-toast";
import { APP_VERSION } from "@/lib/version";
import UploadArea from "@/components/converter/UploadArea";
import ConversionSettings from "@/components/converter/ConversionSettings";
import ToolInstructionsGrid from "@/components/ToolInstructionsGrid";
import {
  Format,
  Operation,
  CompressionLevel,
  ResizeScale,
  Status,
  ACCEPTED_TYPES,
  CropArea,
  MAX_FILES,
} from "@/lib/imageProcessor";
import { TOOL_ITEMS } from "@/lib/toolMeta";
import {
  createBackgroundRemovalPreview,
  processBackgroundRemovedImage,
  BackgroundRemovalAdjustments,
} from "@/lib/backgroundRemoval";

interface ImageData {
  file: File;
  preview: string;
  crop?: Crop;
  completedCrop?: PixelCrop;
  aspect?: number;
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

const RemoveBackgroundPage = () => {
  const [images, setImages] = useState<ImageData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [operation, setOperation] = useState<Operation>("Otimizar e Converter");
  const [format, setFormat] = useState<Format>("PNG");
  const [compression, setCompression] = useState<CompressionLevel>("80");
  const [resizeScale, setResizeScale] = useState<ResizeScale>("100");

  const [sensitivity, setSensitivity] = useState(58);
  const [fineTune, setFineTune] = useState(0);
  const [edgeSoftness, setEdgeSoftness] = useState(26);

  const [status, setStatus] = useState<Status>("idle");
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultFilename, setResultFilename] = useState<string>("");
  const [lastError, setLastError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [removedPreview, setRemovedPreview] = useState<string | null>(null);

  const imgRef = useRef<HTMLImageElement>(null);

  const [currentCrop, setCurrentCrop] = useState<Crop>();
  const [currentCompletedCrop, setCurrentCompletedCrop] = useState<PixelCrop>();
  const [currentAspect, setCurrentAspect] = useState<number | undefined>(undefined);

  const toolMeta = TOOL_ITEMS.find((tool) => tool.key === "remove-background");

  const adjustments: BackgroundRemovalAdjustments = useMemo(
    () => ({
      sensitivity,
      fineTune,
      edgeSoftness,
    }),
    [edgeSoftness, fineTune, sensitivity]
  );

  const onSelectFiles = useCallback(
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

      if (images.length + validFiles.length > MAX_FILES) {
        toast({
          title: "Limite excedido",
          description: `Maximo de ${MAX_FILES} imagens permitidas.`,
          variant: "destructive",
        });
        return;
      }

      const newImagesData: ImageData[] = [];
      let loadedCount = 0;

      validFiles.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          newImagesData.push({
            file,
            preview: event.target?.result as string,
          });
          loadedCount += 1;
          if (loadedCount === validFiles.length) {
            setImages((prev) => [...prev, ...newImagesData]);
          }
        };
        reader.readAsDataURL(file);
      });

      setResultBlob(null);
      setStatus("idle");
      setProcessedCount(0);
    },
    [images.length]
  );

  const onImageLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = event.currentTarget;

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
      setCurrentCompletedCrop(undefined);
    }
  };

  const saveCurrentState = useCallback(() => {
    if (images.length === 0 || !imgRef.current) return;

    const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
    const scaleY = imgRef.current.naturalHeight / imgRef.current.height;

    setImages((prev) => {
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
  }, [currentAspect, currentCompletedCrop, currentCrop, currentIndex, images.length]);

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
      setCurrentAspect(images[currentIndex].aspect);
    }
  }, [currentIndex, images]);

  const currentPreviewCropArea: CropArea | undefined = useMemo(() => {
    if (!imgRef.current || !currentCompletedCrop || currentCompletedCrop.width <= 0 || currentCompletedCrop.height <= 0) {
      return undefined;
    }

    const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
    const scaleY = imgRef.current.naturalHeight / imgRef.current.height;

    return {
      x: currentCompletedCrop.x * scaleX,
      y: currentCompletedCrop.y * scaleY,
      width: currentCompletedCrop.width * scaleX,
      height: currentCompletedCrop.height * scaleY,
    };
  }, [currentCompletedCrop, currentIndex, images]);

  useEffect(() => {
    if (!images[currentIndex]?.file) {
      setRemovedPreview(null);
      setPreviewLoading(false);
      return;
    }

    let active = true;
    setPreviewLoading(true);
    const timer = setTimeout(async () => {
      try {
        const preview = await createBackgroundRemovalPreview(images[currentIndex].file, adjustments, 760, currentPreviewCropArea);
        if (active) {
          setRemovedPreview(preview);
        }
      } catch (error) {
        if (active) {
          console.error("Erro no preview de remocao:", error);
          setRemovedPreview(null);
        }
      } finally {
        if (active) {
          setPreviewLoading(false);
        }
      }
    }, 160);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [adjustments, currentIndex, currentPreviewCropArea, images]);

  const getActiveCropDimensions = () => {
    if (!imgRef.current) return null;

    if (!currentCompletedCrop || currentCompletedCrop.width === 0 || currentCompletedCrop.height === 0) {
      return {
        width: imgRef.current.naturalWidth,
        height: imgRef.current.naturalHeight,
      };
    }

    const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
    const scaleY = imgRef.current.naturalHeight / imgRef.current.height;

    return {
      width: Math.round(currentCompletedCrop.width * scaleX),
      height: Math.round(currentCompletedCrop.height * scaleY),
    };
  };

  const cropDimensions = getActiveCropDimensions();

  const calculateOptionalCropArea = (imgData: ImageData): CropArea | undefined => {
    if (!imgData.completedCrop || !imgData.scaleX || !imgData.scaleY) {
      return undefined;
    }

    if (imgData.completedCrop.width <= 0 || imgData.completedCrop.height <= 0) {
      return undefined;
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
      aspect: currentAspect,
      scaleX: imgRef.current ? imgRef.current.naturalWidth / imgRef.current.width : allImages[currentIndex]?.scaleX,
      scaleY: imgRef.current ? imgRef.current.naturalHeight / imgRef.current.height : allImages[currentIndex]?.scaleY,
    };

    setStatus("loading");
    setLastError("");
    setProcessedCount(0);

    try {
      const qualityNum = parseInt(compression, 10);

      if (allImages.length === 1) {
        const image = allImages[0];
        const cropArea = calculateOptionalCropArea(image);
        const blob = await processBackgroundRemovedImage({
          file: image.file,
          targetFormat: format,
          quality: qualityNum,
          operation,
          resizeScale,
          crop: cropArea,
          adjustments,
        });

        const originalName = image.file.name;
        const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf(".")) || originalName;
        const filename = `${nameWithoutExt}_sem_fundo.${format.toLowerCase()}`;

        setResultBlob(blob);
        setResultFilename(filename);
        setProcessedCount(1);
        downloadFile(blob, filename);
      } else {
        const zip = new JSZip();
        const failedFiles: string[] = [];

        for (const [index, image] of allImages.entries()) {
          try {
            const cropArea = calculateOptionalCropArea(image);
            const blob = await processBackgroundRemovedImage({
              file: image.file,
              targetFormat: format,
              quality: qualityNum,
              operation,
              resizeScale,
              crop: cropArea,
              adjustments,
            });

            const originalName = image.file.name;
            const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf(".")) || originalName;
            zip.file(`${nameWithoutExt}_sem_fundo.${format.toLowerCase()}`, blob);
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
        const filename = "imagens_sem_fundo_studio4x.zip";
        setResultBlob(zipBlob);
        setResultFilename(filename);
        downloadFile(zipBlob, filename);
      }

      setStatus("success");
      toast({
        title: "Sucesso!",
        description: "Remocao de fundo concluida com sucesso.",
      });
    } catch (error: any) {
      console.error("Erro no processamento:", error);
      setStatus("error");
      setLastError(error.message);
      toast({
        title: "Erro no processamento",
        description: "Houve um problema ao remover o fundo das imagens.",
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
    setStatus("idle");
    setResultBlob(null);
    setProcessedCount(0);
    setRemovedPreview(null);
  };

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-start p-0 sm:p-4 pt-24 sm:pt-28 relative overflow-x-hidden">
      <div className="fixed inset-0 bg-gradient-to-b from-primary/10 via-background to-background pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[1400px] relative z-10 py-8 sm:py-10 px-4 sm:px-8"
      >
        <div className="text-center mb-10 sm:mb-12">
          <h1 className="text-4xl sm:text-6xl font-black tracking-tighter mb-3 bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/60 leading-none">
            Remover Fundo de Imagens
          </h1>
          <p className="text-base sm:text-xl text-muted-foreground font-bold max-w-[320px] sm:max-w-4xl mx-auto leading-tight opacity-90">
            Ajuste fino de recorte de fundo com processamento local e exportacao em lote
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
                    <p className="text-[10px] sm:text-xs text-muted-foreground font-bold uppercase tracking-widest truncate max-w-[160px] sm:max-w-[280px]">
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

              <div className="grid grid-cols-1 xl:grid-cols-[1.25fr_0.75fr] gap-6">
                <div className="space-y-5">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-base sm:text-sm font-black text-foreground uppercase tracking-tighter">Ajuste de Crop Opcional</label>
                    <Button variant="ghost" size="sm" onClick={clearAll} className="font-bold text-muted-foreground hover:text-foreground">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Limpar Tudo
                    </Button>
                  </div>

                  <div className="relative rounded-3xl overflow-hidden bg-black/20 border-2 border-white/5 flex items-center justify-center min-h-[260px] sm:min-h-[420px]">
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
                        alt="Crop background removal"
                        src={images[currentIndex].preview}
                        onLoad={onImageLoad}
                        style={{ maxWidth: "100%", maxHeight: "60vh" }}
                      />
                    </ReactCrop>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div className="space-y-3">
                      <label className="text-base sm:text-sm font-black text-foreground uppercase tracking-tighter">Proporcao do Crop</label>
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
                    {currentIndex < images.length - 1 ? (
                      <Button
                        onClick={() => {
                          saveCurrentState();
                          toast({
                            title: "Ajuste salvo",
                            description: `Crop da imagem ${currentIndex + 1} salvo com sucesso.`,
                          });
                          goToNext();
                        }}
                        className="h-11 px-6 text-base font-black rounded-xl bg-green-600 hover:bg-green-700 text-white transition-all shadow-lg whitespace-nowrap"
                      >
                        Confirmar e Avancar <ChevronRight className="ml-2 w-4 h-4" />
                      </Button>
                    ) : (
                      <Button
                        onClick={() => {
                          saveCurrentState();
                          toast({
                            title: "Ajustes prontos",
                            description: "Voce pode iniciar o processamento da remocao de fundo.",
                          });
                        }}
                        className="h-11 px-6 text-base font-black rounded-xl bg-green-600 hover:bg-green-700 text-white transition-all shadow-lg whitespace-nowrap"
                      >
                        Confirmar Crop <Check className="ml-2 w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="bg-white/5 p-5 rounded-3xl border border-white/10 space-y-5">
                    <div className="flex items-center gap-2 text-primary">
                      <Eraser className="w-5 h-5" />
                      <span className="font-black text-base">Ajustes da Remocao</span>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs uppercase tracking-widest font-black text-foreground/90">Sensibilidade</label>
                          <span className="text-xs font-black text-primary">{sensitivity}</span>
                        </div>
                        <Slider
                          value={[sensitivity]}
                          min={20}
                          max={130}
                          step={1}
                          onValueChange={(values) => setSensitivity(values[0])}
                        />
                        <p className="text-[11px] text-muted-foreground mt-2 font-semibold">Valor alto remove mais fundo similar.</p>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs uppercase tracking-widest font-black text-foreground/90">Ajuste fino</label>
                          <span className="text-xs font-black text-primary">{fineTune > 0 ? `+${fineTune}` : fineTune}</span>
                        </div>
                        <Slider
                          value={[fineTune]}
                          min={-40}
                          max={40}
                          step={1}
                          onValueChange={(values) => setFineTune(values[0])}
                        />
                        <p className="text-[11px] text-muted-foreground mt-2 font-semibold">Use negativo para preservar objeto e positivo para remover mais.</p>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs uppercase tracking-widest font-black text-foreground/90">Suavidade de borda</label>
                          <span className="text-xs font-black text-primary">{edgeSoftness}</span>
                        </div>
                        <Slider
                          value={[edgeSoftness]}
                          min={4}
                          max={80}
                          step={1}
                          onValueChange={(values) => setEdgeSoftness(values[0])}
                        />
                        <p className="text-[11px] text-muted-foreground mt-2 font-semibold">Equilibra borda serrilhada e detalhes finos.</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-white/5 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Wand2 className="w-4 h-4 text-primary" />
                      <p className="text-sm font-black">Preview de Remocao</p>
                    </div>
                    <div className="rounded-2xl overflow-hidden border border-white/10 bg-[linear-gradient(45deg,#101010_25%,#1b1b1b_25%,#1b1b1b_50%,#101010_50%,#101010_75%,#1b1b1b_75%,#1b1b1b_100%)] bg-[length:22px_22px] min-h-[170px] flex items-center justify-center">
                      {previewLoading ? (
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      ) : removedPreview ? (
                        <img src={removedPreview} alt="Preview sem fundo" className="w-full h-full object-contain max-h-[260px]" />
                      ) : (
                        <p className="text-xs font-semibold text-muted-foreground">Nao foi possivel gerar preview.</p>
                      )}
                    </div>
                  </div>

                  <div className="bg-white/5 p-5 rounded-3xl border border-white/10 space-y-5">
                    <div className="flex items-center gap-2 text-primary">
                      <Wand2 className="w-5 h-5" />
                      <span className="font-black text-base">Configuracoes de Exportacao</span>
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
                          className="w-full h-16 text-lg bg-green-600 hover:bg-green-700 text-white font-black rounded-2xl shadow-xl"
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
                            <CheckCircle className="w-5 h-5 mr-3" />
                            Remover Fundo e Processar
                          </>
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
                className="flex items-center gap-3 p-5 rounded-2xl bg-green-500/10 border-2 border-green-500/20 text-green-500"
              >
                <CheckCircle className="w-7 h-7 shrink-0" />
                <span className="text-base sm:text-lg font-black leading-tight">Remocao de fundo finalizada com sucesso!</span>
              </motion.div>
            )}

            {status === "error" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-4 p-6 rounded-2xl bg-destructive/10 border-2 border-destructive/20 text-destructive"
              >
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-8 h-8" />
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

export default RemoveBackgroundPage;
