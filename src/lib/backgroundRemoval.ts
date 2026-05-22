import { CropArea, Format, Operation, ResizeScale } from "@/lib/imageProcessor";

export interface BackgroundRemovalAdjustments {
  sensitivity: number;
  fineTune: number;
  edgeSoftness: number;
}

interface ProcessBackgroundRemovalInput {
  file: File;
  targetFormat: Format;
  quality: number;
  operation: Operation;
  resizeScale?: ResizeScale;
  crop?: CropArea;
  adjustments: BackgroundRemovalAdjustments;
}

const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve((e.target?.result as string) || "");
    reader.onerror = () => reject(new Error("Erro ao ler arquivo"));
    reader.readAsDataURL(file);
  });

const loadImageSource = async (file: File): Promise<{ source: CanvasImageSource; width: number; height: number; bitmap?: ImageBitmap }> => {
  try {
    const bitmap = await createImageBitmap(file);
    return { source: bitmap, width: bitmap.width, height: bitmap.height, bitmap };
  } catch {
    const dataUrl = await readFileAsDataUrl(file);
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Erro ao carregar imagem"));
      img.src = dataUrl;
    });

    return {
      source: image,
      width: image.naturalWidth || image.width,
      height: image.naturalHeight || image.height,
    };
  }
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

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const estimateBackgroundColor = (imageData: ImageData, width: number, height: number) => {
  const { data } = imageData;
  const points: Array<[number, number]> = [
    [0, 0],
    [width - 1, 0],
    [0, height - 1],
    [width - 1, height - 1],
    [Math.floor(width / 2), 0],
    [Math.floor(width / 2), height - 1],
    [0, Math.floor(height / 2)],
    [width - 1, Math.floor(height / 2)],
  ];

  const sampleRadius = Math.max(2, Math.round(Math.min(width, height) * 0.006));
  let totalR = 0;
  let totalG = 0;
  let totalB = 0;
  let count = 0;

  for (const [x, y] of points) {
    for (let yy = y - sampleRadius; yy <= y + sampleRadius; yy++) {
      for (let xx = x - sampleRadius; xx <= x + sampleRadius; xx++) {
        if (xx < 0 || yy < 0 || xx >= width || yy >= height) continue;
        const idx = (yy * width + xx) * 4;
        const alpha = data[idx + 3];
        if (alpha === 0) continue;

        totalR += data[idx];
        totalG += data[idx + 1];
        totalB += data[idx + 2];
        count += 1;
      }
    }
  }

  if (count === 0) {
    return { r: 255, g: 255, b: 255 };
  }

  return {
    r: totalR / count,
    g: totalG / count,
    b: totalB / count,
  };
};

const buildRemovedBackgroundCanvas = (
  sourceCanvas: HTMLCanvasElement,
  adjustments: BackgroundRemovalAdjustments
): HTMLCanvasElement => {
  const width = sourceCanvas.width;
  const height = sourceCanvas.height;
  const workCanvas = document.createElement("canvas");
  workCanvas.width = width;
  workCanvas.height = height;

  const ctx = workCanvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    throw new Error("Nao foi possivel preparar o contexto para remocao de fundo");
  }

  ctx.drawImage(sourceCanvas, 0, 0);

  const imageData = ctx.getImageData(0, 0, width, height);
  const background = estimateBackgroundColor(imageData, width, height);
  const data = imageData.data;

  const baseThreshold = clamp(adjustments.sensitivity, 10, 200);
  const fineTuneShift = clamp(adjustments.fineTune, -80, 80) * 1.2;
  const effectiveThreshold = baseThreshold + fineTuneShift;
  const feather = clamp(adjustments.edgeSoftness, 4, 120);

  for (let i = 0; i < data.length; i += 4) {
    const originalAlpha = data[i + 3] / 255;
    if (originalAlpha === 0) continue;

    const dr = data[i] - background.r;
    const dg = data[i + 1] - background.g;
    const db = data[i + 2] - background.b;
    const distance = Math.sqrt(dr * dr + dg * dg + db * db);

    const alphaMask = clamp((distance - effectiveThreshold) / feather, 0, 1);
    data[i + 3] = Math.round(alphaMask * originalAlpha * 255);
  }

  ctx.putImageData(imageData, 0, 0);
  return workCanvas;
};

const createSourceCanvas = async (file: File): Promise<{ canvas: HTMLCanvasElement; bitmap?: ImageBitmap }> => {
  const loaded = await loadImageSource(file);

  const sourceCanvas = document.createElement("canvas");
  sourceCanvas.width = loaded.width;
  sourceCanvas.height = loaded.height;

  const sourceCtx = sourceCanvas.getContext("2d");
  if (!sourceCtx) {
    loaded.bitmap?.close();
    throw new Error("Nao foi possivel preparar imagem para remocao de fundo");
  }

  sourceCtx.drawImage(loaded.source, 0, 0, loaded.width, loaded.height);
  return { canvas: sourceCanvas, bitmap: loaded.bitmap };
};

