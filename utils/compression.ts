/**
 * Loads an image from a source string (URL or Base64) into an HTMLImageElement
 */
export const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
};

/**
 * Performs a single pass of JPEG compression via HTML5 Canvas
 */
export const compressPass = (
  img: HTMLImageElement,
  quality: number
): string => {
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Could not get canvas context");
  }

  // Draw the image onto the canvas
  ctx.drawImage(img, 0, 0);

  // Export as JPEG with specific quality to induce generation loss
  return canvas.toDataURL("image/jpeg", quality);
};

/**
 * Asynchronous delay to allow UI updates during heavy loops
 */
export const yieldToMain = () => new Promise((resolve) => setTimeout(resolve, 0));