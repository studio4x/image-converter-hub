export type Format = "JPG" | "PNG" | "WEBP" | "AVIF";
export type Operation = "Otimizar" | "Converter" | "Otimizar e Converter";
export type CompressionLevel = "10" | "30" | "60" | "80" | "100";
export type ResizeScale = "100" | "75" | "50" | "25";
export type Status = "idle" | "loading" | "success" | "error";

export const MAX_FILES = 10;
export const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve((e.target?.result as string) || "");
    reader.onerror = () => reject(new Error("Erro ao ler arquivo"));
    reader.readAsDataURL(file);
  });

const loadImageElement = async (file: File): Promise<HTMLImageElement> => {
  const dataUrl = await readFileAsDataUrl(file);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Erro ao carregar imagem"));
    img.src = dataUrl;
  });
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

const getFormatFromMimeType = (mimeType: string): Format | null => {
  if (mimeType === "image/jpeg" || mimeType === "image/jpg") return "JPG";
  if (mimeType === "image/png") return "PNG";
  if (mimeType === "image/webp") return "WEBP";
  if (mimeType === "image/avif") return "AVIF";
  return null;
};

export const processImage = async (
  file: File,
  targetFormat: Format,
  quality: number,
  operation: Operation,
  crop?: CropArea,
  resizeScale?: ResizeScale
): Promise<Blob> => {
  let bitmap: ImageBitmap | null = null;

  try {
    let source: CanvasImageSource;
    let sourceWidth: number;
    let sourceHeight: number;

    try {
      bitmap = await createImageBitmap(file);
      source = bitmap;
      sourceWidth = bitmap.width;
      sourceHeight = bitmap.height;
    } catch {
      const img = await loadImageElement(file);
      source = img;
      sourceWidth = img.naturalWidth || img.width;
      sourceHeight = img.naturalHeight || img.height;
    }

    const sourceCropWidth = crop ? crop.width : sourceWidth;
    const sourceCropHeight = crop ? crop.height : sourceHeight;
    const scaleFactor = resizeScale ? parseInt(resizeScale, 10) / 100 : 1;

    const targetWidth = Math.max(1, Math.round(sourceCropWidth * scaleFactor));
    const targetHeight = Math.max(1, Math.round(sourceCropHeight * scaleFactor));

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Nao foi possivel obter o contexto do canvas");
    }

    if (targetFormat === "JPG") {
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    if (crop) {
      ctx.drawImage(source, crop.x, crop.y, crop.width, crop.height, 0, 0, targetWidth, targetHeight);
    } else {
      ctx.drawImage(source, 0, 0, sourceWidth, sourceHeight, 0, 0, targetWidth, targetHeight);
    }

    const mimeType = targetFormat === "JPG" ? "image/jpeg" : `image/${targetFormat.toLowerCase()}`;
    const encodeQuality = operation === "Converter" ? 1 : quality / 100;
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