const getMimeType = (targetFormat: Format) => (targetFormat === "JPG" ? "image/jpeg" : `image/${targetFormat.toLowerCase()}`);

const exportCanvasToFormat = async (
  canvas: HTMLCanvasElement,
  targetFormat: Format,
  quality: number,
  operation: Operation
): Promise<Blob> => {
  const encodeQuality = operation === "Converter" ? 1 : quality / 100;

  if (targetFormat === "SVG") {
    const pngDataUrl = canvas.toDataURL("image/png");
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}" viewBox="0 0 ${canvas.width} ${canvas.height}"><image href="${pngDataUrl}" width="${canvas.width}" height="${canvas.height}"/></svg>`;
    return new Blob([svgContent], { type: "image/svg+xml;charset=utf-8" });
  }

  const mimeType = getMimeType(targetFormat);
  return canvasToBlob(canvas, mimeType, encodeQuality);
};

const applyCropAndResize = (
  sourceCanvas: HTMLCanvasElement,
  targetFormat: Format,
  resizeScale?: ResizeScale,
  crop?: CropArea
) => {
  const sourceWidth = sourceCanvas.width;
  const sourceHeight = sourceCanvas.height;
  const sourceCropWidth = crop ? crop.width : sourceWidth;
  const sourceCropHeight = crop ? crop.height : sourceHeight;
  const scaleFactor = resizeScale ? parseInt(resizeScale, 10) / 100 : 1;

  const targetWidth = Math.max(1, Math.round(sourceCropWidth * scaleFactor));
  const targetHeight = Math.max(1, Math.round(sourceCropHeight * scaleFactor));

  const outputCanvas = document.createElement("canvas");
  outputCanvas.width = targetWidth;
  outputCanvas.height = targetHeight;

  const outputCtx = outputCanvas.getContext("2d");
  if (!outputCtx) {
    throw new Error("Nao foi possivel finalizar a imagem removida");
  }

  if (targetFormat === "JPG") {
    outputCtx.fillStyle = "#FFFFFF";
    outputCtx.fillRect(0, 0, targetWidth, targetHeight);
  }

  if (crop) {
    outputCtx.drawImage(sourceCanvas, crop.x, crop.y, crop.width, crop.height, 0, 0, targetWidth, targetHeight);
  } else {
    outputCtx.drawImage(sourceCanvas, 0, 0, sourceWidth, sourceHeight, 0, 0, targetWidth, targetHeight);
  }

  return outputCanvas;
};

export const createBackgroundRemovalPreview = async (
  file: File,
  adjustments: BackgroundRemovalAdjustments,
  maxPreviewSize = 720
): Promise<string> => {
  let bitmap: ImageBitmap | undefined;

  try {
    const source = await createSourceCanvas(file);
    bitmap = source.bitmap;
    const removedCanvas = buildRemovedBackgroundCanvas(source.canvas, adjustments);

    const scale = Math.min(1, maxPreviewSize / Math.max(removedCanvas.width, removedCanvas.height));
    if (scale === 1) {
      return removedCanvas.toDataURL("image/png");
    }

    const previewCanvas = document.createElement("canvas");
    previewCanvas.width = Math.max(1, Math.round(removedCanvas.width * scale));
    previewCanvas.height = Math.max(1, Math.round(removedCanvas.height * scale));

    const previewCtx = previewCanvas.getContext("2d");
    if (!previewCtx) {
      return removedCanvas.toDataURL("image/png");
    }

    previewCtx.drawImage(removedCanvas, 0, 0, previewCanvas.width, previewCanvas.height);
    return previewCanvas.toDataURL("image/png");
  } finally {
    bitmap?.close();
  }
};

export const processBackgroundRemovedImage = async ({
  file,
  targetFormat,
  quality,
  operation,
  resizeScale,
  crop,
  adjustments,
}: ProcessBackgroundRemovalInput): Promise<Blob> => {
  let bitmap: ImageBitmap | undefined;

  try {
    const source = await createSourceCanvas(file);
    bitmap = source.bitmap;

    const removedCanvas = buildRemovedBackgroundCanvas(source.canvas, adjustments);
    const finalCanvas = applyCropAndResize(removedCanvas, targetFormat, resizeScale, crop);

    return await exportCanvasToFormat(finalCanvas, targetFormat, quality, operation);
  } finally {
    bitmap?.close();
  }
};
