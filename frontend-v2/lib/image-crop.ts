export type CropArea = {
  width: number;
  height: number;
  x: number;
  y: number;
};

type LoadedImage = {
  image: CanvasImageSource;
  width: number;
  height: number;
  cleanup?: () => void;
};

async function loadImage(source: string): Promise<LoadedImage> {
  const response = await fetch(source);
  const blob = await response.blob();

  if (typeof createImageBitmap === "function") {
    const bitmap = await createImageBitmap(blob, {
      imageOrientation: "from-image",
    } as ImageBitmapOptions);
    return {
      image: bitmap,
      width: bitmap.width,
      height: bitmap.height,
      cleanup: () => bitmap.close?.(),
    };
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ image: img, width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => reject(new Error("Nie udało się wczytać obrazu"));
    img.src = source;
  });
}

export async function getCroppedImageBlob(
  source: string,
  crop: CropArea,
  options?: {
    outputSize?: number;
    mimeType?: string;
    quality?: number;
  },
): Promise<Blob> {
  const { outputSize = 512, mimeType = "image/jpeg", quality = 0.85 } = options ?? {};
  const { image, cleanup } = await loadImage(source);

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    cleanup?.();
    throw new Error("Nie udało się przygotować obrazu");
  }

  canvas.width = outputSize;
  canvas.height = outputSize;

  context.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    outputSize,
    outputSize,
  );

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (value) => {
        if (value) resolve(value);
        else reject(new Error("Nie udało się wygenerować obrazu"));
      },
      mimeType,
      quality,
    );
  });

  cleanup?.();
  return blob;
}
