const STANDARD_IMAGE_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/avif"];
const HEIC_IMAGE_MIME_TYPES = ["image/heic", "image/heif", "image/heic-sequence", "image/heif-sequence"];
const SUPPORTED_IMAGE_MIME_TYPES = [...STANDARD_IMAGE_MIME_TYPES, ...HEIC_IMAGE_MIME_TYPES];
const SUPPORTED_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".avif", ".heic", ".heif"];

const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve((event.target?.result as string) || "");
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

const hasSupportedExtension = (fileName: string, extensions: string[]) => {
  const lowerName = fileName.toLowerCase();
  return extensions.some((extension) => lowerName.endsWith(extension));
};

const isHeicByMimeType = (file: File) => HEIC_IMAGE_MIME_TYPES.includes(file.type.toLowerCase());

export const ACCEPTED_TYPES = SUPPORTED_IMAGE_MIME_TYPES;
export const IMAGE_INPUT_ACCEPT = [...SUPPORTED_IMAGE_MIME_TYPES, ...SUPPORTED_IMAGE_EXTENSIONS].join(",");

export const isHeicFile = (file: File) => isHeicByMimeType(file) || hasSupportedExtension(file.name, [".heic", ".heif"]);

export const isSupportedImageFile = (file: File) =>
  SUPPORTED_IMAGE_MIME_TYPES.includes(file.type.toLowerCase()) || hasSupportedExtension(file.name, SUPPORTED_IMAGE_EXTENSIONS);

const loadHeicBitmap = async (file: File): Promise<ImageBitmap> => {
  const { heicTo } = await import("heic-to");
  return heicTo({
    blob: file,
    type: "bitmap",
    options: {
      imageOrientation: "from-image",
    },
  });
};

const detectHeicBySignature = async (file: File) => {
  try {
    const { isHeic } = await import("heic-to");
    return await isHeic(file);
  } catch {
    return false;
  }
};

export const loadImageSource = async (
  file: File
): Promise<{ source: CanvasImageSource; width: number; height: number; bitmap?: ImageBitmap }> => {
  try {
    const bitmap = await createImageBitmap(file);
    return { source: bitmap, width: bitmap.width, height: bitmap.height, bitmap };
  } catch {
    if (!isHeicFile(file)) {
      try {
        const image = await loadImageElement(file);
        return {
          source: image,
          width: image.naturalWidth || image.width,
          height: image.naturalHeight || image.height,
        };
      } catch {
        // Continua para a conversão HEIC quando o navegador não consegue decodificar nativamente.
      }
    }

    try {
      if (!isHeicFile(file) && !(await detectHeicBySignature(file))) {
        throw new Error("Erro ao carregar imagem");
      }
      const bitmap = await loadHeicBitmap(file);
      return { source: bitmap, width: bitmap.width, height: bitmap.height, bitmap };
    } catch {
      throw new Error("Erro ao carregar imagem");
    }
  }
};

export const getImageDimensions = async (file: File) => {
  const loaded = await loadImageSource(file);

  try {
    return { width: loaded.width, height: loaded.height };
  } finally {
    loaded.bitmap?.close();
  }
};

export const createPreviewDataUrl = async (file: File) => {
  if (!isHeicFile(file)) {
    return readFileAsDataUrl(file);
  }

  const loaded = await loadImageSource(file);

  try {
    const canvas = document.createElement("canvas");
    canvas.width = loaded.width;
    canvas.height = loaded.height;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Não foi possível gerar a prévia da imagem");
    }

    ctx.drawImage(loaded.source, 0, 0, loaded.width, loaded.height);
    return canvas.toDataURL("image/png");
  } finally {
    loaded.bitmap?.close();
  }
};
