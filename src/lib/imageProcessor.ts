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

export const processImage = async (
  file: File, 
  targetFormat: Format, 
  quality: number,
  operation: Operation,
  crop?: CropArea,
  resizeScale?: ResizeScale
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        
        let targetWidth = img.width;
        let targetHeight = img.height;

        // Se houver recorte, o canvas terá o tamanho do recorte
        if (crop) {
          targetWidth = crop.width;
          targetHeight = crop.height;
        }

        // Se houver redução de tamanho
        if (resizeScale && resizeScale !== "100") {
          const scaleFactor = parseInt(resizeScale) / 100;
          targetWidth = Math.round(targetWidth * scaleFactor);
          targetHeight = Math.round(targetHeight * scaleFactor);
        }

        canvas.width = targetWidth;
        canvas.height = targetHeight;
        
        const ctx = canvas.getContext("2d");
        
        if (!ctx) {
          reject(new Error("Não foi possível obter o contexto do canvas"));
          return;
        }

        // Se for JPG, preenchemos o fundo com branco (JPG não suporta transparência)
        if (targetFormat === "JPG") {
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // Desenha a imagem (recortada ou não) com as novas dimensões (targetWidth, targetHeight)
        if (crop) {
          ctx.drawImage(
            img,
            crop.x,
            crop.y,
            crop.width,
            crop.height,
            0,
            0,
            targetWidth,
            targetHeight
          );
        } else {
          ctx.drawImage(
            img, 
            0, 
            0,
            img.width,
            img.height,
            0,
            0,
            targetWidth,
            targetHeight
          );
        }

        const mimeType = targetFormat === "JPG" ? "image/jpeg" : `image/${targetFormat.toLowerCase()}`;
        const finalQuality = quality / 100;

        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Erro ao gerar blob da imagem"));
          },
          mimeType,
          operation === "Converter" ? 1.0 : finalQuality
        );
      };
      img.onerror = () => reject(new Error("Erro ao carregar imagem"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Erro ao ler arquivo"));
    reader.readAsDataURL(file);
  });
};
