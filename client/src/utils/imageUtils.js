/**
 * Client-side Automatic Product Background Removal & White Studio Framing
 * Analyzes perimeter background color, segments foreground product,
 * replaces background with pure #FFFFFF, and centers product cleanly.
 */

export const processProductToWhiteBackground = (fileOrUrl) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const maxWidth = 800;
        const maxHeight = 800;
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        // Scale down if image is huge for fast smooth processing
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        // Draw original image
        ctx.drawImage(img, 0, 0, width, height);

        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;

        // Sample border pixels to detect background color profile
        const samplePoints = [
          [2, 2], [width - 3, 2], [2, height - 3], [width - 3, height - 3],
          [Math.floor(width / 2), 2], [Math.floor(width / 2), height - 3],
          [2, Math.floor(height / 2)], [width - 3, Math.floor(height / 2)],
          [10, 10], [width - 11, 10], [10, height - 11], [width - 11, height - 11]
        ];

        let bgR = 0, bgG = 0, bgB = 0;
        for (const [sx, sy] of samplePoints) {
          const idx = (sy * width + sx) * 4;
          bgR += data[idx];
          bgG += data[idx + 1];
          bgB += data[idx + 2];
        }
        bgR /= samplePoints.length;
        bgG /= samplePoints.length;
        bgB /= samplePoints.length;

        // Center coordinates of product
        const centerX = width / 2;
        const centerY = height / 2;
        const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);

        // Process pixels: background pixels replaced with pure #FFFFFF
        const threshold = 38; // Sensitivity threshold for background detection

        let minX = width, maxX = 0, minY = height, maxY = 0;

        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];

            // Color distance from sampled background
            const dR = r - bgR;
            const dG = g - bgG;
            const dB = b - bgB;
            const colorDist = Math.sqrt(dR * dR + dG * dG + dB * dB);

            // Normalized distance from center (products are placed in the center of the photo)
            const distFromCenter = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2) / maxDist;

            // Near the image border, be more aggressive at clearing background
            const isNearBorder = (x < 15 || x > width - 15 || y < 15 || y > height - 15);

            if (isNearBorder || (colorDist < threshold && distFromCenter > 0.18)) {
              // Replace background pixel with pure white
              data[idx] = 255;
              data[idx + 1] = 255;
              data[idx + 2] = 255;
              data[idx + 3] = 255;
            } else {
              // Subject pixel: track bounding box
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }

        // Put modified data back
        ctx.putImageData(imgData, 0, 0);

        // Create a polished final square studio canvas with pure white background
        const finalSize = 500;
        const outCanvas = document.createElement('canvas');
        outCanvas.width = finalSize;
        outCanvas.height = finalSize;
        const outCtx = outCanvas.getContext('2d');

        // Fill background pure white #FFFFFF
        outCtx.fillStyle = '#FFFFFF';
        outCtx.fillRect(0, 0, finalSize, finalSize);

        // Calculate aspect-fit framing with 12% padding
        const pad = 35;
        const targetW = finalSize - pad * 2;
        const targetH = finalSize - pad * 2;

        let srcX = 0, srcY = 0, srcW = width, srcH = height;
        if (maxX > minX && maxY > minY) {
          // Add small margin around detected product
          const m = 15;
          srcX = Math.max(0, minX - m);
          srcY = Math.max(0, minY - m);
          srcW = Math.min(width - srcX, (maxX - minX) + m * 2);
          srcH = Math.min(height - srcY, (maxY - minY) + m * 2);
        }

        const scale = Math.min(targetW / srcW, targetH / srcH);
        const drawW = srcW * scale;
        const drawH = srcH * scale;
        const drawX = (finalSize - drawW) / 2;
        const drawY = (finalSize - drawH) / 2;

        outCtx.drawImage(canvas, srcX, srcY, srcW, srcH, drawX, drawY, drawW, drawH);

        const whiteBgDataUrl = outCanvas.toDataURL('image/jpeg', 0.92);
        resolve(whiteBgDataUrl);
      } catch (err) {
        console.warn('Background removal canvas error, falling back:', err);
        // Fallback to original image if anything fails
        resolve(typeof fileOrUrl === 'string' ? fileOrUrl : URL.createObjectURL(fileOrUrl));
      }
    };

    img.onerror = () => {
      resolve(typeof fileOrUrl === 'string' ? fileOrUrl : URL.createObjectURL(fileOrUrl));
    };

    if (typeof fileOrUrl === 'string') {
      img.src = fileOrUrl;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(fileOrUrl);
    }
  });
};

