import { loadImageSource } from "@/lib/imageInput";

export type Format = "JPG" | "PNG" | "WEBP" | "AVIF" | "SVG";
export type Operation = "Otimizar" | "Converter" | "Otimizar e Converter";
export type CompressionLevel = "10" | "30" | "60" | "80" | "100";
export type ResizeScale = "100" | "75" | "50" | "25";
export type Status = "idle" | "loading" | "success" | "error";

export { ACCEPTED_TYPES, IMAGE_INPUT_ACCEPT, isSupportedImageFile, createPreviewDataUrl, getImageDimensions, loadImageSource } from "@/lib/imageInput";

export const MAX_FILES = 10;

export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

const normalizeRotation = (rotation: number) => ((rotation % 360) + 360) % 360;

const getRotatedDimensions = (width: number, height: number, rotation: number) => {
  const normalizedRotation = normalizeRotation(rotation);
  if (normalizedRotation === 90 || normalizedRotation === 270) {
    return { width: height, height: width };
  }

  return { width, height };
};

const canvasToBlob = (canvas: HTMLCanvasElement, mimeType: string, quality: number): Promise<Blob> =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
          return;
        }

        reject(new Error("Erro ao gerar blob da imagem"));
      },
      mimeType,
      quality
    );
  });

const drawSourceImage = (
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  rotation: number
) => {
  const normalizedRotation = normalizeRotation(rotation);
  const { width: targetWidth, height: targetHeight } = getRotatedDimensions(sourceWidth, sourceHeight, normalizedRotation);

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Não foi possível obter o contexto do canvas");
  }

  if (normalizedRotation === 0) {
    ctx.drawImage(source, 0, 0, sourceWidth, sourceHeight);
    return canvas;
  }

  ctx.translate(targetWidth / 2, targetHeight / 2);
  ctx.rotate((normalizedRotation * Math.PI) / 180);
  ctx.drawImage(source, -sourceWidth / 2, -sourceHeight / 2, sourceWidth, sourceHeight);

  return canvas;
};

const getFormatFromMimeType = (mimeType: string): Format | null => {
  if (mimeType === "image/jpeg" || mimeType === "image/jpg") return "JPG";
  if (mimeType === "image/png") return "PNG";
  if (mimeType === "image/webp") return "WEBP";
  if (mimeType === "image/avif") return "AVIF";
  if (mimeType === "image/svg+xml") return "SVG";
  return null;
};

export const processImage = async (
  file: File,
  targetFormat: Format,
  quality: number,
  operation: Operation,
  crop?: CropArea,
  resizeScale?: ResizeScale,
  rotation = 0
): Promise<Blob> => {
  let bitmap: ImageBitmap | null = null;

  try {
    let source: CanvasImageSource;
    let sourceWidth: number;
    let sourceHeight: number;

    const loadedSource = await loadImageSource(file);
    bitmap = loadedSource.bitmap || null;
    source = loadedSource.source;
    sourceWidth = loadedSource.width;
    sourceHeight = loadedSource.height;

    const rotatedSource = drawSourceImage(source, sourceWidth, sourceHeight, rotation);
    const rotatedDimensions = getRotatedDimensions(sourceWidth, sourceHeight, rotation);

    const sourceCropWidth = crop ? crop.width : rotatedDimensions.width;
    const sourceCropHeight = crop ? crop.height : rotatedDimensions.height;
    const scaleFactor = resizeScale ? parseInt(resizeScale, 10) / 100 : 1;

    const targetWidth = Math.max(1, Math.round(sourceCropWidth * scaleFactor));
    const targetHeight = Math.max(1, Math.round(sourceCropHeight * scaleFactor));

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Não foi possível obter o contexto do canvas");
    }

    if (targetFormat === "JPG") {
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    if (crop) {
      ctx.drawImage(rotatedSource, crop.x, crop.y, crop.width, crop.height, 0, 0, targetWidth, targetHeight);
    } else {
      ctx.drawImage(rotatedSource, 0, 0, rotatedDimensions.width, rotatedDimensions.height, 0, 0, targetWidth, targetHeight);
    }

    const encodeQuality = operation === "Converter" ? 1 : quality / 100;

    // Exporta SVG contendo a imagem rasterizada processada no canvas.
    if (targetFormat === "SVG") {
      const pngDataUrl = canvas.toDataURL("image/png");
      const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${targetWidth}" height="${targetHeight}" viewBox="0 0 ${targetWidth} ${targetHeight}"><image href="${pngDataUrl}" width="${targetWidth}" height="${targetHeight}"/></svg>`;
      return new Blob([svgContent], { type: "image/svg+xml;charset=utf-8" });
    }

    const mimeType = targetFormat === "JPG" ? "image/jpeg" : `image/${targetFormat.toLowerCase()}`;
    const outputBlob = await canvasToBlob(canvas, mimeType, encodeQuality);

    const sourceFormat = getFormatFromMimeType(file.type);
    const noGeometryChange = !crop && (!resizeScale || resizeScale === "100");
    const sameOutputFormat = sourceFormat === targetFormat;
    const isOptimizationFlow = operation !== "Converter";

    // Em fluxo de otimizacao sem mudanca visual, evita retornar arquivo maior que o original.
    if (isOptimizationFlow && noGeometryChange && sameOutputFormat) {
      if (quality >= 100 || outputBlob.size >= file.size) {
        return file;
      }
    }

    return outputBlob;
  } finally {
    bitmap?.close();
  }
};
