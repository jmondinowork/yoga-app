const MAX_DIMENSION = 2000;
const QUALITY = 0.85;
const COMPRESSIBLE_TYPES = ["image/jpeg", "image/png", "image/webp"];

/**
 * Compresse et redimensionne une image côté client via Canvas.
 * Retourne un nouveau File en WebP, beaucoup plus léger.
 * Les SVG et ICO sont retournés tels quels.
 */
export function compressImage(
  file: File,
  maxDim = MAX_DIMENSION,
  quality = QUALITY,
): Promise<File> {
  if (!COMPRESSIBLE_TYPES.includes(file.type)) return Promise.resolve(file);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        const ratio = Math.min(maxDim / width, maxDim / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error("Compression échouée"));
          const name = file.name.replace(/\.[^.]+$/, ".webp");
          resolve(new File([blob], name, { type: "image/webp" }));
        },
        "image/webp",
        quality,
      );
    };
    img.onerror = () => reject(new Error("Impossible de lire l'image"));
    img.src = URL.createObjectURL(file);
  });
}
