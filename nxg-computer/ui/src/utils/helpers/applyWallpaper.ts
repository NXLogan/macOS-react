/** Apply wallpaper URL (bundled asset path or data URL) to the desktop. */
export function applyWallpaperToPage(url: string) {
  const page = document.getElementById("page");
  if (!page) return;
  page.style.backgroundImage = `url(${url})`;
  page.style.backgroundSize = "cover";
  page.style.backgroundPosition = "center";
  page.style.backgroundRepeat = "no-repeat";
}

export function resolveBundledWallpaper(surname: string): string {
  return require(`../../assets/images/${surname}.jpg`);
}

export function resolveBundledPreview(surname: string): string {
  return require(`../../assets/images/preview_${surname}.jpg`);
}

/** Compress an image file to a JPEG data URL suitable for localStorage. */
export function fileToWallpaperDataUrl(
  file: File,
  maxWidth = 1920,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Lecture impossible"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Image invalide"));
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas indisponible"));
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
