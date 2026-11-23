export function compressImageFile(
  file: File,
  maxDim = 960,
  quality = 0.78,
): Promise<{dataUrl: string; base64: string; mimeType: string}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('File read error'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Image load error'));
      img.onload = () => {
        let {width, height} = img;
        if (width > maxDim || height > maxDim) {
          if (width >= height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context missing'));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        const base64 = dataUrl.split(',')[1] || '';
        resolve({dataUrl, base64, mimeType: 'image/jpeg'});
      };
      img.src = String(reader.result || '');
    };
    reader.readAsDataURL(file);
  });
}
